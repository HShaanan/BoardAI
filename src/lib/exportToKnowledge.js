import { base44 } from "@/api/base44Client";

/**
 * Generates a summary of a conversation and saves it as a BrainEntry (Knowledge Base).
 * @param {object} params
 * @param {string} params.title - Title for the knowledge entry
 * @param {Array} params.messages - Array of chat messages
 * @param {string} params.type - "board_meeting" | "agent_chat"
 * @param {string} [params.agentName] - For agent chats
 * @returns {Promise<object>} the created BrainEntry
 */
export async function exportConversationToKnowledge({ title, messages, type, agentName }) {
  const transcript = messages.map(m => {
    const speaker = m.role === "board" ? "דירקטוריון" : (m.agent_role_key || "סוכן");
    return `[${speaker}]: ${m.content}`;
  }).join("\n\n");

  const summaryPrompt = type === "board_meeting"
    ? `להלן תמליל ישיבת דירקטוריון בנושא "${title}":

${transcript}

צור סיכום מובנה בעברית הכולל:
1. **נושא הדיון** - משפט אחד
2. **משתתפים** - מי השתתף
3. **עיקרי הדיון** - 3-5 נקודות מרכזיות
4. **החלטות שהתקבלו** - רשימה ממוספרת
5. **צעדים הבאים** - מה צריך לקרות עכשיו

פורמט: Markdown ברור ומובנה.`
    : `להלן שיחה עם ${agentName}:

${transcript}

צור סיכום קצר בעברית הכולל:
1. **נושא השיחה**
2. **עיקרי הדיון**
3. **החלטות/המלצות**
4. **פעולות נדרשות**

פורמט: Markdown.`;

  const summary = await base44.integrations.Core.InvokeLLM({ prompt: summaryPrompt });

  const fullContent = `# ${title}
תאריך: ${new Date().toLocaleDateString("he-IL")}
סוג: ${type === "board_meeting" ? "ישיבת דירקטוריון" : `שיחה עם ${agentName}`}

---

${summary}`;

  const safeContent = fullContent.length > 50000 ? fullContent.slice(0, 50000) + "\n\n[תוכן קוצר בגלל אורך מקסימאלי]" : fullContent;

  const entry = await base44.entities.BrainEntry.create({
    title,
    content: safeContent,
    source_type: "note",
    category: type === "board_meeting" ? "board_meetings" : "agent_chats",
    tags: type === "board_meeting" ? ["ישיבה", "החלטות", "דיון"] : ["שיחה", agentName || "סוכן"],
  });

  // Save as MemoryEntry for ALL active agents
  const allAgents = await base44.entities.Agent.filter({ is_active: true });
  const memoryContent = `סיכום ${type === "board_meeting" ? "ישיבת דירקטוריון" : `שיחה עם ${agentName}`}: "${title}"\n\n${summary.slice(0, 3000)}`;
  await Promise.all(allAgents.map(agent =>
    base44.entities.MemoryEntry.create({
      agent_id: agent.id,
      content: memoryContent,
      memory_type: "decision",
      is_active: true,
    })
  ));

  // Download .txt file (full content including transcript)
  const downloadContent = `# ${title}
תאריך: ${new Date().toLocaleDateString("he-IL")}

${summary}

---

## תמליל

${transcript}`;
  const blob = new Blob([downloadContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  return entry;
}