import { getOctokitClient } from "@src/client/octokit"

export async function getCommit(repo: string, commitId: string) {
    const octokit = getOctokitClient();
    const [owner, repoName] = repo.split('/');
    const response = await octokit.rest.repos.getCommit({ owner, repo: repoName, ref: commitId });

    return response.data;
}

export async function getRawFileByRawUrl(url: string) {
    const res = await fetch(url,
        {
            method: "GET",
            headers: {
                "User-Agent": "nampe286",
                Accept: "application/vnd.github+json",
                Authorization: "Bearer " + process.env.GITHUB_PAT
            },
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to get raw file: ${res.status}`);
    }

    return await res.text();
}