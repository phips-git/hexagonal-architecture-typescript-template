import type { IdGeneratorPort } from '@hexagonal-ts-template/common/application';
import { nanoid } from 'nanoid';

export class NanoidGeneratorAdapter {
  generate: IdGeneratorPort = <T = string>(length?: number): T =>
    nanoid(length ?? 21) as T;
}
