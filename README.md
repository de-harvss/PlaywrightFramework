# PlaywrightFramework

TypeScript test framework for API and UI testing, built on [Playwright](https://playwright.dev/). Targets the [DummyApi](../DummyApi) and [DummyFrontend](../DummyFrontend) projects.

---

## Project structure

```
PlaywrightFramework/
├── playwright.config.ts        # Project definitions, timeouts, reporters
├── azure-pipelines.yml
│
├── config/
│   └── env.ts                  # Loads .env and exports a typed config object
│
├── types/
│   └── api.types.ts            # Interfaces for all API request/response shapes
│
├── services/
│   ├── base-client.ts          # Shared HTTP logic inherited by all service classes
│   └── todos/
│       └── todo.service.ts     # Methods for every todo and health endpoint
│
├── fixtures/
│   ├── api.fixtures.ts         # Injects todoService and createTodo into tests
│   ├── ui.fixtures.ts          # Injects page objects into tests
│   └── index.ts                # Merges API and UI fixtures — import from here in tests
│
├── page-objects/
│   └── todos.page.ts           # Todo app page actions and locators
│
├── data/
│   └── factories.ts            # Factory functions for building test payloads
│
└── tests/
    ├── api/
    │   └── todos-api/          # One subfolder per microservice
    │       ├── health.spec.ts
    │       └── todos.spec.ts
    └── ui/
        └── todos.spec.ts
```

---

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Start both projects before running tests:

```bash
# DummyApi — http://localhost:5058
cd ../DummyApi && dotnet run

# DummyFrontend — http://localhost:5173
cd ../DummyFrontend && npm run dev
```

---

## Running tests

| Command | What it runs |
|---|---|
| `npm test` | All projects |
| `npm run test:api` | API tests only (no browser) |
| `npm run test:ui` | UI tests only |
| `npm run test:api:staging` | API tests against staging |
| `npm run test:ui:staging` | UI tests against staging |
| `npm run test:report` | Opens the HTML report from the last run |
| `npm run lint` | TypeScript type-check only |

### Running a specific spec file

Pass the file path directly to Playwright with `--project` to target only the tests you care about:

```bash
# API tests for a specific spec
npx playwright test tests/api/todos-api/todos.spec.ts --project=api

# UI tests for a specific spec
npx playwright test tests/ui/todos.spec.ts --project=ui
```

### Targeting different environments

`npm run test:api:staging` sets `ENV=staging`, which loads `.env.staging`. To add a new environment, copy `.env.staging.example` to `.env.staging` and set `BASE_API_URL` and `BASE_UI_URL`.

---

## Key concepts

### Services

`TodoService` extends `BaseApiClient` and maps each API endpoint to a typed method. Every endpoint has two variants:
- **Standard** (e.g. `getTodo`) — returns a typed response, throws `ApiClientError` on non-2xx. Use in happy-path tests.
- **Raw** (e.g. `getTodoRaw`) — returns `{ status, body }` without throwing. Use in negative tests.

### Fixtures

Fixtures inject reusable setup into tests via function parameters.

```ts
test('example', async ({ todoService, createTodo }) => {
  const todo = await createTodo({ title: 'Test' });
  const fetched = await todoService.getTodo(todo.id);
});
```

All test files import `{ test, expect }` from `fixtures/index.ts`.

### Fixture cleanup

`createTodo` wraps `todoService.createTodo()` with automatic teardown — any todo created through it is deleted after the test completes, pass or fail.

When adding fixtures that create data, track created IDs before `await use()`, delete them after, and wrap each delete in `.catch(() => {})` so already-deleted resources don't fail teardown.

### Factories

Factory functions build complete, valid payloads with defaults. The `overrides` parameter lets a test change only the fields it cares about.

```ts
makeCreateTodoPayload()                          // { title: 'Test todo 1234567890' }
makeCreateTodoPayload({ title: 'Buy milk' })     // override the title
```

### Page objects

`TodosPage` encapsulates all locators and actions for the todo app. Tests call `todosPage.addTodo('...')` rather than raw Playwright selectors — selector changes only need updating in one place.

**`addTodo` invariant:** `addTodo(title)` always waits for the new item to appear in the list before returning. This is a framework invariant — it prevents race conditions where a subsequent interaction or count assertion runs before the item has rendered. The guard is skipped when `title` is empty, because an empty submit is rejected by the API and produces no list item.

### UI test data

The backend is an in-memory store that persists across test runs until the server restarts. Two rules apply to all UI tests:

**Create your own data.** Never rely on seeded server state — earlier tests in the same run may have deleted seeded items. Every test that needs a todo must create it via `addTodo()` or the `createTodo` fixture.

**Use unique titles per run.** Static titles accumulate across runs and produce duplicate `aria-label` matches that break Playwright's strict locator mode. Declare a single `const run = Date.now()` at the top of the `describe` block and interpolate it into every title:

```ts
test.describe('My feature', () => {
  const run = Date.now();

  test('example', async ({ todosPage }) => {
    await todosPage.addTodo(`My todo ${run}`);
  });
});
```

---

## Adding tests

### API: New MS > New API > New test(s)

**New MS** — testing a new microservice for the first time:

1. Add request/response interfaces to `types/api.types.ts`
2. Create `services/<ms-name>/<ms-name>.service.ts` extending `BaseApiClient`
3. Add the service as a fixture in `fixtures/api.fixtures.ts`
4. Add a project in `playwright.config.ts` with its own `testMatch` and `baseURL`
5. Create `tests/api/<ms-name>/` and add spec files
6. Add `test:<ms-name>` and `test:<ms-name>:staging` scripts in `package.json`
7. Add a step in `azure-pipelines.yml`

**New API** — a new endpoint on an existing microservice (start here if the MS already has a service and folder):

1. Add the request/response interface to `types/api.types.ts`
2. Add a method to the service — plus a `Raw` variant if negative tests are needed
3. Add test(s) to the spec file under `tests/api/<ms-name>/`

**New test(s)** — more coverage for an existing endpoint (start here if the service method already exists):

Add `test()` to the existing spec file.

---

### UI: New Page > New Selectors > New Interactions > New tests

**New Page** — testing a new page or major component for the first time:

1. Create `page-objects/<page>.page.ts` — locators in the constructor, actions as methods
2. Add it as a fixture in `fixtures/ui.fixtures.ts`
3. Create `tests/ui/<page>.spec.ts`

**New Selectors** — new UI elements on an existing page (start here if the page object already exists):

Add a locator in the page object's constructor:

```ts
private readonly searchInput: Locator;

constructor(page: Page) {
  // existing locators...
  this.searchInput = page.getByLabel('Search todos');
}
```

**New Interactions** — actions for existing selectors (start here if the locator is already defined):

Add a method to the page object. Use `expect(locator).toHaveX()` rather than raw accessors when the action triggers an async state change:

```ts
async searchTodos(query: string): Promise<void> {
  await this.searchInput.fill(query);
  await this.searchInput.press('Enter');
}
```

For actions that add items to the list, always wait for the item to appear before returning — see the `addTodo` invariant above.

**New tests** — test cases for existing interactions (start here if the page action is already defined):

Add `test()` to the existing spec file.

---

## Azure DevOps

In your deployment pipeline, add these steps after the step that deploys to staging. Set `STAGING_API_URL` and `STAGING_UI_URL` as secret pipeline variables.

Install dependencies once per job:

```yaml
- script: |
    npm ci
    npx playwright install chromium --with-deps
  displayName: Install
  workingDirectory: PlaywrightFramework
```

**API tests** — run one step per service subfolder so failures are attributed to the right service:

```yaml
- script: npx playwright test tests/api/todos-api --project=api
  displayName: API tests — todos-api
  workingDirectory: PlaywrightFramework
  env:
    BASE_API_URL: $(STAGING_API_URL)
```

Add a step for each subfolder under `tests/api/` when adding a new service.

**UI tests**:

```yaml
- script: npx playwright test --project=ui
  displayName: UI tests
  workingDirectory: PlaywrightFramework
  env:
    BASE_API_URL: $(STAGING_API_URL)
    BASE_UI_URL: $(STAGING_UI_URL)
```

**Publish the report** so it's available in the pipeline run regardless of pass/fail:

```yaml
- task: PublishPipelineArtifact@1
  condition: always()
  inputs:
    targetPath: PlaywrightFramework/playwright-report
    artifact: playwright-report
  displayName: Publish Playwright report
```
