import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/shared/PageHeader";
import QuickDirective from "../components/dashboard/QuickDirective";
import AgentPerformanceChart from "../components/dashboard/AgentPerformanceChart";
import BoardMeetingStats from "../components/dashboard/BoardMeetingStats";
import TaskStatusChart from "../components/dashboard/TaskStatusChart";
import DirectorDashboard from "../components/dashboard/DirectorDashboard";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [a, t, p] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Task.list("-updated_date", 100),
      base44.entities.Project.list(),
    ]);
    setAgents(a);
    setTasks(t);
    setProjects(p);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <DirectorDashboard agents={agents} tasks={tasks} projects={projects} />
    </div>
  );
}