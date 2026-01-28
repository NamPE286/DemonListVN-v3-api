import type { GitHubCommitPayload } from "@src/models/github";

export async function getCommit(repo: string, commitId: string): Promise<GitHubCommitPayload> {
    const res = await fetch(
        `https://api.github.com/repos/${repo}/commits/${commitId}`,
        {
            method: "GET",
            headers: {
                "User-Agent": "nampe286",
                Accept: "application/vnd.github+json"
            },
        }
    );

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }

    return await res.json();
}

export async function getRawFileByRawUrl(url: string) {
    const res = await fetch(url,
        {
            method: "GET",
            headers: {
                "User-Agent": "nampe286",
                Accept: "application/vnd.github+json"
            },
        }
    );

    if (!res.ok) {
        throw new Error(`Cannot get raw file: ${res.status}`);
    }

    return await res.text();
}

export async function getRawFile(repo: string, path: string) {
    // TODO
}