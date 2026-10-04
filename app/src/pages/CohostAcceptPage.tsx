import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { acceptCohost } from "../domain/access/cohostApi";
import { PublicPageShell } from "../components/layout/PublicPageShell";

export function CohostAcceptPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { status, user, loginWithGoogle } = useAuth();
  const { enterAsHost } = useAccess();
  const { joinWeddingLink } = useWeddingState();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!token || status === "loading") return;
    if (status === "anon") {
      loginWithGoogle(`/cohost/${token}`);
      return;
    }
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const event = await acceptCohost(token);
        await joinWeddingLink(event.code);
        await enterAsHost(event.code);
        navigate("/command-center", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not join this event");
      }
    })();
  }, [token, status, loginWithGoogle, joinWeddingLink, enterAsHost, navigate]);

  return (
    <PublicPageShell narrow>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {error ? (
          <>
            <h1 className="font-headline-md text-[#1a100c] text-[28px]">Couldn’t join</h1>
            <p className="mt-3 text-[14px] text-[#7a6f62] max-w-sm">{error}</p>
            {user?.email ? (
              <p className="mt-2 text-[12px] text-[#b0a89e]">Signed in as {user.email}</p>
            ) : null}
          </>
        ) : (
          <>
            <div className="landing-spinner mx-auto mb-4" aria-hidden />
            <p className="text-[14px] text-[#7a6f62]">
              {status === "anon" ? "Continue with Google…" : "Joining the event…"}
            </p>
          </>
        )}
      </div>
    </PublicPageShell>
  );
}
