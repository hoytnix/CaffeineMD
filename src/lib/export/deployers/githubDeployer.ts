export interface GitHubDeployFile {
  path: string;
  content: string | Uint8Array;
}

export interface GitHubDeployOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  commitMessage?: string;
}

export interface GitHubDeployResult {
  success: boolean;
  url: string;
  commitSha?: string;
  error?: string;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function deployToGitHubPages(
  files: GitHubDeployFile[] | Map<string, string | Uint8Array>,
  options: GitHubDeployOptions
): Promise<GitHubDeployResult> {
  const { token, owner, repo } = options;
  const branch = options.branch || 'gh-pages';
  const commitMessage = options.commitMessage || 'Deploy documentation via CaffeineMD';

  if (!token || !owner || !repo) {
    return {
      success: false,
      url: '',
      error: 'GitHub Token, Owner/Username, and Repository are required.',
    };
  }

  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  const fileList: GitHubDeployFile[] =
    files instanceof Map
      ? Array.from(files.entries()).map(([path, content]) => ({ path, content }))
      : files;

  try {
    // 1. Create blobs for each file
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

    for (const item of fileList) {
      let body: any;
      if (typeof item.content === 'string') {
        body = { content: item.content, encoding: 'utf-8' };
      } else {
        body = { content: uint8ArrayToBase64(item.content), encoding: 'base64' };
      }

      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!blobRes.ok) {
        const err = await blobRes.text();
        return { success: false, url: '', error: `Failed to upload blob for ${item.path}: ${err}` };
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: item.path.replace(/^\/+/, ''),
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 2. Check for latest commit on branch
    let parentCommitSha: string | undefined;
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      headers,
    });
    if (refRes.ok) {
      const refData = await refRes.json();
      parentCommitSha = refData.object?.sha;
    }

    // 3. Construct git tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    });

    if (!treeRes.ok) {
      const err = await treeRes.text();
      return { success: false, url: '', error: `Failed to build tree: ${err}` };
    }
    const treeData = await treeRes.json();

    // 4. Create commit
    const commitBody: any = {
      message: commitMessage,
      tree: treeData.sha,
      parents: parentCommitSha ? [parentCommitSha] : [],
    };

    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitBody),
    });

    if (!commitRes.ok) {
      const err = await commitRes.text();
      return { success: false, url: '', error: `Failed to create commit: ${err}` };
    }
    const commitData = await commitRes.json();
    const newCommitSha = commitData.sha;

    // 5. Update or create branch ref
    if (parentCommitSha) {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: newCommitSha, force: true }),
      });
    } else {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitSha }),
      });
    }

    // 6. Enable GitHub Pages if not already enabled
    try {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ source: { branch, path: '/' } }),
      });
    } catch {}

    const liveUrl = `https://${owner.toLowerCase()}.github.io/${repo}/`;
    return {
      success: true,
      url: liveUrl,
      commitSha: newCommitSha,
    };
  } catch (err: any) {
    return {
      success: false,
      url: '',
      error: err?.message || 'Failed to deploy to GitHub Pages',
    };
  }
}

export async function testGitHubConnection(
  token: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  if (!token) return { success: false, error: 'Token is empty' };
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      return { success: false, error: `Invalid credentials (${res.status})` };
    }
    const data = await res.json();
    return { success: true, username: data.login };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Connection failed' };
  }
}
