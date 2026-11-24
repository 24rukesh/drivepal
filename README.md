# Drivepal (Android)

**Prepared:** 24 Nov 2026
**Built for:** 2026 Baleno Alpha AGS, with valet mode.
**Goal:** one Android app that replaces Suzuki Connect, Smartplay Pro and Smartplay Pro Sync, with mobile number and OTP login.
**App name:** "Drivepal" is a placeholder, chosen so the app doesn't use a car maker's name or logo. Rename it in `capacitor.config.json` and `www/manifest.json`.

## What replaces what

| Official app | What it does | Where it lives in Drivepal |
|---|---|---|
| Suzuki Connect | Car status, location, remote commands, trips, alerts, valet, geofence | Home, Map (map and trips), Remote, Car, Alerts (bell) |
| Smartplay Pro | Bluetooth remote for the car screen: radio, media, screen settings, vehicle info | In-car tab: Head unit, Audio, Vehicle info, Screen settings |
| Smartplay Pro Sync | Head-unit software updates over Wi-Fi and Bluetooth | In-car tab: Software update (plus USB fallback steps) |

## Login (cross-checked against the official apps)

- **Suzuki Connect (India):** sign up with mobile number and VIN, OTP to that number, then create a password. Login is mobile number and password. Forgot password is mobile number and OTP. (The email and password screens online are the Europe app.)
- **Nexa service site and subscription renewal:** mobile number and OTP, by SMS or WhatsApp.
- **Smartplay Pro and Pro Sync:** no account. They pair with the car screen over Bluetooth and Wi-Fi.

**Drivepal:** mobile number (+91, 10 digits starting 6 to 9), then a 6-digit OTP. The OTP expires after 5 minutes, allows 3 wrong tries, and can be resent after 30 seconds. On a new number's first login you set name, car, registration and optional VIN (17 characters, no I, O or Q, checked). "Keep me signed in" is optional. Account screen: sign out, delete account. The car-screen features use Bluetooth pairing, not the account.

**Demo limitation:** there is no SMS server, so the OTP is shown on screen instead of being sent. The code is stored only as a hash, but anyone holding the phone can sign in. Accounts and data live only on that phone, with no cloud sync. For a real release you need:
1. An OTP backend. Options are Firebase Phone Auth (works with Capacitor through a plugin; free quota, then paid) or an Indian SMS gateway such as MSG91 behind a small server.
2. For your own SMS sender in India, DLT registration of the sender ID and template. This is a TRAI rule and needs company paperwork.

## Status: real vs demo

| Part | Status |
|---|---|
| UI, all tabs, login flow, per-user data, offline cache | Built and tested in a browser |
| Maps | Real, OpenStreetMap through Leaflet (bundled in `www/vendor`), no API key |
| Car data, commands, trips, alerts | Mock. Needs Suzuki Connect cloud capture (Phase 0) |
| Head unit audio, settings, vehicle info | Mock. Needs the Smartplay Pro Bluetooth protocol |
| Software updates | Mock. Needs the Pro Sync protocol, and is high risk (see below) |
| OTP SMS | Demo only, needs a backend |

## Folder

```
Drivepal/
  www/                 the app (index.html, app.js, app.css, auth.js, sw.js, manifest.json, icons, vendor/leaflet)
  package.json         Capacitor 7 dependencies and scripts
  capacitor.config.json  appId in.rukesh.drivepal
  .github/workflows/android.yml  cloud build that produces a debug APK
```

## Try it now (no install)

From `Drivepal\www` run `npx http-server -p 8080` (or any static server), then open `http://localhost:8080`. Login needs http on localhost or https, because it uses the browser's crypto API.

## Build the Android APK

Two ways:

**A. Cloud build, recommended (no installs).** Push the `Drivepal` folder to a private GitHub repo. The included workflow builds `app-debug.apk` on every push to main, or on demand from the Actions tab. Download it from the run's Artifacts and install it on the phone (allow "install unknown apps").

**B. Local build.** Install JDK 21 and Android Studio, then from `Drivepal`:
```
npm install
npx cap add android
npx cap sync android
npx cap open android      (then Build > Build APK in Android Studio)
```
Android Studio needs about 8 GB of disk and a fair amount of RAM; option A avoids that.

## Next steps to make it real

1. **Phase 0, Suzuki Connect cloud:** capture the official app's traffic on your own account with a proxy (read-only first, no replaying commands). Find the login, status, location, trips, alerts, valet and command calls.
2. **Phase 0, Smartplay Pro:** on an Android phone turn on Developer options > "Enable Bluetooth HCI snoop log", use Smartplay Pro in the car for a few minutes (radio, volume, presets), then pull the log with `adb bugreport` and read it in Wireshark. Also decompile the Smartplay Pro APK to find its message format. If the head unit uses classic Bluetooth (SPP), Drivepal needs a small native Capacitor plugin. If it uses BLE, `@capacitor-community/bluetooth-le` works.
3. **Phase 0, Pro Sync:** capture the phone's Wi-Fi traffic to the head unit during an update check. **Do not reimplement the file transfer or install step** until it is fully understood: a broken transfer can brick the car screen and may affect warranty. The safe first version only checks the version and hands off to the official installer or USB steps.
4. Swap the mock data for an adapter that calls the real services, keeping the same screens.
5. Add an OTP backend and, if you want, cloud sync of trips and logs.

## Risks to keep in mind

- Unofficial access to these services can break whenever the maker changes them, and may breach their terms. The account could get blocked.
- Remote commands (immobilizer especially) have real-world effects. Keep confirmations and the honest Sending / Done / Couldn't-confirm states.
- Do not publish on the Play Store using the maker's name or logo.
