import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { localStorageRepository, hydrateWeddingState } from "../domain/storage/localStorageRepository";
import { mergeWeddingState } from "../domain/storage/mergeWeddingState";
import { isDemoHeavyGuestList, stripDemoGuests, withoutDemoGuests } from "../domain/guestSeed";
import { STORAGE_KEY } from "../domain/defaults";
import {
  clearAccountCode,
  clearDirty,
  getStoredSyncCode,
  getSyncMeta,
  isLocalPreviewSyncCode,
  isValidSyncCode,
  markCloudAligned,
  markDirty,
  normalizeSyncCode,
  pullWedding,
  pushWedding,
  rememberAccountFromLegacy,
  setStoredSyncCode,
  getAccountCode,
  setCloudVersion,
  type PushResult,
} from "../domain/storage/sync";
import type { WeddingState } from "../domain/types";
import { syncEventGuestCount } from "../domain/guest";

type WeddingContextValue = {
  state: WeddingState;
  setState: (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => void;
  saveState: (next: WeddingState) => void;
  toast: string | null;
  showToast: (message: string) => void;
  newEventModalOpen: boolean;
  setNewEventModalOpen: (open: boolean) => void;
  scheduleModalOpen: boolean;
  setScheduleModalOpen: (open: boolean) => void;
  scheduleFocusId: number | null;
  setScheduleFocusId: (id: number | null) => void;
  lastCreatedFunctionId: number | null;
  clearLastCreatedFunctionId: () => void;
  onFunctionCreated: (dayId: number) => void;
  syncCode: string | null;
  lastSyncedAt: number | null;
  syncBusy: boolean;
  joinWeddingLink: (code: string) => Promise<void>;
  unlinkWedding: () => void;
  refreshFromCloud: (silent?: boolean) => Promise<void>;
  syncLive: boolean;
  reconnectWedding: () => Promise<void>;
  lastAccountCode: string | null;
  flushSyncNow: () => Promise<void>;
};

const WeddingContext = createContext<WeddingContextValue | null>(null);

const POLL_MS = 1500;

function cleanForCloud(state: WeddingState): WeddingState {
  const hydrated = hydrateWeddingState(state);
  const hasDemo = hydrated.guests.some((g) => String(g.id).startsWith("demo-g-"));
  if (!hasDemo) return hydrated;
  const guests = stripDemoGuests(hydrated.guests);
  return {
    ...hydrated,
    guests,
    event: { ...hydrated.event, guests: syncEventGuestCount(guests) },
  };
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<WeddingState>(() => {
    rememberAccountFromLegacy();
    return localStorageRepository.load();
  });
  const [toast, setToast] = useState<string | null>(null);
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleFocusId, setScheduleFocusId] = useState<number | null>(null);
  const [lastCreatedFunctionId, setLastCreatedFunctionId] = useState<number | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(() => getStoredSyncCode());
  const [lastAccountCode, setLastAccountCode] = useState<string | null>(() => getAccountCode());
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(
    () => getSyncMeta().lastSyncedAt,
  );
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncLive, setSyncLive] = useState(false);

  const stateRef = useRef(state);
  const pushTimer = useRef<number>(0);
  const flushInFlight = useRef(false);
  const flushQueued = useRef(false);
  const initialRefreshDone = useRef(false);
  stateRef.current = state;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1700);
  }, []);

  const adoptCloud = useCallback((cloudState: WeddingState, version: number) => {
    const clean = hydrateWeddingState(cloudState);
    localStorageRepository.save(clean);
    const meta = markCloudAligned(version);
    setLastSyncedAt(meta.lastSyncedAt);
    setStateInternal(clean);
    setSyncLive(true);
  }, []);

  const flushPush = useCallback(
    async (next: WeddingState, codeOverride?: string): Promise<void> => {
      const code = codeOverride || getStoredSyncCode();
      if (!code) return;

      if (flushInFlight.current) {
        flushQueued.current = true;
        return;
      }
      flushInFlight.current = true;

      try {
        const payload = cleanForCloud(next);
        const meta = getSyncMeta();
        const result: PushResult = await pushWedding(code, payload, meta.cloudVersion);

        if (result.status === "ok") {
          const aligned = markCloudAligned(result.version);
          setLastSyncedAt(aligned.lastSyncedAt);
          setSyncLive(true);
          return;
        }

        /* 409 conflict -- merge and retry once */
        let remoteState = result.state;
        if (isDemoHeavyGuestList(remoteState.guests)) {
          remoteState = withoutDemoGuests(remoteState);
        }

        const merged = cleanForCloud(mergeWeddingState(payload, remoteState));
        const retry: PushResult = await pushWedding(code, merged, result.version);

        if (retry.status === "ok") {
          localStorageRepository.save(merged);
          const aligned = markCloudAligned(retry.version);
          setLastSyncedAt(aligned.lastSyncedAt);
          setStateInternal(merged);
          setSyncLive(true);
          return;
        }

        /* Retry also conflicted — keep local schedule via merge; don't adopt remote. */
        let retryRemote = retry.state;
        if (isDemoHeavyGuestList(retryRemote.guests)) {
          retryRemote = withoutDemoGuests(retryRemote);
        }
        const kept = cleanForCloud(mergeWeddingState(payload, retryRemote));
        localStorageRepository.save(kept);
        setStateInternal(kept);
        setCloudVersion(retry.version);
        markDirty();
      } finally {
        flushInFlight.current = false;
        if (flushQueued.current) {
          flushQueued.current = false;
          if (getSyncMeta().dirty) {
            void flushPush(stateRef.current).catch(() => undefined);
          }
        }
      }
    },
    [],
  );

  const schedulePush = useCallback(
    (next: WeddingState, immediate = false) => {
      const code = getStoredSyncCode();
      if (!code || isLocalPreviewSyncCode(code)) return;
      window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(
        () => {
          void flushPush(next).catch((error: Error) => {
            showToast(error.message || "Could not sync to cloud");
          });
        },
        immediate ? 0 : 50,
      );
    },
    [flushPush, showToast],
  );

  const persist = useCallback(
    (next: WeddingState, immediate = false) => {
      localStorageRepository.save(next);
      markDirty();
      schedulePush(next, immediate);
    },
    [schedulePush],
  );

  const saveState = useCallback(
    (next: WeddingState) => {
      setStateInternal(next);
      persist(next, true);
    },
    [persist],
  );

  const setState = useCallback(
    (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => {
      setStateInternal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persist(next, true);
        return next;
      });
    },
    [persist],
  );

  const flushSyncNow = useCallback(async () => {
    window.clearTimeout(pushTimer.current);
    if (!getStoredSyncCode()) return;
    markDirty();
    await flushPush(stateRef.current);
  }, [flushPush]);

  const refreshFromCloud = useCallback(
    async (silent = false) => {
      const code = getStoredSyncCode();
      if (!code) return;
      if (isLocalPreviewSyncCode(code)) {
        setSyncLive(false);
        return;
      }
      if (!silent) setSyncBusy(true);
      try {
        const remote = await pullWedding(code);
        if (!remote) {
          /* Cloud is empty -- push our local state as first write */
          setCloudVersion(0);
          markDirty();
          await flushPush(stateRef.current);
          setSyncLive(true);
          return;
        }

        let remoteState = remote.state;
        if (isDemoHeavyGuestList(remoteState.guests)) {
          remoteState = withoutDemoGuests(remoteState);
        }

        const local = stateRef.current;
        const meta = getSyncMeta();

        if (meta.dirty) {
          /* Local has unsaved edits -- merge and push */
          const localClean = cleanForCloud(local);
          const merged = cleanForCloud(mergeWeddingState(localClean, remoteState));
          setCloudVersion(remote.version);
          localStorageRepository.save(merged);
          setStateInternal(merged);
          await flushPush(merged);
        } else if (remote.version > meta.cloudVersion) {
          /* Cloud is ahead -- adopt */
          adoptCloud(remoteState, remote.version);
        } else {
          setSyncLive(true);
        }
      } finally {
        if (!silent) setSyncBusy(false);
      }
    },
    [adoptCloud, flushPush],
  );

  /* Manual flush event */
  useEffect(() => {
    const flush = () => {
      window.clearTimeout(pushTimer.current);
      if (!getStoredSyncCode()) return;
      void flushPush(stateRef.current).catch(() => undefined);
    };
    window.addEventListener("biyeflow:flush-sync", flush);
    return () => window.removeEventListener("biyeflow:flush-sync", flush);
  }, [flushPush]);

  /* Cross-tab sync via storage event */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const next = hydrateWeddingState(JSON.parse(event.newValue) as Partial<WeddingState>);
        setStateInternal(next);
      } catch {
        /* ignore a corrupt sibling tab write */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Initial cloud refresh on mount (also handles the launch-refresh event) */
  useEffect(() => {
    const announceReady = () => {
      window.dispatchEvent(new Event("biyeflow:sync-ready"));
    };

    if (!syncCode) {
      initialRefreshDone.current = true;
      announceReady();
      return;
    }

    void refreshFromCloud(true)
      .catch((error: Error) => {
        const msg = error.message || "Could not load cloud event";
        /* Local UI still works from device storage when Wrangler isn't up. */
        if (msg.includes("API not running") || msg.includes("API not reachable")) {
          setSyncLive(false);
          return;
        }
        showToast(msg);
      })
      .finally(() => {
        initialRefreshDone.current = true;
        announceReady();
      });
  }, [syncCode, refreshFromCloud, showToast]);

  /* Launch refresh event handler — skip if the mount effect already covered it */
  useEffect(() => {
    const onLaunchRefresh = () => {
      if (!initialRefreshDone.current) return;
      const code = getStoredSyncCode();
      if (!code) {
        window.dispatchEvent(new Event("biyeflow:sync-ready"));
        return;
      }
      void refreshFromCloud(true)
        .catch(() => undefined)
        .finally(() => window.dispatchEvent(new Event("biyeflow:sync-ready")));
    };
    window.addEventListener("biyeflow:launch-refresh", onLaunchRefresh);
    return () => window.removeEventListener("biyeflow:launch-refresh", onLaunchRefresh);
  }, [refreshFromCloud]);

  /* Polling loop — waits for the initial refresh to settle before starting */
  useEffect(() => {
    if (!syncCode) return;

    let timer = 0;
    let delay = POLL_MS;
    let inFlight = false;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || document.visibilityState !== "visible" || inFlight) return;
      inFlight = true;
      try {
        const remote = await pullWedding(syncCode);
        delay = POLL_MS;

        if (!remote) {
          const meta = getSyncMeta();
          if (meta.dirty || meta.cloudVersion === 0) {
            setCloudVersion(0);
            markDirty();
            await flushPush(stateRef.current);
          }
          setSyncLive(true);
          return;
        }

        let remoteState = remote.state;
        if (isDemoHeavyGuestList(remoteState.guests)) {
          remoteState = withoutDemoGuests(remoteState);
        }

        const meta = getSyncMeta();

        if (remote.version > meta.cloudVersion) {
          if (meta.dirty) {
            const localClean = cleanForCloud(stateRef.current);
            const merged = cleanForCloud(mergeWeddingState(localClean, remoteState));
            setCloudVersion(remote.version);
            localStorageRepository.save(merged);
            setStateInternal(merged);
            await flushPush(merged);
          } else {
            adoptCloud(remoteState, remote.version);
          }
        } else if (meta.dirty) {
          await flushPush(stateRef.current);
        }

        setSyncLive(true);
      } catch {
        setSyncLive(false);
        delay = Math.min(delay * 2, 12_000);
      } finally {
        inFlight = false;
      }
    };

    const loop = () => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        void tick().finally(() => {
          if (!cancelled) loop();
        });
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        delay = POLL_MS;
        void tick();
      } else {
        window.clearTimeout(pushTimer.current);
        if (getSyncMeta().dirty) {
          void flushPush(stateRef.current).catch(() => undefined);
        }
      }
    };

    const onOffline = () => setSyncLive(false);

    /* Don't fire immediately — the initial mount refresh already covers it.
       Start the first polling tick after POLL_MS so we don't overlap. */
    loop();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncCode, flushPush, adoptCloud]);

  const joinWeddingLink = useCallback(
    async (rawCode: string) => {
      const code = normalizeSyncCode(rawCode);
      if (!isValidSyncCode(code)) {
        throw new Error("Enter the 8-character event code.");
      }
      window.clearTimeout(pushTimer.current);
      flushQueued.current = false;
      const previous = getStoredSyncCode();
      if (
        previous &&
        previous !== code &&
        !isLocalPreviewSyncCode(previous) &&
        getSyncMeta().dirty
      ) {
        try {
          await flushPush(stateRef.current, previous);
        } catch {
          /* The event we are leaving keeps its last saved copy. */
        }
      }
      flushQueued.current = false;
      window.clearTimeout(pushTimer.current);
      clearDirty();
      setSyncBusy(true);
      try {
        const remote = await pullWedding(code);
        if (!remote) {
          const local =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1");
          throw new Error(
            local
              ? "Code not found on local dev. Create an event here first — production codes (biyeflow.pages.dev) use a separate database."
              : "That event code was not found.",
          );
        }
        let incoming = remote.state;
        if (isDemoHeavyGuestList(incoming.guests)) {
          incoming = withoutDemoGuests(incoming);
        }
        /* Strip any demo guests that snuck in */
        const hasDemo = incoming.guests.some((g) => String(g.id).startsWith("demo-g-"));
        if (hasDemo) {
          incoming = withoutDemoGuests(incoming);
        }
        setStoredSyncCode(code);
        setSyncCode(code);
        setLastAccountCode(code);
        try {
          localStorage.setItem("biyeflow.guestDemoSeed", "1");
        } catch {
          /* ignore */
        }
        adoptCloud(incoming, remote.version);
        const n = incoming.guests.length;
        showToast(
          n
            ? `Live — ${n} ${n === 1 ? "family" : "families"}`
            : "Live — push guests from your phone",
        );
      } finally {
        setSyncBusy(false);
      }
    },
    [adoptCloud, flushPush, showToast],
  );

  const reconnectWedding = useCallback(async () => {
    const account = getAccountCode();
    if (!account) {
      showToast("Open Events to continue");
      return;
    }
    setSyncBusy(true);
    try {
      setStoredSyncCode(account);
      setSyncCode(account);
      setLastAccountCode(account);
      await refreshFromCloud(true);
      setSyncLive(true);
      showToast("Live again");
    } catch (error) {
      setSyncLive(false);
      showToast(error instanceof Error ? error.message : "Could not reconnect");
    } finally {
      setSyncBusy(false);
    }
  }, [refreshFromCloud, showToast]);

  const unlinkWedding = useCallback(() => {
    window.clearTimeout(pushTimer.current);
    clearAccountCode();
    setSyncCode(null);
    setLastAccountCode(null);
    setSyncLive(false);
    clearDirty();
    showToast("Signed out on this device");
  }, [showToast]);

  const onFunctionCreated = useCallback((dayId: number) => {
    setLastCreatedFunctionId(dayId);
  }, []);

  const clearLastCreatedFunctionId = useCallback(() => {
    setLastCreatedFunctionId(null);
  }, []);

  const value = useMemo(
    () => ({
      state,
      setState,
      saveState,
      toast,
      showToast,
      newEventModalOpen,
      setNewEventModalOpen,
      scheduleModalOpen,
      setScheduleModalOpen,
      scheduleFocusId,
      setScheduleFocusId,
      lastCreatedFunctionId,
      clearLastCreatedFunctionId,
      onFunctionCreated,
      syncCode,
      lastSyncedAt,
      syncBusy,
      joinWeddingLink,
      unlinkWedding,
      refreshFromCloud,
      syncLive,
      reconnectWedding,
      lastAccountCode,
      flushSyncNow,
    }),
    [
      state,
      setState,
      saveState,
      toast,
      showToast,
      newEventModalOpen,
      scheduleModalOpen,
      scheduleFocusId,
      lastCreatedFunctionId,
      clearLastCreatedFunctionId,
      onFunctionCreated,
      syncCode,
      lastSyncedAt,
      syncBusy,
      joinWeddingLink,
      unlinkWedding,
      refreshFromCloud,
      syncLive,
      reconnectWedding,
      lastAccountCode,
      flushSyncNow,
    ],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWeddingState() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWeddingState must be used within WeddingProvider");
  return ctx;
}
