# Active Context: Kite Workspace

## Current Focus
Refactored Google Drive Cloud Synchronization engine in `/src/lib/sync/googleDriveSync.ts` to overcome throughput throttling (0.2 KB/s) by upgrading chunk mechanics to 5 MB blocks and separating large-file chunked resumable sessions from single-roundtrip small-file multipart uploads.

## Key Changes
1. **Strict Chunk Sizing Constants (`/src/lib/sync/googleDriveSync.ts`)**:
   - `CHUNK_SIZE = 5 * 1024 * 1024` (5,242,880 bytes, exactly 20 * 256 KB blocks adhering to Google Drive Resumable Upload specification).
   - `SMALL_FILE_THRESHOLD = 5 * 1024 * 1024` (5 MB threshold).
2. **Multipart Single-Roundtrip Upload for Files < 5 MB (`uploadSmallFile`)**:
   - Uses `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` (POST) or `.../files/{id}?uploadType=multipart` (PATCH).
   - Formats a single multipart/related MIME body containing metadata JSON (`name`, `mimeType`, `parents`) and the file binary/text content.
   - Eliminates resumable session initiation overhead for markdown notes, settings, and small assets.
3. **5 MB Resumable Chunking for Files >= 5 MB (`uploadLargeFileResumable`)**:
   - Initiates resumable session via `uploadType=resumable` extracting session URI from `Location` response header.
   - Slices and streams payloads in strict 5,242,880-byte increments with `Content-Range: bytes ${start}-${end - 1}/${totalBytes}`.
   - Handles `308 Resume Incomplete` for advancing byte offsets, `200`/`201` for completion, and queries `bytes */${totalBytes}` for interruption recovery.
   - Built-in exponential backoff retry for HTTP 429 rate limits, 5xx server errors, and network disconnects.
4. **File Size Dispatcher Routing (`syncFileToDrive`)**:
   - Inspects `fileBlob.size < SMALL_FILE_THRESHOLD` to route files to `uploadSmallFile` or `uploadLargeFileResumable`.
   - Wired bidirectional sync (`syncNow`, `uploadFile`, `updateFile`) to handle both text markdown notes and large media/binary assets.
