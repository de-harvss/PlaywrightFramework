import { test as base } from '@playwright/test';
import { config } from '../config/env.js';
import { TodoService } from '../services/todos/todo.service.js';
import type { CreateTodoRequest, Todo } from '../types/api.types.js';

export interface ApiFixtures {
  todoService: TodoService;
  // Wraps todoService.createTodo() with automatic cleanup — any todo created through
  // this fixture is deleted after the test finishes, whether it passed or failed.
  createTodo: (payload: CreateTodoRequest) => Promise<Todo>;
}

export const test = base.extend<ApiFixtures>({
  todoService: async ({ request }, use) => {
    await use(new TodoService(request, config.baseApiUrl));
  },

  createTodo: async ({ todoService }, use) => {
    const createdIds: number[] = [];

    await use(async (payload: CreateTodoRequest) => {
      const todo = await todoService.createTodo(payload);
      createdIds.push(todo.id);
      return todo;
    });

    for (const id of createdIds) {
      await todoService.deleteTodo(id).catch(() => {
        // Silently ignore — the test may have already deleted this todo itself.
      });
    }
  },
});

export { expect } from '@playwright/test';
