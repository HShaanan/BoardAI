import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowUp, Loader2, Bot } from "lucide-react";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [agents, setAgents] = useState([]);
  const bottomRef = useRef(null);

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
  }, [messages]);

  const buildSystemPrompt = () => {
    const companyInfo = company
      ? `אתה עוזר AI חכם של החברה "${company.company_name}".
תחום: ${company.industry || "לא צוין"}.
מיסיון: ${company.mission || "לא צוין"}.
יעדים: ${company.business_goals || "לא צוין"}.`
      : "אתה עוזר AI חכם של מנכ\"ל.";

    const agentList = agents.length
      ? `\n\nהסוכנים הזמינים: ${agents.map(a => a.title_he || a.title).join(", ")}.`
      : "";

    return companyInfo + agentList + "\n\nענה בעברית, בצורה ממוקדת ומקצועית. אתה עוזר לנהל, לתכנן, ולקדם את הפעילות העסקית.";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = newMessages.map(m => `${m.role === "user" ? "משתמש" : "עוזר"}: ${m.content}`).join("\n");

    const prompt = `${buildSystemPrompt()}\n\n--- היסטוריית שיחה ---\n${history}\n\nענה רק על ההודעה האחרונה של המשתמש.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });

    setMessages(prev => [...prev, { role: "assistant", content: result }]);
    setLoading(false);
  };

  const greeting = company
    ? `שלום! אני ה-AI של ${company.company_name}. במה אוכל לעזור?`
    : "שלום! אני העוזר AI שלך. במה אוכל לעזור היום?";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground text-sm">Boss AI</h1>
          <p className="text-xs text-muted-foreground">{company?.company_name || "עוזר חכם"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-medium">{greeting}</p>
            <p className="text-muted-foreground text-sm max-w-sm">שאל אותי על פרויקטים, משימות, אסטרטגיה, או כל דבר אחר</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-bl-sm"
                  : "bg-card border border-border text-foreground rounded-br-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-br-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">חושב...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="שאל שאלה, בקש ניתוח, או תן הנחיה..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground max-h-32"
            style={{ direction: "rtl" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-75 transition-opacity"
          >
            <ArrowUp className="w-4 h-4 text-background" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">Enter לשליחה · Shift+Enter לשורה חדשה</p>
      </div>
    </div>
  );
}