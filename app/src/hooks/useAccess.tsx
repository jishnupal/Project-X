import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bootstrapAdminProfile,
  fetchAccessSnapshot,
  fetchInviteLinks,
  heartbeatDevice,
  joinAsBuddy,
  joinAsGuest,
  provisionWedding,
  restoreProfileSession,
  revokeDevice,
  selectExistingProfile,
  updateBuddyGrants,
  updateProfileMeta,
  resetAdminPin,
} from "../domain/access/accessApi";
import {
  getDeviceLabel,
  getOrCreateDeviceId,
  rememberRecentAccess,
} from "../domain/access/deviceLocal";
import {
  canAccess,
  canEditWedding,
  canManageAccess,
  isPinRole,
  normalizeRole,
} from "../domain/access/permissions";
import {
  clearAccessSession,
  loadAccessSession,
  saveAccessSession,
} from "../domain/access/sessionLocal";
import type {
  AccessSnapshot,
  LocalAccessSession,
  ModuleGrants,
  ModuleId,
  ProfileAvatarId,
  WeddingProfile,
} from "../domain/access/types";
import { getStoredSyncCode } from "../domain/storage/sync";
import { useWeddingState } from "./useWeddingState";

type AccessContextValue = {
  snapshot: AccessSnapshot | null;
  session: LocalAccessSession | null;
  profile: WeddingProfile | null;
  deviceCount: number;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  isBuddy: boolean;
  adminUnlocked: boolean;
  canAccessModule: (module: ModuleId, level: "view" | "edit" | "manage") => boolean;
  refreshAccess: () => Promise<void>;
  setupAdmin: (input: {
    name: string;
    avatarId: ProfileAvatarId;
    pin: string;
  }) => Promise<void>;
  joinGuest: (input: {
    inviteToken?: string;
    name: string;
    avatarId: ProfileAvatarId;
  }) => Promise<void>;
  joinBuddy: (input: {
    inviteToken: string;
    name: string;
    avatarId: ProfileAvatarId;
    pin: string;
  }) => Promise<void>;
  unlockProfile: (profileId: string, pin?: string) => Promise<void>;
  resetForgottenPin: (input: { pin: string; confirmPin: string }) => Promise<void>;
  restoreRecentSession: (input: {
    weddingCode: string;
    profileId: string;
    role: string;
    moduleGrants?: ModuleGrants;
  }) => Promise<void>;
  saveProfile: (input: { name?: string; avatarId?: ProfileAvatarId }) => Promise<void>;
  saveBuddyGrants: (profileId: string, moduleGrants: ModuleGrants) => Promise<void>;
  loadInviteLinks: () => Promise<{ guest: string; buddy: string }>;
  removeDevice: (deviceId: string) => Promise<void>;
  provisionWeddingAsSuperAdmin: (input: {
    provisionSecret: string;
    enabledModules?: ModuleId[];
  }) => Promise<void>;
  clearLocalAccess: () => void;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { syncCode, showToast } = useWeddingState();
  const [snapshot, setSnapshot] = useState<AccessSnapshot | null>(null);
  const [session, setSession] = useState<LocalAccessSession | null>(() => loadAccessSession());

  const profile =
    snapshot?.profiles.find((row) => row.id === session?.profileId) ||
    (session
      ? ({
          id: session.profileId,
          name: "You",
          role: session.role,
          avatarId: "lotus",
          moduleGrants: session.moduleGrants,
          hasPin: isPinRole(session.role),
          createdAt: 0,
          updatedAt: 0,
        } as WeddingProfile)
      : null);

  const deviceCount = snapshot?.devices.length || 0;

  const refreshAccess = useCallback(async () => {
    const code = syncCode || getStoredSyncCode();
    if (!code) {
      setSnapshot(null);
      return;
    }
    const next = await fetchAccessSnapshot(code);
    setSnapshot(next);
  }, [syncCode]);

  useEffect(() => {
    void refreshAccess().catch(() => undefined);
  }, [refreshAccess]);

  useEffect(() => {
    const code = syncCode || getStoredSyncCode();
    if (!code || !session?.profileId) return;
    if (session.weddingCode !== code) return;
    if (!isPinRole(session.role)) return;

    let cancelled = false;
    const beat = async () => {
      try {
        const next = await heartbeatDevice(code, {
          deviceId: getOrCreateDeviceId(),
          deviceLabel: getDeviceLabel(),
          profileId: session.profileId,
        });
        if (!cancelled) setSnapshot(next);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("removed") && !cancelled) {
          clearAccessSession();
          setSession(null);
          showToast("This device was removed");
        }
      }
    };
    const initial = window.setTimeout(() => void beat(), 5_000);
    const timer = window.setInterval(() => void beat(), 20_000);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [syncCode, session?.profileId, session?.role, session?.weddingCode, showToast]);

  const persistSession = useCallback(
    (next: LocalAccessSession, activeProfile: WeddingProfile) => {
      saveAccessSession(next);
      setSession(next);
      rememberRecentAccess({
        weddingCode: next.weddingCode,
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        avatarId: activeProfile.avatarId,
        role: activeProfile.role,
        deviceId: next.deviceId,
        lastSeenAt: Date.now(),
      });
    },
    [],
  );

  const setupAdmin = useCallback(
    async (input: { name: string; avatarId: ProfileAvatarId; pin: string }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Connect a wedding first.");
      const deviceId = getOrCreateDeviceId();
      const result = await bootstrapAdminProfile(code, {
        ...input,
        deviceId,
        deviceLabel: getDeviceLabel(),
      });
      setSnapshot(result.snapshot);
      persistSession(
        {
          weddingCode: code,
          profileId: result.profile.id,
          role: result.profile.role,
          moduleGrants: result.profile.moduleGrants,
          adminToken: result.adminToken,
          deviceId,
        },
        result.profile,
      );
      showToast("Admin profile ready");
    },
    [syncCode, persistSession, showToast],
  );

  const joinGuest = useCallback(
    async (input: { inviteToken?: string; name: string; avatarId: ProfileAvatarId }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Wedding not linked.");
      const deviceId = getOrCreateDeviceId();
      const result = await joinAsGuest(code, {
        ...input,
        deviceId,
        deviceLabel: getDeviceLabel(),
      });
      setSnapshot(result.snapshot);
      persistSession(
        {
          weddingCode: code,
          profileId: result.profile.id,
          role: result.profile.role,
          moduleGrants: result.profile.moduleGrants,
          adminToken: "",
          deviceId,
        },
        result.profile,
      );
      showToast(`Welcome, ${result.profile.name}`);
    },
    [syncCode, persistSession, showToast],
  );

  const joinBuddy = useCallback(
    async (input: {
      inviteToken: string;
      name: string;
      avatarId: ProfileAvatarId;
      pin: string;
    }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Wedding not linked.");
      const deviceId = getOrCreateDeviceId();
      const result = await joinAsBuddy(code, {
        ...input,
        deviceId,
        deviceLabel: getDeviceLabel(),
      });
      setSnapshot(result.snapshot);
      persistSession(
        {
          weddingCode: code,
          profileId: result.profile.id,
          role: result.profile.role,
          moduleGrants: result.profile.moduleGrants,
          adminToken: result.adminToken,
          deviceId,
        },
        result.profile,
      );
      showToast(`Joined as ${result.profile.name}`);
    },
    [syncCode, persistSession, showToast],
  );

  const unlockProfile = useCallback(
    async (profileId: string, pin?: string) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Connect a wedding first.");
      const deviceId = getOrCreateDeviceId();
      const result = await selectExistingProfile(code, {
        profileId,
        pin,
        deviceId,
        deviceLabel: getDeviceLabel(),
      });
      setSnapshot(result.snapshot);
      persistSession(
        {
          weddingCode: code,
          profileId: result.profile.id,
          role: result.profile.role,
          moduleGrants: result.profile.moduleGrants,
          adminToken: result.adminToken || "",
          deviceId,
        },
        result.profile,
      );
      showToast(`Signed in as ${result.profile.name}`);
    },
    [syncCode, persistSession, showToast],
  );

  const resetForgottenPin = useCallback(
    async (input: { pin: string; confirmPin: string }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Connect a wedding first.");
      const deviceId = getOrCreateDeviceId();
      const result = await resetAdminPin(code, {
        pin: input.pin,
        confirmPin: input.confirmPin,
        deviceId,
        deviceLabel: getDeviceLabel(),
      });
      setSnapshot(result.snapshot);
      persistSession(
        {
          weddingCode: code,
          profileId: result.profile.id,
          role: result.profile.role,
          moduleGrants: result.profile.moduleGrants,
          adminToken: result.adminToken || "",
          deviceId,
        },
        result.profile,
      );
      showToast("PIN reset — signed in as Admin");
    },
    [syncCode, persistSession, showToast],
  );

  const restoreRecentSession = useCallback(
    async (input: {
      weddingCode: string;
      profileId: string;
      role: string;
      moduleGrants?: ModuleGrants;
    }) => {
      const code = input.weddingCode.toUpperCase();
      const deviceId = getOrCreateDeviceId();
      let activeProfile: WeddingProfile;
      try {
        const restored = await restoreProfileSession(code, {
          deviceId,
          profileId: input.profileId,
        });
        setSnapshot(restored.snapshot);
        activeProfile = restored.profile;
      } catch {
        activeProfile = {
          id: input.profileId,
          name: "You",
          role: normalizeRole(input.role),
          avatarId: "lotus",
          moduleGrants: input.moduleGrants || {},
          hasPin: isPinRole(input.role),
          createdAt: 0,
          updatedAt: 0,
        };
      }
      persistSession(
        {
          weddingCode: code,
          profileId: input.profileId,
          role: normalizeRole(input.role),
          moduleGrants: activeProfile.moduleGrants || input.moduleGrants || {},
          adminToken: "",
          deviceId,
        },
        activeProfile,
      );
      showToast("Welcome back");
    },
    [persistSession, showToast],
  );

  const saveProfile = useCallback(
    async (input: { name?: string; avatarId?: ProfileAvatarId }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code || !session?.profileId) throw new Error("No active profile.");
      const next = await updateProfileMeta(code, {
        profileId: session.profileId,
        deviceId: session.deviceId,
        ...input,
      });
      setSnapshot(next);
      showToast("Profile updated");
    },
    [syncCode, session, showToast],
  );

  const saveBuddyGrants = useCallback(
    async (profileId: string, moduleGrants: ModuleGrants) => {
      const code = syncCode || getStoredSyncCode();
      if (!code || !session?.adminToken) throw new Error("Admin session required.");
      const next = await updateBuddyGrants(code, {
        profileId,
        moduleGrants,
        adminToken: session.adminToken,
      });
      setSnapshot(next);
      showToast("Buddy access updated");
    },
    [syncCode, session, showToast],
  );

  const loadInviteLinks = useCallback(async () => {
    const code = syncCode || getStoredSyncCode();
    if (!code || !session?.adminToken) throw new Error("Admin session required.");
    const result = await fetchInviteLinks(code, session.adminToken);
    setSnapshot(result.snapshot);
    return {
      guest: result.guestInviteToken,
      buddy: result.buddyInviteToken,
    };
  }, [syncCode, session]);

  const removeDevice = useCallback(
    async (deviceId: string) => {
      const code = syncCode || getStoredSyncCode();
      if (!code || !session?.adminToken) throw new Error("Admin session required.");
      const next = await revokeDevice(code, {
        deviceId,
        adminToken: session.adminToken,
      });
      setSnapshot(next);
      showToast("Device removed");
    },
    [syncCode, session, showToast],
  );

  const provisionWeddingAsSuperAdmin = useCallback(
    async (input: { provisionSecret: string; enabledModules?: ModuleId[] }) => {
      const code = syncCode || getStoredSyncCode();
      if (!code) throw new Error("Connect a wedding code first.");
      const next = await provisionWedding(code, input);
      setSnapshot(next);
      showToast("Wedding provisioned");
    },
    [syncCode, showToast],
  );

  const clearLocalAccess = useCallback(() => {
    clearAccessSession();
    setSession(null);
  }, []);

  const canAccessModule = useCallback(
    (module: ModuleId, level: "view" | "edit" | "manage") =>
      canAccess(profile, module, level),
    [profile],
  );

  const value = useMemo(
    () => ({
      snapshot,
      session,
      profile,
      deviceCount,
      canEdit: canEditWedding(profile),
      canManage: canManageAccess(profile),
      isAdmin: normalizeRole(profile?.role ?? session?.role) === "admin",
      isGuest: Boolean(session && normalizeRole(session.role) === "guest"),
      isBuddy: normalizeRole(profile?.role) === "buddy",
      adminUnlocked: Boolean(session?.adminToken) && isPinRole(session?.role || ""),
      canAccessModule,
      refreshAccess,
      setupAdmin,
      joinGuest,
      joinBuddy,
      unlockProfile,
      resetForgottenPin,
      restoreRecentSession,
      saveProfile,
      saveBuddyGrants,
      loadInviteLinks,
      removeDevice,
      provisionWeddingAsSuperAdmin,
      clearLocalAccess,
    }),
    [
      snapshot,
      session,
      profile,
      deviceCount,
      canAccessModule,
      refreshAccess,
      setupAdmin,
      joinGuest,
      joinBuddy,
      unlockProfile,
      resetForgottenPin,
      restoreRecentSession,
      saveProfile,
      saveBuddyGrants,
      loadInviteLinks,
      removeDevice,
      provisionWeddingAsSuperAdmin,
      clearLocalAccess,
    ],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
