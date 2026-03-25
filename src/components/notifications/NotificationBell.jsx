import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Zap, FileText, X, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export default function NotificationBell({ collapsed }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("dismissed_notifs") || "[]")); }
    catch { return new Set(); }
  });
  const [toasts, setToasts] = useState([]);
  const panelRef = useRef(null);
  const prevIds = useRef(new Set());

  useOutsideClick(panelRef, () => setOpen(false));

  const addToast = (notif) => {
    const id = Date.now();
    setToasts(t => [...t, { ...notif, toastId: id }]);
    setTimeout(() => setToasts(t => t.filter(x => x.toastId !== id)), 5000);
  };

  const buildNotifications = (directives, outputs) => {
    const items = [];

    directives.forEach(d => {
      if (d.status === "issued") {
        items.push({
          id: `dir-${d.id}`,
          type: "directive",
          title: "החלטה ממתינה לאישור",
          body: d.content?.slice(0, 80) || "הנחיה חדשה",
          link: "/directives",
          time: d.created_date,
        });
      }
    });

    outputs.forEach(o => {
      if (o.output_type === "report" && o.status === "draft") {
        items.push({
          id: `out-${o.id}`,
          type: "output",
          title: "סיכום דיון חדש נוצר",
          body: o.title?.slice(0, 80) || "תוצר חדש",
          link: "/outputs",
          time: o.created_date,
        });
      }
    });

    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    return items;
  };

  const load = async () => {
    const [directives, outputs] = await Promise.all([
      base44.entities.Directive.filter({ status: "issued" }),
      base44.entities.Output.list("-created_date", 10),
    ]);
    const items = buildNotifications(directives, outputs);
    const newItems = items.filter(i => !prevIds.current.has(i.id) && !dismissed.has(i.id));
    newItems.forEach(n => { if (prevIds.current.size > 0) addToast(n); });
    items.forEach(i => prevIds.current.add(i.id));
    setNotifications(items.filter(i => !dismissed.has(i.id)));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (id) => {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    localStorage.setItem("dismissed_notifs", JSON.stringify([...next]));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unread = notifications.length;

  return (
    <>
      {/* Toast area */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.toastId}
            className="pointer-events-auto bg-card border border-border rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3 max-w-xs animate-in slide-in-from-right-5 fade-in"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              toast.type === "directive" ? "bg-accent/20" : "bg-primary/20"
            )}>
              {toast.type === "directive"
                ? <Zap className="w-4 h-4 text-accent" />
                : <FileText className="w-4 h-4 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{toast.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{toast.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bell button */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            "relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <div className="relative shrink-0">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
          {!collapsed && <span className="truncate">התראות</span>}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className={cn(
            "absolute z-50 bg-card border border-border rounded-2xl shadow-2xl w-80 overflow-hidden",
            collapsed ? "left-14 bottom-0" : "left-full ml-2 bottom-0"
          )}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">התראות</span>
              {unread > 0 && (
                <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">{unread} חדשות</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>אין התראות חדשות</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      n.type === "directive" ? "bg-accent/20" : "bg-primary/20"
                    )}>
                      {n.type === "directive"
                        ? <Zap className="w-3.5 h-3.5 text-accent" />
                        : <FileText className="w-3.5 h-3.5 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                      <Link
                        to={n.link}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-primary mt-1 hover:underline"
                      >
                        צפה <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}