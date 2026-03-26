import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowUp, Zap, FolderKanban, Users, CheckSquare, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUICK_ACTIONS = [
  { label: "הנחיה חדשה", icon: Zap, path: "/directives" },
  { label: "פרויקט חדש", icon: FolderKanban, path: "/projects" },
  { label: "הצוות שלי", icon: Users, path: "/org-chart" },
  { label: "משימות", icon: CheckSquare, path: "/tasks" },
];

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ agents: 0, tasks: 0, projects: 0 });
  const [company, setCompany] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Task.filter({ status: "in_progress" }),
      base44.entities.Project.filter({ status: "active" }),
      base44.entities.CompanyCore.list("-created_date", 1),
    ]).then(([a, t, p, c]) => {
      setStats({ agents: a.length, tasks: t.length, projects: p.length });
      if (c[0]) setCompany(c[0]);
    });
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await base44.entities.Directive.create({ content: input, status: "issued", priority: "high" });
    setInput("");
    setLoading(false);
    navigate("/directives");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Greeting */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {company ? `מה נעשה היום, ${company.company_name}?` : "מה תרצה לעשות היום?"}
        </h1>
        <p className="text-muted-foreground text-sm">
          תן הנחיה לצוות הסוכנים שלך
        </p>
      </div>

      {/* Main Input */}
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder="תאר משימה, שאל שאלה, או תן הנחיה לצוות..."
            rows={4}
            className="w-full px-5 pt-4 pb-2 text-sm bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
            style={{ direction: 'rtl' }}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <button
              onClick={() => navigate("/directives")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              הנחיות קודמות
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              <ArrowUp className="w-4 h-4 text-background" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all bg-card"
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 flex gap-8 text-center">
        {[
          { label: "סוכנים פעילים", value: stats.agents },
          { label: "משימות בביצוע", value: stats.tasks },
          { label: "פרויקטים פעילים", value: stats.projects },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}