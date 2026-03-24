import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, FolderKanban, CheckCircle, Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader";
import StatsCard from "../components/dashboard/StatsCard";
import AgentActivityFeed from "../components/dashboard/AgentActivityFeed";
import QuickDirective from "../components/dashboard/QuickDirective";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [a, t, p, d, o] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Task.list("-updated_date", 50),
      base44.entities.Project.list(),
      base44.entities.Directive.list("-created_date", 10),
      base44.entities.Output.list(),
    ]);
    setAgents(a);
    setTasks(t);
    setProjects(p);
    setDirectives(d);
    setOutputs(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeAgents = agents.filter(a => a.is_active).length;
  const activeProjects = projects.filter(p => p.status === "active").length;
  const pendingReviews = outputs.filter(o => o.status === "in_review").length;
  const completedTasks = tasks.filter(t => t.status === "done").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Command Center"
        subtitle="Your boardroom overview."
        action={
          <Link to="/directives">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-9 px-3 sm:px-4">
              <Zap className="w-4 h-4" /> <span className="hidden sm:inline">New Directive</span>
            </Button>
          </Link>
        }
      />

      {/* Quick Directive */}
      <QuickDirective onDirectiveCreated={loadData} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <StatsCard icon={Users} label="Active Agents" value={activeAgents} color="#3B82F6" />
        <StatsCard icon={FolderKanban} label="Active Projects" value={activeProjects} color="#8B5CF6" />
        <StatsCard icon={Clock} label="Pending Reviews" value={pendingReviews} color="#F59E0B" />
        <StatsCard icon={CheckCircle} label="Completed Tasks" value={completedTasks} color="#10B981" />
      </div>

      {/* Activity & Recent Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <AgentActivityFeed agents={agents} tasks={tasks} />

        {/* Recent Directives */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Directives</h3>
          {directives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No directives issued yet.
            </p>
          ) : (
            <div className="space-y-2">
              {directives.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 active:bg-secondary/70">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{d.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(d.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}