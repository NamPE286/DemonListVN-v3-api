import { Octokit } from "octokit";

export function getOctokitClient() {
    return new Octokit({ auth: process.env.GITHUB_PAT })
}