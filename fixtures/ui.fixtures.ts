import { test as base } from '@playwright/test';
import { TodosPage } from '../page-objects/todos.page.js';

export interface UiFixtures {
  todosPage: TodosPage;
}

export const test = base.extend<UiFixtures>({
  todosPage: async ({ page }, use) => {
    await use(new TodosPage(page));
  },
});

export { expect } from '@playwright/test';
