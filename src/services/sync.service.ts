export async function syncWiki(commitId: string | number) {
    const GITHUB_API_BASE = 'https://api.github.com/repos/Demon-List-VN/wiki/commits/'
    const res = await (
        (await fetch(GITHUB_API_BASE + String(commitId))).json()
    )

    
}