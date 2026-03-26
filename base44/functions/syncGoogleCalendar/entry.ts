import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CONNECTOR_ID = "69c552746adfdb1e590072b0";

// Categorize event based on title/description keywords
function categorizeEvent(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();

  if (/\b(meeting|sync|call|standup|סנכרון|פגישה|שיחה|ישיבה)\b/.test(text)) return "meeting";
  if (/\b(deadline|due|submit|הגשה|דדליין|תאריך אחרון)\b/.test(text)) return "deadline";
  if (/\b(review|debrief|retrospective|רטרו|סקירה|ביקורת)\b/.test(text)) return "review";
  if (/\b(task|todo|do|משימה|לעשות)\b/.test(text)) return "task";
  if (/\b(personal|birthday|vacation|חופשה|יום הולדת|אישי)\b/.test(text)) return "personal";
  return "other";
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Get access token for this user's Google Calendar
  let accessToken;
  try {
    accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(CONNECTOR_ID);
  } catch (_) {
    return Response.json({ error: 'Google Calendar not connected. Please connect your account first.' }, { status: 403 });
  }

  // Fetch upcoming events (next 30 days)
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!calRes.ok) {
    const err = await calRes.text();
    return Response.json({ error: 'Failed to fetch calendar', details: err }, { status: 500 });
  }

  const calData = await calRes.json();
  const events = calData.items || [];

  // Get existing synced events for this user to avoid duplicates
  const existing = await base44.asServiceRole.entities.CalendarEvent.filter({ user_email: user.email });
  const existingIds = new Set(existing.map(e => e.google_event_id));

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const title = event.summary || "No Title";
    const description = event.description || "";
    const category = categorizeEvent(title, description);
    const start_time = event.start?.dateTime || event.start?.date;
    const end_time = event.end?.dateTime || event.end?.date;

    const payload = {
      google_event_id: event.id,
      title,
      description,
      start_time,
      end_time,
      location: event.location || "",
      category,
      user_email: user.email,
      calendar_link: event.htmlLink || "",
    };

    if (existingIds.has(event.id)) {
      const existingEvent = existing.find(e => e.google_event_id === event.id);
      await base44.asServiceRole.entities.CalendarEvent.update(existingEvent.id, payload);
      updated++;
    } else {
      await base44.asServiceRole.entities.CalendarEvent.create(payload);
      created++;
    }
  }

  return Response.json({ success: true, created, updated, total: events.length });
});