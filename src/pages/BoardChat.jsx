import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, ChevronDown, ChevronUp, Download, FileText, Plus, ArrowUp } from "lucide-react";
import MeetingSidebar from "../components/boardchat/MeetingSidebar";
import ExportOutputModal from "../components/boardchat/ExportOutputModal";
import { Button } from "@/components/ui/button";
import AgentAvatar from "../components/shared/AgentAvatar";
import DecisionPanel from "../components/boardchat/DecisionPanel";
import ReactMarkdown from "react-markdown";

// ── Message Bubble ──────────────────────────────────────
function MessageBubble({ message, agentMap }) {
  const isUser = message.role === "user";
  const isFacilitator = !isUser && message.agent_role_key === "facilitator";
  const agent = message.agent_role_key ? agentMap[message.agent_role_key] : null;

  if (isUser) {
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
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5 text-sm">🤖</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-1.5" style={{ color: agent?.color || "hsl(var(--muted-foreground))" }}>
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

// ── Confirm Panel ───────────────────────────────────────
function ConfirmPanel({ recommendation, allAgents, onConfirm }) {
  const [selectedKeys, setSelectedKeys] = useState(() => recommendation.selected_agents.map(s => s.role_key));
  const [format, setFormat] = useState(recommendation.suggested_format || "statements");
  const [expanded, setExpanded] = useState(true);

  const toggleAgent = (key) =>
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const selectedAgents = allAgents.filter(a => selectedKeys.includes(a.role_key));

  return (
    <div className="max-w-2xl mx-auto w-full px-4 mb-4">
      <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden">
        <button onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors">
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
                    <button key={a.id} onClick={() => toggleAgent(a.role_key)} title={rec?.reason || ""}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                        isSelected ? "bg-primary/20 border-primary text-primary" : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/40"
                      }`}>
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
                {[
                  { val: "statements", label: "הבעת עמדות", desc: "כל סוכן מביע עמדה עצמאית" },
                  { val: "debate", label: "דיון פתוח", desc: "סוכנים מגיבים אחד לשני" }
                ].map(f => (
                  <button key={f.val} onClick={() => setFormat(f.val)}
                    className={`p-3 rounded-xl border text-right transition-all ${format === f.val ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <p className="text-xs font-semibold text-foreground">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => onConfirm(selectedAgents, format)} disabled={selectedAgents.length === 0} className="w-full rounded-xl">
              <Sparkles className="w-4 h-4 mr-1" />
              פתח את הדיון ({selectedAgents.length} משתתפים)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────
export default function BoardChat() {
  const [agents, setAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  // Merged display messages
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | planning | confirming | running | done
  const [pendingTopic, setPendingTopic] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [activeAgents, setActiveAgents] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [meetings, setMeetings] = useState([]);
  // real agent conversations: role_key → convo
  const [agentConvos, setAgentConvos] = useState({});
  const facilitatorConvoRef = useRef(null);
  const unsubscribesRef = useRef({});
  const messagesRef = useRef([]); // track all messages for dedup
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { init(); return () => unsubscribeAll(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, phase]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const unsubscribeAll = () => {
    Object.values(unsubscribesRef.current).forEach(fn => fn());
    unsubscribesRef.current = {};
  };

  const mergeConvoMessages = (convosMap) => {
    const all = [];
    Object.entries(convosMap).forEach(([roleKey, convo]) => {
      if (!convo?.messages) return;
      convo.messages.forEach(m => {
        all.push({
          id: `${roleKey}-${m.id || m.content?.slice(0, 10)}`,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          agent_role_key: m.role === "assistant" ? roleKey : null,
          ts: m.created_date || m.id,
        });
      });
    });
    // Deduplicate user messages
    const seen = new Set();
    const deduped = all.filter(m => {
      if (m.role !== "user") return true;
      if (seen.has(m.content)) return false;
      seen.add(m.content);
      return true;
    });
    deduped.sort((a, b) => (a.ts > b.ts ? 1 : -1));
    setMessages(deduped);
  };

  const init = async () => {
    const a = await base44.entities.Agent.list();
    const active = a.filter(ag => ag.is_active);
    setAgents(active);
    const map = {};
    active.forEach(ag => { map[ag.role_key] = ag; });
    setAgentMap(map);
    loadMeetings();
  };

  const loadMeetings = async () => {
    const all = await base44.entities.Conversation.filter({ type: "meeting" });
    setMeetings(all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  // Add a local display message (for facilitator/system messages)
  const addLocalMsg = (msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  };

  const subscribeAgent = (roleKey, convoId) => {
    if (unsubscribesRef.current[roleKey]) unsubscribesRef.current[roleKey]();
    const unsub = base44.agents.subscribeToConversation(convoId, (data) => {
      setAgentConvos(prev => {
        const updated = { ...prev, [roleKey]: data };
        mergeConvoMessages(updated);
        return updated;
      });
    });
    unsubscribesRef.current[roleKey] = unsub;
  };

  const handleTopicSubmit = async () => {
    if (!input.trim() || loading) return;
    const topic = input.trim();
    setInput("");
    setLoading(true);
    setPendingTopic(topic);
    setPhase("planning");
    setMessages([]);
    unsubscribeAll();
    setAgentConvos({});

    addLocalMsg({ role: "user", content: topic, agent_role_key: null });

    // Use the real facilitator agent
    const convo = await base44.agents.createConversation({
      agent_name: "facilitator",
      metadata: { title: `Board Meeting: ${topic}` }
    });
    facilitatorConvoRef.current = convo;

    // Subscribe to facilitator for real-time streaming
    const unsub = base44.agents.subscribeToConversation(convo.id, (data) => {
      // Show only the latest facilitator assistant message
      const assistantMsgs = (data.messages || []).filter(m => m.role === "assistant");
      if (assistantMsgs.length === 0) return;
      const latest = assistantMsgs[assistantMsgs.length - 1];
      setMessages(prev => {
        const filtered = prev.filter(m => m.agent_role_key !== "facilitator" || m.id === "fac-latest");
        return [...filtered, {
          id: "fac-latest",
          role: "assistant",
          content: latest.content,
          agent_role_key: "facilitator",
          ts: latest.created_date,
        }];
      });
    });
    unsubscribesRef.current["facilitator"] = unsub;

    // Ask the facilitator to plan the meeting
    const planPrompt = `נושא לדיון: "${topic}"\n\nאנא:\n1. נתח את הנושא והמלץ על 3-5 סוכנים מתוך הרשימה לפי הרלוונטיות.\n2. המלץ על פורמט: "statements" (כל אחד מביע עמדה) או "debate".\n3. החזר JSON בלבד:\n{"facilitator_message":"...","selected_agents":[{"role_key":"...","reason":"..."}],"suggested_format":"statements|debate","format_reason":"..."}`;

    await base44.agents.addMessage(convo, { role: "user", content: planPrompt });

    // Poll for the JSON response
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const updated = await base44.agents.getConversation(convo.id);
      const assistantMsgs = (updated.messages || []).filter(m => m.role === "assistant");
      if (assistantMsgs.length > 0 || attempts > 30) {
        clearInterval(poll);
        const lastMsg = assistantMsgs[assistantMsgs.length - 1];
        if (lastMsg) {
          try {
            const jsonMatch = lastMsg.content.match(/\{[\s\S]*\}/);
            const rec = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            if (rec && rec.selected_agents) {
              // Show human-readable message instead of raw JSON
              setMessages(prev => prev.map(m => m.id === "fac-latest" ? {
                ...m,
                content: `${rec.facilitator_message}\n\n**פורמט מומלץ:** ${rec.suggested_format === "debate" ? "דיון פתוח" : "הבעת עמדות"} — ${rec.format_reason}`
              } : m));
              setRecommendation(rec);
              setPhase("confirming");
            } else {
              setPhase("confirming");
            }
          } catch {
            setPhase("confirming");
          }
        }
        setLoading(false);
      }
    }, 1500);
  };

  const handleConfirm = async (selectedAgents, format) => {
    setActiveAgents(selectedAgents);
    setPhase("running");
    setLoading(true);

    addLocalMsg({
      role: "assistant",
      content: `מתחילים! משתתפים: ${selectedAgents.map(a => a.title).join(", ")} | פורמט: ${format === "debate" ? "דיון פתוח" : "הבעת עמדות"}`,
      agent_role_key: "facilitator"
    });

    // Create a real agent conversation for each selected agent
    const newConvos = {};
    for (const agent of selectedAgents) {
      const convo = await base44.agents.createConversation({
        agent_name: agent.role_key,
        metadata: { title: `Board Meeting: ${pendingTopic}` }
      });
      newConvos[agent.role_key] = convo;
      subscribeAgent(agent.role_key, convo.id);
    }
    setAgentConvos(newConvos);

    // Run the discussion by sending the topic to each agent
    if (format === "statements") {
      for (const agent of selectedAgents) {
        setCurrentSpeaker(agent.title);
        const convo = newConvos[agent.role_key];
        const prompt = `נושא לדיון בישיבת הדירקטוריון: "${pendingTopic}"\n\nהבע את עמדתך המקצועית בנושא. תן המלצה ברורה עם נימוקים. היה תמציתי ומקצועי.`;
        await base44.agents.addMessage(convo, { role: "user", content: prompt });
        // Wait for response
        await waitForAgentResponse(agent.role_key, convo.id, newConvos);
      }
    } else {
      // Debate: each agent responds to the previous ones
      const discussionSoFar = [];
      for (const agent of selectedAgents) {
        setCurrentSpeaker(agent.title);
        const convo = newConvos[agent.role_key];
        const histCtx = discussionSoFar.length > 0
          ? `\n\nמה שנאמר עד כה:\n${discussionSoFar.map(h => `${h.agent}: ${h.content.slice(0, 300)}`).join("\n\n")}`
          : "";
        const prompt = `נושא לדיון בישיבת הדירקטוריון: "${pendingTopic}"${histCtx}\n\n${discussionSoFar.length === 0 ? "פתח את הדיון." : "הגב לדברים שנאמרו. אפשר להסכים, לחלוק, לחדד."} היה ממוקד ותורם לדיון.`;
        await base44.agents.addMessage(convo, { role: "user", content: prompt });
        const resp = await waitForAgentResponse(agent.role_key, convo.id, newConvos);
        if (resp) discussionSoFar.push({ agent: agent.title, content: resp });
      }
    }

    // Summarize decisions via facilitator
    setCurrentSpeaker("מסכם החלטות...");
    const allAgentMsgs = selectedAgents.map(a => {
      const msgs = (newConvos[a.role_key]?.messages || []).filter(m => m.role === "assistant");
      const last = msgs[msgs.length - 1];
      return last ? `${a.title}: ${last.content.slice(0, 400)}` : "";
    }).filter(Boolean).join("\n\n");

    const summaryPrompt = `סכם את הדיון שהתקיים בנושא: "${pendingTopic}"\n\nהמשתתפים אמרו:\n${allAgentMsgs}\n\nחלץ 2-5 החלטות מעשיות ברורות. החזר JSON:\n{"decisions":[{"directive_text":"...","agent_role_key":"...","priority":"low|medium|high|critical"}]}`;
    const facConvo = facilitatorConvoRef.current;
    if (facConvo) {
      await base44.agents.addMessage(facConvo, { role: "user", content: summaryPrompt });
      const updated = await pollForResponse(facConvo.id);
      const assistantMsgs = (updated?.messages || []).filter(m => m.role === "assistant");
      const last = assistantMsgs[assistantMsgs.length - 1];
      if (last) {
        try {
          const jsonMatch = last.content.match(/\{[\s\S]*\}/);
          const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          if (result?.decisions) {
            setDecisions(result.decisions);
            const count = result.decisions.length;
            addLocalMsg({
              role: "assistant",
              content: `הדיון הסתיים. זיהיתי **${count} החלטות** — ניתן להמיר אותן ל-Directives בפאנל למטה.`,
              agent_role_key: "facilitator"
            });
          }
        } catch {
          addLocalMsg({ role: "assistant", content: "הדיון הסתיים.", agent_role_key: "facilitator" });
        }
      }
    }

    // Save meeting to entity for history
    const meetingConvo = await base44.entities.Conversation.create({
      type: "meeting",
      topic: pendingTopic,
      participants: selectedAgents.map(a => a.id),
    });
    await loadMeetings();

    setCurrentSpeaker(null);
    setLoading(false);
    setPhase("done");
  };

  // Poll until agent responds, update convos state, return response text
  const waitForAgentResponse = async (roleKey, convoId, convosMap) => {
    const updated = await pollForResponse(convoId);
    if (updated) {
      const assistantMsgs = (updated.messages || []).filter(m => m.role === "assistant");
      const last = assistantMsgs[assistantMsgs.length - 1];
      setAgentConvos(prev => {
        const newMap = { ...prev, [roleKey]: updated };
        mergeConvoMessages({ ...convosMap, ...newMap, [roleKey]: updated });
        return newMap;
      });
      return last?.content || null;
    }
    return null;
  };

  const pollForResponse = (convoId, maxAttempts = 40) => {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const updated = await base44.agents.getConversation(convoId);
        const assistantMsgs = (updated.messages || []).filter(m => m.role === "assistant");
        if (assistantMsgs.length > 0 || attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(updated);
        }
      }, 1500);
    });
  };

  const handleNewSession = () => {
    setPhase("idle");
    setPendingTopic("");
    setRecommendation(null);
    setActiveAgents([]);
    setDecisions([]);
    setMessages([]);
    setAgentConvos({});
    facilitatorConvoRef.current = null;
    unsubscribeAll();
  };

  const handleEndMeeting = () => {
    setPhase("done");
    setCurrentSpeaker(null);
    setLoading(false);
  };

  const handleSelectMeeting = async (meeting) => {
    setPhase("done");
    setDecisions([]);
    setActiveAgents([]);
    setPendingTopic(meeting.topic !== "board_room_discussion" ? meeting.topic : "");
    // Load old ChatMessage records for this meeting
    const msgs = await base44.entities.ChatMessage.filter({ conversation_id: meeting.id });
    const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(sorted.map(m => ({
      id: m.id,
      role: m.role === "board" ? "user" : "assistant",
      content: m.content,
      agent_role_key: m.agent_role_key || null,
      ts: m.created_date,
    })));
  };

  const handleSend = () => {
    if (phase === "idle" || phase === "done") handleTopicSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmptyState = phase === "idle" && messages.length === 0;

  const placeholder = phase === "idle" ? "הציגו נושא לדיון..." : phase === "done" ? "נושא חדש לדיון..." : "ממתין...";
  const inputDisabled = loading || phase === "confirming" || phase === "running" || phase === "planning";
  const canSend = input.trim() && !inputDisabled;

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden bg-background">
      <MeetingSidebar
        meetings={meetings}
        currentId={null}
        onSelect={handleSelectMeeting}
        onNewMeeting={handleNewSession}
        onEndMeeting={handleEndMeeting}
        phase={phase}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="flex flex-col flex-1 min-w-0 relative">
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
            <div className="w-full max-w-2xl">
              <InputBox input={input} setInput={setInput} onSend={handleSend} disabled={inputDisabled} canSend={canSend} loading={loading} placeholder={placeholder} textareaRef={textareaRef} onKeyDown={handleKeyDown} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">
                {messages.map((msg, i) => (
                  <MessageBubble key={msg.id || i} message={msg} agentMap={agentMap} />
                ))}
                {loading && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{currentSpeaker || "..."} מכין תגובה...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {phase === "confirming" && recommendation && (
              <ConfirmPanel recommendation={recommendation} allAgents={agents} onConfirm={handleConfirm} />
            )}

            {decisions.length > 0 && (
              <div className="max-w-2xl mx-auto w-full px-4">
                <DecisionPanel decisions={decisions} agents={agents} onDirectiveCreated={() => {}} />
              </div>
            )}

            {phase === "done" && (
              <div className="flex justify-center gap-2 pb-2 px-4">
                <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="text-xs h-7 rounded-lg gap-1">
                  <FileText className="w-3 h-3" /> סיכום Output
                </Button>
                <Button variant="outline" size="sm" onClick={handleNewSession} className="text-xs h-7 rounded-lg gap-1">
                  <Plus className="w-3 h-3" /> דיון חדש
                </Button>
              </div>
            )}

            {(phase === "idle" || phase === "done") && (
              <div className="px-4 pb-4 pt-2 max-w-2xl mx-auto w-full">
                <InputBox input={input} setInput={setInput} onSend={handleSend} disabled={inputDisabled} canSend={canSend} loading={loading} placeholder={placeholder} textareaRef={textareaRef} onKeyDown={handleKeyDown} />
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

function InputBox({ input, setInput, onSend, disabled, canSend, loading, placeholder, textareaRef, onKeyDown }) {
  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        dir="auto"
        rows={1}
        className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-[200px] text-right"
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/60">Enter לשליחה</p>
        <button onClick={onSend} disabled={!canSend}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}