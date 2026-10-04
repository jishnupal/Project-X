# Native host shell (Phase 3)

BiyeFlow’s guest invite path stays a **web link** (welcome + letter + FOMO).  
The native shell is for **hosts**: Contacts permission, push, and store listing.

## Universal Links

- iOS: `public/.well-known/apple-app-site-association`
- Android: `public/.well-known/assetlinks.json`
- Claim URLs (`/claim/:code`, `/invite/:role/:token`) open the app when installed, else the web letter.

## Setup (when ready to ship stores)

```bash
cd app
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/push-notifications @capacitor-community/contacts
npx cap init BiyeFlow com.biyeflow.app --web-dir=dist
npx cap add ios
npx cap add android
npm run build && npx cap sync
```

Config lives in `capacitor.config.ts`. Bridge stubs: `src/native/hostShell.ts`.
