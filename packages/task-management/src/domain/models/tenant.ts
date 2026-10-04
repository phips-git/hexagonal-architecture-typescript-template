import type { Brand } from '@hexagonal-ts-template/common/domain';

export type TenantId = Brand<string, 'TenantId'>;

export type ValidTenantId = Brand<string, 'ValidTenantId'>;
