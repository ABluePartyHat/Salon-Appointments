/**
 * Salon booking Worker — reviewed candidate, NOT deployed.
 * Required secrets: ALLOWED_ORIGIN, APPS_SCRIPT_URL, API_SHARED_SECRET.
 * Optional: BOOKING_SUBMISSIONS_ENABLED, LOCAL_TEST_ORIGIN,
 * CONTROLLED_TEST_TOKEN, CONTROLLED_TEST_REQUEST_ID.
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);
    const allowed = Boolean(origin && [env.ALLOWED_ORIGIN, env.LOCAL_TEST_ORIGIN].filter(Boolean).includes(origin));
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Salon-Test-Token',
      'Vary': 'Origin', 'Cache-Control': 'no-store'
    };
    const respond = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
    });
    if (!allowed) return respond({ ok: false, error: 'Forbidden' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let payload;
    if (request.method === 'GET' && url.pathname === '/api/availability') {
      const date = url.searchParams.get('date');
      const servicesParam = url.searchParams.get('services');
      const hairLength = url.searchParams.get('hairLength');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return respond({ ok: false, error: 'Invalid date.' }, 400);
      if (!servicesParam || !hairLength) return respond({ ok: false, error: 'Select services and hair length.' }, 400);
      const services = servicesParam.split(',');
      if (services.length > 13 || services.some(id => !/^[a-z0-9-]{1,60}$/.test(id)) ||
          !['short', 'medium', 'long'].includes(hairLength)) {
        return respond({ ok: false, error: 'Invalid service selection.' }, 400);
      }
      payload = { action: 'availability', date, services, hairLength };
    } else if (request.method === 'POST' && url.pathname === '/api/bookings') {
      const testToken = request.headers.get('X-Salon-Test-Token');
      const configuredToken = env.CONTROLLED_TEST_TOKEN;
      const configuredId = env.CONTROLLED_TEST_REQUEST_ID;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const tokenMatches = typeof configuredToken === 'string' && configuredToken.length >= 32 &&
        typeof testToken === 'string' && testToken.length === configuredToken.length &&
        (() => { let diff = 0; for (let i = 0; i < testToken.length; i++) diff |= testToken.charCodeAt(i) ^ configuredToken.charCodeAt(i); return diff === 0; })();
      const controlledTest = env.BOOKING_SUBMISSIONS_ENABLED !== 'true' &&
        tokenMatches && typeof configuredId === 'string' && uuid.test(configuredId);
      if (env.BOOKING_SUBMISSIONS_ENABLED !== 'true' && !controlledTest)
        return respond({ ok: false, error: 'Booking submissions are temporarily paused.' }, 503);
      if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json'))
        return respond({ ok: false, error: 'JSON required.' }, 415);
      if (Number(request.headers.get('Content-Length')) > 8192)
        return respond({ ok: false, error: 'Request too large.' }, 413);
      const raw = await request.text();
      if (raw.length > 8192) return respond({ ok: false, error: 'Request too large.' }, 413);
      let booking;
      try { booking = JSON.parse(raw); } catch { return respond({ ok: false, error: 'Invalid JSON.' }, 400); }
      if (!booking || typeof booking !== 'object' || Array.isArray(booking) ||
          typeof booking.requestId !== 'string' || !uuid.test(booking.requestId) ||
          !Array.isArray(booking.services) || !booking.services.length || booking.services.length > 13 ||
          booking.services.some(id => typeof id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(id)) ||
          !['short', 'medium', 'long'].includes(booking.hairLength))
        return respond({ ok: false, error: 'Invalid multi-service booking.' }, 400);
      if (controlledTest && booking.requestId.toLowerCase() !== configuredId.toLowerCase())
        return respond({ ok: false, error: 'Controlled test request ID mismatch.' }, 403);
      payload = { action: 'booking', booking };
    } else {
      return respond({ ok: false, error: 'Not found.' }, 404);
    }
    if (!env.APPS_SCRIPT_URL || !env.API_SHARED_SECRET)
      return respond({ ok: false, error: 'Server not configured.' }, 503);
    payload.apiSecret = env.API_SHARED_SECRET;
    try {
      // An upstream timeout is not proof that a booking failed. The browser
      // must preserve its requestId for safe recovery.
      const upstream = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload), redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      });
      if (!upstream.ok) {
        console.error('Apps Script upstream failure', { status: upstream.status, action: payload.action });
        return respond({ ok: false, error: 'Booking service unavailable.' }, 502);
      }
      let result;
      try { result = await upstream.json(); }
      catch { return respond({ ok: false, error: 'Invalid upstream response.' }, 502); }
      if (!result || typeof result !== 'object' || result.ok !== true) {
        // Apps Script returns HTTP 200 even for caught exceptions. Without a
        // typed failure contract, we cannot prove the booking was not written.
        return respond({ ok: false, error: 'Booking outcome could not be confirmed. Retry using the same request.' },
          payload.action === 'booking' ? 502 : 400);
      }
      if (payload.action === 'availability' &&
          (result.date !== payload.date || !Array.isArray(result.slots) ||
           result.slots.some(s => typeof s !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s))))
        return respond({ ok: false, error: 'Invalid availability response.' }, 502);
      if (payload.action === 'booking' &&
          (result.status !== 'Pending' || typeof result.bookingId !== 'string' ||
           !result.bookingId || typeof result.duplicate !== 'boolean'))
        return respond({ ok: false, error: 'Invalid booking response.' }, 502);
      return respond(result, 200);
    } catch (error) {
      console.error('Booking upstream error', error?.name || 'Unknown');
      return respond({ ok: false, error: 'Booking service temporarily unavailable.' }, 502);
    }
  }
};
