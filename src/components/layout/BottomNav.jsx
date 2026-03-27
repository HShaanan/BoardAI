import { Link, useLocation } from "react-router-dom";
import { MessageSquare, FolderKanban, CheckSquare, Network, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { path: "/",          icon: MessageSquare,  label: "שיחות" },
  { path: "/org-chart", icon: Network,        label: "צוות" },
  { path: "/projects",  icon: FolderKanban,   label: "פרויקטים" },
  { path: "/tasks",     icon: CheckSquare,    label: "משימות" },
  { path: "/settings",  icon: Settings,       label: "הגדרות" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-sidebar-border safe-area-pb rtl">
      <div className="flex items-stretch justify-around px-1">
        {PRIMARY_NAV.map(({ path, icon: Icon, label }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);
          return (
            <Link key={path} to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 min-h-[56px] transition-colors duration-150",
                isActive ? "text-primary" : "text-sidebar-foreground"
              )}>
              <Icon className={cn("w-5 h-5 transition-all duration-150", isActive ? "scale-110" : "scale-100 opacity-60")} />
              <span className={cn("text-[10px] font-medium leading-none", isActive ? "opacity-100" : "opacity-50")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-bottom" />
    </nav>
  );
}
