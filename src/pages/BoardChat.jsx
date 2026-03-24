import { useEffect, useState, useRef } from "react";
import DecisionPanel from "../components/boardchat/DecisionPanel";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Users, Gavel, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentAvatar from "../components/shared/AgentAvatar";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message, agents }) {
  const isBoard = message.role === "board";
  const isFacilitator = message.agent_role_key === "facilitator";
  const agent = agents.find(a => a.id === message.agent_id);

  if (isBoard) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] sm:max-w-[60%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">הדירקטוריון</p>
        </div>
      </div>
    );
  }

  if (isFacilitator) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full shrink-0">
          <Gavel className="w-3 h-3 text-accent" />
          <span>{message.content}</span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      {agent && <AgentAvatar agent={agent} size="sm" showStatus />}
      {!agent && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="max-w-[75%] sm:max-w-[65%]">
        <p className="text-[11px] font-semibold text-muted-foreground mb-1">
          {agent?.title || message.agent_role_key}
        </p>
        <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
          <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function BoardChat() {
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [core, setCore] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const init = async () => {
    const [a, c, convos] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
      base44.entities.Conversation.filter({ type: "meeting", topic: "board_room_discussion" }),
    ]);
    const activeAgents = a.filter(ag => ag.is_active);
    setAgents(activeAgents);
    if (c.length > 0) setCore(c[0]);

    let convo;
    if (convos.length > 0) {
      convo = convos[0];
    } else {
      convo = await base44.entities.Conversation.create({
        type: "meeting",
        topic: "board_room_discussion",
        participants: activeAgents.map(ag => ag.id),
      });
    }
    setConversation(convo);
    const msgs = await base44.entities.ChatMessage.filter({ conversation_id: convo.id });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setInitializing(false);
  };

  const addMessage = async (convo, data) => {
    const msg = await base44.entities.ChatMessage.create({ conversation_id: convo.id, ...data });
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || loading) return;
    const topic = input.trim();
    setInput("");
    setLoading(true);

    // Save board message
    await addMessage(conversation, { role: "board", content: topic });

    const coreCtx = core ? `חברה: ${core.company_name}\nמשימה: ${core.mission}\nחזון: ${core.vision}\nגיידליינס: ${core.brand_guidelines}` : "";
    const agentsList = agents.map(a => `- ${a.role_key}: ${a.title} (${a.department}), אחריות: ${a.responsibilities}`).join("\n");

    // Step 1: Facilitator decides which agents should speak
    setCurrentSpeaker("מנחה מחליט...");
    const facilitatorDecision = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה מנחה ישיבת דירקטוריון. נושא הדיון: "${topic}"

הסוכנים הזמינים:
${agentsList}

${coreCtx}

