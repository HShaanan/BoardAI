import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowLeft, Briefcase, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import PageHeader from "../components/shared/PageHeader";
import AgentAvatar from "../components/shared/AgentAvatar";
import StatusBadge from "../components/shared/StatusBadge";
import AgentGoalsPanel from "../components/agent/AgentGoalsPanel";
import AgentAIPanel from "../components/agent/AgentAIPanel";

export default function AgentProfile() {
  const agentId = window.location.pathname.split("/agent/")[1];
  const [agent, setAgent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = () =>
    base44.entities.Task.filter({ assigned_agent_id: agentId }).then(setTasks);

  useEffect(() => {
    if (!agentId) return;
    Promise.all([
      base44.entities.Agent.filter({ id: agentId }),
      base44.entities.Task.filter({ assigned_agent_id: agentId }),
      base44.entities.Output.filter({ agent_id: agentId }),
      base44.entities.Project.list(),
    ]).then(([a, t, o, p]) => {
      setAgent(a[0]);
      setTasks(t);
      setOutputs(o);
      setProjects(p);
      setLoading(false);
    });
  }, [agentId]);

  if (loading || !agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSliderChange = async (field, value) => {
    await base44.entities.Agent.update(agent.id, { [field]: value[0] });
    setAgent(prev => ({ ...prev, [field]: value[0] }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/org-chart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Org Chart
      </Link>

      {/* Hero */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6" style={{ borderColor: `${agent.color}40` }}>
        <div className="flex items-start gap-5">
          <AgentAvatar agent={agent} size="xl" showStatus />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{agent.title}</h1>
            <p className="text-lg text-muted-foreground">{agent.title_he}</p>
            <p className="text-sm mt-2" style={{ color: agent.color }}>{agent.department} · {agent.level === "c_suite" ? "C-Suite" : agent.level === "vp" ? "VP" : "Special"}</p>
            <p className="text-sm text-muted-foreground mt-3">{agent.responsibilities}</p>
          </div>
          <Link to={`/chat?agent=${agent.id}`}>
            <Button className="gap-2">
              <MessageSquare className="w-4 h-4" /> Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personality */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" /> Personality & Style
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Personality Traits</p>
              <p className="text-sm text-foreground">{agent.personality_traits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Communication Style</p>
              <p className="text-sm text-foreground">{agent.communication_style}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Creativity Level: {agent.creativity_level}/10</p>
              <Slider
                value={[agent.creativity_level || 5]}
                min={1} max={10} step={1}
                onValueCommit={(v) => handleSliderChange("creativity_level", v)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Verbosity Level: {agent.verbosity_level}/10</p>
              <Slider
                value={[agent.verbosity_level || 5]}
                min={1} max={10} step={1}
                onValueCommit={(v) => handleSliderChange("verbosity_level", v)}
              />
            </div>
          </div>
        </div>

        {/* Current Tasks */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Current Tasks ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                  <p className="text-sm text-foreground truncate">{t.title}</p>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals & KPIs */}
        <AgentGoalsPanel agent={agent} onUpdate={setAgent} />

        {/* AI Capabilities */}
        <AgentAIPanel
          agent={agent}
          tasks={tasks}
          outputs={outputs}
          projects={projects}
          onTasksCreated={loadTasks}
        />

        {/* Tools */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tools & Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {(agent.tools || []).map(tool => (
              <span key={tool} className="px-3 py-1.5 bg-secondary rounded-lg text-xs text-foreground font-medium">
                {tool.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Outputs */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Outputs ({outputs.length})</h3>
          {outputs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No outputs yet.</p>
          ) : (
            <div className="space-y-2">
              {outputs.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                  <p className="text-sm text-foreground truncate">{o.title}</p>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}