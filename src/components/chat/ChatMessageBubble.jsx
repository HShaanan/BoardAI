import AgentAvatar from "../shared/AgentAvatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function ChatMessageBubble({ message, agent }) {
  const isBoard = message.role === "board";

  return (
    <div className={cn("flex gap-3", isBoard ? "justify-end" : "justify-start")}>
      {!isBoard && (
        <AgentAvatar agent={agent} size="sm" />
      )}
      <div className={cn("max-w-[75%]")}>
        {!isBoard && (
          <p className="text-xs font-medium mb-1" style={{ color: agent?.color }}>
            {agent?.title}
          </p>
        )}
        {isBoard && (
          <p className="text-xs font-medium mb-1 text-accent text-right">Board Directive</p>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm",
          isBoard
            ? "bg-accent/20 text-foreground border border-accent/30 rounded-br-sm"
            : "bg-card border border-border rounded-bl-sm"
        )}>
          {isBoard ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {new Date(message.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {isBoard && (
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 ring-2 ring-accent/40">
          <span className="text-sm">👑</span>
        </div>
      )}
    </div>
  );
}