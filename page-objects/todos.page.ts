import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// Page object for the todo app at /.
// Stores element locators as private fields and exposes actions as methods.
export class TodosPage {
  private readonly titleInput: Locator;
  private readonly addButton: Locator;
  private readonly todoItems: Locator;
  private readonly errorAlert: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.getByLabel('New todo title');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.todoItems = page.locator('.todo-list li');
    this.errorAlert = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for the initial todos fetch to settle before tests start reading the list.
    await this.page.waitForLoadState('networkidle');
  }

  async addTodo(title: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.addButton.click();
    // Wait for the new item to appear before returning — prevents race conditions
    // where the caller tries to interact with the item before it renders.
    if (title.trim()) {
      await expect(this.todoItems.filter({ hasText: title })).toHaveCount(1);
    }
  }

  async getTodoCount(): Promise<number> {
    return this.todoItems.count();
  }

  // Waits (with auto-retry) until the list reaches exactly count items.
  async waitForTodoCount(count: number): Promise<void> {
    await expect(this.todoItems).toHaveCount(count);
  }

  // Clicks the completion checkbox for the todo with the given title.
  async toggleTodo(title: string): Promise<void> {
    await this.page.getByLabel(`Mark "${title}" as complete`).click();
  }

  async deleteTodo(title: string): Promise<void> {
    await this.page.getByLabel(`Delete "${title}"`).click();
  }

  // Waits until the todo's li carries (or no longer carries) the 'completed' CSS class.
  async waitForTodoCompleted(title: string, completed = true): Promise<void> {
    const li = this.todoItems.filter({ hasText: title });
    if (completed) {
      await expect(li).toHaveClass(/completed/);
    } else {
      await expect(li).not.toHaveClass(/completed/);
    }
  }

  async getErrorMessage(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible' });
    return this.errorAlert.innerText();
  }

  async isVisible(): Promise<boolean> {
    return this.page.getByRole('heading', { name: 'Todo List' }).isVisible();
  }
}
