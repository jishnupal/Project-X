import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { clearHostFaces, loadHostFaces, recentHostFace, type HostFace } from "../domain/access/hostFaces";
import { AppIntro } from "../components/access/AppIntro";
import { Icon } from "../components/ui/Icon";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function clearLocalWeddingState() {
  const keys = [
    "biyeflow.syncCode",
    "biyeflow_sync_code",
    "biyeflow_wedding_code",
    "biyeflow.accessSession",
    "biyeflow.accountCode",
    "biyeflow.syncActive",
    "biyeflow.syncMeta",
    "biyeflow.recentAccess",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function firstName(name: string) {
  const part = name.trim().split(/\s+/)[0];
  return part || name;
}

function Pill({
  tone,
  disabled,
  onClick,
  children,
}: {
  tone: "yellow" | "dark" | "light";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const toneClass =
    tone === "yellow"
      ? "bg-[#feca43] text-black"
      : tone === "dark"
        ? "bg-[#424242] text-white"
        : "border border-[#ececec] bg-white text-[#1a1a1a]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[16px] font-semibold active:scale-[0.98] disabled:opacity-70 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function TextField({
  icon,
  placeholder,
  type = "text",
  trailing,
  value,
  onChange,
}: {
  icon: string;
  placeholder: string;
  type?: string;
  trailing?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex h-[52px] items-center gap-3 rounded-[10px] border border-[#e6e6e6] bg-white px-3.5">
      <Icon name={icon} className="text-[20px] text-[#b5b5b5]" />
      <input
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="h-full w-full bg-transparent text-[15px] text-[#1a1a1a] outline-none placeholder:text-[#b5b5b5]"
      />
      {trailing}
    </label>
  );
}

function safeReturnPath(raw: string | null, fallback = "/dashboard") {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, status, logout } = useAuth();
  const [faces, setFaces] = useState<HostFace[]>(() => loadHostFaces());
  const [freshReady, setFreshReady] = useState(false);
  const picking = searchParams.get("pick") === "1";
  const returnTo = safeReturnPath(searchParams.get("return"), "/dashboard");
  const inviteIntent =
    searchParams.get("intent") === "invite" ||
    searchParams.get("signup") === "1" ||
    returnTo.startsWith("/claim") ||
    returnTo.startsWith("/invite");

  useEffect(() => {
    const wantFresh = searchParams.get("fresh") === "1";
    if (!wantFresh) {
      setFreshReady(true);
      setFaces(loadHostFaces());
      return;
    }
    let cancelled = false;
    (async () => {
      clearLocalWeddingState();
      clearHostFaces();
      try {
        await logout();
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setFaces([]);
        const keep = new URLSearchParams();
        if (searchParams.get("return")) keep.set("return", searchParams.get("return")!);
        if (searchParams.get("intent")) keep.set("intent", searchParams.get("intent")!);
        if (searchParams.get("signup")) keep.set("signup", searchParams.get("signup")!);
        const q = keep.toString();
        navigate(q ? `/login?${q}` : "/login", { replace: true });
        setFreshReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, logout, navigate]);

  useEffect(() => {
    if (!freshReady) return;
    if (searchParams.get("fresh") === "1" || searchParams.get("pick") === "1") return;
    if (status === "authenticated") {
      navigate(returnTo, { replace: true });
    }
  }, [status, navigate, freshReady, searchParams, returnTo]);

  const waiting =
    !freshReady ||
    status === "loading" ||
    (status === "authenticated" &&
      searchParams.get("fresh") !== "1" &&
      searchParams.get("pick") !== "1");
  const recent = recentHostFace(faces);
  const [screen, setScreen] = useState<"start" | "login" | "signup">(() => {
    if (inviteIntent) return "signup";
    if (picking) return "login";
    return "start";
  });
  const [email, setEmail] = useState(() => recentHostFace(loadHostFaces())?.email ?? "");
  const [signupName, setSignupName] = useState(() => {
    try {
      return sessionStorage.getItem("biyeflow.viewerName") || "";
    } catch {
      return "";
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const busy = waiting;
  const typedEmail = email.trim().toLowerCase();
  const emailReady = typedEmail.includes("@");
  const sameAsRecent = Boolean(recent && emailReady && typedEmail === recent.email);

  const rememberSignupName = () => {
    const name = signupName.trim();
    if (!name) return;
    try {
      sessionStorage.setItem("biyeflow.viewerName", name);
    } catch {
      /* ignore */
    }
  };

  const openLogin = () => {
    setEmail(recent?.email ?? "");
    setScreen("login");
  };
  const openSignup = () => {
    setEmail("");
    setScreen("signup");
  };
  const continueSaved = () => {
    if (recent) loginWithGoogle(returnTo, recent.email, true);
  };
  const continueKnown = () => {
    const hint = emailReady ? typedEmail : undefined;
    if (hint) loginWithGoogle(returnTo, hint);
    else loginWithGoogle(returnTo, undefined, false, true);
  };
  const continueDifferent = () => loginWithGoogle(returnTo, undefined, false, true);
  const continueSignup = () => {
    rememberSignupName();
    loginWithGoogle(
      returnTo,
      emailReady && !sameAsRecent ? typedEmail : undefined,
      false,
      true,
    );
  };

  let introSeen = false;
  try {
    introSeen = sessionStorage.getItem("biyeflow.introSeen") === "1";
  } catch {
    introSeen = false;
  }

  if (screen === "start" && !inviteIntent) {
    return (
      <AppIntro
        still={introSeen}
        showActions={!busy}
        busy={busy}
        onLogin={openLogin}
        onSignup={openSignup}
      />
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#fff8f5] text-[#1e1b18]">
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
          <div className="flex flex-1 flex-col px-6 pb-8 pt-4">
            <button
              type="button"
              onClick={() => {
                if (inviteIntent) {
                  navigate(returnTo, { replace: true });
                  return;
                }
                setScreen("start");
              }}
              aria-label="Back"
              className="grid h-10 w-10 place-items-center"
            >
              <Icon name="arrow_back" className="text-[24px] text-[#1a1a1a]" />
            </button>
            <h1 className="mt-3 text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-[#324e51]">
              {screen === "login"
                ? "Welcome back"
                : inviteIntent
                  ? "Join to check in"
                  : "Create account"}
            </h1>
            <p className="mt-1.5 text-[15px] text-[#584141]">
              {screen === "login"
                ? recent
                  ? "Tap to continue"
                  : "Enter your credential to continue"
                : inviteIntent
                  ? "Create your BiyeFlow profile to save your pass and enter the event."
                  : "Use a different email. This adds another person."}
            </p>

            {screen === "login" && recent ? (
              <div className="mt-10 flex flex-col items-center text-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={continueSaved}
                  className="flex flex-col items-center disabled:opacity-70"
                >
                  {recent.avatarUrl ? (
                    <img src={recent.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-[#feca43]" />
                  ) : (
                    <span className="grid h-24 w-24 place-items-center rounded-full bg-[#f3f3f3] text-[32px] font-bold ring-4 ring-[#feca43]">
                      {firstName(recent.name).slice(0, 1)}
                    </span>
                  )}
                  <span className="mt-3 text-[18px] font-bold tracking-[-0.03em]">{firstName(recent.name)}</span>
                  <span className="mt-1 text-[14px] text-[#584141]">{recent.email}</span>
                </button>
                <div className="mt-8 w-full">
                  <Pill tone="yellow" disabled={busy} onClick={continueSaved}>
                    {busy ? "Opening" : "Log in"}
                  </Pill>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={continueDifferent}
                  className="mt-4 text-[14px] font-semibold text-[#1a1a1a] disabled:opacity-70"
                >
                  Log in with a different account
                </button>
              </div>
            ) : null}

            {screen === "login" && recent ? null : (
            <>
            <form
              className="mt-7 flex flex-col gap-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                if (busy) return;
                if (screen === "signup") continueSignup();
                else continueKnown();
              }}
            >
              {screen === "signup" ? (
                <TextField
                  icon="person"
                  placeholder="Name"
                  value={signupName}
                  onChange={setSignupName}
                  trailing={<span className="h-6 w-px bg-[#e4e4e4]" aria-hidden />}
                />
              ) : null}
              <TextField
                icon={screen === "login" ? "person" : "mail"}
                placeholder={screen === "login" ? "Email or username" : "Email address"}
                value={email}
                onChange={setEmail}
              />
              {screen === "signup" && sameAsRecent ? (
                <p className="px-1 text-[13px] text-[#584141]">
                  That email is already on this phone. Use a different one to sign up.
                </p>
              ) : null}
              <TextField
                icon="lock"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                trailing={
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>
                    <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px] text-[#b5b5b5]" />
                  </button>
                }
              />
              {screen === "signup" ? (
                <TextField
                  icon="lock"
                  placeholder="Confirm password"
                  type={showConfirm ? "text" : "password"}
                  trailing={
                    <button type="button" aria-label={showConfirm ? "Hide password" : "Show password"} onClick={() => setShowConfirm((v) => !v)}>
                      <Icon name={showConfirm ? "visibility_off" : "visibility"} className="text-[20px] text-[#b5b5b5]" />
                    </button>
                  }
                />
              ) : (
                <div className="flex justify-end">
                  <span className="text-[13px] text-[#584141]">Forgot password?</span>
                </div>
              )}
            </form>

            <div className="mt-5 flex flex-col gap-3">
              <Pill tone="yellow" disabled={busy || (screen === "signup" && sameAsRecent)} onClick={screen === "signup" ? continueSignup : continueKnown}>
                {busy ? "Opening" : screen === "login" ? "Log in" : "Sign up"}
              </Pill>
              <Pill tone="light" disabled={busy} onClick={screen === "signup" ? continueSignup : continueKnown}>
                <GoogleIcon />
                {screen === "signup" ? "Sign up with Google" : "Log in using Google"}
              </Pill>
            </div>
            </>
            )}

            <p className="mt-auto pt-8 text-center text-[14px] text-[#584141]">
              {screen === "login" ? "Don't have account? " : "Already member? "}
              <button
                type="button"
                onClick={screen === "login" ? openSignup : openLogin}
                className="font-semibold text-[#1a1a1a]"
              >
                {screen === "login" ? "Sign up" : "Log In"}
              </button>
            </p>
          </div>
      </main>
    </div>
  );
}
