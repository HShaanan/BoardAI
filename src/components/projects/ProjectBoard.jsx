import StatusBadge from "../shared/StatusBadge";
import AgentAvatar from "../shared/AgentAvatar";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "backlog", label: "Backlog", color: "border-t-gray-500" },
  { key: "active", label: "Active", color: "border-t-blue-500" },
  { key: "review", label: "In Review", color: "border-t-yellow-500" },
  { key: "done", label: "Done", color: "border-t-green-500" },
];

export default function ProjectBoard({ projects, tasks, agents }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colProjects = projects.filter(p => p.status === col.key);
        return (
          <div key={col.key} className={cn("bg-card/50 rounded-xl border border-border border-t-2 p-4 min-h-[300px]", col.color)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {colProjects.length}
              </span>
            </div>
            <div className="space-y-3">
              {colProjects.map(project => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const doneTasks = projectTasks.filter(t => t.status === "done").length;
                return (
                  <div key={project.id} className="bg-card rounded-lg border border-border p-3 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">{project.name}</h4>
                      <StatusBadge status={project.priority} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                    )}
                    {projectTasks.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(doneTasks / projectTasks.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{doneTasks}/{projectTasks.length}</span>
                      </div>
                    )}
                    {/* Agent avatars */}
                    {(project.assigned_agents || []).length > 0 && (
                      <div className="flex -space-x-2 mt-2">
                        {(project.assigned_agents || []).slice(0, 4).map(agentId => {
                          const agent = agents.find(a => a.id === agentId);
                          return agent ? (
                            <div key={agentId}>
                              <AgentAvatar agent={agent} size="sm" />
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {colProjects.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No projects</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}