# lit-html Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace imperative DOM creation with lit-html declarative templates, starting with `sceneTreePanel.ts`, and establish shared rendering utilities for future UI components.

**Architecture:** Add `lit-html` as a runtime dependency. Create a shared `src/ui/html.ts` module that re-exports lit-html primitives and provides a `renderTo()` lifecycle helper. Rewrite `sceneTreePanel.ts` to use `html` tagged templates with inline event handlers and the `repeat()` directive.

**Tech Stack:** lit-html ^3.x, eslint-plugin-lit, Vite, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-22-lit-html-integration-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/ui/html.ts` | Re-exports `html`, `render`, `repeat` from lit-html. Exports `StateSource` interface and `renderTo()` helper. |
| Modify | `src/ui/sceneTreePanel.ts` | Rewrite to use lit-html templates, inline events, `repeat()`, and `renderTo()`. |
| Modify | `eslint.config.js` | Add `eslint-plugin-lit` with recommended rules. |
| Create | `tests/ui/html.test.ts` | Unit tests for `renderTo()`. |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install lit-html**

```bash
npm install lit-html
```

- [ ] **Step 2: Install eslint-plugin-lit**

```bash
npm install -D eslint-plugin-lit
```

- [ ] **Step 3: Verify installation**

Run: `npm ls lit-html && npm ls eslint-plugin-lit`
Expected: Both packages listed without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lit-html and eslint-plugin-lit dependencies"
```

---

### Task 2: Create `src/ui/html.ts` with `renderTo()` helper

**Files:**
- Create: `src/ui/html.ts`
- Create: `tests/ui/html.test.ts`

- [ ] **Step 1: Write failing tests for `renderTo()`**

Create `tests/ui/html.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { html, renderTo } from '@/ui/html';

function createMockStateSource() {
  const listeners = new Set<(...args: unknown[]) => void>();

  return {
    onChange(callback: (...args: unknown[]) => void) {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe('renderTo', () => {
  it('renders the template immediately', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();
    let count = 0;

    renderTo(container, source, () => {
      count++;
      return html`<p>hello</p>`;
    });

    expect(count).toBe(1);
    expect(container.querySelector('p')?.textContent).toBe('hello');
  });

  it('re-renders when the state source notifies', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();
    let value = 'first';

    renderTo(container, source, () => html`<p>${value}</p>`);

    expect(container.querySelector('p')?.textContent).toBe('first');

    value = 'second';
    source.notify();

    expect(container.querySelector('p')?.textContent).toBe('second');
  });

  it('unsubscribes on dispose', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();

    const { dispose } = renderTo(container, source, () => html`<p>test</p>`);

    expect(source.listenerCount).toBe(1);

    dispose();

    expect(source.listenerCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/html.test.ts`
Expected: FAIL — module `@/ui/html` not found.

- [ ] **Step 3: Write `src/ui/html.ts`**

```ts
import type { TemplateResult } from 'lit-html';
import { render } from 'lit-html';

import type { Disposable } from '@/types/disposable';

export { html, render } from 'lit-html';
export { repeat } from 'lit-html/directives/repeat.js';

export interface StateSource {
  onChange(callback: (...args: unknown[]) => void): () => void;
}

export function renderTo(
  container: HTMLElement,
  stateSource: StateSource,
  templateFn: () => TemplateResult,
): Disposable {
  const update = () => {
    render(templateFn(), container);
  };

  const unsubscribe = stateSource.onChange(update);

  update();

  return {
    dispose() {
      unsubscribe();
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/html.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Run type-check**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/html.ts tests/ui/html.test.ts
git commit -m "feat: add lit-html renderTo() utility"
```

---

### Task 3: Rewrite `sceneTreePanel.ts` to use lit-html

**Files:**
- Modify: `src/ui/sceneTreePanel.ts`

- [ ] **Step 1: Rewrite `sceneTreePanel.ts`**

Replace the entire contents of `src/ui/sceneTreePanel.ts` with:

```ts
import type { SceneGraph, SceneNode } from '@/scene/sceneGraph';
import type { Disposable } from '@/types/disposable';
import { html, repeat, renderTo } from '@/ui/html';

export function createSceneTreePanel(container: HTMLUListElement, sceneGraph: SceneGraph): Disposable {
  return renderTo(container, sceneGraph, () => html`
    ${repeat(
      sceneGraph.getNodes(),
      node => node.id,
      node => treeItem(node, sceneGraph.getSelectedId(), sceneGraph),
    )}
  `);
}

function treeItem(node: SceneNode, selectedId: string | null, sceneGraph: SceneGraph) {
  return html`
    <li class="scene-tree__item" role="treeitem"
        data-node-id=${node.id} data-selected=${String(node.id === selectedId)}
        @click=${() => sceneGraph.select(sceneGraph.getSelectedId() === node.id ? null : node.id)}>
      <i class="scene-tree__item-icon fa-solid fa-cube" aria-hidden="true"></i>
      <span class="scene-tree__label">${node.label}</span>
      <button type="button" class="scene-tree__visibility"
              aria-label=${node.visible ? 'Hide' : 'Show'}
              title=${node.visible ? 'Hide' : 'Show'}
              data-hidden=${String(!node.visible)}
              @click=${(e: Event) => { e.stopPropagation(); sceneGraph.setVisible(node.id, !node.visible); }}>
        <i class=${node.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
      </button>
      <input type="color" class="scene-tree__color" .value=${node.color}
             title="Object color"
             @input=${(e: Event) => sceneGraph.setColor(node.id, (e.target as HTMLInputElement).value)}
             @click=${(e: Event) => e.stopPropagation()}>
    </li>`;
}
```

- [ ] **Step 2: Run existing tests**

Run: `npm test`
Expected: All tests in `tests/app.test.ts` pass — specifically "shows a model icon alongside scene tree items" which exercises the scene tree rendering.

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/sceneTreePanel.ts
git commit -m "refactor: rewrite sceneTreePanel to use lit-html templates"
```

---

### Task 4: Add `eslint-plugin-lit` to ESLint config

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Add lit plugin to eslint config**

In `eslint.config.js`, add the import at the top:

```js
import litPlugin from 'eslint-plugin-lit';
```

Then add `litPlugin.configs['flat/recommended']` to the config array, after `prettier` and before the `files: ['**/*.{ts,tsx}']` block:

```js
export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    prettier,
    litPlugin.configs['flat/recommended'],
    {
        files: ['**/*.{ts,tsx}'],
        // ... existing config
    },
    // ... rest
);
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors. If there are lit-specific warnings, fix them.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add eslint-plugin-lit with recommended rules"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full CI pipeline**

Run: `npm run ci`
Expected: type-check, lint, test, and build all pass.

- [ ] **Step 2: Start dev server and verify visually**

Run: `npm run dev`
Open `http://localhost:3000` in a browser. Verify:
- Scene tree items render with icons, labels, visibility buttons, and color inputs.
- Clicking an item selects/deselects it (highlight appears).
- Clicking the eye icon toggles visibility.
- Changing the color input updates the model color.

- [ ] **Step 3: Commit any remaining fixes if needed**
