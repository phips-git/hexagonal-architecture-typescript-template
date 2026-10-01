import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ExternalServiceError,
  NotFoundError
} from '@hexagonal-ts-template/common/domain';
import type { ObjectMetadata, StoredObject } from '../../domain/models';
import type {
  CreateSignedUrlOptions,
  ObjectStoragePort,
  PutObjectOptions
} from '../../domain/ports';

export interface ObjectStorageAwsS3AdapterOptions {
  client: S3Client;
  bucket: string;
}

export class ObjectStorageAwsS3Adapter implements ObjectStoragePort {
  constructor(private readonly options: ObjectStorageAwsS3AdapterOptions) {}

  async putObject(
    key: string,
    body: Uint8Array | Blob,
    options?: PutObjectOptions
  ): Promise<ObjectMetadata> {
    const bodyBuffer = await this.toBuffer(body);

    await this.runOperation(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: bodyBuffer,
        ContentType: options?.contentType
      })
    );

    return { key, size: bodyBuffer.byteLength, lastModified: null };
  }

  private async toBuffer(body: Uint8Array | Blob): Promise<Buffer> {
    if (body instanceof Uint8Array) return Buffer.from(body);
    const buffer = await body.arrayBuffer();
    return Buffer.from(new Uint8Array(buffer));
  }

  async getObject(key: string): Promise<StoredObject> {
    const response = await this.runOperation(
      new GetObjectCommand({ Bucket: this.options.bucket, Key: key })
    );

    if (this.isNoSuchKeyException(response as any)) {
      throw new NotFoundError('Object not found', { context: { key } });
    }

    const bodyBytes = await this.readStream(response.Body);

    return {
      key,
      size: response.ContentLength ?? bodyBytes.byteLength,
      lastModified: response.LastModified ?? null,
      body: bodyBytes
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.runOperation(
      new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key })
    );
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.runOperation(
        new HeadObjectCommand({ Bucket: this.options.bucket, Key: key })
      );
      return true;
    } catch (error) {
      if (this.isNoSuchKeyException(error)) return false;
      throw error;
    }
  }

  async listObjects(prefix: string): Promise<ObjectMetadata[]> {
    const results: ObjectMetadata[] = [];
    let continuationToken: string | undefined;

    do {
      const response: any = await this.runOperation(
        new ListObjectsV2Command({
          Bucket: this.options.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        })
      );

      for (const content of response.Contents ?? []) {
        if (content.Key && content.Size !== undefined && content.LastModified) {
          results.push({
            key: content.Key,
            size: content.Size,
            lastModified: content.LastModified
          });
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return results.sort((a, b) => a.key.localeCompare(b.key));
  }

  async createSignedUrl(
    key: string,
    options: CreateSignedUrlOptions
  ): Promise<string> {
    const command =
      options.method === 'PUT'
        ? new PutObjectCommand({ Bucket: this.options.bucket, Key: key })
        : new GetObjectCommand({ Bucket: this.options.bucket, Key: key });

    const url = await getSignedUrl(this.options.client, command, {
      expiresIn: options.expiresInSeconds
    });

    return url.toString();
  }

  private async runOperation(command: any): Promise<any> {
    try {
      return await this.options.client.send(command);
    } catch (error) {
      throw new ExternalServiceError('S3 operation failed', {
        cause: error,
        context: { operation: this.getOperationName(command) }
      });
    }
  }

  private getOperationName(command: any): string {
    if (command instanceof PutObjectCommand) return 'put-object';
    if (command instanceof GetObjectCommand) return 'get-object';
    if (command instanceof DeleteObjectCommand) return 'delete-object';
    if (command instanceof HeadObjectCommand) return 'head-object';
    if (command instanceof ListObjectsV2Command) return 'list-objects';
    return 'unknown';
  }

  private isNoSuchKeyException(error: any): boolean {
    return error?.$fault === 'client' && error?.Name === 'NoSuchKeyException';
  }

  private async readStream(body: any): Promise<Uint8Array> {
    if (!body) return new Uint8Array(0);
    if (body instanceof Uint8Array) return body;
    if (Buffer.isBuffer(body))
      return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
    if (typeof body === 'string') return new TextEncoder().encode(body);

    const chunks: Uint8Array[] = [];
    if (typeof body.getReader === 'function') {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    } else if (body[Symbol.asyncIterator]) {
      for await (const chunk of body) {
        if (chunk) chunks.push(chunk);
      }
    }

    if (chunks.length === 0) return new Uint8Array(0);
    if (chunks.length === 1) return chunks[0]!;

    const totalLength = chunks.reduce(
      (acc, chunk) => acc + chunk.byteLength,
      0
    );
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }
}
