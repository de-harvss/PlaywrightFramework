// Tests for the todo endpoints.
// Covers the full CRUD lifecycle and key negative cases (missing fields, invalid IDs).
//
// createTodo (fixture) is used instead of todoService.createTodo() directly —
// it automatically deletes any todos created during the test so they don't
// accumulate across runs.
import { test, expect } from '../../../fixtures/index.js';
import { makeCreateTodoPayload, makeUpdateTodoPayload } from '../../../data/factories.js';

test.describe('Todos API', () => {

  test('get all todos returns a non-empty array', async ({ todoService }) => {
    const todos = await todoService.getTodos();

    expect(todos).toBeInstanceOf(Array);
    expect(todos.length).toBeGreaterThan(0);
  });

  test('get todo by ID returns the correct todo', async ({ todoService }) => {
    const todos = await todoService.getTodos();
    const first = todos[0];
    expect(first).toBeDefined();

    const todo = await todoService.getTodo(first!.id);

    expect(todo.id).toBe(first!.id);
    expect(todo.title).toBe(first!.title);
    expect(typeof todo.completed).toBe('boolean');
  });

  test('create todo returns the new todo with completed=false', async ({ createTodo }) => {
    const todo = await createTodo(makeCreateTodoPayload());

    expect(todo.id).toBeTruthy();
    expect(typeof todo.title).toBe('string');
    expect(todo.completed).toBe(false);
  });

  // End-to-end: verify the created todo is retrievable by its ID.
  test('created todo is retrievable by ID', async ({ todoService, createTodo }) => {
    const created = await createTodo(makeCreateTodoPayload({ title: 'Retrieve me' }));

    const fetched = await todoService.getTodo(created.id);

    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe('Retrieve me');
  });

  test('update todo changes title and completion status', async ({ todoService, createTodo }) => {
    const created = await createTodo(makeCreateTodoPayload());

    const updated = await todoService.updateTodo(
      created.id,
      makeUpdateTodoPayload({ title: 'Updated title', completed: true }),
    );

    expect(updated.title).toBe('Updated title');
    expect(updated.completed).toBe(true);
  });

  // End-to-end: delete a todo and confirm it returns 404 afterwards.
  // createTodo is still used here — if the explicit delete fails mid-test,
  // the fixture teardown ensures the todo is still cleaned up.
  test('deleted todo returns 404', async ({ todoService, createTodo }) => {
    const created = await createTodo(makeCreateTodoPayload());

    await todoService.deleteTodo(created.id);

    const { status } = await todoService.getTodoRaw(created.id);
    expect(status).toBe(404);
  });

  // Negative: a non-existent ID should return 404, not 500.
  test('get non-existent todo returns 404', async ({ todoService }) => {
    const { status } = await todoService.getTodoRaw(99999);

    expect(status).toBe(404);
  });

  // Negative: an empty title should be rejected with a 400 and an error message.
  test('create todo with empty title returns 400', async ({ todoService }) => {
    const { status, body } = await todoService.createTodoRaw({ title: '' });

    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  // Negative: a whitespace-only title should also be rejected.
  test('create todo with whitespace title returns 400', async ({ todoService }) => {
    const { status } = await todoService.createTodoRaw({ title: '   ' });

    expect(status).toBe(400);
  });

});
