import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Plus, Loader2, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import AgentAvatar from "../components/shared/AgentAvatar";
import TaskCard from "../components/tasks/TaskCard";
import CreateTaskFromDirectiveModal from "../components/tasks/CreateTaskFromDirectiveModal";

const STATUS_ORDER = ["todo", "in_progress", "review", "approved", "done", "rejected"];
const STATUS_LABELS = {
  todo: "לביצוע", in_progress: "בביצוע", review: "בסקירה",
  approved: "אושר", done: "הושלם", rejected: "נדחה"
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadData = async () => {
    const [t, d, a] = await Promise.all([
      base44.entities.Task.list("-created_date", 100),
      base44.entities.Directive.list("-created_date", 50),
      base44.entities.Agent.filter({ is_active: true }),
    ]);
    setTasks(t);
    setDirectives(d);
    setAgents(a);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    await base44.entities.Task.update(taskId, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDelete = async (taskId) => {
    await base44.entities.Task.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const filteredTasks = filterStatus === "all"
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  const tasksByStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="ניהול משימות"
        subtitle={`${tasks.length} משימות סה"כ`}
        action={
          <Button onClick={() => setShowModal(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> משימה מהחלטה
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterStatus === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          הכל ({tasks.length})
        </button>
        {STATUS_ORDER.map(s => {
          const count = tasks.filter(t => t.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban Columns */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-foreground font-semibold">אין משימות עדיין</p>
          <p className="text-sm text-muted-foreground mt-1">הקצה החלטה מהדיון כמשימה לסוכן</p>
          <Button onClick={() => setShowModal(true)} className="mt-4 gap-2" variant="outline">
            <Plus className="w-4 h-4" /> צור משימה ראשונה
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STATUS_ORDER.filter(s => tasksByStatus[s]?.length > 0 || filterStatus === "all").map(status => {
            const statusTasks = tasksByStatus[status];
            if (statusTasks.length === 0 && filterStatus !== "all") return null;
            return (
              <div key={status} className="bg-card/50 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {statusTasks.map(task => {
                    const agent = agents.find(a => a.id === task.assigned_agent_id);
                    const directive = directives.find(d => d.id === task.project_id); // using project_id as directive link
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        agent={agent}
                        directive={directive}
                        agents={agents}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CreateTaskFromDirectiveModal
          directives={directives}
          agents={agents}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
}