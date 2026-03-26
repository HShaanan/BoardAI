import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, XCircle, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CONNECTORS = [
  { id: "69c5354290df2e0f2594ae79", name: "Gmail", icon: "✉️", desc: "שליחת מיילים ותקשורת חיצונית" },
  { id: "69c5359f73a994251d8284c2", name: "Google Calendar", icon: "📅", desc: "תזמון משימות ודדליינים" },
  { id: "69c535acbbb61e4f6d471fe8", name: "Google Sheets", icon: "📊", desc: "דוחות ותיעוד נתונים" },
  { id: "69c53a79bbb61e4f6d472163", name: "ClickUp", icon: "✅", desc: "ניהול פרויקטים ומשימות" },
  { id: "69c53ba1decfe0270ace1dd1", name: "Slack", icon: "💬", desc: "תקשורת צוות ועדכונים" },
];

function ConnectorRow({ connector }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    try {
      await base44.functions.invoke("checkConnectorStatus", { connectorId: connector.id });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => { checkConnection(); }, []);

  const handleConnect = async () => {
    setLoading(true);
    const url = await base44.connectors.connectAppUser(connector.id);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
        setLoading(false);
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await base44.connectors.disconnectAppUser(connector.id);
    setConnected(false);
    setLoading(false);
    toast.success(`${connector.name} נותק`);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border hover:border-primary/30 transition-all">
      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-secondary rounded-lg">
        {connector.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{connector.name}</p>
        <p className="text-xs text-muted-foreground">{connector.desc}</p>
      </div>
      <div className="flex items-center gap-2">
        {connected && (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="w-3.5 h-3.5" /> מחובר
          </span>
        )}
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : connected ? (
          <Button size="sm" variant="outline" onClick={handleDisconnect} className="text-xs h-7">
            נתק
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect} className="text-xs h-7 gap-1">
            <Link className="w-3 h-3" /> חבר
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ConnectorsPanel() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
    });
  }, []);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-3">יש להתחבר כדי לחבר כלים חיצוניים</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>התחבר</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {CONNECTORS.map(c => (
        <ConnectorRow key={c.id} connector={c} />
      ))}
    </div>
  );
}