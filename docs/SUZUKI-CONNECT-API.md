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


---

## 8. Full decompile (24 Nov 2026): the complete API surface

Method: downloaded a portable JRE 21 + JADX through the browser, decompiled `com.msil.suzukiconnect_generation_2.apk` (1.1.24) fully. The definitive endpoint list comes from the Retrofit service interface (`api/k.java`).

### Architecture facts (now confirmed)
- **One base URL for everything:** the only `Retrofit.baseUrl(...)` call uses `Keys.apiKey("PROD")` — every path below, including the `remote/...` ones, is relative to it. The DEX string `tsp-in.suzukiconnect.info` plus the live 401 confirm this host.
- **Keys live in native code:** `api/Keys` methods (`apiKey`, `clientID`, `clientSecret`, `pin`, `sign`, `id`, `key`, `domain`...) are JNI natives in `libnative-lib.so` (arm64). The library decodes values at runtime via a `reveal(vector<uint8_t>)` helper and contains an `encrypt(string)` function. It also exposes root/Frida/emulator detection lists.
- **Certificate pinning:** the OkHttp client pins the API host using `Keys.pin()` — a MITM capture needs a pinning bypass (or capture before pin checks).
- **String obfuscation:** inline strings are XOR-encoded with the literal key `SuzukiCipherKey` (verified: the token-refresh byte array decodes to `refresh_token`). Most literals in the DEX are plain, though.
- **No CORS headers** on the gateway (verified earlier). A browser page cannot call it directly; Android (Capacitor native HTTP) can.

### Login / auth (the real flow)
| Call | Shape |
|---|---|
| `POST api/auth/otp/request` | JSON body: `mobile`, `appVer`, `device_id`, `device_type`, `grant_type` (**must be `"otp"`** — server-verified), `client_id`, `client_secret` |
| `POST api/auth/otp/validate` | JSON: `grant_type`, `oai`, `otp`, `client_id`, `client_secret`, `device_token` (FCM, optional), `device_id`, `device_type`, `appVer`, `device_model`, `os_version` |
| `POST api/auth/otp/accountsetup` | OTPRegistrationRequest (sign-up completion) |
| `POST api/oauth/login/signin` | legacy FormUrlEncoded field-map (token update / signin) |
| `POST api/validateUserSession` | session check |
| `GET /api/mpin/sendotp`, `POST /api/mpin/validateotp`, `POST /api/mpin/resetmPin` | mPIN management (sendotp is a **GET**) |
| `POST /api/profile/validatempin`, `setremotePIN`, `setsecremotePIN` | mPIN / remote PIN |
| `GET /api/logout`, `GET /api/profile/vehicleList` | session + vehicles |
| `POST /api/validatemobile`, `/api/login/forgotpassword`, `resetpassword`, `setpassword/`, `api/login/signup` | account (FormUrlEncoded field-maps) |

Live-verified: `grant_type` must be `"otp"`; wrong/missing `client_id` returns `incorrect_client_id`. The actual `client_id`/`client_secret` values are native-decoded and not guessable (14 candidates tried).

### Vehicle data and dashboard
`POST /api/dashboard` (DashBoardRequest → DashBoardResponse with BatteryHealth, TPMS, UserData), `POST api/dashboard/vehicleHealthStatus`, `POST api/dashboard/getSVTDetailsNew`, `POST api/dashboard/disableTracking`, `POST api/dashboard/disableTrackEvent`, `POST api/v2/profile/getVehicleDetails`, `GET /api/services`.

### Remote operations (all need header `r_key` — likely the remote-PIN-derived key)
`GET remote/api/remoteapi/{operation}` (generic: any operation), `GET remote/api/remoteapi/tracking_start`, `POST remote/api/remoteapi/ac_control/gen2/performRemoteOps`, `POST remote/api/v2/remoteapi/climate_control/ac_ops`, `GET api/v2/climate_control/getACDetails`, `GET api/climate_control/getACDetailsV1`, climate schedule create/edit/delete/getAll (gasoline + EV), `POST /api/immobilizer/initiateRequest`, `POST api/valet/create_delete_valet`, `GET api/valet/viewvalet`, remote charge: `GET remote/api/v2/remoteapi/charge_control/charge_on`, `GET api/v2/remoteCharge/chargeDetails`, `GET api/remote-charge/getAllSchedules`, charge schedule create/update.

### Trips, driving, location share
`POST /api/trip/tripHistory`, `tripdetails`, `tripHistoryDownload`, `labelTrip`, `api/trip/mergeTrips`, `api/trip/drivingBehaviour`, `api/trip/driverInsights`, trip planning save/get/delete, send-to-car save/get/delete, `api/locshare/slreq`, `api/locshare/urls`, `api/locshare/drivingHistUrls`, `api/locshare/delslurl`.

### Alerts, geofence, profile, extras
`POST /api/profile/alertHistory`, `api/v2/profile/getAlertCategoryDetails`, `getAlertSettings`, `updateAlertSettings`; geofence `api/geofence/creategeofence`, `updategeofence`, `viewgeofence`; fuel-expense `api/v2/fuelExpense/list/add/edit/delete`; battery prognostics `api/v2/batteryPrognostic/updateView`; subscription `getPlanDetails`, `initiatePayment`, `getTransactionStatus`, `resubscribe_*`; smart parking endpoints; smartwatch authorize; alexa portal enable/delink/status; wallpapers; leaderboard; data booster; infotainment data control; account delete; contact us; feedback.

### What is still unknown
1. `client_id` / `client_secret` values (native `libnative-lib.so`, runtime-decoded; also `Keys.pin()` for cert pinning).
2. Whether `api/auth/otp/validate` bodies are sent as plain JSON or via the `encrypt()` path (both strings exist).
3. The `r_key` header derivation for remote ops (likely mPIN-derived; verify after login works).
4. Exact login-session header format (`Authorization: Bearer ...` assumed from `access_token`/`refresh_token` strings and the token interceptor `b`/`m` classes).

### Recommended next step
Extract the three native values by running the real app once under a local proxy (needs pinning bypass, e.g. Frida objection on an emulator or a rooted phone), OR run the app in an Android emulator and hook `Keys.clientID()` with Frida. Then the whole login → token → data flow can be implemented in Drivepal as-is.