בחר 3-5 סוכנים הרלוונטיים ביותר לנושא זה. עבור כל סוכן שנבחר, כתוב הקדמה קצרה (משפט אחד) שמסבירה למה הוא רלוונטי.
החזר JSON בלבד:
{
  "opening": "הקדמת המנחה לדיון (משפט קצר בעברית)",
  "selected": [
    {"role_key": "...", "intro": "משפט הקדמה קצר בעברית"}
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          opening: { type: "string" },
          selected: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role_key: { type: "string" },
                intro: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Facilitator opening
    const opening = facilitatorDecision?.opening || "פותח את הדיון...";
    await addMessage(conversation, {
      role: "agent",
      content: opening,
      agent_role_key: "facilitator"
    });

    const selected = facilitatorDecision?.selected || [];

    // Step 2: Each selected agent responds
    for (const pick of selected) {
      const agent = agents.find(a => a.role_key === pick.role_key);
      if (!agent) continue;

      // Facilitator intro for this agent
      await addMessage(conversation, {
        role: "agent",
        content: `${pick.intro}`,
        agent_role_key: "facilitator"
      });

      setCurrentSpeaker(agent.title);

      const recentMsgs = messages.slice(-4).map(m => `${m.role === "board" ? "דירקטוריון" : m.agent_role_key}: ${m.content}`).join("\n");

      const agentResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה ${agent.title} (${agent.title_he}).

זהות:
- אחריות: ${agent.responsibilities}
- מחלקה: ${agent.department}
- אישיות: ${agent.personality_traits}
- סגנון תקשורת: ${agent.communication_style}
- יצירתיות: ${agent.creativity_level}/10
- פירוטיות: ${agent.verbosity_level}/10

${coreCtx}

הקשר הדיון האחרון:
${recentMsgs}

נושא הדיון: "${topic}"

הגב מנקודת המבט של תפקידך. היה ממוקד, מקצועי ותורם לדיון. הגב בשפה שבה שאל הדירקטוריון (עברית/אנגלית).`,
      });

      await addMessage(conversation, {
        role: "agent",
        content: agentResponse || "אין לי הערות נוספות בנושא זה.",
        agent_id: agent.id,
        agent_role_key: agent.role_key,
      });
    }

    // Facilitator extracts decisions
    setCurrentSpeaker("מנחה מסכם החלטות...");
    const agentNames = agents.map(a => `${a.role_key}: ${a.title}`).join("\n");
    const discussionSummary = selected.map(p => {
      const a = agents.find(x => x.role_key === p.role_key);
      return a?.title || p.role_key;
    }).join(", ");

    const decisionsResult = await base44.integrations.Core.InvokeLLM({
      prompt: `סיכמת ישיבת דירקטוריון בנושא: "${topic}"
השתתפו: ${discussionSummary}

זהה החלטות ברורות שהתקבלו בדיון ושניתן להפוך לתוצאות (deliverables). לכל החלטה: מה לעשות, מי הסוכן האחראי, ועדיפות.

החזר JSON בלבד:
{
  "decisions": [
    {
      "directive_text": "תיאור ברור של הפעולה הנדרשת",
      "agent_role_key": "אחד מהמפתחות: ${agents.map(a => a.role_key).join(', ')}",
      "priority": "low|medium|high|critical"
    }
  ]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          decisions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                directive_text: { type: "string" },
                agent_role_key: { type: "string" },
                priority: { type: "string" }
              }
            }
          }
        }
      }
    });

    const extracted = decisionsResult?.decisions || [];
    if (extracted.length > 0) {
      setDecisions(prev => [...prev, ...extracted]);
      const closingMsg = `הדיון הסתיים. זיהיתי ${extracted.length} החלטות לביצוע — ניתן להמיר אותן ל-Directives בלחיצה.`;
      await addMessage(conversation, { role: "agent", content: closingMsg, agent_role_key: "facilitator" });
    } else {
      await addMessage(conversation, { role: "agent", content: "הדיון בנושא זה הסתיים. כל הסוכנים הרלוונטיים הביעו את עמדתם.", agent_role_key: "facilitator" });
    }

    setCurrentSpeaker(null);
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">מכין את חדר הישיבות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] md:h-screen">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Board Room</h1>
              <p className="text-xs text-muted-foreground">{agents.length} סוכנים · דיון קבוצתי</p>
            </div>
          </div>
          {/* Agent avatars preview */}
          <div className="flex -space-x-2">
            {agents.slice(0, 5).map(a => (
              <div
                key={a.id}
                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs"
                style={{ backgroundColor: a.color ? `${a.color}30` : "hsl(var(--secondary))" }}
              >
                {a.avatar_emoji}
              </div>
            ))}
            {agents.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] text-muted-foreground">
                +{agents.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">ברוכים הבאים לחדר הישיבות</p>
              <p className="text-sm text-muted-foreground mt-1">
                כתב נושא לדיון ומנחה הישיבה יזמן את הסוכנים הרלוונטיים להשיב
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
              {[
                "מה האסטרטגיה שלנו לרבעון הבא?",
                "איך נגדיל את הכנסות החברה?",
                "מה מצב הפרויקטים הפעילים?"
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs bg-secondary hover:bg-secondary/70 text-muted-foreground rounded-xl p-2.5 text-right leading-snug transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} agents={agents} />
        ))}

        {loading && currentSpeaker && (
          <div className="flex items-center gap-2 text-muted-foreground pl-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs">{currentSpeaker} מכין תגובה...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <DecisionPanel
        decisions={decisions}
        agents={agents}
        onDirectiveCreated={() => {}}
      />

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/50 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="הציגו נושא לדיון בפני הדירקטוריון..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
            disabled={loading}
            dir="auto"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-xl h-auto px-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {loading && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            המנחה מנהל את הדיון... אנא המתן
          </p>
        )}
      </div>
    </div>
  );
}