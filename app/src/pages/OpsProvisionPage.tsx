import { useState } from "react";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import type { ModuleId } from "../domain/access/types";
import { MODULE_IDS, MODULE_LABELS } from "../domain/access/permissions";

/** Hidden ops route — not linked anywhere in the app. */
export function OpsProvisionPage() {
  const { syncCode, joinWeddingLink, showToast } = useWeddingState();
  const { provisionWeddingAsSuperAdmin } = useAccess();

  const [joinCode, setJoinCode] = useState("");
  const [provisionSecret, setProvisionSecret] = useState("");
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([
    "buzz",
    "guests",
    "menu",
    "rooms",
    "access",
  ]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const toggleModule = (moduleId: ModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId],
    );
  };

  return (
    <div className="min-h-dvh bg-surface px-4 py-10">
      <div className="max-w-md mx-auto space-y-5">
        <div>
          <h1 className="font-headline-md text-primary text-[22px]">Provision wedding</h1>
          <p className="text-[13px] text-secondary mt-2">
            Link a wedding code, then enable modules for the client Admin.
          </p>
        </div>

        {syncCode ? (
          <p className="text-[12px] text-secondary tabular-nums tracking-wider">
            Linked · {syncCode}
          </p>
        ) : (
          <div className="flex gap-1.5">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="Wedding code"
              className="flex-1 h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3 text-xs tracking-[0.2em] uppercase text-primary outline-none"
            />
            <button
              type="button"
              disabled={busy || joinCode.length < 8}
              onClick={() => void run(async () => {
                await joinWeddingLink(joinCode);
                setJoinCode("");
              })}
              className="h-11 px-4 rounded-xl bg-primary text-on-primary font-button text-[13px] disabled:opacity-40"
            >
              Link
            </button>
          </div>
        )}

        <label className="block">
          <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Secret</span>
          <input
            value={provisionSecret}
            onChange={(e) => setProvisionSecret(e.target.value)}
            type="password"
            autoComplete="off"
            className="mt-1.5 w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 text-primary outline-none"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Modules</legend>
          <div className="grid grid-cols-2 gap-2">
            {MODULE_IDS.map((moduleId) => (
              <label key={moduleId} className="flex items-center gap-2 text-[12px] text-secondary">
                <input
                  type="checkbox"
                  checked={enabledModules.includes(moduleId)}
                  onChange={() => toggleModule(moduleId)}
                />
                {MODULE_LABELS[moduleId]}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          disabled={busy || !syncCode || !provisionSecret || enabledModules.length === 0}
          onClick={() =>
            void run(async () => {
              await provisionWeddingAsSuperAdmin({ provisionSecret, enabledModules });
              setDone(true);
            })
          }
          className="w-full h-11 rounded-full bg-primary text-on-primary font-button text-[13px] disabled:opacity-40"
        >
          {busy ? "Provisioning…" : "Provision"}
        </button>

        {done ? (
          <p className="text-[12px] text-secondary">Done. Client Admin can now set up their profile at /auth.</p>
        ) : null}
      </div>
    </div>
  );
}
