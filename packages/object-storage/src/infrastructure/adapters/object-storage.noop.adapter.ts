import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import type { ObjectMetadata, StoredObject } from '../../domain/models';
import type {
  CreateSignedUrlOptions,
  ObjectStoragePort
} from '../../domain/ports';

export class ObjectStorageNoopAdapter implements ObjectStoragePort {
  private readonly objects = new Map<string, StoredObject>();

  async putObject(
    key: string,
    body: Uint8Array | Blob
  ): Promise<ObjectMetadata> {
    const bytes = await this.toBytes(body);

    this.objects.set(key, {
      key,
      size: bytes.byteLength,
      lastModified: new Date(),
      body: bytes
    });

    return { key, size: bytes.byteLength, lastModified: null };
  }

  async getObject(key: string): Promise<StoredObject> {
    const object = this.objects.get(key);
    if (!object)
      throw new NotFoundError('Object not found', { context: { key } });
    return object;
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async objectExists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  async listObjects(prefix: string): Promise<ObjectMetadata[]> {
    return [...this.objects.values()]
      .filter((object) => object.key.startsWith(prefix))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, size, lastModified }) => ({ key, size, lastModified }));
  }

  async createSignedUrl(
    key: string,
    options: CreateSignedUrlOptions
  ): Promise<string> {
    return `https://noop.example/${key}?method=${options.method}&expiresInSeconds=${options.expiresInSeconds}`;
  }

  private async toBytes(body: Uint8Array | Blob): Promise<Uint8Array> {
    if (body instanceof Uint8Array) return body;
    return new Uint8Array(await body.arrayBuffer());
  }
}
