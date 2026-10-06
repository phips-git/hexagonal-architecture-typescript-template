import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

/**
 * User information from authentication
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Authorization context passed to usecases
 */
export interface AuthorizationContext {
  userId: string;
  userEmail: string;
  userRole: string;
}

/**
 * Request context extracted from API Gateway event
 */
export interface RequestContext {
  requestId: string;
  awsRequestId: string;
  authenticatedUser?: AuthenticatedUser | null;
}

/**
 * Parsed path parameters
 */
export interface ParsedPathParams {
  [key: string]: string | undefined;
}

/**
 * Generic API Gateway event wrapper
 */
export interface ApiGatewayRequest {
  event: APIGatewayProxyEvent;
  context: Context;
}

/**
 * Extract request context from API Gateway event
 */
export function extractRequestContext(
  event: APIGatewayProxyEvent,
  context: Context
): RequestContext {
  return {
    requestId: event.requestContext?.requestId || context.awsRequestId,
    awsRequestId: context.awsRequestId,
    authenticatedUser: undefined // Will be populated by auth middleware
  };
}

/**
 * Extract path parameters from API Gateway event
 */
export function extractPathParams(
  event: APIGatewayProxyEvent
): ParsedPathParams {
  return event.pathParameters || {};
}

/**
 * Extract query string parameters
 */
export function extractQueryParams(
  event: APIGatewayProxyEvent
): Record<string, string | string[] | undefined> {
  return event.queryStringParameters || {};
}

/**
 * Extract request body with proper handling
 */
export function extractRequestBody<T = unknown>(
  event: APIGatewayProxyEvent
): T | null {
  if (!event.body) {
    return null;
  }

  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Extract HTTP method
 */
export function extractMethod(event: APIGatewayProxyEvent): string {
  return event.httpMethod || event.requestContext?.http?.method || 'GET';
}

/**
 * Check if request has a body
 */
export function hasBody(event: APIGatewayProxyEvent): boolean {
  return !!event.body && event.body.length > 0;
}

/**
 * Create authorization context from authenticated user
 */
export function createAuthorizationContext(
  user: AuthenticatedUser | null
): AuthorizationContext | null {
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role
  };
}

/**
 * Path parameter extractor
 */
export class PathParam {
  private constructor(private readonly params: ParsedPathParams) {}

  static fromEvent(event: APIGatewayProxyEvent): PathParam {
    return new PathParam(extractPathParams(event));
  }

  get(name: string): string | undefined {
    return this.params[name];
  }

  getRequired(name: string): string {
    const value = this.get(name);
    if (!value) {
      throw new Error(`Required path parameter '${name}' is missing`);
    }
    return value;
  }
}

/**
 * Query parameter extractor
 */
export class QueryParam {
  private constructor(
    private readonly params: Record<string, string | string[] | undefined>
  ) {}

  static fromEvent(event: APIGatewayProxyEvent): QueryParam {
    return new QueryParam(extractQueryParams(event));
  }

  get(name: string): string | undefined {
    return this.params[name] as string | undefined;
  }

  getAll(name: string): string[] {
    const value = this.params[name];
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }

  getOptionalInt(name: string): number | null {
    const value = this.get(name);
    if (!value) {
      return null;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Query parameter '${name}' is not a valid integer`);
    }
    return parsed;
  }

  getOptionalBoolean(name: string): boolean | null {
    const value = this.get(name);
    if (!value) {
      return null;
    }
    return value.toLowerCase() === 'true';
  }
}
