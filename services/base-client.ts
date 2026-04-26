import type { APIRequestContext, APIResponse } from '@playwright/test';

// A typed error thrown by parseJson when the API returns a non-2xx status.
export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly url: string,
    public readonly responseBody: string,
  ) {
    super(`HTTP ${statusCode} from ${url}: ${responseBody}`);
    this.name = 'ApiClientError';
  }
}

// Base class inherited by every service.
// Centralises URL building and response parsing so individual services stay focused on their endpoints.
export class BaseApiClient {
  protected readonly baseUrl: string;

  constructor(
    protected readonly request: APIRequestContext,
    baseUrl: string,
  ) {
    // Strip trailing slash so paths never produce double slashes.
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  protected url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Use in happy-path tests — throws ApiClientError on non-2xx.
  protected async parseJson<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      const body = await response.text();
      throw new ApiClientError(response.status(), response.url(), body);
    }
    return response.json() as Promise<T>;
  }

  // Use in negative tests — returns { status, body } without throwing.
  // Handles empty bodies (e.g. 204 No Content) and non-JSON bodies (e.g. ASP.NET
  // model-binding failures that return plain text) gracefully.
  protected async parseJsonAllowErrors<T>(
    response: APIResponse,
  ): Promise<{ status: number; body: T }> {
    const text = await response.text();
    if (!text) return { status: response.status(), body: {} as T };
    try {
      return { status: response.status(), body: JSON.parse(text) as T };
    } catch {
      return { status: response.status(), body: text as unknown as T };
    }
  }

  // Use for endpoints that return 204 No Content (e.g. DELETE).
  protected async parseNoContent(response: APIResponse): Promise<void> {
    if (!response.ok()) {
      const body = await response.text();
      throw new ApiClientError(response.status(), response.url(), body);
    }
  }
}
