import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Network, MessageSquare, Brain, Heart,
  FolderKanban, Archive, BookOpen, Settings, Zap, ChevronLeft, ChevronRight, Sparkles
} from "lucide-react";
import { useState } from "react";
import NotificationBell from "../notifications/NotificationBell";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", label_he: "לוח בקרה" },
  { path: "/org-chart", icon: Network, label: "Org Chart", label_he: "מבנה ארגוני" },
  { path: "/chat", icon: MessageSquare, label: "Chat", label_he: "שיחות" },
  { path: "/directives", icon: Zap, label: "Directives", label_he: "הנחיות" },
  { path: "/projects", icon: FolderKanban, label: "Projects", label_he: "פרויקטים" },
  { path: "/brain", icon: Brain, label: "Brain", label_he: "המוח" },
  { path: "/core", icon: Heart, label: "Core", label_he: "הליבה" },
  { path: "/outputs", icon: Archive, label: "Outputs", label_he: "תוצרים" },
  { path: "/memory", icon: BookOpen, label: "Memory", label_he: "זיכרון" },
  { path: "/board-chat", icon: Sparkles, label: "Board Room", label_he: "חדר ישיבות" },
  { path: "/settings", icon: Settings, label: "Settings", label_he: "הגדרות" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">MC</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-lg tracking-tight whitespace-nowrap">
            My Company
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div className="px-2 pb-2">
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