import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch user's active projects
    const projects = await base44.entities.Project.filter(
      { status: 'active', assigned_agents: { $in: [user.id] } },
      '-created_date',
      50
    );

    // Fetch critical tasks for current user
    const tasks = await base44.entities.Task.filter(
      { 
        assigned_agent_id: user.id,
        status: { $nin: ['done', 'approved'] },
        priority: 'critical'
      },
      '-created_date',
      20
    );

    // Fetch impending deadlines (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingDeadlines = await base44.entities.Task.filter(
      {
        assigned_agent_id: user.id,
        status: { $nin: ['done'] },
        deadline: { 
          $gte: now.toISOString(),
          $lte: sevenDaysFromNow.toISOString()
        }
      },
      'deadline',
      20
    );

    // Format the report
    const reportHTML = generateReport(user.full_name, projects, tasks, upcomingDeadlines);

    // Send via Gmail using app user connector
    const gmailConnectorId = '69c5354290df2e0f2594ae79';
    const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(gmailConnectorId);

    const emailSubject = `Daily Team Alignment Report - ${new Date().toLocaleDateString('he-IL')}`;
    const emailBody = reportHTML.replace(/<[^>]*>/g, ' ').substring(0, 1000); // Plain text version for fallback

    // Send email via Gmail API
    const sendEmailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: Buffer.from(
          `From: ${user.email}\r\n` +
          `To: ${user.email}\r\n` +
          `Subject: ${emailSubject}\r\n` +
          `Content-Type: text/html; charset="UTF-8"\r\n` +
          `\r\n` +
          reportHTML
        ).toString('base64'),
      }),
    });

    if (!sendEmailResponse.ok) {
      const errorData = await sendEmailResponse.json();
      return Response.json({ error: 'Failed to send email', details: errorData }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Daily report sent successfully',
      projectsCount: projects.length,
      criticalTasksCount: tasks.length,
      upcomingDeadlinesCount: upcomingDeadlines.length
    });

  } catch (error) {
    console.error('Error sending daily report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReport(userName, projects, tasks, deadlines) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { background-color: white; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; }
        h1 { color: #1a1a1a; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 20px; }
        .section { margin-bottom: 20px; }
        .item { padding: 10px; background-color: #f9f9f9; margin-bottom: 8px; border-left: 4px solid #2563eb; }
        .critical { border-left-color: #dc2626; }
        .date { color: #666; font-size: 0.9em; }
        .status { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; font-weight: bold; }
        .active { background-color: #dcfce7; color: #166534; }
        .urgent { background-color: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 דוח יומי - יישור צוות</h1>
        <p><strong>שלום ${userName}</strong></p>
        <p>זהו דוח יומי של פרויקטים פעילים, משימות קריטיות ודדליינים קרובים.</p>
        <p><span class="date">${dateStr}</span></p>
  `;

  // Active Projects Section
  if (projects.length > 0) {
    html += '<div class="section"><h2>🎯 פרויקטים פעילים</h2>';
    projects.forEach(p => {
      html += `
        <div class="item">
          <strong>${p.name}</strong>
          <span class="status active">פעיל</span>
          <p>${p.description || 'ללא תיאור'}</p>
          <span class="date">עדכון אחרון: ${new Date(p.updated_date).toLocaleDateString('he-IL')}</span>
        </div>
      `;
    });
    html += '</div>';
  }

  // Critical Tasks Section
  if (tasks.length > 0) {
    html += '<div class="section"><h2>⚡ משימות קריטיות</h2>';
    tasks.forEach(t => {
      html += `
        <div class="item critical">
          <strong>${t.title}</strong>
          <span class="status urgent">קריטי</span>
          <p>${t.description || 'ללא תיאור'}</p>
          <span class="date">יעד: ${t.deadline ? new Date(t.deadline).toLocaleDateString('he-IL') : 'ללא תאריך'}</span>
        </div>
      `;
    });
    html += '</div>';
  }

  // Upcoming Deadlines Section
  if (deadlines.length > 0) {
    html += '<div class="section"><h2>📅 דדליינים בשבוע הקרוב</h2>';
    deadlines.forEach(d => {
      const daysLeft = Math.ceil((new Date(d.deadline) - now) / (1000 * 60 * 60 * 24));
      html += `
        <div class="item">
          <strong>${d.title}</strong>
          <p>${d.description || 'ללא תיאור'}</p>
          <span class="date">
            זמן לדדליין: ${daysLeft} ימים (${new Date(d.deadline).toLocaleDateString('he-IL')})
          </span>
        </div>
      `;
    });
    html += '</div>';
  }

  if (projects.length === 0 && tasks.length === 0 && deadlines.length === 0) {
    html += '<div class="section"><p>✅ אין פרויקטים פעילים, משימות קריטיות או דדליינים קרובים כרגע.</p></div>';
  }

  html += `
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 0.9em; text-align: center;">דוח זה נשלח באופן אוטומטי כל בוקר ב-8:00.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}