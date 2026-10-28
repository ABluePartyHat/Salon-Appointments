# Booking backend deployment checklist

The source in `backend/cloudflare/worker.mjs` is a **candidate** and is not automatically deployed. No secrets are stored here.

## Before applying
1. Confirm the live Worker environment has `ALLOWED_ORIGIN`, `APPS_SCRIPT_URL`, and `API_SHARED_SECRET` configured; never copy their values into GitHub.
2. Verify `BOOKING_SUBMISSIONS_ENABLED` is configured for the intended launch state.
3. Confirm the current Apps Script `doPost` V2 handler accepts `{action:"booking", booking:{requestId,services,hairLength,...},apiSecret}`.
4. Save a backup of the live Worker and Apps Script deployment versions.
5. Run `npm test` and `npm run test:local-booking`.

## Changes in this candidate
- Preserves V2 booking payload and request ID.
- Returns HTTP 502 for unclassified booking failures so browser recovery reuses the original request ID.
- Adds a 12-second upstream timeout, before the frontend's 15-second timeout.
- Enforces the 8192-byte JSON request limit using UTF-8 bytes.

## Release order
1. Deploy Worker candidate during a controlled window; validate availability first.
2. Submit one labeled test booking and retry the **same** request ID. Verify one row only.
3. Confirm an overlapping different request ID is rejected.
4. Only then disable the legacy Apps Script route and redeploy Apps Script.
5. Validate the same website workflow again.
6. Keep email delivery disabled until notification tests and explicit approval.

## Rollback
Restore the prior Worker version or Apps Script deployment if the controlled checks fail. A failed/uncertain POST may already have created a booking: inspect Sheets by request ID before attempting any different request ID.

## Limitations
CI exercises the Worker using mocked upstream responses. It cannot establish that the deployed Worker or Apps Script match these files, and does not simulate Google's real LockService.
