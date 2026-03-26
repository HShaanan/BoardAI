import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORY_COLORS = {
  meeting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  deadline: "bg-red-500/20 text-red-400 border-red-500/30",
  task: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  review: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  personal: "bg-green-500/20 text-green-400 border-green-500/30",
  other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const CATEGORY_LABELS = {
  meeting: "פגישה",
  deadline: "דדליין",
  task: "משימה",
  review: "סקירה",
  personal: "אישי",
  other: "אחר",
};

export default function CalendarWidget() {
  const [events, setEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUserEmail(u.email);
        loadEvents(u.email);
      }
    });
  }, []);

  const loadEvents = async (email) => {
    const now = new Date().toISOString();
    const all = await base44.entities.CalendarEvent.filter({ user_email: email || userEmail });
    const upcoming = all
      .filter(e => e.start_time >= now)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 6);
    setEvents(upcoming);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncGoogleCalendar", {});
      if (res.data?.error === "Google Calendar not connected. Please connect your account first.") {
        setConnected(false);
        toast.error("יש לחבר Google Calendar תחילה");
      } else {
        toast.success(`סונכרנו ${res.data.total} אירועים`);
        loadEvents();
      }
    } catch {
      setConnected(false);
      toast.error("Google Calendar לא מחובר");
    }
    setSyncing(false);
  };

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser("69c552746adfdb1e590072b0");
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnected(true);
        handleSync();
      }
    }, 500);
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("he-IL", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">יומן קרוב</h3>
        </div>
        {connected ? (
          <Button size="sm" variant="ghost" onClick={handleSync} disabled={syncing} className="h-7 text-xs gap-1">
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            סנכרן
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect} className="h-7 text-xs">
            חבר יומן
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {connected ? "לחץ סנכרן לטעינת אירועים" : "יש לחבר Google Calendar"}
        </p>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/20 transition-colors group">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${CATEGORY_COLORS[event.category]}`}>
                {CATEGORY_LABELS[event.category]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatTime(event.start_time)}</p>
              </div>
              {event.calendar_link && (
                <a href={event.calendar_link} target="_blank" rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}