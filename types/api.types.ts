// TypeScript interfaces for all DummyApi request and response shapes.
// Update these when the API contract changes — TypeScript will surface every affected call site.

// ── Todos ─────────────────────────────────────────────────────────────────────

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// Body sent to POST /todos
export interface CreateTodoRequest {
  title: string;
}

// Body sent to PUT /todos/:id
export interface UpdateTodoRequest {
  title: string;
  completed: boolean;
}

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}
