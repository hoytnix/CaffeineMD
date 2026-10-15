import { RemoteDriveFile, RemoteDriveFolder } from './driveApiClient';

/**
 * Recursively scans Google Drive remote directory tree, paginating with nextPageToken,
 * and returning a flat Map<string, RemoteDriveFile> keyed by normalized relative paths.
 * Optionally records remote folder nodes into folderMap.
 */
export async function crawlRemoteDirectory(
  accessToken: string,
  rootFolderId: string,
  currentPath = '',
  folderMap?: Map<string, RemoteDriveFolder>
): Promise<Map<string, RemoteDriveFile>> {
  const fileMap = new Map<string, RemoteDriveFile>();

  const traverse = async (parentFolderId: string, prefix: string): Promise<void> => {
    let pageToken: string | undefined = undefined;

    do {
      const q = encodeURIComponent(`'${parentFolderId}' in parents and trashed = false`);
      const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, modifiedTime, md5Checksum, size)');
      const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const requestUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100${pageParam}`;

      const res = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Drive remote crawl failed (${res.status}): ${errText}`);
      }

      const data: any = await res.json();
      const files: any[] = data.files || [];
      pageToken = data.nextPageToken;

      for (const f of files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          // Recursive subfolder traverse
          const nextPrefix = prefix ? `${prefix}/${f.name}` : f.name;
          folderMap?.set(nextPrefix, {
            id: f.id,
            name: f.name,
            relativePath: nextPrefix,
            parentId: parentFolderId,
          });
          await traverse(f.id, nextPrefix);
        } else {
          // Support both nested paths and legacy flat ___ encoded paths
          let relativePath = prefix ? `${prefix}/${f.name}` : f.name;
          if (f.name.includes('___')) {
            relativePath = f.name.replace(/___/g, '/');
          }

          fileMap.set(relativePath, {
            id: f.id,
            name: f.name,
            relativePath,
            modifiedTime: f.modifiedTime,
            mimeType: f.mimeType,
            md5Checksum: f.md5Checksum,
            size: f.size ? parseInt(f.size, 10) : undefined,
            parentId: parentFolderId,
          });
        }
      }
    } while (pageToken);
  };

  await traverse(rootFolderId, currentPath);
  return fileMap;
}

export const listAllRemoteFiles = crawlRemoteDirectory;

export interface RemoteWorkspaceCrawlResult {
  files: Map<string, RemoteDriveFile>;
  trashedPaths: Map<string, RemoteDriveFile>;
  folders: Map<string, RemoteDriveFolder>;
}

/**
 * Crawls active remote workspace files, remote folders, and queries trashed remote workspace files.
 */
export async function crawlRemoteWorkspace(
  accessToken: string,
  rootFolderId: string
): Promise<RemoteWorkspaceCrawlResult> {
  const folders = new Map<string, RemoteDriveFolder>();
  const files = await crawlRemoteDirectory(accessToken, rootFolderId, '', folders);
  const trashedPaths = new Map<string, RemoteDriveFile>();

  try {
    const q = encodeURIComponent(`'${rootFolderId}' in parents and trashed = true`);
    const fields = encodeURIComponent('files(id, name, mimeType, modifiedTime, trashed)');
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=100`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data: any = await res.json();
      for (const f of data.files || []) {
        let relativePath = f.name;
        if (f.name.includes('___')) {
          relativePath = f.name.replace(/___/g, '/');
        }
        trashedPaths.set(relativePath, {
          id: f.id,
          name: f.name,
          relativePath,
          modifiedTime: f.modifiedTime,
          mimeType: f.mimeType,
          trashed: true,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to crawl trashed files from remote workspace:', err);
  }

  return { files, trashedPaths, folders };
}


