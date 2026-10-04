/**
 * Native host shell (Capacitor) — Phase 3 scaffold.
 *
 * Universal Links / App Links open the same claim/letter URLs as web.
 * Contacts + push are host-only; guests never need the install to read the letter.
 *
 * Wire-up later:
 *   npx cap init BiyeFlow com.biyeflow.app --web-dir=dist
 *   npx cap add ios && npx cap add android
 */
export const capacitorConfig = {
  appId: "com.biyeflow.app",
  appName: "BiyeFlow",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default capacitorConfig;
