import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowUp, Loader2, Bot, Plus, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const AGENT_NAME = "boss_ai";
const STORAGE_KEY = "boss_ai_conversations";

function loadStoredConvos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveStoredConvos(convos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

export default function Dashboard() {
  // storedConvos: [{ id, title, createdAt }] — metadata only
  const [storedConvos, setStoredConvos] = useState(() => loadStoredConvos());
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeConvo, setActiveConvo] = useState(null); // full convo object from SDK
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const subscribeToConvo = (convoId) => {
    if (unsubRef.current) unsubRef.current();
    const unsub = base44.agents.subscribeToConversation(convoId, (data) => {
      setMessages(data.messages || []);
    });
    unsubRef.current = unsub;
  };

  const openConversation = async (meta) => {
    setLoadingConvo(true);
    setActiveConvoId(meta.id);
    setMessages([]);
    const convo = await base44.agents.getConversation(meta.id);
    setActiveConvo(convo);
    setMessages(convo.messages || []);
    subscribeToConvo(meta.id);
    setLoadingConvo(false);
  };

  const createNewChat = async () => {
    setActiveConvoId(null);
    setActiveConvo(null);
    setMessages([]);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setInput("");
  };

  const deleteConvo = (id, e) => {
    e.stopPropagation();
    const updated = storedConvos.filter(c => c.id !== id);
    setStoredConvos(updated);
    saveStoredConvos(updated);
    if (activeConvoId === id) createNewChat();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    let convo = activeConvo;

    if (!convo) {
      convo = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { title: text.slice(0, 50) }
      });
      setActiveConvo(convo);
      setActiveConvoId(convo.id);
      subscribeToConvo(convo.id);

      const meta = { id: convo.id, title: text.slice(0, 50), createdAt: new Date().toISOString() };
      const updated = [meta, ...storedConvos];
      setStoredConvos(updated);
      saveStoredConvos(updated);
    }

    await base44.agents.addMessage(convo, { role: "user", content: text });
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isTyping = messages.length > 0 && messages[messages.length - 1]?.role === "user" && loading;

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
                  <button
                    key={c.id}
                    onClick={() => openConversation(c)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${
                      activeConvoId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2
                      className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      onClick={(e) => deleteConvo(c.id, e)}
                    />
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
                  <button
                    key={c.id}
                    onClick={() => openConversation(c)}
                    className={`w-full group flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-colors ${
                      activeConvoId === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <Trash2
                      className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      onClick={(e) => deleteConvo(c.id, e)}
                    />
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {loadingConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && !activeConvo ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Boss AI</h1>
            <p className="text-muted-foreground text-sm mb-8">מנהל הסוכנים שלך — שאל, הנחה, נתח</p>
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
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-3"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-secondary text-foreground rounded-bl-sm" : "text-foreground"
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
                ))}
                {(isTyping || (loading && activeConvo)) && (
                  <div className="flex justify-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Boss AI חושב...
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