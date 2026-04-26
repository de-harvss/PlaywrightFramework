// UI tests for the todo app.
import { test, expect } from '../../fixtures/index.js';

test.describe('Todo App', () => {
  // Unique suffix per test run — prevents title collisions in DummyApi's in-memory store
  // when the server stays running between runs.
  let suffix: string;

  test.beforeEach(async ({ todosPage }) => {
    suffix = Date.now().toString();
    await todosPage.goto();
  });

  // Delete any todos created by this test run (identified by suffix).
  test.afterEach(async ({ todoService }) => {
    const todos = await todoService.getTodos();
    await Promise.all(
      todos
        .filter(t => t.title.includes(suffix))
        .map(t => todoService.deleteTodo(t.id).catch(() => {})),
    );
  });

  test('page loads and shows the todo list', async ({ todosPage, page }) => {
    await expect(page).toHaveTitle(/todo/i);
    expect(await todosPage.isVisible()).toBe(true);
  });

  test('adding a todo increases the list count', async ({ todosPage }) => {
    const before = await todosPage.getTodoCount();

    await todosPage.addTodo(`Buy oat milk ${suffix}`);

    await todosPage.waitForTodoCount(before + 1);
  });

  test('added todo appears in the list', async ({ todosPage, page }) => {
    await todosPage.addTodo(`Walk the cat ${suffix}`);

    await expect(page.locator('.todo-list')).toContainText(`Walk the cat ${suffix}`);
  });

  test('completing a todo applies the completed style', async ({ todosPage }) => {
    await todosPage.addTodo(`Read the docs ${suffix}`);

    await todosPage.toggleTodo(`Read the docs ${suffix}`);

    await todosPage.waitForTodoCompleted(`Read the docs ${suffix}`);
  });

  test('deleting a todo removes it from the list', async ({ todosPage, page }) => {
    await todosPage.addTodo(`To be deleted ${suffix}`);
    await todosPage.deleteTodo(`To be deleted ${suffix}`);

    await expect(page.locator('.todo-list')).not.toContainText(`To be deleted ${suffix}`);
  });

  test('submitting an empty title shows an error', async ({ todosPage }) => {
    await todosPage.addTodo('');

    const error = await todosPage.getErrorMessage();
    expect(error.length).toBeGreaterThan(0);
  });

});
