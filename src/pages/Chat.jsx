import { useEffect, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowUp, Download, Search, Plus, PanelLeftClose, PanelLeftOpen, X, AtSign } from "lucide-react";
import AgentAvatar from "../components/shared/AgentAvatar";
import ReactMarkdown from "react-markdown";
import { exportConversationToKnowledge } from "../lib/exportToKnowledge";

// ── Message Bubble ──────────────────────────────────────
function MessageBubble({ message, agents }) {
  const isUser = message.role === "board";
  const agent = agents.find(a => a.id === message.agent_id || a.role_key === message.agent_role_key);

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[72%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start mb-6">
      <div className="shrink-0 mt-0.5">
        {agent ? (
          <AgentAvatar agent={agent} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">🤖</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-1.5" style={{ color: agent?.color || "hsl(var(--muted-foreground))" }}>
          {agent?.title || message.agent_role_key}
          {agent?.title_he && agent.title_he !== agent.title && (
            <span className="font-normal opacity-50 ml-1">· {agent.title_he}</span>
          )}
        </p>
        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ── Agent Mention Popup ─────────────────────────────────
function AgentMentionPopup({ agents, activeAgentIds, query, onSelect, onClose }) {
  const filtered = agents.filter(a =>
    !activeAgentIds.includes(a.id) &&
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
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-right"
          >
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
function AgentsSidebar({ agents, selectedConvoId, conversations, onSelectAgent, onSelectConvo, isOpen, onToggle }) {
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
            {/* Search */}
            <div className="p-2 border-b border-sidebar-border">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="חפש סוכן..."
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full text-right"
                />
              </div>
            </div>

            {/* Agents list */}
            <div className="flex-1 overflow-y-auto py-1">
              <div className="px-2 space-y-0.5">
                {filtered.map(a => {
                  const convo = conversations.find(c => c.agent_id === a.id && c.type === "individual");
                  const isActive = convo?.id === selectedConvoId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelectAgent(a)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-sidebar-accent text-right ${isActive ? "bg-sidebar-accent" : ""}`}
                    >
                      <AgentAvatar agent={a} size="sm" showStatus />
                      <div className="flex-1 min-w-0 text-right">
                        <p className={`text-xs font-medium truncate ${isActive ? "text-foreground" : "text-sidebar-foreground"}`}>
                          {a.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.title_he}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Collapsed: show agent avatars */}
        {!isOpen && (
          <div className="flex flex-col items-center gap-1.5 py-2 overflow-y-auto flex-1">
            {agents.slice(0, 10).map(a => {
              const convo = conversations.find(c => c.agent_id === a.id && c.type === "individual");
              const isActive = convo?.id === selectedConvoId;
              return (
                <button
                  key={a.id}
                  onClick={() => onSelectAgent(a)}
                  title={a.title}
                  className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"}`}
                >
                  <AgentAvatar agent={a} size="sm" />
                </button>
              );
            })}
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
  const [conversations, setConversations] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]); // agents in current convo
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [core, setCore] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [mentionQuery, setMentionQuery] = useState(null); // null = closed, string = query
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const init = async () => {
    const [a, c, convos] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
      base44.entities.Conversation.filter({ type: "individual" }),
    ]);
    const active = a.filter(ag => ag.is_active);
    setAgents(active);
    setConversations(convos);
    if (c.length > 0) setCore(c[0]);
    if (preselectedAgentId) {
      const found = active.find(ag => ag.id === preselectedAgentId);
      if (found) handleSelectAgent(found, convos);
    }
  };

  const handleSelectAgent = async (agent, existingConvos) => {
    setSelectedAgent(agent);
    setActiveAgents([agent]);
    const convos = existingConvos || conversations;
    let convo = convos.find(c => c.agent_id === agent.id && c.type === "individual");
    if (!convo) {
      convo = await base44.entities.Conversation.create({
        type: "individual",
        agent_id: agent.id,
        participants: [agent.id],
        topic: `Chat with ${agent.title}`
      });
      setConversations(prev => [convo, ...prev]);
    }
    setConversation(convo);
    const msgs = await base44.entities.ChatMessage.filter({ conversation_id: convo.id });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setSidebarOpen(window.innerWidth >= 768);
  };

  const addAgentToConvo = (agent) => {
    if (!activeAgents.find(a => a.id === agent.id)) {
      setActiveAgents(prev => [...prev, agent]);
    }
    // Remove @mention from input
    setInput(prev => prev.replace(/@\S*$/, `@${agent.title_he || agent.title} `));
    setMentionQuery(null);
  };

  const removeAgent = (agentId) => {
    if (activeAgents.length <= 1) return;
    setActiveAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    // Detect @ or / trigger
    const match = val.match(/[@\/](\S*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput("");
    setMentionQuery(null);
    setSending(true);

    const userMsg = await base44.entities.ChatMessage.create({
      conversation_id: conversation.id,
      role: "board",
      content: text,
    });
    setMessages(prev => [...prev, userMsg]);

    const brainEntries = await base44.entities.BrainEntry.list("-created_date", 8);
    const knowledgeCtx = brainEntries.length > 0
      ? `\n\nKNOWLEDGE BASE:\n${brainEntries.map(e => `### ${e.title}\n${e.content?.slice(0, 400)}`).join("\n---\n")}`
      : "";
    const coreCtx = core ? `\nCOMPANY: ${core.company_name}\nMISSION: ${core.mission}\nVISION: ${core.vision}\n` : "";
    const recentMsgs = messages.slice(-8).map(m => {
      const a = agents.find(ag => ag.id === m.agent_id);
      return `${m.role === "board" ? "Board" : (a?.title || m.agent_role_key)}: ${m.content}`;
    }).join("\n");

    for (const agent of activeAgents) {
      setCurrentSpeaker(agent.title);
      const prompt = `You are ${agent.title} (${agent.title_he}).
Role: ${agent.responsibilities}
Department: ${agent.department}
Personality: ${agent.personality_traits}
Style: ${agent.communication_style}
Creativity: ${agent.creativity_level}/10 | Verbosity: ${agent.verbosity_level}/10
${coreCtx}${knowledgeCtx}

RECENT CONVERSATION:
${recentMsgs}

Board: ${text}

${activeAgents.length > 1 ? `Other participants: ${activeAgents.filter(a => a.id !== agent.id).map(a => a.title).join(", ")}. You may reference their perspective.` : ""}

Respond in the same language as the Board's message. Stay in character.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      const agentMsg = await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        role: "agent",
        content: response,
        agent_id: agent.id,
        agent_role_key: agent.role_key,
      });
      setMessages(prev => [...prev, agentMsg]);
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

  const canSend = input.trim() && !sending && conversation;

  return (
    <div className="flex h-[calc(100dvh-56px)] md:h-screen overflow-hidden bg-background">
      {/* Agents Sidebar */}
      <AgentsSidebar
        agents={agents}
        selectedConvoId={conversation?.id}
        conversations={conversations}
        onSelectAgent={handleSelectAgent}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {!selectedAgent ? (
          /* Welcome / empty state */
          <div className="flex flex-col flex-1 items-center justify-center px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">AI Executive Team</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-8">
              בחר סוכן מהסייד-בר כדי להתחיל שיחה. השתמש ב-@ כדי להוסיף סוכנים נוספים לדיון.
            </p>
            {/* Agent grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-lg">
              {agents.slice(0, 8).map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAgent(a)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all"
                >
                  <AgentAvatar agent={a} size="md" showStatus />
                  <p className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2">{a.title_he || a.title}</p>
                </button>
              ))}
            </div>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mt-6 text-xs text-primary hover:underline"
              >
                הצג את כל הסוכנים ←
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/30 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {activeAgents.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-secondary/60 rounded-full pl-1 pr-2 py-1">
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
                <button
                  onClick={() => exportConversationToKnowledge({
                    title: `שיחה עם ${selectedAgent.title}`,
                    messages,
                    type: "agent_chat",
                    agentName: selectedAgent.title
                  })}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                  title="ייצא לבסיס הידע"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AgentAvatar agent={selectedAgent} size="xl" />
                    <p className="text-lg font-bold text-foreground">{selectedAgent.title}</p>
                    <p className="text-sm text-muted-foreground max-w-xs">{selectedAgent.responsibilities}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      השתמש ב-@ להוספת סוכנים נוספים
                    </p>
                  </div>
                )}
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} agents={agents} />
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
                {/* Agent mention popup */}
                {mentionQuery !== null && (
                  <AgentMentionPopup
                    agents={agents}
                    activeAgentIds={activeAgents.map(a => a.id)}
                    query={mentionQuery}
                    onSelect={addAgentToConvo}
                    onClose={() => setMentionQuery(null)}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setInput(prev => prev + "@"); setMentionQuery(""); textareaRef.current?.focus(); }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                        title="הוסף סוכן"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
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
    </div>
  );
}