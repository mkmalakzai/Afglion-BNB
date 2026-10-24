# Afglion-BNB

Afglion-BNB is the BNB-denominated Telegram Mini App based on the existing AFGLION premium app. It preserves the dark/gold design and feature set: VIP packages with automatic activation, daily rewards, referral commissions, AdsGram, profile, manually reviewed deposits and withdrawals, payment-method management, channel notices, broadcasts, and separate admin/staff controls.

## Stack
- Next.js shell for Vercel; the main experience is the copied premium UI in `public/`.
- Node/Vercel API functions in `api/`.
- Firebase Admin SDK for server-side data access. Firestore collections use the `bnb*` prefix so records remain separate from the original app.
- BNB wallet ledger. Deposits and withdrawals are manually reviewed; the app does not send automatic blockchain transactions.

## Required Vercel environment variables
- `TELEGRAM_BOT_TOKEN`: token for the Afglion-BNB Telegram bot.
- `TELEGRAM_BOT_USERNAME`: actual bot username without `@`.
- `TELEGRAM_ADMIN_IDS`: comma-separated numeric Telegram IDs allowed to administer the app.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: service-account JSON from the separate Firebase project `afglion-bnb` (project_id must be `afglion-bnb`). Never commit this secret.
- `TELEGRAM_NOTIFICATION_CHANNEL`: optional public channel URL for welcome/payment notices.

The public Firebase web config is in `public/firebase-config.js`; it is not a server credential. The API uses Firebase Admin/Firestore and returns a configuration error until the matching service-account JSON is set in Vercel. If only Realtime Database is enabled in the project, Firestore must also be enabled before this backend can operate.

## Checks
Run `npm run check` and `npm run build`.
