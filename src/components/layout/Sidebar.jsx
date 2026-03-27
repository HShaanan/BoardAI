import { Link, useLocation } from "react-router-dom";
import {
  MessageSquare, Network, FolderKanban, CheckSquare,
  Archive, Settings, ChevronLeft, ChevronRight, Heart, Brain, UserCog
} from "lucide-react";
import { useState } from "react";
import CompanySwitcher from "./CompanySwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",           icon: MessageSquare, label: "שיחות" },
  { path: "/org-chart",  icon: Network,       label: "צוות" },
  { path: "/projects",   icon: FolderKanban,  label: "פרויקטים" },
  { path: "/tasks",      icon: CheckSquare,   label: "משימות" },
  { path: "/outputs",    icon: Archive,       label: "תוצרים" },
  { path: "/brain",      icon: Brain,         label: "ידע" },
  { path: "/core",       icon: Heart,         label: "ליבת החברה" },
  { path: "/my-agents",  icon: UserCog,       label: "סוכנים" },
  { path: "/settings",   icon: Settings,      label: "הגדרות" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen bg-sidebar border-l border-sidebar-border flex flex-col transition-all duration-200 sticky top-0 shrink-0",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Logo */}
      <div className="px-3 py-3 flex items-center gap-2.5 border-b border-sidebar-border min-h-[56px]">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">AI</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground text-sm tracking-tight whitespace-nowrap">
            BoardAI
          </span>
        )}
      </div>

      {/* Company Switcher */}
      <CompanySwitcher collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);
          return (
            <Link key={path} to={path}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-100",
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}>
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "opacity-60")} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(c => !c)}
        className="p-3 border-t border-sidebar-border text-sidebar-foreground hover:text-foreground transition-colors flex items-center justify-center">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
