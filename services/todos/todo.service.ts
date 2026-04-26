import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '../base-client.js';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  HealthResponse,
  ApiError,
} from '../../types/api.types.js';

export class TodoService extends BaseApiClient {
  constructor(request: APIRequestContext, baseUrl: string) {
    super(request, baseUrl);
  }

  // GET /health
  async getHealth(): Promise<HealthResponse> {
    const response = await this.request.get(this.url('/health'));
    return this.parseJson<HealthResponse>(response);
  }

  // GET /todos
  async getTodos(): Promise<Todo[]> {
    const response = await this.request.get(this.url('/todos'));
    return this.parseJson<Todo[]>(response);
  }

  // GET /todos/:id — throws on non-2xx.
  async getTodo(id: number): Promise<Todo> {
    const response = await this.request.get(this.url(`/todos/${id}`));
    return this.parseJson<Todo>(response);
  }

  // GET /todos/:id — returns { status, body } for negative tests.
  async getTodoRaw(id: number): Promise<{ status: number; body: Todo | ApiError }> {
    const response = await this.request.get(this.url(`/todos/${id}`));
    return this.parseJsonAllowErrors<Todo | ApiError>(response);
  }

  // POST /todos — throws on non-2xx.
  async createTodo(payload: CreateTodoRequest): Promise<Todo> {
    const response = await this.request.post(this.url('/todos'), { data: payload });
    return this.parseJson<Todo>(response);
  }

  // POST /todos — returns { status, body } for negative tests.
  async createTodoRaw(payload: CreateTodoRequest): Promise<{ status: number; body: ApiError }> {
    const response = await this.request.post(this.url('/todos'), { data: payload });
    return this.parseJsonAllowErrors<ApiError>(response);
  }

  // PUT /todos/:id — throws on non-2xx.
  async updateTodo(id: number, payload: UpdateTodoRequest): Promise<Todo> {
    const response = await this.request.put(this.url(`/todos/${id}`), { data: payload });
    return this.parseJson<Todo>(response);
  }

  // DELETE /todos/:id — throws on non-2xx. Returns void (204 No Content).
  async deleteTodo(id: number): Promise<void> {
    const response = await this.request.delete(this.url(`/todos/${id}`));
    return this.parseNoContent(response);
  }
}
