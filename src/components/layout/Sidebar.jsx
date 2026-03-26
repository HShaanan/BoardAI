import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Network, MessageSquare, Brain, Heart,
  FolderKanban, Archive, BookOpen, Settings, Zap, ChevronLeft, ChevronRight, CheckSquare, History, UserCog
} from "lucide-react";
import { useState } from "react";
import NotificationBell from "../notifications/NotificationBell";
import CompanySwitcher from "./CompanySwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label_he: "לוח בקרה" },
  { path: "/org-chart", icon: Network, label_he: "מבנה ארגוני" },
  { path: "/chat", icon: MessageSquare, label_he: "שיחות" },
  { path: "/directives", icon: Zap, label_he: "הנחיות" },
  { path: "/projects", icon: FolderKanban, label_he: "פרויקטים" },
  { path: "/tasks", icon: CheckSquare, label_he: "משימות" },
  { path: "/outputs", icon: Archive, label_he: "תוצרים" },
  { path: "/brain", icon: Brain, label_he: "המוח" },
  { path: "/memory", icon: BookOpen, label_he: "זיכרון" },
  { path: "/core", icon: Heart, label_he: "ליבת החברה" },
  { path: "/my-agents", icon: UserCog, label_he: "סוכנים שלי" },
  { path: "/settings", icon: Settings, label_he: "הגדרות" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-l border-sidebar-border flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-sidebar-border min-h-[56px]">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">AI</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground text-base tracking-tight whitespace-nowrap">
            Boss AI
          </span>
        )}
      </div>

      {/* Company Switcher */}
      <CompanySwitcher collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "opacity-60")} />
              {!collapsed && <span className="truncate">{item.label_he}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div className="px-2 pb-1">
        <NotificationBell collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-sidebar-border text-sidebar-foreground hover:text-foreground transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}