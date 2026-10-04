const KEY = "biyeflow.hostFaces";

const RECENT_MS = 24 * 60 * 60 * 1000;

export type HostFace = {
  email: string;
  name: string;
  avatarUrl: string | null;
  seenAt?: number;
};

function isFace(value: unknown): value is HostFace {
  if (!value || typeof value !== "object") return false;
  const face = value as HostFace;
  return typeof face.email === "string" && face.email.includes("@") && typeof face.name === "string";
}

export function loadHostFaces(): HostFace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    let stamped = false;
    const faces = parsed.filter(isFace).slice(0, 4).map((face) => {
      if (typeof face.seenAt === "number") return face;
      stamped = true;
      return { ...face, seenAt: now };
    });
    if (stamped) {
      try {
        localStorage.setItem(KEY, JSON.stringify(faces));
      } catch {
        /* ignore */
      }
    }
    return faces;
  } catch {
    return [];
  }
}

export function rememberHostFace(face: HostFace) {
  const email = face.email.trim().toLowerCase();
  if (!email.includes("@")) return;
  const next = [
    {
      email,
      name: face.name.trim() || email.split("@")[0],
      avatarUrl: face.avatarUrl,
      seenAt: Date.now(),
    },
    ...loadHostFaces().filter((item) => item.email !== email),
  ].slice(0, 4);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function recentHostFace(faces: HostFace[]): HostFace | null {
  const face = faces[0];
  if (!face || typeof face.seenAt !== "number") return null;
  if (Date.now() - face.seenAt > RECENT_MS) return null;
  return face;
}

export function clearHostFaces() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
