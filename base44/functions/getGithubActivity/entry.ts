import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { owner, repo } = await req.json();
    if (!owner || !repo) return Response.json({ error: 'owner and repo are required' }, { status: 400 });

    const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'BossAI-App' };

    // Fetch commits and repo info in parallel
    const [commitsRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    ]);

    if (!commitsRes.ok) {
      const err = await commitsRes.json();
      return Response.json({ error: err.message || 'Failed to fetch commits' }, { status: commitsRes.status });
    }

    const [commits, repoData] = await Promise.all([commitsRes.json(), repoRes.json()]);

    const simplified = commits.map(c => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    return Response.json({
      commits: simplified,
      repo: {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
        default_branch: repoData.default_branch,
        updated_at: repoData.updated_at,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});