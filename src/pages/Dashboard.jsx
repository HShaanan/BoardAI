import { useEffect, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowUp, Loader2, Plus, MessageSquare, Trash2, X,
  Users, User, ChevronLeft, ChevronRight, Zap, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AgentAvatar from "../components/shared/AgentAvatar";
import FeedbackButtons from "../components/shared/FeedbackButtons";

const STORAGE_KEY = "boardai_convos_v3";

function loadConvos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveConvos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ── Typing dots ──────────────────────────────────────────
function TypingBubble({ agent }) {
  return (
    <div className="flex gap-3 items-start mb-5">
      <div className="shrink-0 mt-0.5">
        {agent
          ? <AgentAvatar agent={agent} size="sm" />
          : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">🤖</div>
        }
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map(delay => (
          <span key={delay} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Single message bubble ────────────────────────────────
function MessageBubble({ msg, agentMap }) {
  const isUser = msg.role === "user";
  const agent = msg.agentKey ? agentMap[msg.agentKey] : null;

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[72%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start mb-5 group">
      <div className="shrink-0 mt-0.5">
        {agent
          ? <AgentAvatar agent={agent} size="sm" />
          : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">🤖</div>
        }
      </div>
      <div className="flex-1 min-w-0 max-w-[82%]">
        {agent && (
          <p className="text-xs font-semibold mb-1.5" style={{ color: agent.color || "hsl(var(--muted-foreground))" }}>
            {agent.title_he || agent.title}
            {agent.title && agent.title_he && agent.title !== agent.title_he && (
              <span className="font-normal opacity-50 ml-1">· {agent.title}</span>
            )}
          </p>
        )}
        <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        <FeedbackButtons message={msg} agentRoleKey={msg.agentKey} agentTitle={agent?.title} />
      </div>
    </div>
  );
}

// ── New Chat Modal ───────────────────────────────────────
function NewChatModal({ agents, onStart, onClose }) {
  const [step, setStep] = useState("type"); // "type" | "agent" | "board"
  const [selected, setSelected] = useState([]);

  const cSuiteKeys = ["ceo","cfo","cto","cmo","coo","cpo","cro","chro","boss_ai"];
  const cSuite = agents.filter(a => cSuiteKeys.includes(a.role_key));

  const toggle = (key) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const startBoard = () => {
    const picked = agents.filter(a => selected.includes(a.role_key));
    if (picked.length > 0) onStart({ type: "board", agents: picked });
  };

  // Pre-select C-suite when entering board step
  const enterBoard = () => {
    setSelected(cSuite.map(a => a.role_key));
    setStep("board");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {step !== "type" && (
              <button onClick={() => setStep("type")} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-semibold text-foreground">
              {step === "type" ? "שיחה חדשה" : step === "agent" ? "בחר סוכן" : "ישיבת דירקטוריון"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: pick type */}
          {step === "type" && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep("agent")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <User className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">אחד על אחד</p>
                  <p className="text-xs text-muted-foreground mt-0.5">שיחה עם סוכן ספציפי</p>
                </div>
              </button>
              <button onClick={enterBoard}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Users className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">ישיבת דירקטוריון</p>
                  <p className="text-xs text-muted-foreground mt-0.5">כל הצוות המנהל</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2a: pick single agent */}
          {step === "agent" && (
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {agents.map(a => (
                <button key={a.id} onClick={() => onStart({ type: "single", agents: [a] })}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <AgentAvatar agent={a} size="md" />
                  <p className="text-xs font-medium text-center leading-tight line-clamp-2">
                    {a.title_he || a.title}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2b: board meeting agent selection */}
          {step === "board" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{selected.length} סוכנים נבחרו</p>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(cSuite.map(a => a.role_key))}
                    className="text-xs text-primary hover:underline">C-Suite</button>
                  <button onClick={() => setSelected(agents.map(a => a.role_key))}
                    className="text-xs text-primary hover:underline">הכל</button>
                  <button onClick={() => setSelected([])}
                    className="text-xs text-muted-foreground hover:underline">נקה</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto mb-4">
                {agents.map(a => {
                  const isOn = selected.includes(a.role_key);
                  return (
                    <button key={a.id} onClick={() => toggle(a.role_key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isOn ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}>
                      <AgentAvatar agent={a} size="sm" />
                      <p className="text-xs font-medium text-center leading-tight line-clamp-2">
                        {a.title_he || a.title}
                      </p>
                    </button>
                  );
                })}
              </div>
              <button onClick={startBoard} disabled={selected.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                התחל ישיבה עם {selected.length} סוכנים
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversation list item ────────────────────────────────
function ConvoItem({ convo, active, onClick, onDelete }) {
  return (
    <button onClick={onClick}
      className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      }`}>
      <span className="text-sm shrink-0">{convo.type === "board" ? "👥" : "💬"}</span>
      <span className="flex-1 truncate text-xs">{convo.title}</span>
      <button
        onClick={e => onDelete(convo.id, e)}
        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </button>
  );
}

// ── Main component ───────────────────────────────────────
export default function Dashboard() {
  const [convos, setConvos] = useState(() => loadConvos());
  const [activeMeta, setActiveMeta] = useState(null);
  const [convoObjects, setConvoObjects] = useState({}); // roleKey → base44 convo
  const [displayMsgs, setDisplayMsgs] = useState([]); // what we show in UI
  const [allAgents, setAllAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingKeys, setTypingKeys] = useState(new Set());
  const [showNewChat, setShowNewChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const unsubsRef = useRef({});
  // For board meetings: context from previous round
  const boardCtxRef = useRef("");
  // Track expected assistant message counts per agent (to detect new responses)
  const expectedCountRef = useRef({});

  // Load agents on mount
  useEffect(() => {
    base44.entities.Agent.list().then(list => {
      const active = list.filter(a => a.is_active);
      setAllAgents(active);
      const map = {};
      active.forEach(a => { map[a.role_key] = a; });
      setAgentMap(map);
    });
    return () => unsubAll();
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMsgs, typingKeys]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const unsubAll = () => {
    Object.values(unsubsRef.current).forEach(fn => fn?.());
    unsubsRef.current = {};
  };

  // Rebuild displayMsgs from convoObjects
  // For board: use primaryAgent's user messages + all agents' assistant messages by turn index
  const rebuildFromConvos = useCallback((convosMap, primaryKey) => {
    if (!primaryKey || !convosMap[primaryKey]?.messages) return;
    const primaryMsgs = convosMap[primaryKey].messages;
    const result = [];

    primaryMsgs.forEach((m, idx) => {
      if (m.role === "user") {
        // Strip injected context (everything after "---\n*הקשר") from display
        const cleanContent = m.content.replace(/\n\n---\n\*הקשר מהסיבוב הקודם:[\s\S]*$/, "");
        result.push({ id: `u-${idx}`, role: "user", content: cleanContent, agentKey: null });
      } else if (m.role === "assistant") {
        // Add primary agent's response
        result.push({ id: `${primaryKey}-${idx}`, role: "assistant", content: m.content, agentKey: primaryKey });
        // Add other agents' responses at same turn
        Object.entries(convosMap).forEach(([key, convo]) => {
          if (key === primaryKey || !convo?.messages) return;
          const other = convo.messages[idx];
          if (other?.role === "assistant") {
            result.push({ id: `${key}-${idx}`, role: "assistant", content: other.content, agentKey: key });
          }
        });
      }
    });

    setDisplayMsgs(result);
  }, []);

  const subscribeAgent = useCallback((roleKey, convoId, primaryKey) => {
    if (unsubsRef.current[roleKey]) unsubsRef.current[roleKey]();
    const unsub = base44.agents.subscribeToConversation(convoId, (data) => {
      setConvoObjects(prev => {
        const updated = { ...prev, [roleKey]: data };
        const pk = primaryKey || Object.keys(updated)[0];
        rebuildFromConvos(updated, pk);
        return updated;
      });

      // Detect new assistant message → remove from typingKeys
      const assistants = (data.messages || []).filter(m => m.role === "assistant");
      const expected = expectedCountRef.current[roleKey] ?? 0;
      if (assistants.length > expected) {
        expectedCountRef.current[roleKey] = assistants.length;
        setTypingKeys(prev => {
          const next = new Set(prev);
          next.delete(roleKey);
          return next;
        });
        // Save last response to board context
        if (assistants.length > 0) {
          const agentData = allAgents.find(a => a.role_key === roleKey);
          const name = agentData?.title_he || agentData?.title || roleKey;
          const content = assistants[assistants.length - 1].content;
          boardCtxRef.current = boardCtxRef.current
            ? `${boardCtxRef.current}\n\n**${name}**: ${content}`
            : `**${name}**: ${content}`;
        }
      }
    });
    unsubsRef.current[roleKey] = unsub;
  }, [allAgents, rebuildFromConvos]);

  // Open an existing conversation
  const openConvo = async (meta) => {
    unsubAll();
    setDisplayMsgs([]);
    setConvoObjects({});
    setTypingKeys(new Set());
    boardCtxRef.current = "";
    setActiveMeta(meta);

    if (!meta.agentConvoIds || Object.keys(meta.agentConvoIds).length === 0) return;

    const newConvos = {};
    const primaryKey = meta.primaryKey || Object.keys(meta.agentConvoIds)[0];
    for (const [key, id] of Object.entries(meta.agentConvoIds)) {
      const c = await base44.agents.getConversation(id);
      newConvos[key] = c;
      subscribeAgent(key, c.id, primaryKey);
    }
    setConvoObjects(newConvos);
    rebuildFromConvos(newConvos, primaryKey);
  };

  // Start a brand-new chat
  const startNewChat = ({ type, agents }) => {
    setShowNewChat(false);
    unsubAll();
    setDisplayMsgs([]);
    setConvoObjects({});
    setTypingKeys(new Set());
    boardCtxRef.current = "";
    expectedCountRef.current = {};

    const primaryKey = agents[0].role_key;
    const title = type === "board"
      ? `ישיבת דירקטוריון — ${new Date().toLocaleDateString("he-IL")}`
      : `שיחה עם ${agents[0].title_he || agents[0].title}`;

    setActiveMeta({
      id: null,
      title,
      type,
      primaryKey,
      agentKeys: agents.map(a => a.role_key),
      agentConvoIds: {},
      createdAt: new Date().toISOString(),
    });
  };

  const deleteConvo = (id, e) => {
    e.stopPropagation();
    const updated = convos.filter(c => c.id !== id);
    setConvos(updated);
    saveConvos(updated);
    if (activeMeta?.id === id) {
      setActiveMeta(null);
      setDisplayMsgs([]);
      setConvoObjects({});
      unsubAll();
    }
  };

  // Send a message
  const handleSend = async () => {
    if (!input.trim() || sending || !activeMeta) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    const isBoard = activeMeta.type === "board";
    const agents = activeMeta.agentKeys.map(k => agentMap[k]).filter(Boolean);
    const primaryKey = activeMeta.primaryKey || agents[0]?.role_key;

    let currentConvos = { ...convoObjects };
    let currentMeta = { ...activeMeta };

    // ── Create conversations on first message ──
    if (Object.keys(currentConvos).length === 0) {
      const agentConvoIds = {};
      for (const agent of agents) {
        const c = await base44.agents.createConversation({
          agent_name: agent.role_key,
          metadata: { title: currentMeta.title },
        });
        currentConvos[agent.role_key] = c;
        agentConvoIds[agent.role_key] = c.id;
        subscribeAgent(agent.role_key, c.id, primaryKey);
        expectedCountRef.current[agent.role_key] = 0;
      }

      const newMeta = {
        ...currentMeta,
        id: currentConvos[primaryKey].id,
        agentConvoIds,
      };
      currentMeta = newMeta;
      setActiveMeta(newMeta);
      setConvoObjects(currentConvos);

      const updated = [newMeta, ...convos.filter(c => c.id !== newMeta.id)];
      setConvos(updated);
      saveConvos(updated);
    }

    // ── Add user message to display immediately ──
    const userMsgId = `u-local-${Date.now()}`;
    setDisplayMsgs(prev => [...prev, { id: userMsgId, role: "user", content: text, agentKey: null }]);

    // ── Build actual message content ──
    let msgContent = text;
    if (isBoard && boardCtxRef.current) {
      msgContent = `${text}\n\n---\n*הקשר מהסיבוב הקודם:*\n${boardCtxRef.current}`;
    }

    // Reset board context for new round
    boardCtxRef.current = "";

    // ── Mark all agents as typing ──
    const typingSet = new Set(agents.map(a => a.role_key));
    setTypingKeys(typingSet);

    // ── Update expected assistant counts ──
    agents.forEach(a => {
      const convo = currentConvos[a.role_key];
      const currentCount = (convo?.messages || []).filter(m => m.role === "assistant").length;
      expectedCountRef.current[a.role_key] = currentCount;
    });

    // ── Send to all agents in parallel ──
    await Promise.all(agents.map(agent => {
      const convo = currentConvos[agent.role_key];
      if (!convo) return null;
      return base44.agents.addMessage(convo, { role: "user", content: msgContent });
    }));

    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group convos by date
  const todayStr = new Date().toDateString();
  const grouped = {
    today: convos.filter(c => new Date(c.createdAt).toDateString() === todayStr),
    older: convos.filter(c => new Date(c.createdAt).toDateString() !== todayStr),
  };

  const isBoard = activeMeta?.type === "board";
  const activeAgents = (activeMeta?.agentKeys || []).map(k => agentMap[k]).filter(Boolean);
  const primaryAgent = activeAgents.find(a => a.role_key === activeMeta?.primaryKey) || activeAgents[0];
  const canSend = !!input.trim() && !sending && !!activeMeta;

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen bg-background overflow-hidden">

      {/* ── Conversation History Sidebar ── */}
      <div className={`
        shrink-0 border-l border-border bg-card flex-col
        transition-all duration-200 overflow-hidden
        hidden md:flex
        ${sidebarOpen ? "w-64" : "w-0"}
      `}>
        <div className="p-3 border-b border-border">
          <button onClick={() => setShowNewChat(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            שיחה חדשה
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
          {convos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-10">אין שיחות עדיין</p>
          )}
          {grouped.today.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">היום</p>
              <div className="space-y-0.5">
                {grouped.today.map(c => (
                  <ConvoItem key={c.id} convo={c} active={activeMeta?.id === c.id}
                    onClick={() => openConvo(c)} onDelete={deleteConvo} />
                ))}
              </div>
            </div>
          )}
          {grouped.older.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">קודם</p>
              <div className="space-y-0.5">
                {grouped.older.map(c => (
                  <ConvoItem key={c.id} convo={c} active={activeMeta?.id === c.id}
                    onClick={() => openConvo(c)} onDelete={deleteConvo} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeMeta ? (
          /* ── Welcome screen ── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            {/* Sidebar toggle on welcome screen */}
            <button onClick={() => setSidebarOpen(o => !o)}
              className="absolute top-4 right-4 md:right-auto md:left-[calc(var(--sidebar-width,256px)+16px)] p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hidden md:flex">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-3xl">🏛️</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">BoardAI</h1>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              שוחח אחד-על-אחד עם כל סוכן, או כנס לישיבת דירקטוריון עם כל הצוות המנהל שלך
            </p>
            <button onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg">
              <Plus className="w-5 h-5" />
              התחל שיחה חדשה
            </button>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 shrink-0 bg-card/40">
              {/* Sidebar toggle */}
              <button onClick={() => setSidebarOpen(o => !o)}
                className="hidden md:flex p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground shrink-0">
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isBoard ? (
                /* Board meeting header */
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full shrink-0">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-primary">ישיבת דירקטוריון</span>
                  </div>
                  <div className="flex items-center gap-1 overflow-hidden">
                    {activeAgents.slice(0, 7).map(a => (
                      <AgentAvatar key={a.id} agent={a} size="sm" />
                    ))}
                    {activeAgents.length > 7 && (
                      <div className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        +{activeAgents.length - 7}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 1-on-1 header */
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {primaryAgent && <AgentAvatar agent={primaryAgent} size="sm" showStatus />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {primaryAgent?.title_he || primaryAgent?.title}
                    </p>
                    {primaryAgent?.title_he && primaryAgent.title !== primaryAgent.title_he && (
                      <p className="text-[10px] text-muted-foreground truncate">{primaryAgent.title}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">

                {/* Empty state per conversation */}
                {displayMsgs.length === 0 && typingKeys.size === 0 && (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    {isBoard ? (
                      <>
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {activeAgents.slice(0, 5).map(a => (
                            <div key={a.id} className="ring-2 ring-background rounded-full">
                              <AgentAvatar agent={a} size="md" />
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">ישיבת דירקטוריון</p>
                          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            {activeAgents.length} סוכנים ישיבו. בסיבובים הבאים — כל סוכן יקבל הקשר מתגובות עמיתיו
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {primaryAgent && <AgentAvatar agent={primaryAgent} size="xl" />}
                        <div>
                          <p className="text-xl font-bold text-foreground">
                            {primaryAgent?.title_he || primaryAgent?.title}
                          </p>
                          {primaryAgent?.responsibilities && (
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                              {primaryAgent.responsibilities}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Message list */}
                {displayMsgs.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} agentMap={agentMap} />
                ))}

                {/* Typing indicators */}
                {Array.from(typingKeys).map(key => (
                  <TypingBubble key={key} agent={agentMap[key]} />
                ))}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── Input ── */}
            <div className="px-4 pb-4 pt-2 shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden focus-within:border-primary/50 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isBoard
                        ? "שאל את הדירקטוריון..."
                        : `שאל את ${primaryAgent?.title_he || primaryAgent?.title || "הסוכן"}...`
                    }
                    disabled={sending}
                    dir="auto"
                    rows={1}
                    className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-[200px] text-right"
                  />
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                    <p className="text-[10px] text-muted-foreground">
                      Shift+Enter לשורה חדשה
                    </p>
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      className={`pointer-events-auto w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        canSend
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowUp className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New Chat Modal ── */}
      {showNewChat && (
        <NewChatModal
          agents={allAgents}
          onStart={startNewChat}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
}
