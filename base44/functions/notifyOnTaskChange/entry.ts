import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_CONNECTOR_ID = "69c53ba1decfe0270ace1dd1";
const CLICKUP_CONNECTOR_ID = "69c53a79bbb61e4f6d472163";
const GMAIL_CONNECTOR_ID = "69c5354290df2e0f2594ae79";

const STATUS_LABELS = {
  todo: "ממתין",
  in_progress: "בביצוע",
  review: "לסקירה",
  approved: "אושר",
  rejected: "נדחה",
  done: "הושלם",
};

const PRIORITY_LABELS = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const CLICKUP_PRIORITY_MAP = {
  low: 4,
  medium: 3,
  high: 2,
  critical: 1,
};

const CLICKUP_STATUS_MAP = {
  todo: "to do",
  in_progress: "in progress",
  review: "in review",
  approved: "complete",
  done: "complete",
  rejected: "cancelled",
};

async function tryGetAccessToken(base44, connectorId) {
  try {
    return await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId);
  } catch {
    return null;
  }
}

async function sendSlackNotification(accessToken, message) {
  // Get list of channels first
  const channelsRes = await fetch("https://slack.com/api/conversations.list?limit=5", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const channelsData = await channelsRes.json();
  if (!channelsData.ok || !channelsData.channels?.length) return false;

  // Use first available channel or find #general
  const channel =
    channelsData.channels.find((c) => c.name === "general") ||
    channelsData.channels[0];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channel.id, text: message }),
  });
  const data = await res.json();
  return data.ok;
}

async function sendGmailNotification(accessToken, toEmail, subject, body) {
  const emailLines = [
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    body,
  ];
  const raw = btoa(unescape(encodeURIComponent(emailLines.join("\r\n"))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );
  return res.ok;
}

async function updateClickUpTask(accessToken, taskTitle, status, priority) {
  // Search for existing task by name
  const searchRes = await fetch(
    `https://api.clickup.com/api/v2/team?` + new URLSearchParams({}),
    { headers: { Authorization: accessToken } }
  );
  const teamsData = await searchRes.json();
  if (!teamsData.teams?.length) return false;

  const teamId = teamsData.teams[0].id;

  // Search tasks across team
  const searchTasksRes = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/task?` +
      new URLSearchParams({ query: taskTitle, page: 0 }),
    { headers: { Authorization: accessToken } }
  );
  const searchData = await searchTasksRes.json();
  const existingTask = searchData.tasks?.find(
    (t) => t.name.toLowerCase() === taskTitle.toLowerCase()
  );

  const clickupStatus = CLICKUP_STATUS_MAP[status] || "to do";
  const clickupPriority = CLICKUP_PRIORITY_MAP[priority] || 3;

  if (existingTask) {
    // Update existing task
    const updateRes = await fetch(
      `https://api.clickup.com/api/v2/task/${existingTask.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: clickupStatus, priority: clickupPriority }),
      }
    );
    return updateRes.ok;
  } else {
    // Create task in first list found
    const spacesRes = await fetch(
      `https://api.clickup.com/api/v2/team/${teamId}/space`,
      { headers: { Authorization: accessToken } }
    );
    const spacesData = await spacesRes.json();
    if (!spacesData.spaces?.length) return false;

    const foldersRes = await fetch(
      `https://api.clickup.com/api/v2/space/${spacesData.spaces[0].id}/folder`,
      { headers: { Authorization: accessToken } }
    );
    const foldersData = await foldersRes.json();

    let listId = null;
    if (foldersData.folders?.length) {
      const listsRes = await fetch(
        `https://api.clickup.com/api/v2/folder/${foldersData.folders[0].id}/list`,
        { headers: { Authorization: accessToken } }
      );
      const listsData = await listsRes.json();
      listId = listsData.lists?.[0]?.id;
    } else {
      const listsRes = await fetch(
        `https://api.clickup.com/api/v2/space/${spacesData.spaces[0].id}/list`,
        { headers: { Authorization: accessToken } }
      );
      const listsData = await listsRes.json();
      listId = listsData.lists?.[0]?.id;
    }

    if (!listId) return false;

    const createRes = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        method: "POST",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: taskTitle,
          status: clickupStatus,
          priority: clickupPriority,
        }),
      }
    );
    return createRes.ok;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    if (!data) {
      return Response.json({ skipped: true, reason: "no data" });
    }

    const isCreate = event?.type === "create";
    const eventLabel = isCreate ? "נוצרה" : "עודכנה";

    const taskTitle = data.title || "ללא כותרת";
    const status = data.status || "todo";
    const priority = data.priority || "medium";
    const description = data.description || "";
    const createdBy = data.created_by || "";

    const statusLabel = STATUS_LABELS[status] || status;
    const priorityLabel = PRIORITY_LABELS[priority] || priority;

    const slackMessage =
      `🤖 *משימה ${eventLabel}:* ${taskTitle}\n` +
      `📌 סטטוס: ${statusLabel} | עדיפות: ${priorityLabel}` +
      (description ? `\n📝 ${description.slice(0, 200)}` : "") +
      (createdBy ? `\n👤 נוצר על ידי: ${createdBy}` : "");

    const emailSubject = `[Boss AI] משימה ${eventLabel}: ${taskTitle}`;
    const emailBody =
      `שלום,\n\nמשימה ${eventLabel} במערכת ה-AI:\n\n` +
      `כותרת: ${taskTitle}\n` +
      `סטטוס: ${statusLabel}\n` +
      `עדיפות: ${priorityLabel}\n` +
      (description ? `תיאור: ${description}\n` : "") +
      `\nBoss AI`;

    const results = { slack: false, gmail: false, clickup: false };

    // Try Slack
    const slackToken = await tryGetAccessToken(base44, SLACK_CONNECTOR_ID);
    if (slackToken) {
      results.slack = await sendSlackNotification(slackToken, slackMessage);
    }

    // Try Gmail - send to task creator if we have their email
    const gmailToken = await tryGetAccessToken(base44, GMAIL_CONNECTOR_ID);
    if (gmailToken && createdBy) {
      results.gmail = await sendGmailNotification(
        gmailToken,
        createdBy,
        emailSubject,
        emailBody
      );
    }

    // Try ClickUp - sync task status
    const clickupToken = await tryGetAccessToken(base44, CLICKUP_CONNECTOR_ID);
    if (clickupToken) {
      results.clickup = await updateClickUpTask(
        clickupToken,
        taskTitle,
        status,
        priority
      );
    }

    console.log(`Task automation results for "${taskTitle}":`, results);

    return Response.json({ success: true, event: event?.type, task: taskTitle, results });
  } catch (error) {
    console.error("Task automation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});