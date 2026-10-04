import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type AdminEvent = {
  name: string;
  code: string;
  role: string;
  owner: boolean;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  events: AdminEvent[];
};

export function PlatformAdminPage() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "anon") navigate("/login", { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (user.platformRole !== "platform_admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    let cancelled = false;
    void fetch("/api/admin/users", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load customers");
        return data as { count: number; users: AdminUser[] };
      })
      .then((data) => {
        if (cancelled) return;
        setCount(data.count);
        setUsers(data.users);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load customers");
      });
    return () => {
      cancelled = true;
    };
  }, [status, user, navigate]);

  if (status !== "authenticated" || !user || user.platformRole !== "platform_admin") {
    return <div className="min-h-dvh bg-[#fff8f5]" aria-busy="true" />;
  }

  return (
    <div className="min-h-dvh bg-[#fff8f5] font-[Manrope,sans-serif] text-black">
      <header className="px-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-[15px] font-semibold text-[#584141]"
        >
          Events
        </button>
        <p className="mt-8 text-[13px] font-medium text-[#584141]">Customers</p>
        <h1 className="mt-1 text-[56px] font-extrabold leading-none tracking-[-0.045em] tabular-nums">
          {count ?? "—"}
        </h1>
        <p className="mt-2 text-[15px] text-[#584141]">Gmail accounts that have signed in.</p>
      </header>
      <main className="px-6 pb-16 pt-8">
        {error ? <p className="text-[15px] font-semibold text-[#584141]">{error}</p> : null}
        <ul className="flex flex-col gap-3">
          {users.map((person) => (
            <li key={person.id} className="rounded-[24px] bg-[#fffdf8] px-4 py-4 shadow-[0_10px_24px_rgba(30,27,24,0.06)]">
              <p className="text-[18px] font-extrabold tracking-[-0.02em]">{person.name}</p>
              <p className="mt-0.5 text-[13px] font-medium text-[#584141]">{person.email}</p>
              <p className="mt-2 text-[13px] font-semibold text-black">
                {person.events.length === 0
                  ? "No event"
                  : person.events.map((event) => event.name).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
