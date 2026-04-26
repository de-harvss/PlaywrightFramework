import type { CreateTodoRequest, UpdateTodoRequest } from '../types/api.types.js';

// Factory functions build complete, valid request payloads with sensible defaults.
// The optional overrides parameter lets a test change only the fields it cares about.

// Returns a valid create-todo request body.
// Date.now() in the title ensures repeated test runs do not collide.
export function makeCreateTodoPayload(
  overrides?: Partial<CreateTodoRequest>,
): CreateTodoRequest {
  return {
    title: `Test todo ${Date.now()}`,
    ...overrides,
  };
}

// Returns a valid update-todo request body.
export function makeUpdateTodoPayload(
  overrides?: Partial<UpdateTodoRequest>,
): UpdateTodoRequest {
  return {
    title: `Updated todo ${Date.now()}`,
    completed: false,
    ...overrides,
  };
}
