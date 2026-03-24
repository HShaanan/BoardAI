import { cn } from "@/lib/utils";

export default function AgentAvatar({ agent, size = "md", showStatus = false }) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-14 h-14 text-2xl",
    xl: "w-20 h-20 text-4xl",
  };

  const statusColors = {
    idle: "bg-gray-400",
    working: "bg-green-500 animate-pulse-glow",
    waiting_approval: "bg-yellow-500",
    in_meeting: "bg-blue-500",
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "rounded-full flex items-center justify-center shrink-0 ring-2",
          sizes[size]
        )}
        style={{
          backgroundColor: agent?.color ? `${agent.color}20` : "hsl(var(--secondary))",
          ringColor: agent?.color || "hsl(var(--border))",
          borderColor: agent?.color || "hsl(var(--border))",
          boxShadow: `0 0 0 2px ${agent?.color || 'transparent'}40`
        }}
      >
        <span>{agent?.avatar_emoji || "🤖"}</span>
      </div>
      {showStatus && agent?.status && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            statusColors[agent.status] || "bg-gray-400"
          )}
        />
      )}
    </div>
  );
}