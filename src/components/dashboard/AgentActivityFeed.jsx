import AgentAvatar from "../shared/AgentAvatar";
import StatusBadge from "../shared/StatusBadge";

export default function AgentActivityFeed({ agents, tasks }) {
  // Get recent tasks with their agents
  const recentActivity = (tasks || [])
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 8)
    .map(task => {
      const agent = (agents || []).find(a => a.id === task.assigned_agent_id);
      return { task, agent };
    })
    .filter(item => item.agent);

  if (recentActivity.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Agent Activity</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No recent activity yet. Issue a directive to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Agent Activity</h3>
      <div className="space-y-3">
        {recentActivity.map(({ task, agent }) => (
          <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <AgentAvatar agent={agent} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{agent.title}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>
        ))}
      </div>
    </div>
  );
}