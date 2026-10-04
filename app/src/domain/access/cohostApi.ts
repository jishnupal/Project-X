export type CohostSeat = {
  email: string;
  name?: string | null;
  status: "pending" | "active";
  token?: string;
};

export type CohostStatus = {
  isOwner: boolean;
  eventName: string;
  cohost: CohostSeat | null;
};

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) return payload.error;
  } catch {
    /* ignore */
  }
  return "Something went wrong";
}

export async function fetchCohost(code: string): Promise<CohostStatus | null> {
  const response = await fetch(`/api/events/cohost?code=${encodeURIComponent(code)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as CohostStatus;
}

export async function inviteCohost(code: string, email: string): Promise<CohostSeat> {
  const response = await fetch("/api/events/cohost", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "invite", code, email }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { cohost: CohostSeat };
  return payload.cohost;
}

export async function revokeCohost(code: string): Promise<void> {
  const response = await fetch("/api/events/cohost", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "revoke", code }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function acceptCohost(token: string): Promise<{ code: string; name: string }> {
  const response = await fetch("/api/cohost/accept", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as { code: string; name: string };
}

export function cohostLink(token: string): string {
  return `${window.location.origin}/cohost/${token}`;
}
