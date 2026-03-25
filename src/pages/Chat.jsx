import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowUp, Search, PanelLeftClose, PanelLeftOpen, X, AtSign, Download } from "lucide-react";
import AgentAvatar from "../components/shared/AgentAvatar";
import ReactMarkdown from "react-markdown";
import { exportConversationToKnowledge } from "../lib/exportToKnowledge";
import FeedbackButtons from "../components/shared/FeedbackButtons";

// ── Message Bubble ──────────────────────────────────────
function MessageBubble({ message, agentMap }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[72%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // assistant message — find agent by role_key stored in message metadata
  const agent = message.agent_role_key ? agentMap[message.agent_role_key] : null;

  return (
    <div className="flex gap-3 items-start mb-6 group">
      <div className="shrink-0 mt-0.5">
        {agent ? (
          <AgentAvatar agent={agent} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">🤖</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {agent && (
          <p className="text-xs font-semibold mb-1.5" style={{ color: agent?.color || "hsl(var(--muted-foreground))" }}>
            {agent.title}
            {agent.title_he && agent.title_he !== agent.title && (
              <span className="font-normal opacity-50 ml-1">· {agent.title_he}</span>
            )}
          </p>
        )}
        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <FeedbackButtons
          message={message}
          agentRoleKey={message.agent_role_key}
          agentTitle={agent?.title}
        />
      </div>
    </div>
  );
}

// ── Agent Mention Popup ─────────────────────────────────
function AgentMentionPopup({ agents, activeAgentRoleKeys, query, onSelect }) {
  const filtered = agents.filter(a =>
    !activeAgentRoleKeys.includes(a.role_key) &&
    (a.title.toLowerCase().includes(query.toLowerCase()) ||
     (a.title_he || "").includes(query))
  ).slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">הוסף סוכן לשיחה</p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {filtered.map(a => (
          <button key={a.id} onClick={() => onSelect(a)}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-right">
            <AgentAvatar agent={a} size="sm" />
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground truncate">{a.title_he}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Agents Sidebar ──────────────────────────────────────
function AgentsSidebar({ agents, selectedRoleKey, onSelectAgent, isOpen, onToggle }) {
  const [search, setSearch] = useState("");
  const filtered = agents.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.title_he || "").includes(search)
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={onToggle} />
      )}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 md:z-auto
        flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-200 shrink-0
        ${isOpen ? "w-64" : "w-0 md:w-14 overflow-hidden"}
      `}>
        {/* Header */}
        <div className={`flex items-center border-b border-sidebar-border px-2 py-3 ${isOpen ? "justify-between" : "justify-center"}`}>
          {isOpen && <span className="text-xs font-semibold text-sidebar-foreground px-2">Agents</span>}
          <button onClick={onToggle} className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground">
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && (
          <>
            <div className="p-2 border-b border-sidebar-border">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חפש סוכן..."
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full text-right" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <div className="px-2 space-y-0.5">
                {filtered.map(a => {
                  const isActive = selectedRoleKey === a.role_key;
                  return (
                    <button key={a.id} onClick={() => onSelectAgent(a)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-sidebar-accent text-right ${isActive ? "bg-sidebar-accent" : ""}`}>
                      <AgentAvatar agent={a} size="sm" showStatus />
                      <div className="flex-1 min-w-0 text-right">
                        <p className={`text-xs font-medium truncate ${isActive ? "text-foreground" : "text-sidebar-foreground"}`}>{a.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.title_he}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isOpen && (
          <div className="flex flex-col items-center gap-1.5 py-2 overflow-y-auto flex-1">
            {agents.slice(0, 12).map(a => (
              <button key={a.id} onClick={() => onSelectAgent(a)} title={a.title}
                className={`p-1.5 rounded-xl transition-colors ${selectedRoleKey === a.role_key ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"}`}>
                <AgentAvatar agent={a} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ───────────────────────────────────────────
export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedAgentId = urlParams.get("agent");

  const [agents, setAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({}); // role_key → agent
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeAgents, setActiveAgents] = useState([]); // agents in current thread
  // Map of role_key → base44 agent conversation object
  const [agentConvos, setAgentConvos] = useState({});
  // Merged messages for display: [{ id, role, content, agent_role_key, ts }]
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [mentionQuery, setMentionQuery] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const unsubscribesRef = useRef({});

  useEffect(() => { init(); return () => unsubscribeAll(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const unsubscribeAll = () => {
    Object.values(unsubscribesRef.current).forEach(fn => fn());
    unsubscribesRef.current = {};
  };

  const init = async () => {
    const a = await base44.entities.Agent.list();
    const active = a.filter(ag => ag.is_active);
    setAgents(active);
    const map = {};
    active.forEach(ag => { map[ag.role_key] = ag; });
    setAgentMap(map);

    if (preselectedAgentId) {
      const found = active.find(ag => ag.id === preselectedAgentId);
      if (found) openAgentChat(found, map);
    }
  };

  // Merge messages from multiple agent conversations, sorted by time
  const mergeMessages = (convosMap) => {
    const all = [];
    Object.entries(convosMap).forEach(([roleKey, convo]) => {
      if (!convo?.messages) return;
      convo.messages.forEach(m => {
        all.push({
          id: `${roleKey}-${m.id || Math.random()}`,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          agent_role_key: m.role === "assistant" ? roleKey : null,
          ts: m.created_date || m.id,
        });
      });
    });
    // Deduplicate user messages (same content sent to multiple agents)
    const seen = new Set();
    const deduped = all.filter(m => {
      if (m.role !== "user") return true;
      const key = m.content;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    deduped.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    setMessages(deduped);
  };

  const subscribeAgent = (roleKey, convoId) => {
    if (unsubscribesRef.current[roleKey]) {
      unsubscribesRef.current[roleKey]();
    }
    const unsub = base44.agents.subscribeToConversation(convoId, (data) => {
      setAgentConvos(prev => {
        const updated = { ...prev, [roleKey]: data };
        mergeMessages(updated);
        return updated;
      });
    });
    unsubscribesRef.current[roleKey] = unsub;
  };

  const openAgentChat = async (agent, mapOverride) => {
    const map = mapOverride || agentMap;
    setSelectedAgent(agent);
    setActiveAgents([agent]);
    setMessages([]);
    setAgentConvos({});
    unsubscribeAll();

    // Create or reuse a conversation with the real agent
    const convo = await base44.agents.createConversation({
      agent_name: agent.role_key,
      metadata: { title: `Chat with ${agent.title}` }
    });

    const newConvos = { [agent.role_key]: convo };
    setAgentConvos(newConvos);
    mergeMessages(newConvos);
    subscribeAgent(agent.role_key, convo.id);
    setSidebarOpen(window.innerWidth >= 768);
  };

  const addAgentToConvo = async (agent) => {
    if (activeAgents.find(a => a.id === agent.id)) return;
    const newActive = [...activeAgents, agent];
    setActiveAgents(newActive);

    // Create a new conversation for this agent too
    const convo = await base44.agents.createConversation({
      agent_name: agent.role_key,
      metadata: { title: `Chat with ${agent.title}` }
    });

    setAgentConvos(prev => {
      const updated = { ...prev, [agent.role_key]: convo };
      mergeMessages(updated);
      return updated;
    });
    subscribeAgent(agent.role_key, convo.id);

    setInput(prev => prev.replace(/[@\/]\S*$/, `@${agent.title_he || agent.title} `));
    setMentionQuery(null);
  };

  const removeAgent = (agentId) => {
    if (activeAgents.length <= 1) return;
    const agent = activeAgents.find(a => a.id === agentId);
    if (!agent) return;
    setActiveAgents(prev => prev.filter(a => a.id !== agentId));
    if (unsubscribesRef.current[agent.role_key]) {
      unsubscribesRef.current[agent.role_key]();
      delete unsubscribesRef.current[agent.role_key];
    }
    setAgentConvos(prev => {
      const updated = { ...prev };
      delete updated[agent.role_key];
      mergeMessages(updated);
      return updated;
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const match = val.match(/[@\/](\S*)$/);
    if (match) setMentionQuery(match[1]);
    else setMentionQuery(null);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || activeAgents.length === 0) return;
    const text = input.trim();
    setInput("");
    setMentionQuery(null);
    setSending(true);

    // Send to each active agent's conversation
    for (const agent of activeAgents) {
      const convo = agentConvos[agent.role_key];
      if (!convo) continue;
      setCurrentSpeaker(agent.title);
      await base44.agents.addMessage(convo, { role: "user", content: text });
    }

    setCurrentSpeaker(null);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionQuery !== null) return;
      handleSend();
    }
    if (e.key === "Escape") setMentionQuery(null);
  };

  const handleExport = () => {
    const exportMsgs = messages.map(m => ({
      role: m.role === "user" ? "board" : "agent",
      content: m.content,
      agent_id: m.agent_role_key ? agentMap[m.agent_role_key]?.id : null,
      agent_role_key: m.agent_role_key,
      created_date: m.ts,
    }));
    exportConversationToKnowledge({
      title: `שיחה עם ${activeAgents.map(a => a.title).join(", ")}`,
      messages: exportMsgs,
      type: "agent_chat",
      agentName: selectedAgent?.title
    });
  };

  const canSend = input.trim() && !sending && activeAgents.length > 0;

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden bg-background">
      <AgentsSidebar
        agents={agents}
        selectedRoleKey={selectedAgent?.role_key}
        onSelectAgent={openAgentChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {!selectedAgent ? (
          <div className="flex flex-col flex-1 items-center justify-center px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">AI Executive Team</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-8">
              בחר סוכן מהסייד-בר כדי להתחיל שיחה. כל סוכן עובד עם הכלים, הזיכרון והפרומפט האמיתי שלו.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-lg">
              {agents.slice(0, 8).map(a => (
                <button key={a.id} onClick={() => openAgentChat(a)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all">
                  <AgentAvatar agent={a} size="md" showStatus />
                  <p className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2">{a.title_he || a.title}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/30 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
                {activeAgents.map(a => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-secondary/60 rounded-full pl-1 pr-2 py-1 shrink-0">
                    <AgentAvatar agent={a} size="sm" />
                    <span className="text-xs font-medium text-foreground">{a.title_he || a.title}</span>
                    {activeAgents.length > 1 && (
                      <button onClick={() => removeAgent(a.id)} className="text-muted-foreground hover:text-foreground ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {messages.length > 2 && (
                <button onClick={handleExport}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground shrink-0" title="ייצא לבסיס הידע">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">
                {messages.length === 0 && !sending && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AgentAvatar agent={selectedAgent} size="xl" />
                    <p className="text-lg font-bold text-foreground">{selectedAgent.title}</p>
                    <p className="text-sm text-muted-foreground max-w-xs">{selectedAgent.responsibilities}</p>
                    <p className="text-xs text-muted-foreground/50 mt-2">השתמש ב-@ להוספת סוכנים נוספים</p>
                  </div>
                )}
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} agentMap={agentMap} />
                ))}
                {sending && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{currentSpeaker || "..."} מעבד...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 max-w-2xl mx-auto w-full">
              <div className="relative">
                {mentionQuery !== null && (
                  <AgentMentionPopup
                    agents={agents}
                    activeAgentRoleKeys={activeAgents.map(a => a.role_key)}
                    query={mentionQuery}
                    onSelect={addAgentToConvo}
                  />
                )}
                <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="כתוב הודעה... (@סוכן להוספה)"
                    disabled={sending}
                    dir="auto"
                    rows={1}
                    className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-[180px] text-right"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <button
                      onClick={() => { setInput(prev => prev + "@"); setMentionQuery(""); textareaRef.current?.focus(); }}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      title="הוסף סוכן">
                      <AtSign className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleSend} disabled={!canSend}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"
                      }`}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}