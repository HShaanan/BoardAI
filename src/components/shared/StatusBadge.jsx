import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  // Task/Project statuses
  todo: { label: "To Do", color: "bg-gray-500/20 text-gray-400" },
  backlog: { label: "Backlog", color: "bg-gray-500/20 text-gray-400" },
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  active: { label: "Active", color: "bg-blue-500/20 text-blue-400" },
  review: { label: "Review", color: "bg-yellow-500/20 text-yellow-400" },
  in_review: { label: "In Review", color: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
  done: { label: "Done", color: "bg-green-500/20 text-green-400" },
  published: { label: "Published", color: "bg-purple-500/20 text-purple-400" },
  draft: { label: "Draft", color: "bg-gray-500/20 text-gray-400" },
  // Directive statuses
  issued: { label: "Issued", color: "bg-yellow-500/20 text-yellow-400" },
  parsed: { label: "Parsed", color: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400" },
  // Priority
  low: { label: "Low", color: "bg-gray-500/20 text-gray-400" },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  high: { label: "High", color: "bg-orange-500/20 text-orange-400" },
  critical: { label: "Critical", color: "bg-red-500/20 text-red-400" },
};

export default function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500/20 text-gray-400" };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", config.color, className)}>
      {config.label}
    </span>
  );
}