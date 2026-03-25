import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function Directives() {
  const [directives, setDirectives] = useState([]);
  const [agents, setAgents] = useState([]);
  const [core, setCore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");

  const loadData = async () => {
    const [d, a, c] = await Promise.all([
      base44.entities.Directive.list("-created_date", 50),
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
    ]);
    setDirectives(d);
    setAgents(a);
    if (c.length > 0) setCore(c[0]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);

    // Create the directive
    const directive = await base44.entities.Directive.create({
      content: content.trim(),
      priority,
      status: "issued",
    });

    // Use the real Chief of Staff agent via base44.agents SDK
    const coreContext = core ? `Company: ${core.company_name}. Mission: ${core.mission}. Goals: ${core.business_goals}.` : "";
    const agentsList = agents.map(a => `${a.title} (${a.role_key})`).join(", ");

    const prompt = `${coreContext}\n\nDirective ID: ${directive.id}\nPriority: ${priority}\n\nBoard Directive: "${content.trim()}"\n\nAvailable agents: ${agentsList}\n\nAnalyze this directive, create tasks in the database, and provide a breakdown.`;

    const convo = await base44.agents.createConversation({
      agent_name: "chief_of_staff",
      metadata: { title: `Directive: ${content.trim().slice(0, 60)}` }
    });

    await base44.agents.addMessage(convo, { role: "user", content: prompt });

    // Poll for response
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const updated = await base44.agents.getConversation(convo.id);
      const assistantMsgs = (updated.messages || []).filter(m => m.role === "assistant");
      if (assistantMsgs.length > 0 || attempts > 30) {
        clearInterval(poll);
        const response = assistantMsgs[assistantMsgs.length - 1]?.content || "";
        if (response) {
          await base44.entities.Directive.update(directive.id, {
            status: "parsed",
            ai_response: response,
          });
        }
        setContent("");
        toast.success("Directive issued and processed by Chief of Staff!");
        setSending(false);
        loadData();
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Board Directives" subtitle="Issue commands to your executive team" />

      {/* Issue Directive */}
      <div className="bg-gradient-to-br from-accent/10 via-card to-primary/10 rounded-xl border border-accent/30 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-lg">👑</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Issue New Directive</h3>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you want your company to accomplish..."
          rows={4}
          className="bg-background/60 mb-3"
        />
        <div className="flex items-center gap-3">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 ml-auto"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Processing..." : "Issue Directive"}
          </Button>
        </div>
      </div>

      {/* Directive History */}
      <h3 className="text-sm font-semibold text-foreground mb-4">Directive History</h3>
      {directives.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">No directives issued yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tell your team what to focus on</p>
        </div>
      ) : (
        <div className="space-y-4">
          {directives.map(d => (
            <div key={d.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={d.priority} />
                <StatusBadge status={d.status} />
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(d.created_date).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-foreground font-medium mb-3 border-l-2 border-accent pl-3">
                {d.content}
              </p>
              {d.ai_response && (
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    📌 Chief of Staff Analysis
                  </p>
                  <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm">
                    {d.ai_response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}