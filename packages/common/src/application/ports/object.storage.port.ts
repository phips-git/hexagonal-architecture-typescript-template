export interface FileObjectMetadata {
  readonly key: string;
  readonly size: number;
  readonly lastModified: Date | null;
}

export interface StoredFile extends FileObjectMetadata {
  readonly body: Uint8Array;
}

export interface PutObjectOptions {
  readonly contentType?: string;
}

export interface CreateSignedUrlOptions {
  readonly method: 'GET' | 'PUT';
  readonly expiresInSeconds: number;
}

export interface FileStoragePort {
  putObject(
    key: string,
    body: Uint8Array | Blob,
    options?: PutObjectOptions
  ): Promise<FileObjectMetadata>;

  getObject(key: string): Promise<StoredFile>;

  deleteObject(key: string): Promise<void>;

  objectExists(key: string): Promise<boolean>;

  listObjects(prefix: string): Promise<FileObjectMetadata[]>;

  createSignedUrl(key: string, options: CreateSignedUrlOptions): string;
}
