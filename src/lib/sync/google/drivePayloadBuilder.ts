'use client';

import { VaultFile } from '@/src/lib/storage/db';

export interface DriveFileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
  description?: string;
  properties?: Record<string, string>;
  appProperties?: Record<string, string>;
}

export interface MultipartPayload {
  body: Blob;
  contentType: string;
}

/**
 * DrivePayloadBuilder
 * Constructs MIME multipart payloads, metadata headers, and note packages
 * for Google Drive v3 REST API upload endpoints.
 */
export class DrivePayloadBuilder {
  /**
   * Generates a random MIME multipart boundary string.
   */
  public static generateBoundary(): string {
    return `-------kite_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Serializes Google Drive note metadata into JSON string with indentation.
   */
  public static serializeMetadata(metadata: DriveFileMetadata): string {
    return JSON.stringify({
      name: metadata.name,
      mimeType: metadata.mimeType,
      parents: metadata.parents,
      description: metadata.description,
      properties: metadata.properties,
      appProperties: metadata.appProperties,
    });
  }

  /**
   * Packages markdown note content or binary asset into a typed Blob.
   */
  public static packageNoteContent(
    contentOrBlob: string | Blob,
    mimeType: string = 'text/markdown; charset=UTF-8'
  ): Blob {
    if (typeof contentOrBlob === 'string') {
      return new Blob([contentOrBlob], { type: mimeType });
    }
    return contentOrBlob;
  }

  /**
   * Packages a Dexie VaultFile into metadata and Blob payload ready for Google Drive synchronization.
   */
  public static packageVaultFile(
    file: VaultFile,
    parentFolderId?: string
  ): { metadata: DriveFileMetadata; fileBlob: Blob } {
    const fileName = file.title
      ? `${file.title}.md`
      : file.name.endsWith('.md')
      ? file.name
      : `${file.name}.md`;

    const mimeType = file.isBinary
      ? file.mimeType || 'application/octet-stream'
      : 'text/markdown; charset=UTF-8';

    const metadata: DriveFileMetadata = {
      name: fileName,
      mimeType,
      parents: parentFolderId ? [parentFolderId] : undefined,
      appProperties: {
        kiteVaultId: file.vaultId || 'default-vault',
        kiteFilePath: file.path,
        kiteUpdatedAt: String(file.updatedAt),
      },
    };

    const fileBlob = this.packageNoteContent(file.content || '', mimeType);
    return { metadata, fileBlob };
  }

  /**
   * Builds a multipart/related Blob conforming to Google Drive v3 upload API specifications.
   */
  public static buildMultipartBody(
    metadata: DriveFileMetadata,
    fileBlob: Blob,
    customBoundary?: string
  ): MultipartPayload {
    const boundary = customBoundary || this.generateBoundary();
    const metadataString = this.serializeMetadata(metadata);

    const parts = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      `${metadataString}\r\n`,
      `--${boundary}\r\n`,
      `Content-Type: ${fileBlob.type || 'application/octet-stream'}\r\n\r\n`,
      fileBlob,
      `\r\n--${boundary}--`,
    ];

    const body = new Blob(parts, {
      type: `multipart/related; boundary=${boundary}`,
    });

    return {
      body,
      contentType: `multipart/related; boundary=${boundary}`,
    };
  }
}
