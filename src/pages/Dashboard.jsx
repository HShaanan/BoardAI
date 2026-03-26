import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowUp, Loader2, Bot, Plus, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

function buildSystemPrompt(company, agents) {
  const companyInfo = company
    ? `אתה עוזר AI חכם של החברה "${company.company_name}". תחום: ${company.industry || "לא צוין"}. מיסיון: ${company.mission || "לא צוין"}. יעדים: ${company.business_goals || "לא צוין"}.`
    : 'אתה עוזר AI חכם של מנכ"ל.';
  const agentList = agents.length
    ? `\n\nהסוכנים הזמינים: ${agents.map(a => a.title_he || a.title).join(", ")}.`
    : "";
  return companyInfo + agentList + "\n\nענה בעברית, בצורה ממוקדת ומקצועית.";
}

const STORAGE_KEY = "boss_ai_chats";

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveChats(chats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export default function Dashboard() {
  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [agents, setAgents] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  useEffect(() => {
    Promise.all([
      base44.entities.CompanyCore.list("-created_date", 1),
      base44.entities.Agent.list(),
    ]).then(([c, a]) => {
      if (c[0]) setCompany(c[0]);
      setAgents(a);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const createNewChat = () => {
    setActiveChatId(null);
    setInput("");
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    saveChats(updated);
    if (activeChatId === id) setActiveChatId(null);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    let chatId = activeChatId;
    let currentChats = chats;

    if (!chatId) {
      const newChat = {
        id: Date.now().toString(),
        title: text.slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      currentChats = [newChat, ...chats];
      setChats(currentChats);
      saveChats(currentChats);
      chatId = newChat.id;
      setActiveChatId(chatId);
    }

    const chat = currentChats.find(c => c.id === chatId);
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...chat.messages, userMsg];

    const updatedChats = currentChats.map(c =>
      c.id === chatId ? { ...c, messages: updatedMessages } : c
    );
    setChats(updatedChats);
    saveChats(updatedChats);

    const history = updatedMessages.map(m => `${m.role === "user" ? "משתמש" : "עוזר"}: ${m.content}`).join("\n");
    const prompt = `${buildSystemPrompt(company, agents)}\n\n--- היסטוריית שיחה ---\n${history}\n\nענה רק על ההודעה האחרונה.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });

    const assistantMsg = { role: "assistant", content: result };
    const finalMessages = [...updatedMessages, assistantMsg];
    const finalChats = updatedChats.map(c =>
      c.id === chatId ? { ...c, messages: finalMessages } : c
    );
    setChats(finalChats);
    saveChats(finalChats);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedChats = {
    today: chats.filter(c => {
      const d = new Date(c.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }),
    older: chats.filter(c => {
      const d = new Date(c.createdAt);
      const now = new Date();
      return d.toDateString() !== now.toDateString();
    }),
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat History Sidebar */}
      <div className="w-64 shrink-0 border-l border-border bg-card flex flex-col hidden md:flex">
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
          {groupedChats.today.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">היום</p>
              <div className="space-y-0.5">
                {groupedChats.today.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${
                      activeChatId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2
                      className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      onClick={(e) => deleteChat(c.id, e)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {groupedChats.older.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">קודם</p>
              <div className="space-y-0.5">
                {groupedChats.older.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${
                      activeChatId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2
                      className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      onClick={(e) => deleteChat(c.id, e)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {chats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">אין שיחות עדיין</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeChat ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {company ? `שלום, ${company.company_name}` : "Boss AI"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">שאל שאלה, בקש ניתוח, או תן הנחיה לצוות</p>

            <div className="w-full max-w-2xl">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="במה אוכל לעזור?"
                  rows={3}
                  className="w-full px-5 pt-4 pb-2 text-sm bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
                  style={{ direction: "rtl" }}
                />
                <div className="flex justify-end px-4 pb-3">
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
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {activeChat.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 ml-3">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-secondary text-foreground rounded-bl-sm"
                          : "text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl text-sm text-muted-foreground flex items-center gap-2">
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
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="המשך את השיחה..."
                    rows={1}
                    className="w-full px-5 pt-3.5 pb-2 text-sm bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground max-h-40"
                    style={{ direction: "rtl" }}
                  />
                  <div className="flex justify-end px-4 pb-3">
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-75 transition-opacity"
                    >
                      {loading ? <Loader2 className="w-4 h-4 text-background animate-spin" /> : <ArrowUp className="w-4 h-4 text-background" />}
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">Enter לשליחה · Shift+Enter לשורה חדשה</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}