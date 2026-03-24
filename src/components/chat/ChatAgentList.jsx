import AgentAvatar from "../shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

export default function ChatAgentList({ agents, selectedAgent, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = agents.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.title_he.includes(search) ||
    a.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 border-r border-border bg-card/30 flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map(agent => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left",
              selectedAgent?.id === agent.id && "bg-secondary"
            )}
          >
            <AgentAvatar agent={agent} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{agent.title}</p>
              <p className="text-xs text-muted-foreground truncate">{agent.department}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}