import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localStorageRepository } from "../domain/storage/localStorageRepository";
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
};

const WeddingContext = createContext<WeddingContextValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<WeddingState>(() =>
    localStorageRepository.load(),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [lastCreatedFunctionId, setLastCreatedFunctionId] = useState<number | null>(null);

  const saveState = useCallback((next: WeddingState) => {
    setStateInternal(next);
    localStorageRepository.save(next);
  }, []);

  const setState = useCallback(
    (updater: WeddingState | ((prev: WeddingState) => WeddingState)) => {
      setStateInternal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localStorageRepository.save(next);
        return next;
      });
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1700);
  }, []);

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
    ],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWeddingState() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWeddingState must be used within WeddingProvider");
  return ctx;
}
