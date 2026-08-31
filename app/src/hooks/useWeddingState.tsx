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
import { DEFAULT_WEDDING_STATE, STORAGE_KEY } from "../domain/defaults";
import {
  clearAccountCode,
  clearDirty,
  generateSyncCode,
  getStoredSyncCode,
  getSyncMeta,
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
  lastCreatedFunctionId: number | null;
  clearLastCreatedFunctionId: () => void;
  onFunctionCreated: (dayId: number) => void;
  syncModalOpen: boolean;
  setSyncModalOpen: (open: boolean) => void;
  syncCode: string | null;
  lastSyncedAt: number | null;
  syncBusy: boolean;
  createWeddingLink: () => Promise<void>;
  joinWeddingLink: (code: string) => Promise<void>;
  unlinkWedding: () => void;
  refreshFromCloud: (silent?: boolean) => Promise<void>;
  restoreIntactWedding: () => void;
  syncLive: boolean;
  reconnectWedding: () => Promise<void>;
  lastAccountCode: string | null;
  flushSyncNow: () => Promise<void>;
};

const WeddingContext = createContext<WeddingContextValue | null>(null);

const POLL_MS = 1500;

function cleanForCloud(state: WeddingState): WeddingState {
  const hasDemo = state.guests.some((g) => String(g.id).startsWith("demo-g-"));
  if (!hasDemo) return state;
  const guests = stripDemoGuests(state.guests);
  return {
    ...state,
    guests,
    event: { ...state.event, guests: syncEventGuestCount(guests) },
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
  const [syncModalOpen, setSyncModalOpen] = useState(false);
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
    localStorageRepository.save(cloudState);
    const meta = markCloudAligned(version);
    setLastSyncedAt(meta.lastSyncedAt);
    setStateInternal(cloudState);
    setSyncLive(true);
  }, []);

  const flushPush = useCallback(
    async (next: WeddingState): Promise<void> => {
      const code = getStoredSyncCode();
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

        /* Retry also conflicted -- adopt cloud, mark dirty so next poll will re-merge */
        let retryRemote = retry.state;
        if (isDemoHeavyGuestList(retryRemote.guests)) {
          retryRemote = withoutDemoGuests(retryRemote);
        }
        adoptCloud(retryRemote, retry.version);
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
    [adoptCloud],
  );

  const schedulePush = useCallback(
    (next: WeddingState, immediate = false) => {
      if (!getStoredSyncCode()) return;
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

  /* App update toast */
  useEffect(() => {
    if (sessionStorage.getItem("biyeflow.appUpdated") === "1") {
      sessionStorage.removeItem("biyeflow.appUpdated");
      showToast("App updated");
    }
  }, [showToast]);

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
        showToast(error.message || "Could not load cloud wedding");
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

  const createWeddingLink = useCallback(async () => {
    const code = generateSyncCode();
    setSyncBusy(true);
    try {
      const clean = cleanForCloud(stateRef.current);
      const result = await pushWedding(code, clean, 0);
      if (result.status === "ok") {
        const meta = markCloudAligned(result.version);
        setLastSyncedAt(meta.lastSyncedAt);
      } else {
        /* Wedding code already exists (unlikely) -- adopt the existing one */
        adoptCloud(mergeWeddingState(clean, result.state), result.version);
      }
      setStoredSyncCode(code);
      setSyncCode(code);
      setLastAccountCode(code);
      setSyncLive(true);
      showToast("Live on this wedding");
    } finally {
      setSyncBusy(false);
    }
  }, [adoptCloud, showToast]);

  const joinWeddingLink = useCallback(
    async (rawCode: string) => {
      const code = normalizeSyncCode(rawCode);
      if (!isValidSyncCode(code)) {
        throw new Error("Enter the 8-character wedding code.");
      }
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
              ? "Code not found on local dev. Create a wedding here first — production codes (biyeflow.pages.dev) use a separate database."
              : "That wedding code was not found.",
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
    [adoptCloud, showToast],
  );

  const restoreIntactWedding = useCallback(() => {
    const restored = {
      ...structuredClone(DEFAULT_WEDDING_STATE),
      event: {
        ...DEFAULT_WEDDING_STATE.event,
        ...stateRef.current.event,
      },
    };
    saveState(restored);
    showToast("Original wedding menu restored");
  }, [saveState, showToast]);

  const reconnectWedding = useCallback(async () => {
    const account = getAccountCode();
    if (!account) {
      setSyncModalOpen(true);
      return;
    }
    setSyncBusy(true);
    try {
      setStoredSyncCode(account);
      setSyncCode(account);
      setLastAccountCode(account);
      await refreshFromCloud(true);
      setSyncLive(true);
      showToast("Logged in");
    } catch (error) {
      setSyncLive(false);
      showToast(error instanceof Error ? error.message : "Could not log in");
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
      lastCreatedFunctionId,
      clearLastCreatedFunctionId,
      onFunctionCreated,
      syncModalOpen,
      setSyncModalOpen,
      syncCode,
      lastSyncedAt,
      syncBusy,
      createWeddingLink,
      joinWeddingLink,
      unlinkWedding,
      refreshFromCloud,
      restoreIntactWedding,
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
      lastCreatedFunctionId,
      clearLastCreatedFunctionId,
      onFunctionCreated,
      syncModalOpen,
      syncCode,
      lastSyncedAt,
      syncBusy,
      createWeddingLink,
      joinWeddingLink,
      unlinkWedding,
      refreshFromCloud,
      restoreIntactWedding,
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
