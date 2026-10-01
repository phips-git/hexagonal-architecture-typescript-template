export interface ObjectMetadata {
  readonly key: string;
  readonly size: number;
  readonly lastModified: Date | null;
}

export interface StoredObject extends ObjectMetadata {
  readonly body: Uint8Array;
}
