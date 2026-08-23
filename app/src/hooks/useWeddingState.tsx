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
import { localStorageRepository, recoverIntactWedding, hydrateWeddingState } from "../domain/storage/localStorageRepository";
import { DEFAULT_WEDDING_STATE, STORAGE_KEY } from "../domain/defaults";
import {
  generateSyncCode,
  getStoredSyncCode,
  getSyncMeta,
  isValidSyncCode,
  markSynced,
  normalizeSyncCode,
  pullWedding,
  pullWeddingRevision,
  pushWedding,
  rememberAccountFromLegacy,
  setStoredSyncCode,
  touchLocalUpdatedAt,
  getAccountCode,
} from "../domain/storage/sync";
import type { WeddingState } from "../domain/types";

type WeddingContextValue = {
  state: WeddingState;
  setState: (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => void;
  saveState: (next: WeddingState) => void;
  toast: string | null;
  showToast: (message: string) => void;
  newEventModalOpen: boolean;
  setNewEventModalOpen: (open: boolean) => void;
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
};

const WeddingContext = createContext<WeddingContextValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<WeddingState>(() => {
    rememberAccountFromLegacy();
    return localStorageRepository.load();
  });
  const [toast, setToast] = useState<string | null>(null);
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
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
  stateRef.current = state;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1700);
  }, []);

  const flushPush = useCallback(async (next: WeddingState) => {
    const code = getStoredSyncCode();
    if (!code) return;
    const updatedAt = getSyncMeta().updatedAt || Date.now();
    await pushWedding(code, next, updatedAt);
    setLastSyncedAt(markSynced().lastSyncedAt);
    setSyncLive(true);
  }, []);

  const schedulePush = useCallback(
    (next: WeddingState) => {
      if (!getStoredSyncCode()) return;
      window.clearTimeout(pushTimer.current);
      pushTimer.current =       window.setTimeout(() => {
        void flushPush(next).catch((error: Error) => {
          showToast(error.message || "Could not sync to cloud");
        });
      }, 400);
    },
    [flushPush, showToast],
  );

  const persist = useCallback(
    (next: WeddingState) => {
      localStorageRepository.save(next);
      touchLocalUpdatedAt();
      schedulePush(next);
    },
    [schedulePush],
  );

  const saveState = useCallback(
    (next: WeddingState) => {
      setStateInternal(next);
      persist(next);
    },
    [persist],
  );

  const setState = useCallback(
    (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => {
      setStateInternal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const applyRemote = useCallback(
    (next: WeddingState, updatedAt: number) => {
      const recovered = recoverIntactWedding(next);
      localStorageRepository.save(recovered);
      touchLocalUpdatedAt(updatedAt);
      setLastSyncedAt(markSynced().lastSyncedAt);
      setStateInternal(recovered);
      setSyncLive(true);
    },
    [],
  );

  const refreshFromCloud = useCallback(async (silent = false) => {
    const code = getStoredSyncCode();
    if (!code) return;
    if (!silent) setSyncBusy(true);
    try {
      const remote = await pullWedding(code);
      if (!remote) {
        await flushPush(stateRef.current);
        setSyncLive(true);
        return;
      }
      const localUpdated = getSyncMeta().updatedAt;
      if (remote.updatedAt >= localUpdated) {
        applyRemote(remote.state, remote.updatedAt);
      } else {
        await flushPush(stateRef.current);
      }
      setSyncLive(true);
    } finally {
      if (!silent) setSyncBusy(false);
    }
  }, [applyRemote, flushPush]);

  useEffect(() => {
    if (sessionStorage.getItem("biyeflow.appUpdated") === "1") {
      sessionStorage.removeItem("biyeflow.appUpdated");
      showToast("App updated");
    }
  }, [showToast]);

  useEffect(() => {
    const flush = () => {
      window.clearTimeout(pushTimer.current);
      if (!getStoredSyncCode()) return;
      void flushPush(stateRef.current).catch(() => undefined);
    };
    window.addEventListener("biyeflow:flush-sync", flush);
    return () => window.removeEventListener("biyeflow:flush-sync", flush);
  }, [flushPush]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const next = recoverIntactWedding(
          hydrateWeddingState(JSON.parse(event.newValue) as Partial<WeddingState>),
        );
        setStateInternal(next);
      } catch {
        /* ignore a corrupt sibling tab write */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const announceReady = () => {
      window.dispatchEvent(new Event("biyeflow:sync-ready"));
    };

    if (!syncCode) {
      announceReady();
      return;
    }

    void refreshFromCloud(true)
      .catch((error: Error) => {
        showToast(error.message || "Could not load cloud wedding");
      })
      .finally(announceReady);
  }, [syncCode, refreshFromCloud, showToast]);

  useEffect(() => {
    const onLaunchRefresh = () => {
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

  useEffect(() => {
    if (!syncCode) return;

    let timer = 0;
    let delay = 400;
    let inFlight = false;
    let cancelled = false;

    const onHide = () => {
      window.clearTimeout(pushTimer.current);
      void flushPush(stateRef.current).catch(() => undefined);
    };

    const tick = async () => {
      if (cancelled || document.visibilityState !== "visible" || inFlight) return;
      inFlight = true;
      try {
        const rev = await pullWeddingRevision(syncCode);
        delay = 2000;
        if (rev == null) {
          await flushPush(stateRef.current);
          setSyncLive(true);
          return;
        }
        const localUpdated = getSyncMeta().updatedAt;
        if (rev > localUpdated) {
          await refreshFromCloud(true);
        } else if (rev < localUpdated) {
          await flushPush(stateRef.current);
        }
        setSyncLive(true);
      } catch {
        setSyncLive(false);
        delay = Math.min(delay * 2, 20_000);
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
        delay = 2000;
        void tick();
      } else {
        onHide();
      }
    };

    const onOffline = () => setSyncLive(false);

    void tick().finally(() => {
      if (!cancelled) loop();
    });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("online", onVisible);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("online", onVisible);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncCode, flushPush, refreshFromCloud]);

  const createWeddingLink = useCallback(async () => {
    const code = generateSyncCode();
    setSyncBusy(true);
    try {
      const updatedAt = touchLocalUpdatedAt().updatedAt;
      await pushWedding(code, stateRef.current, updatedAt);
      setStoredSyncCode(code);
      setSyncCode(code);
      setLastAccountCode(code);
      setLastSyncedAt(markSynced().lastSyncedAt);
      setSyncLive(true);
      showToast("Live on this wedding");
    } finally {
      setSyncBusy(false);
    }
  }, [showToast]);

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
          throw new Error("That wedding code was not found.");
        }
        const recovered = recoverIntactWedding(remote.state);
        setStoredSyncCode(code);
        setSyncCode(code);
        setLastAccountCode(code);
        applyRemote(recovered, remote.updatedAt);
        setSyncLive(true);
        showToast("Live on both devices");
      } finally {
        setSyncBusy(false);
      }
    },
    [applyRemote, showToast],
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
    setLastAccountCode(getAccountCode());
    setStoredSyncCode(null);
    setSyncCode(null);
    setSyncLive(false);
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
    }),
    [
      state,
      setState,
      saveState,
      toast,
      showToast,
      newEventModalOpen,
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
    ],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWeddingState() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWeddingState must be used within WeddingProvider");
  return ctx;
}
