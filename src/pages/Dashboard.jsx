import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, FolderKanban, CheckCircle, Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader";
import StatsCard from "../components/dashboard/StatsCard";
import AgentActivityFeed from "../components/dashboard/AgentActivityFeed";
import QuickDirective from "../components/dashboard/QuickDirective";
import AgentPerformanceChart from "../components/dashboard/AgentPerformanceChart";
import BoardMeetingStats from "../components/dashboard/BoardMeetingStats";
import TaskStatusChart from "../components/dashboard/TaskStatusChart";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [a, t, p, d, o, c] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Task.list("-updated_date", 100),
      base44.entities.Project.list(),
      base44.entities.Directive.list("-created_date", 50),
      base44.entities.Output.list(),
      base44.entities.Conversation.list("-created_date", 100),
    ]);
    setAgents(a);
    setTasks(t);
    setProjects(p);
    setDirectives(d);
    setOutputs(o);
    setConversations(c);
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

      {/* Charts Row 1 */}
      <div className="mt-5">
        <BoardMeetingStats directives={directives} conversations={conversations} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <AgentPerformanceChart agents={agents} tasks={tasks} />
        <TaskStatusChart tasks={tasks} />
      </div>

      {/* Activity Feed */}
      <div className="mt-5">
        <AgentActivityFeed agents={agents} tasks={tasks} />
      </div>
    </div>
  );
}