import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Network, MessageSquare, FolderKanban,
  Brain, Heart, Zap, Archive, BookOpen, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/directives", icon: Zap, label: "Directives" },
  { path: "/projects", icon: FolderKanban, label: "Projects" },
  { path: "/brain", icon: Brain, label: "Brain" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border safe-area-pb">
      <div className="flex items-stretch justify-around px-1">
        {PRIMARY_NAV.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 min-h-[56px] transition-colors duration-150",
                isActive ? "text-primary" : "text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-6 h-6 transition-all duration-150",
                  isActive ? "scale-110" : "scale-100 opacity-60"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-tight leading-none",
                  isActive ? "opacity-100" : "opacity-50"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS home indicator safe area */}
      <div className="h-safe-bottom" />
    </nav>
  );
}