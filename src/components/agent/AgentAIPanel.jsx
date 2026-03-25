import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Brain, FileText, ListChecks, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const ACTIONS = [
  {
    id: "analyze",
    icon: Brain,
    label: "Analyze Domain",
    desc: "Proactively analyze current data in this agent's domain",
    prompt: (agent, data) =>
      `You are ${agent.title} (${agent.title_he}). Analyze the current state of your domain based on this data:\n\nTasks: ${JSON.stringify(data.tasks?.slice(0, 10))}\nOutputs: ${JSON.stringify(data.outputs?.slice(0, 5))}\nGoals: ${JSON.stringify(agent.goals)}\nProjects: ${JSON.stringify(data.projects?.slice(0, 5))}\n\nProvide a concise executive analysis: what's going well, what needs attention, and your top 3 recommendations. Be specific and actionable.`,
  },
  {
    id: "report",
    icon: FileText,
    label: "Generate Report",
    desc: "Auto-generate a status report for your domain",
    prompt: (agent, data) =>
      `You are ${agent.title}. Generate a professional status report for your domain.\n\nData: Tasks(${data.tasks?.length}), Outputs(${data.outputs?.length}), Goals: ${JSON.stringify(agent.goals)}\n\nStructure: Executive Summary, Key Metrics, Progress on Goals, Blockers, Next Steps. Be concise and actionable.`,
  },
  {
    id: "initiatives",
    icon: Sparkles,
    label: "Suggest Initiatives",
    desc: "AI-generated strategic initiatives based on your goals",
    prompt: (agent, data) =>
      `You are ${agent.title}. Based on your goals and domain:\n\nGoals: ${JSON.stringify(agent.goals)}\nDepartment: ${agent.department}\nResponsibilities: ${agent.responsibilities}\n\nSuggest 3-5 specific, actionable strategic initiatives that would move the needle on these goals. Include expected impact and effort for each.`,
  },
  {
    id: "tasks",
    icon: ListChecks,
    label: "Create Task Plan",
    desc: "Auto-generate a task breakdown to achieve your goals",
    prompt: (agent, data) =>
      `You are ${agent.title}. Create a practical task plan to achieve your goals.\n\nGoals: ${JSON.stringify(agent.goals)}\nExisting Tasks: ${JSON.stringify(data.tasks?.map(t => t.title)?.slice(0, 10))}\n\nGenerate 5-8 specific tasks that don't already exist. For each: title, description, priority (high/medium/low), and estimated days.`,
  },
];

export default function AgentAIPanel({ agent, tasks, outputs, projects, onTasksCreated }) {
  const [activeAction, setActiveAction] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const run = async (action) => {
    setActiveAction(action.id);
    setLoading(true);
    setResult(null);
    const data = { tasks, outputs, projects };
    const prompt = action.prompt(agent, data);

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setResult(response);

    // If task plan, also save to database as a draft Output
    if (action.id === "report") {
      await base44.entities.Output.create({
        agent_id: agent.id,
        title: `${agent.title} Status Report - ${new Date().toLocaleDateString()}`,
        content: response,
        output_type: "report",
        status: "draft",
      });
    }

    if (action.id === "analyze") {
      await base44.entities.Agent.update(agent.id, {
        last_analysis: response,
        last_analysis_date: new Date().toISOString(),
      });
    }

    setLoading(false);
  };

  const handleCreateTasks = async () => {
    if (!result || activeAction !== "tasks") return;
    // Parse task lines from AI output and create them
    const lines = result.split("\n").filter(l => l.trim().match(/^\d+\.|^-|^\*/));
    const tasksToCreate = lines.slice(0, 8).map(line => ({
      title: line.replace(/^\d+\.|^-|^\*/, "").trim().split(":")[0].trim().slice(0, 100),
      assigned_agent_id: agent.id,
      status: "todo",
      priority: "medium",
    })).filter(t => t.title);

    await Promise.all(tasksToCreate.map(t => base44.entities.Task.create(t)));
    onTasksCreated?.();
    setResult(prev => prev + "\n\n✅ Tasks created successfully!");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AI Capabilities
        </h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ACTIONS.map(action => {
              const Icon = action.icon;
              const isActive = activeAction === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => run(action)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left transition-all hover:border-primary/50 disabled:opacity-50 ${
                    isActive && loading ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {loading && isActive
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      : <Icon className="w-3.5 h-3.5 text-primary" />
                    }
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{action.desc}</p>
                </button>
              );
            })}
          </div>

          {result && (
            <div className="mt-2 bg-secondary/30 rounded-xl p-4 border border-border">
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              {activeAction === "tasks" && (
                <Button size="sm" className="mt-3 text-xs gap-1" onClick={handleCreateTasks}>
                  <ListChecks className="w-3.5 h-3.5" /> Save Tasks to Board
                </Button>
              )}
            </div>
          )}

          {agent.last_analysis && !result && (
            <div className="mt-2 bg-secondary/20 rounded-lg p-3 border border-border">
              <p className="text-[10px] text-muted-foreground mb-1">
                Last analysis: {agent.last_analysis_date ? new Date(agent.last_analysis_date).toLocaleString() : ""}
              </p>
              <p className="text-xs text-foreground/70 line-clamp-3">{agent.last_analysis}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}