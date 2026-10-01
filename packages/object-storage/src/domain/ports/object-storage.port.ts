import type { ObjectMetadata, StoredObject } from '../models';

export interface PutObjectOptions {
  readonly contentType?: string;
}

export interface CreateSignedUrlOptions {
  readonly method: 'GET' | 'PUT';
  readonly expiresInSeconds: number;
}

export interface ObjectStoragePort {
  putObject(
    key: string,
    body: Uint8Array | Blob,
    options?: PutObjectOptions
  ): Promise<ObjectMetadata>;

  getObject(key: string): Promise<StoredObject>;

  deleteObject(key: string): Promise<void>;

  objectExists(key: string): Promise<boolean>;

  listObjects(prefix: string): Promise<ObjectMetadata[]>;

  createSignedUrl(
    key: string,
    options: CreateSignedUrlOptions
  ): Promise<string>;
}
