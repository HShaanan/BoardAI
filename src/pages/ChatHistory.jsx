import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Search, MessageSquare, Calendar, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import AgentAvatar from "../components/shared/AgentAvatar";
import ReactMarkdown from "react-markdown";
import PageHeader from "../components/shared/PageHeader";

export default function ChatHistory() {
  const [agents, setAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [conversations, setConversations] = useState([]);
  const [allMessages, setAllMessages] = useState([]); // [{ convoId, convoTitle, agentRoleKey, role, content, created_date }]
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Expanded conversations
  const [expandedConvos, setExpandedConvos] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [agentList, convoList] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Conversation.filter({ type: "individual" }),
    ]);

    const map = {};
    agentList.forEach(a => { map[a.role_key] = a; });
    setAgents(agentList);
    setAgentMap(map);
    setConversations(convoList);

    // Load ChatMessage records for all individual conversations
    const msgList = await base44.entities.ChatMessage.list("-created_date", 500);
    setAllMessages(msgList);
    setLoading(false);
  };

  // Group messages by conversation_id
  const grouped = useMemo(() => {
    const groups = {};
    allMessages.forEach(m => {
      if (!groups[m.conversation_id]) groups[m.conversation_id] = [];
      groups[m.conversation_id].push(m);
    });
    // Sort each group by date ascending
    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    });
    return groups;
  }, [allMessages]);

  // Build display threads with filters
  const filteredThreads = useMemo(() => {
    return conversations
      .map(convo => {
        const msgs = grouped[convo.id] || [];
        const agentRoleKey = msgs.find(m => m.role === "agent")?.agent_role_key || convo.agent_id;
        const agent = agentMap[agentRoleKey];

        // Filter by agent
        if (filterAgent !== "all" && agentRoleKey !== filterAgent) return null;

        // Filter messages by keyword & date
        const filtered = msgs.filter(m => {
          if (search && !m.content?.toLowerCase().includes(search.toLowerCase())) return false;
          if (filterDateFrom && new Date(m.created_date) < new Date(filterDateFrom)) return false;
          if (filterDateTo && new Date(m.created_date) > new Date(filterDateTo + "T23:59:59")) return false;
          return true;
        });

        if (filtered.length === 0 && (search || filterDateFrom || filterDateTo)) return null;

        return { convo, msgs, filtered, agent, agentRoleKey };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aLast = a.msgs[a.msgs.length - 1]?.created_date || a.convo.created_date;
        const bLast = b.msgs[b.msgs.length - 1]?.created_date || b.convo.created_date;
        return new Date(bLast) - new Date(aLast);
      });
  }, [conversations, grouped, agentMap, search, filterAgent, filterDateFrom, filterDateTo]);

  const toggleConvo = (id) => setExpandedConvos(prev => ({ ...prev, [id]: !prev[id] }));

  const uniqueAgentsInMsgs = useMemo(() => {
    const keys = new Set(allMessages.map(m => m.agent_role_key).filter(Boolean));
    return [...keys].map(k => agentMap[k]).filter(Boolean);
  }, [allMessages, agentMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="היסטוריית שיחות"
        subtitle={`${conversations.length} שרשורים · ${allMessages.length} הודעות`}
      />

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי מילות מפתח בתוכן..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full text-right"
            dir="auto"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Agent filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">סוכן:</label>
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              dir="rtl"
            >
              <option value="all">כל הסוכנים</option>
              {uniqueAgentsInMsgs.map(a => (
                <option key={a.role_key} value={a.role_key}>{a.title_he || a.title}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">מתאריך:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">עד תאריך:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {(search || filterAgent !== "all" || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setSearch(""); setFilterAgent("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="text-xs text-primary hover:underline"
            >
              נקה סינון
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredThreads.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">לא נמצאו שיחות</p>
          <p className="text-sm text-muted-foreground mt-1">נסה לשנות את פרמטרי החיפוש</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map(({ convo, msgs, filtered, agent }) => {
            const isExpanded = expandedConvos[convo.id];
            const displayMsgs = search || filterDateFrom || filterDateTo ? filtered : msgs;
            const lastMsg = msgs[msgs.length - 1];
            const lastDate = lastMsg?.created_date ? new Date(lastMsg.created_date) : null;

            return (
              <div key={convo.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Thread header */}
                <button
                  onClick={() => toggleConvo(convo.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-right"
                >
                  {agent ? (
                    <AgentAvatar agent={agent} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">🤖</div>
                  )}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {agent?.title_he || agent?.title || convo.topic || "שיחה"}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 line-clamp-1">
                        {lastMsg.content?.slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{displayMsgs.length} הודעות</p>
                      {lastDate && !isNaN(lastDate.getTime()) && (
                        <p className="text-[10px] text-muted-foreground/60">
                          {lastDate.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Messages */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-4 max-h-[500px] overflow-y-auto">
                    {displayMsgs.map((m, i) => {
                      const isBoard = m.role === "board";
                      const msgAgent = agentMap[m.agent_role_key];
                      const msgDate = m.created_date ? new Date(m.created_date) : null;
                      return (
                        <div key={m.id || i} className={`flex gap-3 ${isBoard ? "flex-row-reverse" : ""}`}>
                          {isBoard ? (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0 mt-0.5">👤</div>
                          ) : msgAgent ? (
                            <AgentAvatar agent={msgAgent} size="sm" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0 mt-0.5">🤖</div>
                          )}
                          <div className={`flex-1 min-w-0 ${isBoard ? "items-end" : ""}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isBoard ? "flex-row-reverse" : ""}`}>
                              <span className="text-xs font-semibold" style={{ color: msgAgent?.color || "hsl(var(--muted-foreground))" }}>
                                {isBoard ? "Board" : (msgAgent?.title_he || msgAgent?.title || m.agent_role_key)}
                              </span>
                              {msgDate && !isNaN(msgDate.getTime()) && (
                                <span className="text-[10px] text-muted-foreground/60">
                                  {msgDate.toLocaleString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm text-foreground/85 leading-relaxed prose prose-sm prose-invert max-w-none ${isBoard ? "bg-primary/10 rounded-xl px-3 py-2 text-right" : ""}`}>
                              {isBoard
                                ? <p className="m-0">{m.content}</p>
                                : <ReactMarkdown>{m.content}</ReactMarkdown>
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}