# Suzuki Connect API (India) — Reverse-Engineered Map

**Date:** 24 Nov 2026
**Source:** official Android app `com.msil.suzukiconnect_generation_2`, version 1.1.24 (57), arm64-v8a XAPK from APKPure, decompiled by scanning the DEX constant-pool strings (no Java on the PC, so no full JADX pass yet).
**Status:** paths and hosts are extracted from the app binary. Request/response shapes are still unverified, except where marked. Nothing here has been called with credentials yet.

---

## 1. Live-verified base host

| Host | Evidence | Live check (24 Nov, unauthenticated) |
|---|---|---|
| `https://tsp-in.suzukiconnect.info` | exact string `tsp-in.suzukiconnect.info` in DEX ("TSP" = telematics service provider) | `GET https://tsp-in.suzukiconnect.info/api/services` → **401**. Host and path exist and demand auth. |
| `tsp-in.suzukiconnect.in` and other variants | — | DNS does not resolve. |

Full base URL is very likely `https://tsp-in.suzukiconnect.info` + the `/api/...` paths below, but the exact prefix (e.g. a `/connectapi` segment) is **unconfirmed** until one real request is replayed.

## 2. Endpoint paths (all from the app's own code)

### Auth / login / account
| Path | Notes |
|---|---|
| `/api/validatemobile` | first step: check mobile number (sign-up or sign-in start) |
| `/api/mpin/sendotp` | send OTP (mPIN reset / verification flow) |
| `/api/mpin/validateotp` | verify OTP |
| `/api/mpin/resetmPin` | reset mPIN |
| `/api/login/validateotp` | validate OTP at login |
| `/api/login/forgotpassword` | forgot password |
| `/api/login/resetpassword` | reset password |
| `/api/login/setpassword/` | set password (trailing slash in source) |
| `/api/guestuser/generatesecotp` | guest user OTP |
| `/api/logout` | logout |
| `/api/accountDelete/acc_delete` | delete account |
| `/api/accountDelete/acc_status` | account deletion status |
| `/api/updateDeviceToken` | push token update (FCM) |
| `/api/services` | the live-checked catch-all/service endpoint |

India flow from these paths: mobile number → OTP (validate) → **mPIN** is the credential, plus an optional password login (`/api/login/*`). The FAQ "create password" and mPIN coexist; exact order needs capture.

### Profile and vehicles
| Path | Notes |
|---|---|
| `/api/profile/vehicleList` | list vehicles on the account |
| `/api/profile/getProfileDetails` | profile |
| `/api/profile/editProfileDetails` | edit profile |
| `/api/profile/alertHistory` | alert feed |
| `/api/profile/validateprimary` | primary-user validation |
| `/api/profile/setremotePIN` and `/api/profile/setsecremotePIN` | remote (secret) PIN for remote commands |
| `/api/profile/validatempin` | verify mPIN before sensitive actions |
| `/api/profile/getInfotainment` | infotainment info |
| `/api/profile/uploadimage`, `deleteimage` | avatar |
| `/api/profile/uploadTripImg`, `deleteTripImage` | trip photos |
| `/api/profile/resendemail` | resend email |
| `/api/profile/updateAppGuideView` | app guide flag |
| `/api/profile/videoTutorials` | tutorials |
| `/api/contact_us` | support |

### Trips and planning
| Path | Notes |
|---|---|
| `/api/trip/tripHistory` | trip list |
| `/api/trip/tripdetails` | single trip detail |
| `/api/trip/tripHistoryDownload` | download trip history |
| `/api/trip/labelTrip` | label/tag a trip |
| `/api/v2/tripPlanning/saveTrip`, `getTrip`, `deleteTrip` | trip planning |
| `/api/v2/sendToCar/saveTrips`, `/api/v2/sendtocar/getTrip`, `/api/v2/sendtocar/deleteTrip` | send-to-car navigation |

