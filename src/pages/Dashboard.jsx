import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowUp, Loader2, Bot, Plus, MessageSquare, Trash2, X, AtSign, Check, Sparkles, Users, ListTodo } from "lucide-react";
import TaskPanel from "../components/chat/TaskPanel";

import ReactMarkdown from "react-markdown";
import AgentAvatar from "../components/shared/AgentAvatar";

const BOSS_AGENT = "boss_ai";
const STORAGE_KEY = "boss_ai_conversations";

function loadStoredConvos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveStoredConvos(convos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

// Agent mention popup with AI recommendations
function AgentMentionPopup({ agents, activeAgentKeys, query, onToggle, onClose, recommendations, loadingRecs, onAddAll }) {
  const filtered = agents.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    (a.title_he || "").includes(query)
  );

  const recommended = agents.filter(a => recommendations.includes(a.role_key));
  const others = filtered.filter(a => !recommendations.includes(a.role_key));

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">הוסף סוכנים לשיחה</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>

      {/* Recommendations section */}
      {(loadingRecs || recommended.length > 0) && (
        <div className="border-b border-border">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">מומלצים למשימה</span>
            </div>
            {recommended.length > 1 && (
              <button
                onClick={() => onAddAll(recommended)}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <Users className="w-3 h-3" />
                הוסף הכל
              </button>
            )}
          </div>
          {loadingRecs ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Boss AI מנתח את השיחה...
            </div>
          ) : (
            recommended.map(a => {
              const isActive = activeAgentKeys.includes(a.role_key);
              return (
                <button key={a.id} onClick={() => onToggle(a)}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50/30 transition-colors text-right ${isActive ? "opacity-50" : ""}`}>
                  <AgentAvatar agent={a} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title_he || a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.department}</p>
                  </div>
                  {isActive ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* All agents */}
      {query === "" && <p className="text-[10px] font-semibold text-muted-foreground uppercase px-3 pt-2 pb-1">כל הסוכנים</p>}
      <div className="max-h-52 overflow-y-auto">
        {(query === "" ? others : filtered).map(a => {
          const isActive = activeAgentKeys.includes(a.role_key);
          return (
            <button key={a.id} onClick={() => onToggle(a)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-right ${isActive ? "bg-secondary/60" : ""}`}>
              <AgentAvatar agent={a} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title_he || a.title}</p>
                <p className="text-xs text-muted-foreground truncate">{a.department}</p>
              </div>
              {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [storedConvos, setStoredConvos] = useState(() => loadStoredConvos());
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [convoObjects, setConvoObjects] = useState({}); // agentKey → convo object
  const [messages, setMessages] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]); // extra agents besides boss_ai
  const [allAgents, setAllAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({}); // role_key → agent
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [tasks, setTasks] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const unsubsRef = useRef({});

  const refreshTasks = () => {
    base44.entities.Task.list("-created_date", 50).then(setTasks);
  };

  useEffect(() => {
    refreshTasks();
    base44.entities.Agent.list().then(a => {
      const active = a.filter(ag => ag.is_active);
      setAllAgents(active);
      const map = {};
      active.forEach(ag => { map[ag.role_key] = ag; });
      setAgentMap(map);
    });
    return () => { Object.values(unsubsRef.current).forEach(fn => fn()); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const subscribeAgent = (agentKey, convoId) => {
    if (unsubsRef.current[agentKey]) unsubsRef.current[agentKey]();
    const unsub = base44.agents.subscribeToConversation(convoId, (data) => {
      // Merge all messages from all active convos
      setConvoObjects(prev => {
        const updated = { ...prev, [agentKey]: data };
        rebuildMessages(updated);
        return updated;
      });
    });
    unsubsRef.current[agentKey] = unsub;
  };

  const rebuildMessages = (convosMap) => {
    // Use boss convo as the reference for turn structure
    const bossConvo = convosMap[BOSS_AGENT];
    if (!bossConvo?.messages?.length) {
      setMessages([]);
      return;
    }

    const result = [];
    const bossMessages = bossConvo.messages;

    // Iterate through boss convo messages in order
    // Odd indices = user, even indices = assistant (or vice versa)
    // Boss messages alternate: user, assistant, user, assistant...
    for (let i = 0; i < bossMessages.length; i++) {
      const m = bossMessages[i];
      if (m.role === 'user') {
        // Add user message once
        result.push({
          id: `user-turn-${i}`,
          role: 'user',
          content: m.content,
          agentKey: null,
        });
      } else if (m.role === 'assistant') {
        // Add boss AI response
        result.push({
          id: `${BOSS_AGENT}-${i}`,
          role: 'assistant',
          content: m.content,
          agentKey: BOSS_AGENT,
        });
        // Add other agents' responses at the same turn
        Object.entries(convosMap).forEach(([key, convo]) => {
          if (key === BOSS_AGENT || !convo?.messages) return;
          const agentMsg = convo.messages[i];
          if (agentMsg?.role === 'assistant') {
            result.push({
              id: `${key}-${i}`,
              role: 'assistant',
              content: agentMsg.content,
              agentKey: key,
            });
          }
        });
      }
    }

    setMessages(result);
  };

  const createNewChat = () => {
    Object.values(unsubsRef.current).forEach(fn => fn());
    unsubsRef.current = {};
    setActiveConvoId(null);
    setConvoObjects({});
    setMessages([]);
    setActiveAgents([]);
    setInput("");
  };

  const openConversation = async (meta) => {
    setLoadingConvo(true);
    createNewChat();
    setActiveConvoId(meta.id);
    const convo = await base44.agents.getConversation(meta.id);
    const newConvos = { [BOSS_AGENT]: convo };

    // Also load any extra agent convos stored in meta
    if (meta.agentConvoIds) {
      for (const [key, id] of Object.entries(meta.agentConvoIds)) {
        const c = await base44.agents.getConversation(id);
        newConvos[key] = c;
        const agent = allAgents.find(a => a.role_key === key);
        if (agent) setActiveAgents(prev => [...prev.filter(a => a.role_key !== key), agent]);
      }
    }

    setConvoObjects(newConvos);
    rebuildMessages(newConvos);
    Object.entries(newConvos).forEach(([key, c]) => subscribeAgent(key, c.id));
    setLoadingConvo(false);
  };

  const deleteConvo = (id, e) => {
    e.stopPropagation();
    const updated = storedConvos.filter(c => c.id !== id);
    setStoredConvos(updated);
    saveStoredConvos(updated);
    if (activeConvoId === id) createNewChat();
  };

  const toggleAgent = async (agent) => {
    const key = agent.role_key;
    if (activeAgents.find(a => a.role_key === key)) {
      // Remove agent
      setActiveAgents(prev => prev.filter(a => a.role_key !== key));
      if (unsubsRef.current[key]) { unsubsRef.current[key](); delete unsubsRef.current[key]; }
      setConvoObjects(prev => {
        const updated = { ...prev };
        delete updated[key];
        rebuildMessages(updated);
        return updated;
      });
    } else {
      // Add agent — create convo immediately if we're in an active chat
      const newActiveAgents = [...activeAgents, agent];
      setActiveAgents(newActiveAgents);

      if (convoObjects[BOSS_AGENT]) {
        // We have an active boss convo — create agent convo now
        const convo = await base44.agents.createConversation({
          agent_name: key,
          metadata: { title: `שיחה עם ${agent.title_he || agent.title}` }
        });
        const updated = { ...convoObjects, [key]: convo };
        setConvoObjects(updated);
        subscribeAgent(key, convo.id);
        rebuildMessages(updated);
      }
    }
    setMentionQuery(null);
    setInput(prev => prev.replace(/[@]\S*$/, ''));
    textareaRef.current?.focus();
  };

  const fetchRecommendations = async () => {
    if (messages.length === 0 && !input.trim()) return;
    setLoadingRecs(true);
    setRecommendations([]);
    const context = messages.slice(-6).map(m => `${m.role === 'user' ? 'משתמש' : 'סוכן'}: ${m.content}`).join('\n') || input;
    const agentsList = allAgents.map(a => `${a.role_key}: ${a.title_he || a.title} (${a.department})`).join('\n');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `בהתבסס על השיחה הבאה, בחר 3-4 סוכנים הרלוונטיים ביותר מהרשימה.\n\nשיחה:\n${context}\n\nרשימת סוכנים:\n${agentsList}\n\nהחזר JSON עם מפתח role_keys שהוא מערך של role_key strings בלבד.`,
      response_json_schema: { type: 'object', properties: { role_keys: { type: 'array', items: { type: 'string' } } } }
    });
    setRecommendations(res?.role_keys || []);
    setLoadingRecs(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const match = val.match(/@(\S*)$/);
    if (match) {
      setMentionQuery(match[1]);
      if (mentionQuery === null) fetchRecommendations(); // first open
    } else {
      setMentionQuery(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMentionQuery(null);
    setLoading(true);

    let currentConvoId = activeConvoId;
    let currentConvos = { ...convoObjects };

    if (!currentConvoId) {
      // Create boss_ai convo
      const bossConvo = await base44.agents.createConversation({
        agent_name: BOSS_AGENT,
        metadata: { title: text.slice(0, 50) }
      });
      currentConvoId = bossConvo.id;
      currentConvos[BOSS_AGENT] = bossConvo;
      subscribeAgent(BOSS_AGENT, bossConvo.id);
      setActiveConvoId(currentConvoId);

      // Create convos for active agents too
      const agentConvoIds = {};
      for (const agent of activeAgents) {
        const c = await base44.agents.createConversation({
          agent_name: agent.role_key,
          metadata: { title: text.slice(0, 50) }
        });
        currentConvos[agent.role_key] = c;
        agentConvoIds[agent.role_key] = c.id;
        subscribeAgent(agent.role_key, c.id);
      }

      const meta = { id: currentConvoId, title: text.slice(0, 50), createdAt: new Date().toISOString(), agentConvoIds };
      const updated = [meta, ...storedConvos];
      setStoredConvos(updated);
      saveStoredConvos(updated);
    }

    setConvoObjects(currentConvos);

    // Send to boss_ai + all active agents
    const allConvoKeys = [BOSS_AGENT, ...activeAgents.map(a => a.role_key)];
    for (const key of allConvoKeys) {
      const convo = currentConvos[key];
      if (convo) await base44.agents.addMessage(convo, { role: 'user', content: text });
    }

    setLoading(false);
    // Auto-refresh tasks after AI responds
    setTimeout(refreshTasks, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionQuery !== null) return;
      handleSend();
    }
    if (e.key === "Escape") setMentionQuery(null);
  };

  const handleAddAllRecommended = async (agents) => {
    for (const agent of agents) {
      if (!activeAgents.find(a => a.role_key === agent.role_key)) {
        await toggleAgent(agent);
      }
    }
    setMentionQuery(null);
    setInput(prev => prev.replace(/[@]\S*$/, ''));
  };

  const hasBossConvo = !!convoObjects[BOSS_AGENT];
  const showMessages = messages.length > 0 || hasBossConvo;

  const groupedConvos = {
    today: storedConvos.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()),
    older: storedConvos.filter(c => new Date(c.createdAt).toDateString() !== new Date().toDateString()),
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-l border-border bg-card flex-col hidden md:flex">
        <div className="p-3 border-b border-border">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            שיחה חדשה
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {groupedConvos.today.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">היום</p>
              <div className="space-y-0.5">
                {groupedConvos.today.map(c => (
                  <button key={c.id} onClick={() => openConversation(c)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${activeConvoId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2 className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" onClick={(e) => deleteConvo(c.id, e)} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {groupedConvos.older.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">קודם</p>
              <div className="space-y-0.5">
                {groupedConvos.older.map(c => (
                  <button key={c.id} onClick={() => openConversation(c)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${activeConvoId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2 className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" onClick={(e) => deleteConvo(c.id, e)} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {storedConvos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">אין שיחות עדיין</p>
          )}
        </div>
      </div>


      {/* Task Panel */}
      {showTaskPanel && (
        <TaskPanel
          tasks={tasks}
          agents={allAgents}
          onRefresh={refreshTasks}
          onClose={() => setShowTaskPanel(false)}
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {loadingConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !showMessages ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="flex items-center gap-2 absolute top-3 left-3">
              <button onClick={() => { setShowTaskPanel(p => !p); refreshTasks(); }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showTaskPanel ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <ListTodo className="w-3.5 h-3.5" />
                משימות
              </button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Boss AI</h1>
            <p className="text-muted-foreground text-sm mb-8">מנהל הסוכנים שלך — שאל, הנחה, נתח. לחץ @ להוספת סוכנים</p>
            <div className="w-full max-w-2xl">
              {activeAgents.length > 0 && (
                <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
                  {activeAgents.map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-2 py-1">
                      <AgentAvatar agent={a} size="sm" />
                      <span className="text-xs font-medium">{a.title_he || a.title}</span>
                      <button onClick={() => toggleAgent(a)} className="text-muted-foreground hover:text-foreground ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
                {mentionQuery !== null && (
                  <AgentMentionPopup
                    agents={allAgents}
                    activeAgentKeys={activeAgents.map(a => a.role_key)}
                    query={mentionQuery}
                    onToggle={toggleAgent}
                    onClose={() => setMentionQuery(null)}
                    recommendations={recommendations}
                    loadingRecs={loadingRecs}
                    onAddAll={handleAddAllRecommended}
                  />
                )}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="במה אוכל לעזור? (@ להוספת סוכן)"
                    rows={3}
                    className="w-full px-5 pt-4 pb-2 text-sm bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
                    style={{ direction: "rtl" }}
                  />
                  <div className="flex items-center justify-between px-4 pb-3">
                    <button
                      onClick={() => { setInput(prev => prev + "@"); setMentionQuery(""); textareaRef.current?.focus(); }}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      title="הוסף סוכן"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-75 transition-opacity"
                    >
                      {loading ? <Loader2 className="w-4 h-4 text-background animate-spin" /> : <ArrowUp className="w-4 h-4 text-background" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-2 flex-wrap">
                {activeAgents.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2 py-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">Boss AI</span>
                    </div>
                    {activeAgents.map(a => (
                      <div key={a.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-2 py-1">
                        <span className="text-xs font-medium">{a.title_he || a.title}</span>
                        <button onClick={() => toggleAgent(a)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <button onClick={() => { setShowTaskPanel(p => !p); refreshTasks(); }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showTaskPanel ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <ListTodo className="w-3.5 h-3.5" />
                משימות {tasks.filter(t => t.status !== "done").length > 0 && `(${tasks.filter(t => t.status !== "done").length})`}
              </button>
            </div>


            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {messages.map((msg, i) => {
                  const agent = msg.agentKey ? agentMap[msg.agentKey] : null;
                  const isBoss = msg.agentKey === BOSS_AGENT;
                  return (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-3"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1">
                          {agent && !isBoss ? (
                            <AgentAvatar agent={agent} size="sm" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {msg.role === "assistant" && agent && !isBoss && (
                          <p className="text-xs font-semibold mb-1 text-muted-foreground">{agent.title_he || agent.title}</p>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user" ? "bg-secondary text-foreground rounded-bl-sm ml-auto" : "text-foreground"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none text-foreground">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      חושב...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-4">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  {mentionQuery !== null && (
                    <AgentMentionPopup
                      agents={allAgents}
                      activeAgentKeys={activeAgents.map(a => a.role_key)}
                      query={mentionQuery}
                      onToggle={toggleAgent}
                      onClose={() => setMentionQuery(null)}
                      recommendations={recommendations}
                      loadingRecs={loadingRecs}
                      onAddAll={handleAddAllRecommended}
                    />
                    )}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="המשך את השיחה... (@ להוספת סוכן)"
                      rows={1}
                      className="w-full px-5 pt-3.5 pb-2 text-sm bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground max-h-40"
                      style={{ direction: "rtl" }}
                    />
                    <div className="flex items-center justify-between px-4 pb-3">
                      <button
                        onClick={() => { setInput(prev => prev + "@"); setMentionQuery(""); textareaRef.current?.focus(); }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                        title="הוסף סוכן"
                      >
                        <AtSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-75 transition-opacity"
                      >
                        {loading ? <Loader2 className="w-4 h-4 text-background animate-spin" /> : <ArrowUp className="w-4 h-4 text-background" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">Enter לשליחה · @ להוספת סוכן · Shift+Enter לשורה חדשה</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}