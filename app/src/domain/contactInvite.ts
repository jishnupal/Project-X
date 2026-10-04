export type ContactInvitePayload = {
  guestId: string;
  name: string;
  whatsappText: string;
  claimCode?: string;
  claimUrl?: string;
  url?: string;
};

export async function createContactInvite(input: {
  code: string;
  guestId: string;
  role?: "guest" | "buddy";
}): Promise<ContactInvitePayload> {
  const response = await fetch("/api/invites/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      code: input.code,
      guestId: input.guestId,
      role: input.role === "buddy" ? "buddy" : "guest",
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    url?: string;
    claimUrl?: string;
    claimCode?: string;
    whatsappText?: string;
    name?: string;
    error?: string;
  };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Could not create the invite");
  }
  return {
    guestId: input.guestId,
    name: String(data.name || "").trim(),
    whatsappText: data.whatsappText || data.claimUrl || data.url,
    claimCode: data.claimCode,
    claimUrl: data.claimUrl,
    url: data.url,
  };
}

/** Personal note (cherry) + built invitation body for WhatsApp. */
export function composeWhatsAppInviteText(invitationBody: string, customNote?: string): string {
  const note = String(customNote || "").trim();
  const body = String(invitationBody || "").trim();
  if (note && body) return `${note}\n\n${body}`;
  return note || body;
}

function isMobileLike(): boolean {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) return true;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
  } catch {
    return false;
  }
}

function clickHref(href: string, targetBlank: boolean): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  if (targetBlank) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Open WhatsApp without replacing the BiyeFlow page.
 * Never navigate this window to wa.me (that leaves a blank redirect).
 * Mobile: native whatsapp:// handoff; desktop: new tab.
 */
export function openWhatsAppInvite(text: string): void {
  const encoded = encodeURIComponent(text);
  const nativeUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;

  if (isMobileLike()) {
    clickHref(nativeUrl, false);
    window.setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      clickHref(webUrl, true);
    }, 800);
    return;
  }

  const opened = window.open(webUrl, "_blank", "noopener,noreferrer");
  if (!opened) clickHref(webUrl, true);
}
