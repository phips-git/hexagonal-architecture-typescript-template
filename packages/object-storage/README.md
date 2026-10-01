# Object Storage

Hexagonal architecture implementation for object storage operations.

## Overview

This package provides a domain-driven interface (`ObjectStoragePort`) with concrete adapters:

- **`ObjectStorageAwsS3Adapter`** - Production AWS S3 implementation
- **`ObjectStorageNoopAdapter`** - In-memory implementation for testing

## Usage

### Domain Interface (Your App Depends On)

```typescript
import type { ObjectStoragePort } from '@hexagonal-ts-template/object-storage/domain';

// Inject into services
class UserService {
  constructor(private readonly storage: ObjectStoragePort) {}

  async upload(file: Blob) {
    const metadata = await this.storage.putObject('file.txt', file, {
      contentType: 'text/plain'
    });
  }
}
```

### Infrastructure Adapters

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { ObjectStorageAwsS3Adapter } from '@hexagonal-ts-template/object-storage/infrastructure';

const storage = new ObjectStorageAwsS3Adapter({
  client: new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  }),
  bucket: process.env.S3_BUCKET!
});
```

### Testing with Noop Adapter

```typescript
import { ObjectStorageNoopAdapter } from '@hexagonal-ts-template/object-storage/infrastructure';

const storage = new ObjectStorageNoopAdapter();
```

## API Reference

### ObjectStoragePort

```typescript
interface ObjectStoragePort {
  putObject(
    key: string,
    body: Uint8Array | Blob,
    options?: { contentType?: string }
  ): Promise<ObjectMetadata>;

  getObject(key: string): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
  listObjects(prefix: string): Promise<ObjectMetadata[]>;
  createSignedUrl(
    key: string,
    options: { method: 'GET' | 'PUT'; expiresInSeconds: number }
  ): Promise<string>;
}
```

### Models

```typescript
interface ObjectMetadata {
  key: string;
  size: number;
  lastModified: Date | null;
}

interface StoredObject extends ObjectMetadata {
  body: Uint8Array;
}
```
