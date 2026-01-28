/**
 * Types for GitHub commit payload (partial - matches provided webhook example)
 */

export interface GitHubCommitAuthor {
	name: string;
	email: string;
	date: string; // ISO 8601
}

export interface GitHubCommitVerification {
	verified: boolean;
	reason: string;
	signature?: string | null;
	payload?: string | null;
	verified_at?: string | null;
}

export interface GitHubCommitTree {
	sha: string;
	url: string;
}

export interface GitHubCommitSummary {
	author: GitHubCommitAuthor;
	committer: GitHubCommitAuthor;
	message: string;
	tree: GitHubCommitTree;
	url: string;
	comment_count: number;
	verification: GitHubCommitVerification;
}

export interface GitHubUser {
	login: string;
	id: number;
	node_id?: string;
	avatar_url?: string;
	gravatar_id?: string;
	url?: string;
	html_url?: string;
	followers_url?: string;
	following_url?: string;
	gists_url?: string;
	starred_url?: string;
	subscriptions_url?: string;
	organizations_url?: string;
	repos_url?: string;
	events_url?: string;
	received_events_url?: string;
	type?: string;
	user_view_type?: string;
	site_admin?: boolean;
}

export interface GitHubCommitParent {
	sha: string;
	url: string;
	html_url?: string;
}

export interface GitHubCommitFile {
	sha?: string;
	filename: string;
	status?: string;
	additions?: number;
	deletions?: number;
	changes?: number;
	blob_url?: string;
	raw_url?: string;
	contents_url?: string;
	patch?: string;
}

export interface GitHubCommitStats {
	total: number;
	additions: number;
	deletions: number;
}

export interface GitHubCommitPayload {
	sha: string;
	node_id?: string;
	commit: GitHubCommitSummary;
	url?: string;
	html_url?: string;
	comments_url?: string;
	author?: GitHubUser | null;
	committer?: GitHubUser | null;
	parents?: GitHubCommitParent[];
	stats?: GitHubCommitStats;
	files?: GitHubCommitFile[];
}
