import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Send, Loader2, ChevronDown, ChevronUp, Users, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import DirectiveBreakdown from "../components/directives/DirectiveBreakdown";
import { toast } from "sonner";

export default function Directives() {
  const [directives, setDirectives] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentMap, setAgentMap] = useState({});
  const [tasks, setTasks] = useState([]);
  const [core, setCore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");

  const loadData = async () => {
    const [d, a, c, t] = await Promise.all([
      base44.entities.Directive.list("-created_date", 50),
      base44.entities.Agent.list(),
      base44.entities.CompanyCore.list("-created_date", 1),
      base44.entities.Task.list("-created_date", 200),
    ]);
    setDirectives(d);
    setAgents(a);
    setTasks(t);
    const map = {};
    a.forEach(ag => { map[ag.role_key] = ag; });
    setAgentMap(map);
    if (c.length > 0) setCore(c[0]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);

    // Create the directive first
    const directive = await base44.entities.Directive.create({
      content: content.trim(),
      priority,
      status: "issued",
    });
    setContent("");

    // Use InvokeLLM to get a structured task breakdown
    const coreContext = core
      ? `Company: ${core.company_name}. Industry: ${core.industry}. Mission: ${core.mission}. Goals: ${core.business_goals}.`
      : "";
    const agentsList = agents
      .filter(a => a.is_active)
      .map(a => `{ "role_key": "${a.role_key}", "title": "${a.title}", "responsibilities": "${(a.responsibilities || "").slice(0, 120)}" }`)
      .join(",\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Chief of Staff. Given a board directive, identify the relevant agents and break it down into specific actionable tasks assigned to the right people.

Company Context: ${coreContext}

Directive: "${content.trim()}"
Priority: ${priority}

Available Agents:
[${agentsList}]

Return a JSON breakdown of tasks to create. Each task must be assigned to one agent role_key from the list above. Be specific and actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          selected_agents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role_key: { type: "string" },
                rationale: { type: "string" }
              }
            }
          },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                assigned_agent_role_key: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high", "critical"] }
              }
            }
          }
        }
      }
    });

    // Create all tasks in parallel
    const createdTaskIds = [];
    if (result?.tasks?.length) {
      const agentByRoleKey = {};
      agents.forEach(a => { agentByRoleKey[a.role_key] = a; });

      await Promise.all(
        result.tasks.map(async (t) => {
          const agent = agentByRoleKey[t.assigned_agent_role_key];
          const task = await base44.entities.Task.create({
            title: t.title,
            description: t.description,
            assigned_agent_id: agent?.id || null,
            assigned_agent_role_key: t.assigned_agent_role_key || null,
            priority: t.priority || priority,
            status: "todo",
            directive_id: directive.id,
            created_by_agent: "chief_of_staff",
          });
          createdTaskIds.push(task.id);
        })
      );
    }

    // Update directive as parsed
    await base44.entities.Directive.update(directive.id, {
      status: "parsed",
      parsed_tasks: createdTaskIds,
      ai_response: result?.summary || "",
    });

    toast.success(`Directive broken down into ${createdTaskIds.length} tasks!`);
    setSending(false);
    loadData();
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
      <PageHeader
        title="Board Directives"
        subtitle="Issue a high-level goal — the system identifies relevant agents and creates tasks automatically"
      />

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
          placeholder="e.g. Increase user retention by 20% this quarter..."
          rows={4}
          className="bg-background/60 mb-3"
          disabled={sending}
        />

        {/* Agent preview */}
        {agents.filter(a => a.is_active).length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">AI will select from {agents.filter(a => a.is_active).length} active agents</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Select value={priority} onValueChange={setPriority} disabled={sending}>
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
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
            {sending ? "Breaking down..." : "Issue & Auto-Assign"}
          </Button>
        </div>

        {sending && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Identifying relevant agents and creating tasks...
          </div>
        )}
      </div>

      {/* Directive History */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Directive History</h3>
        <span className="text-xs text-muted-foreground">{directives.length} directives · {tasks.filter(t => t.directive_id).length} tasks created</span>
      </div>

      {directives.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-semibold">No directives issued yet</p>
          <p className="text-sm text-muted-foreground mt-1">Issue your first directive to see the AI breakdown</p>
        </div>
      ) : (
        <div className="space-y-4">
          {directives.map(d => (
            <DirectiveBreakdown
              key={d.id}
              directive={d}
              agentMap={agentMap}
              tasks={tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}