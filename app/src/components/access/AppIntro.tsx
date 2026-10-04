import type { ReactNode } from "react";

function Mark() {
  return (
    <div className="text-black">
      <p className="text-[20px] font-black leading-none tracking-[-0.06em]">B</p>
      <p className="mt-0.5 text-[10px] font-bold leading-none tracking-[0.22em]">BIYEFLOW</p>
    </div>
  );
}

function Pill({
  tone,
  disabled,
  onClick,
  children,
}: {
  tone: "yellow" | "dark";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const toneClass = tone === "yellow" ? "bg-[#feca43] text-black" : "bg-[#424242] text-white";
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

export function AppIntro({
  showActions = false,
  still = false,
  busy = false,
  onLogin,
  onSignup,
}: {
  showActions?: boolean;
  still?: boolean;
  busy?: boolean;
  onLogin?: () => void;
  onSignup?: () => void;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#fff8f5] text-[#1e1b18]">
      <main className={`app-intro relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col ${still ? "app-intro--still" : ""}`}>
        <div className="app-intro__mark px-6 pt-5">
          <Mark />
        </div>
        <div className="app-intro__art flex min-h-0 flex-1 items-end px-4 pb-1">
          <img
            src="/signin-characters.png"
            alt=""
            className="max-h-full w-full object-contain object-bottom"
          />
        </div>
        <div className="app-intro__copy px-6 pb-40 pt-4">
          <h1 className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-black">
            Let's
            <br />
            get started
          </h1>
          <p className="mt-3 text-[15px] text-[#584141]">Everything starts from here</p>
          {showActions ? (
            <div className="app-intro__actions mt-20 flex flex-col gap-3">
              <Pill tone="yellow" disabled={busy} onClick={onLogin}>
                Log in
              </Pill>
              <Pill tone="dark" disabled={busy} onClick={onSignup}>
                Sign up
              </Pill>
            </div>
          ) : (
            <div className="mt-20 h-[116px]" aria-hidden />
          )}
        </div>
      </main>
    </div>
  );
}
