// Tests for GET /health.
import { test, expect } from '../../../fixtures/index.js';

test.describe('Health API', () => {

  test('returns healthy status', async ({ todoService }) => {
    const response = await todoService.getHealth();

    expect(response.status).toBe('healthy');
  });

});
