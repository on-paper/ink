import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";
const OWNER = "on-paper";
const REPO = "ink";
const CACHE_DURATION = 5 * 60 * 1000;

let cachedData: { commits: any[]; timestamp: number } | null = null;

export async function GET() {
  try {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({ commits: cachedData.commits });
    }

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch more commits to ensure we get all since our base commit
    const response = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/commits?per_page=200`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    const commits = data.map((commit: any) => {
      // Check if this is a merge commit
      const isMerge = commit.parents && commit.parents.length > 1;
      const commitMessage = commit.commit.message.split("\n")[0];

      // Extract branch name from merge commit messages
      let branch = null;
      if (isMerge && commitMessage.includes("Merge")) {
        const branchMatch = commitMessage.match(/from [^/]+\/([^\s]+)|'([^']+)'|"([^"]+)"|branch '([^']+)'/);
        if (branchMatch) {
          branch = branchMatch[1] || branchMatch[2] || branchMatch[3] || branchMatch[4];
        }
      }

      return {
        sha: commit.sha.substring(0, 7),
        message: commitMessage,
        author: {
          name: commit.commit.author.name,
          username: commit.author?.login || commit.committer?.login || null,
          // Use author date to show when the commit was actually made
          date: commit.commit.author.date,
          avatarUrl: commit.author?.avatar_url || commit.committer?.avatar_url || null,
        },
        branch,
        isMerge,
        url: commit.html_url,
      };
    });

    // Sort commits by author date, newest first
    commits.sort((a: any, b: any) => {
      return new Date(b.author.date).getTime() - new Date(a.author.date).getTime();
    });

    cachedData = {
      commits,
      timestamp: Date.now(),
    };

    return NextResponse.json({ commits });
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json({ error: "Failed to fetch commits" }, { status: 500 });
  }
}