### Fuel expense (v2)
| Path | Notes |
|---|---|
| `/api/v2/fuelExpense/add`, `edit`, `delete`, `list` | manual fuel-expense ledger (exactly what Drivepal's fuel log wants) |

### Smart parking
| Path | Notes |
|---|---|
| `/api/parking/getParkLoc` | parked location |
| `/api/parking/getBookings`, `getBookingReceipt`, `getInvoiceDetails`, `getFavorites`, `favorites`, `initiatePayment`, `prepay_request`, `supportEmail`, `updateParkedview` | smart-parking bookings and payments |

### Misc
| Path | Notes |
|---|---|
| `/api/dashboard` | dashboard data |
| `/api/smartwatch/authorize`, `/api/smartwatch/mobile/logout` | smartwatch linking |
| `/api/v2/dataBooster/getPlans` | data booster plans |
| `/api/v2/appstore/datacontrol` | app store / data control |
| `/api/services/getKnowYourApp` | know-your-app content |

### Not found in this pass (open)
- **Remote command endpoints** (lock, hazard, alarm, AC, immobilizer) are absent as plain strings — they are likely under another base (a separate TSP command host), built dynamically, or encrypted. Package names in the DEX mention `modules.remoteac.gen3` and `modules.locationtracking.tripplanning`, so remote-AC code exists; its endpoint needs the next scan or a traffic capture.
- Socket/MQTT endpoints for live tracking (live location streams are likely sockets, not REST).

## 3. Auth model clues (strings found in the app)

| Clue | Meaning (to verify) |
|---|---|
| `Authorization`, `access_token`, `refresh_token`, `refreshToken` | bearer-token style auth with refresh |
| `device_id`, `deviceId`, `deviceName`, `deviceToken`, `fcmToken` | device registration payload fields |
| `app_version`, `platform`, `os`, `PLATFORM` | likely sent as headers or body fields on every call |
| `mPin`, `MPIN`, `mpin` | mPIN is a real credential; `/api/profile/validatempin` gates sensitive actions |
| `secretKey`, `encryptData`, `encRequest` | strong hint that some request bodies are encrypted (common in Indian fintech/telematics). Scheme unknown |
| `grant_type`, `client_id`, `client_secret`, `scope` | OAuth-style token grant strings present |

## 4. Request field names present in the binary

`mobile`, `mobileNumber`, `Mobile_No`, `otp`, `OTP`, `mPin`, `password`, `newPassword`, `vin`, `regNo`, `registrationNumber`, `email`, `name`, `deviceId`, `device_id`, `fcmToken`, `appVersion`, `platform`, `grantType`, `client_id`, `client_secret`, `scope`, `access_token`, `refresh_token`, `encryptData`, `encRequest`

## 5. Third-party services inside the app (context)

- **Mappls / MapmyIndia** (`apis.mappls.com`, `atlas.mappls.com`, `outpost.mappls.com`, `mgis-api.mappls.com`, `daar.mappls.com`) — maps, geocoding and routing. Drivepal's OpenStreetMap choice stays; Mappls is what the official app uses.
- **Firebase** (Analytics, Crashlytics, Remote Config, FCM) — push and remote config. Base URLs may be delivered via Remote Config at runtime.
- Azure blob storage hosts the official user manual; Nexa app links for T&C.

## 6. What this means for Drivepal (next step proposal, pending approval)

1. Confirm the base prefix by replaying one unauthenticated call and reading the 401 body/headers.
2. Try `/api/validatemobile` and `/api/mpin/sendotp` shapes (POST, JSON) with your real number — one OTP, read-only.
3. If payloads are encrypted (`encryptData`), find the `secretKey`/algorithm in a full JADX decompile (needs Java, or a web decompiler) before automating.
4. Leave remote-command calls until status/location/trips/auth work, since they have real-world effects.
5. Same treatment for Smartplay Pro (Bluetooth protocol, needs an HCI capture in the car) later.

**Unverified everywhere:** HTTP methods, body shapes, encryption, header names, base prefix, response envelope.


---

## 7. Live probes (24 Nov 2026, after initial write-up)

Tested against `https://tsp-in.suzukiconnect.info` with no credentials:

| Call | Result | Reading |
|---|---|---|
| `GET /api/services` | 401 `{"errors":[{"code":111035,"message":"Token not available.","field":"auth_middle"}]}` | Auth middleware gates nearly every path; a token must be obtained first |
| `POST /api/validatemobile` (JSON or form) | same 401 | Also behind the token middleware |
| `POST /api/dashboard` | same 401 | Same |
| `POST /api/mpin/sendotp` | 404 "Cannot POST" (Express HTML) | mPIN service lives on a different route/host, not this gateway |
| `POST /api/login/validateotp` with `{mobile,otp,client_id,grant_type}` (8 candidate client_ids) | 400 `code:200, field:"incorrect_client_id"` | Same error regardless of body: the client identity is checked before the body — it is almost certainly sent as a header, inside an encrypted payload, or the endpoint expects a different shape |
| `POST /oauth/token`, `/api/token`, `/api/generateToken`, `/api/authTokens`, and similar | all 404 | The token endpoint is not a guessable path; it lives in another microservice or a prefixed route |

**Conclusions**
- One gateway (`tsp-in.suzukiconnect.info`) fronts the data API behind a token middleware. Login itself is handled elsewhere (separate auth/mPIN service) and needs the app's real `client_id` and payload format.
- `access-control-allow-origin` is not set, so a browser page cannot call the API directly (CORS). Drivepal's Android build can use Capacitor's native HTTP (no CORS), and any web use needs a small relay proxy.
- The app binary contains an `api/Keys` class, `TokenData`/`TokenUpdateResponse` models, and `encryptData`/`secretKey`/`encRequest` strings: encrypted login payloads are likely. Exact values need a full decompile (Java/JADX) or one MITM capture of the real app logging in.

**Two ways to get the exact login recipe (either works):**
1. Install Java + JADX on a machine and decompile `api/Keys` and the auth repository classes.
2. Capture the real app's login traffic once (phone + mitmproxy), read the exact request.
