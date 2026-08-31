import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isValidSyncCode, normalizeSyncCode } from "../../domain/storage/sync";
import { useWeddingState } from "../../hooks/useWeddingState";

/**
 * Same-room pairing: open /join/ABCDEFGH (or ?code=) on the second device.
 */
export function JoinPairingHandler() {
  const { code: pathCode } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { syncCode, joinWeddingLink, showToast, setSyncModalOpen } = useWeddingState();
  const handled = useRef("");

  useEffect(() => {
    const raw = pathCode || params.get("code") || "";
    const code = normalizeSyncCode(raw);

    if (!isValidSyncCode(code)) {
      navigate("/join", { replace: true });
      return;
    }

    if (handled.current === code) return;
    if (syncCode === code) {
      handled.current = code;
      navigate("/auth", { replace: true });
      return;
    }

    handled.current = code;
    void (async () => {
      try {
        await joinWeddingLink(code);
        showToast("Wedding linked — sign in to continue");
        navigate("/auth", { replace: true });
      } catch (error) {
        handled.current = "";
        setSyncModalOpen(true);
        showToast(error instanceof Error ? error.message : "Could not join");
        navigate("/join", { replace: true });
      }
    })();
  }, [
    pathCode,
    params,
    syncCode,
    joinWeddingLink,
    showToast,
    setSyncModalOpen,
    navigate,
  ]);

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="landing-spinner" aria-hidden />
      <p className="font-headline-md text-primary text-[22px]">Joining wedding…</p>
      <p className="text-sm text-secondary">Pulling the shared guest list</p>
    </div>
  );
}
