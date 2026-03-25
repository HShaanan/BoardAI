import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Sparkles, Users, ChevronDown, ChevronUp, Download, FileText, Plus, ArrowUp } from "lucide-react";
import MeetingSidebar from "../components/boardchat/MeetingSidebar";
import ExportOutputModal from "../components/boardchat/ExportOutputModal";
import { exportConversationToKnowledge } from "../lib/exportToKnowledge";
import { Button } from "@/components/ui/button";
import AgentAvatar from "../components/shared/AgentAvatar";
import DecisionPanel from "../components/boardchat/DecisionPanel";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message, agents }) {
  const isBoard = message.role === "board";
  const isFacilitator = message.agent_role_key === "facilitator";
  const agent = agents.find(a => a.id === message.agent_id);

  if (isBoard) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isFacilitator) {
    return (
      <div className="flex gap-3 items-start mb-6">
        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-accent mb-1.5">מנחה הישיבה</p>
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start mb-6">
      {agent ? (
        <AgentAvatar agent={agent} size="sm" showStatus />
      ) : (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">
          {agent?.title || message.agent_role_key}
          {agent?.title_he && agent.title_he !== agent.title && (
            <span className="font-normal opacity-60"> · {agent.title_he}</span>
          )}
        </p>
        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function ConfirmPanel({ recommendation, allAgents, onConfirm }) {
  const [selectedKeys, setSelectedKeys] = useState(
    () => recommendation.selected_agents.map(s => s.role_key)
  );
  const [format, setFormat] = useState(recommendation.suggested_format || "statements");
  const [expanded, setExpanded] = useState(true);

  const toggleAgent = (key) =>
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

  const selectedAgents = allAgents.filter(a => selectedKeys.includes(a.role_key));

  return (
    <div className="max-w-2xl mx-auto w-full px-4 mb-4">
      <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">אישור משתתפים ופורמט</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">בחר/בטל משתתפים:</p>
              <div className="flex flex-wrap gap-2">
                {allAgents.filter(a => a.is_active).map(a => {
                  const rec = recommendation.selected_agents.find(s => s.role_key === a.role_key);
                  const isSelected = selectedKeys.includes(a.role_key);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAgent(a.role_key)}
                      title={rec?.reason || ""}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{a.avatar_emoji}</span>
                      <span>{a.title_he || a.title}</span>
                      {isSelected && rec && <span className="text-[9px] opacity-70">★</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">פורמט הדיון:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat("statements")}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    format === "statements" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground">הבעת עמדות</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">כל סוכן מביע עמדה עצמאית</p>
                </button>
                <button
                  onClick={() => setFormat("debate")}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    format === "debate" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground">דיון פתוח</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">סוכנים מגיבים אחד לשני</p>
                </button>
              </div>
            </div>

            <Button
              onClick={() => onConfirm(selectedAgents, format)}
              disabled={selectedAgents.length === 0}
              className="w-full rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              פתח את הדיון ({selectedAgents.length} משתתפים)
            </Button>
          </div>
        )}
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
  const [phase, setPhase] = useState("idle");
  const [pendingTopic, setPendingTopic] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [activeAgents, setActiveAgents] = useState([]);
  const [discussionFormat, setDiscussionFormat] = useState("statements");
  const [showExportModal, setShowExportModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const loadMeetings = async () => {
    const all = await base44.entities.Conversation.filter({ type: "meeting" });
    setMeetings(all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  useEffect(() => { init(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const init = async () => {
    const [a, c] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
    ]);
    const active = a.filter(ag => ag.is_active);
    setAgents(active);
    if (c.length > 0) setCore(c[0]);
    await loadMeetings();
    setInitializing(false);
  };

  const addMsg = async (convo, data) => {
    const msg = await base44.entities.ChatMessage.create({ conversation_id: convo.id, ...data });
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleTopicSubmit = async () => {
    if (!input.trim() || loading) return;
    const topic = input.trim();
    setInput("");
    setLoading(true);
    setPendingTopic(topic);
    setPhase("planning");

    // If no conversation yet, create one
    let convo = conversation;
    if (!convo) {
      convo = await base44.entities.Conversation.create({
        type: "meeting",
        topic: "board_room_discussion",
        participants: agents.map(ag => ag.id),
      });
      setConversation(convo);
      await loadMeetings();
    }

    await addMsg(convo, { role: "board", content: topic });

    const agentsList = agents.map(a =>
      `- ${a.role_key}: ${a.title} (${a.department}) — ${a.responsibilities}`
    ).join("\n");
    const coreCtx = core ? `חברה: ${core.company_name}\nמשימה: ${core.mission}\nחזון: ${core.vision}` : "";

    const rec = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה מנחה ישיבת דירקטוריון מקצועי.\n\nנושא הדיון: "${topic}"\n${coreCtx}\n\nהסוכנים הזמינים:\n${agentsList}\n\nבצע תיאום ציפיות:\n1. זהה 3-5 סוכנים הכי רלוונטיים ונמק בקצרה\n2. המלץ על פורמט: "statements" (כל אחד מביע עמדה) או "debate" (דיון חי בין הסוכנים)\n3. כתוב הודעה קצרה ומקצועית למשתמש\n\nהחזר JSON בלבד:\n{\n  "facilitator_message": "הודעה למשתמש בעברית",\n  "selected_agents": [{"role_key": "...", "reason": "נימוק קצר"}],\n  "suggested_format": "statements|debate",\n  "format_reason": "למה מומלץ פורמט זה"\n}`,
      response_json_schema: {
        type: "object",
        properties: {
          facilitator_message: { type: "string" },
          selected_agents: { type: "array", items: { type: "object", properties: { role_key: { type: "string" }, reason: { type: "string" } } } },
          suggested_format: { type: "string" },
          format_reason: { type: "string" }
        }
      }
    });

    await addMsg(convo, {
      role: "agent",
      content: `${rec.facilitator_message}\n\n**פורמט מומלץ:** ${rec.suggested_format === "debate" ? "דיון פתוח" : "הבעת עמדות"} — ${rec.format_reason}`,
      agent_role_key: "facilitator"
    });

    setRecommendation(rec);
    setLoading(false);
    setPhase("confirming");
  };

  const handleConfirm = async (selectedAgents, format) => {
    setActiveAgents(selectedAgents);
    setDiscussionFormat(format);
    setPhase("running");
    setLoading(true);
    setCurrentSpeaker("מתחיל דיון...");

    const names = selectedAgents.map(a => a.title).join(", ");
    await addMsg(conversation, {
      role: "agent",
      content: `מתחילים! משתתפים: ${names} | פורמט: ${format === "debate" ? "דיון פתוח" : "הבעת עמדות"}`,
      agent_role_key: "facilitator"
    });

    try {
      await runDiscussion(selectedAgents, format, pendingTopic);
    } catch (e) {
      console.error(e);
      setCurrentSpeaker(null);
      setLoading(false);
      setPhase("done");
    }
  };

  const buildAgentPrompt = (agent, topic, coreCtx, history, mode, knowledgeCtx = "") => {
    const histCtx = history.length > 0
      ? `\nמה שנאמר עד כה:\n${history.map(h => `${h.agent}: ${h.content}`).join("\n\n")}`
      : "";
    return `אתה ${agent.title} (${agent.title_he}).\nאחריות: ${agent.responsibilities}\nאישיות: ${agent.personality_traits}\nסגנון: ${agent.communication_style}\nיצירתיות: ${agent.creativity_level}/10 | פירוטיות: ${agent.verbosity_level}/10\n\n${coreCtx}\n${knowledgeCtx}\n${histCtx}\n\nנושא: "${topic}"\n\n${mode === "debate" ? "הגב לדברים שנאמרו. אפשר להסכים, לחלוק, לחדד. היה ממוקד ותורם לדיון." : "הבע את עמדתך המקצועית. תן המלצה ברורה. עשה שימוש בנתונים ממאגר הידע אםרלוונטים."}\nהגב בשפה שבה נוסח הנושא.`;
  };

  const runDiscussion = async (selectedAgents, format, topic) => {
    const coreCtx = core ? `חברה: ${core.company_name}\nמשימה: ${core.mission}\nחזון: ${core.vision}\nגיידליינס: ${core.brand_guidelines}` : "";
    const brainEntries = await base44.entities.BrainEntry.list("-created_date", 8);
    const knowledgeCtx = brainEntries.length > 0
      ? `\n\nמאגר ידע ארגוני:\n${brainEntries.map(e => `### ${e.title}\n${e.content?.slice(0, 500)}`).join("\n---\n")}`
      : "";

    if (format === "statements") {
      for (const agent of selectedAgents) {
        setCurrentSpeaker(agent.title);
        await addMsg(conversation, { role: "agent", content: `${agent.title}, מה עמדתך?`, agent_role_key: "facilitator" });
        const resp = await base44.integrations.Core.InvokeLLM({
          prompt: buildAgentPrompt(agent, topic, coreCtx, [], "statement", knowledgeCtx)
        });
        await addMsg(conversation, { role: "agent", content: resp, agent_id: agent.id, agent_role_key: agent.role_key });
      }
    } else {
      const discussionHistory = [];
      for (const agent of selectedAgents) {
        setCurrentSpeaker(agent.title);
        await addMsg(conversation, {
          role: "agent",
          content: discussionHistory.length === 0 ? `${agent.title}, פתח את הדיון.` : `${agent.title}, מה תגובתך לאמור עד כה?`,
          agent_role_key: "facilitator"
        });
        const resp = await base44.integrations.Core.InvokeLLM({
          prompt: buildAgentPrompt(agent, topic, coreCtx, discussionHistory, "debate", knowledgeCtx)
        });
        discussionHistory.push({ agent: agent.title, content: resp });
        await addMsg(conversation, { role: "agent", content: resp, agent_id: agent.id, agent_role_key: agent.role_key });
      }
    }

    setCurrentSpeaker("מסכם החלטות...");
    const allAgentNames = selectedAgents.map(a => a.role_key).join(", ");
    const decisionsResult = await base44.integrations.Core.InvokeLLM({
      prompt: `סכם את הדיון שהתקיים בנושא: "${topic}" וחלץ החלטות מעשיות.\nסוכנים שהשתתפו: ${selectedAgents.map(a => a.title).join(", ")}\n\nלכל החלטה: מה לעשות, מי אחראי (role_key מ: ${allAgentNames}), עדיפות.\n\nהחזר JSON:\n{"decisions": [{"directive_text": "...","agent_role_key": "...","priority": "low|medium|high|critical"}]}`,
      response_json_schema: {
        type: "object",
        properties: {
          decisions: {
            type: "array",
            items: { type: "object", properties: { directive_text: { type: "string" }, agent_role_key: { type: "string" }, priority: { type: "string" } } }
          }
        }
      }
    });

    const extracted = decisionsResult?.decisions || [];
    setDecisions(prev => [...prev, ...extracted]);

    const closingMsg = extracted.length > 0
      ? `הדיון הסתיים. זיהיתי **${extracted.length} החלטות** — ניתן להמיר אותן ל-Directives בפאנל למטה.`
      : "הדיון הסתיים. תודה לכל המשתתפים.";

    await addMsg(conversation, { role: "agent", content: closingMsg, agent_role_key: "facilitator" });
    setCurrentSpeaker(null);
    setLoading(false);
    setPhase("done");

    const allMsgs = await base44.entities.ChatMessage.filter({ conversation_id: conversation.id });
    exportConversationToKnowledge({
      title: `ישיבת דירקטוריון: ${topic}`,
      messages: allMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
      type: "board_meeting"
    });
  };

  const handleInterject = async () => {
    if (!input.trim() || loading) return;
    const comment = input.trim();
    setInput("");
    await addMsg(conversation, { role: "board", content: comment });
  };

  const handleNewSession = async () => {
    setPhase("idle");
    setPendingTopic("");
    setRecommendation(null);
    setActiveAgents([]);
    setDecisions([]);
    setMessages([]);
    setConversation(null);
    await loadMeetings();
  };

  const handleEndMeeting = async () => {
    setPhase("done");
    setCurrentSpeaker(null);
    setLoading(false);
    if (pendingTopic && conversation) {
      await base44.entities.Conversation.update(conversation.id, { topic: pendingTopic });
      await loadMeetings();
    }
  };

  const handleSelectMeeting = async (meeting) => {
    setConversation(meeting);
    const msgs = await base44.entities.ChatMessage.filter({ conversation_id: meeting.id });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setPhase("done");
    setDecisions([]);
    setActiveAgents([]);
    setPendingTopic(meeting.topic !== "board_room_discussion" ? meeting.topic : "");
  };

  const handleSend = () => {
    if (phase === "idle" || phase === "done") handleTopicSubmit();
    else if (phase === "running") handleInterject();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const isEmptyState = !conversation || (messages.length === 0 && phase === "idle");

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <MeetingSidebar
        meetings={meetings}
        currentId={conversation?.id}
        onSelect={handleSelectMeeting}
        onNewMeeting={handleNewSession}
        onEndMeeting={handleEndMeeting}
        phase={phase}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 relative">

        {/* Empty / welcome state */}
        {isEmptyState ? (
          <div className="flex flex-col flex-1 items-center justify-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Board Room</h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
              הציגו נושא — המנחה יתאם ציפיות, ימליץ על משתתפים ופורמט, ואתם תאשרו לפני תחילת הדיון
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mb-8">
              {["מה האסטרטגיה שלנו לרבעון הבא?", "איך נגדיל הכנסות ב-30%?", "מה מצב הפרויקטים הפעילים?"].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-sm bg-card hover:bg-secondary border border-border text-muted-foreground rounded-xl p-3 text-right transition-colors">
                  {s}
                </button>
              ))}
            </div>
            {/* Input at bottom of empty state */}
            <div className="w-full max-w-2xl">
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={handleSend}
                loading={loading}
                phase={phase}
                textareaRef={textareaRef}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} agents={agents} />
                ))}

                {loading && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{currentSpeaker || "טוען..."} מכין תגובה...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Confirm Panel */}
            {phase === "confirming" && recommendation && (
              <ConfirmPanel
                recommendation={recommendation}
                allAgents={agents}
                onConfirm={handleConfirm}
              />
            )}

            {/* Decision Panel */}
            {decisions.length > 0 && (
              <div className="max-w-2xl mx-auto w-full px-4">
                <DecisionPanel decisions={decisions} agents={agents} onDirectiveCreated={() => {}} />
              </div>
            )}

            {/* Action bar (done state) */}
            {phase === "done" && (
              <div className="flex justify-center gap-2 pb-2 px-4">
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="text-xs h-7 rounded-lg gap-1">
                  <FileText className="w-3 h-3" /> סיכום Output
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportConversationToKnowledge({
                  title: `ישיבת דירקטוריון: ${pendingTopic}`,
                  messages,
                  type: "board_meeting"
                })} className="text-xs h-7 rounded-lg gap-1">
                  <Download className="w-3 h-3" /> ייצוא
                </Button>
                <Button variant="outline" size="sm" onClick={handleNewSession} className="text-xs h-7 rounded-lg gap-1">
                  <Plus className="w-3 h-3" /> דיון חדש
                </Button>
              </div>
            )}

            {/* Input */}
            {phase !== "confirming" && (
              <div className="px-4 pb-4 pt-2 max-w-2xl mx-auto w-full">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  loading={loading}
                  phase={phase}
                  textareaRef={textareaRef}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showExportModal && (
        <ExportOutputModal
          topic={pendingTopic}
          activeAgents={activeAgents}
          decisions={decisions}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

function ChatInput({ input, setInput, onSend, loading, phase, textareaRef, onKeyDown }) {
  const placeholder =
    phase === "idle" ? "הציגו נושא לדיון..." :
    phase === "running" ? "הוסף הערה תוך כדי הדיון..." :
    phase === "done" ? "נושא חדש לדיון..." :
    "ממתין...";

  const isDisabled = loading && phase !== "running";
  const canSend = input.trim() && !isDisabled;

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        dir="auto"
        rows={1}
        className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-[200px] text-right"
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/60">
          {phase === "running" ? "Enter לשליחה · Shift+Enter לשורה חדשה" : "Enter לשליחה"}
        </p>
        <button
          onClick={onSend}
          disabled={!canSend}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          {loading && phase !== "running"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ArrowUp className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}