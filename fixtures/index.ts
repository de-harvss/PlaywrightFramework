// Merges the API and UI fixture sets into one combined test object.
// All test files import { test, expect } from here — never directly from
// api.fixtures or ui.fixtures — so every test has access to every fixture
// regardless of whether it is an API or UI test.
import { mergeTests } from '@playwright/test';
import { test as apiTest } from './api.fixtures.js';
import { test as uiTest } from './ui.fixtures.js';

export const test = mergeTests(apiTest, uiTest);
export { expect } from '@playwright/test';
