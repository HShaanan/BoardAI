import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { GitCommit, Star, GitFork, AlertCircle, Loader2, Github, ExternalLink, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GitHubActivityWidget() {
  const [repoInput, setRepoInput] = useState(() => localStorage.getItem("gh_widget_repo") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const intervalRef = useRef(null);

  const fetchActivity = async (repoStr) => {
    const input = (repoStr || repoInput).trim();
    if (!input) return;
    const parts = input.replace("https://github.com/", "").split("/");
    if (parts.length < 2) { setError("Format: owner/repo"); return; }
    const [owner, repo] = parts;
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("getGithubActivity", { owner, repo });
    if (res.data?.error) { setError(res.data.error); setLoading(false); return; }
    setData(res.data);
    setLastSync(new Date());
    localStorage.setItem("gh_widget_repo", input);
    setLoading(false);
  };

  // Auto-refresh every 60 seconds if repo is set
  useEffect(() => {
    if (repoInput.trim()) fetchActivity(repoInput);
    intervalRef.current = setInterval(() => {
      const saved = localStorage.getItem("gh_widget_repo");
      if (saved) fetchActivity(saved);
    }, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-2">
          <Github className="w-4 h-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">GitHub Activity</span>
          {data && <span className="text-xs text-muted-foreground">— {data.repo.name}</span>}
          {lastSync && <span className="text-[10px] text-muted-foreground">· sync {timeAgo(lastSync.toISOString())}</span>}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {data && (
            <button
              onClick={() => fetchActivity()}
              disabled={loading}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              title="Sync now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Input */}
          <div className="flex gap-2">
            <input
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchActivity()}
              placeholder="owner/repo or GitHub URL"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-secondary border border-border outline-none text-foreground placeholder:text-muted-foreground"
              style={{ direction: "ltr" }}
            />
            <button
              onClick={() => fetchActivity()}
              disabled={loading || !repoInput.trim()}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:opacity-85 transition-opacity"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Fetch"}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}

          {data && (
            <>
              {/* Repo stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{data.repo.stars}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{data.repo.forks}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{data.repo.open_issues}</span>
                <span className="ml-auto text-[10px]">↑ {timeAgo(data.repo.updated_at)}</span>
              </div>

              {/* Commits */}
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {data.commits.map(c => (
                  <a
                    key={c.sha}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <GitCommit className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate leading-tight">{c.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.author} · {timeAgo(c.date)} · <span className="font-mono">{c.sha}</span></p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}