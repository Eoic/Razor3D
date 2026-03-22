# lit-html Integration Design

## Problem

UI components like `sceneTreePanel.ts` use imperative DOM creation (`document.createElement`, manual attribute setting, `append`). This is hard to read, maintain, and scale as more UI components are added.

## Decision

Adopt `lit-html` (standalone, ~3.2KB gzip) for declarative HTML templating. No full Lit framework, no Web Components, no Shadow DOM.

## New dependency

- **Runtime:** `lit-html`
- **Dev:** `eslint-plugin-lit`

## New file: `src/ui/html.ts`

Shared rendering utility that:

- Re-exports `html`, `render` from `lit-html`.
- Re-exports `repeat` from `lit-html/directives/repeat.js`.
- Exports a `renderTo()` helper with the following signature:

```ts
interface StateSource {
  onChange(callback: (...args: unknown[]) => void): () => void;
}

function renderTo(
  container: HTMLElement,
  stateSource: StateSource,
  templateFn: () => TemplateResult
): Disposable;
```

Behavior:
- Subscribes to the state source's `onChange` callback. The callback uses `(...args: unknown[])` to be structurally compatible with any callback signature (e.g., `SceneGraph.onChange` which passes a `SceneChangeEvent`). The arguments are ignored — `templateFn` re-reads current state on each call.
- Calls lit-html `render()` with the template function's result on each change.
- Does an initial render immediately.
- Returns a `Disposable` that unsubscribes on `dispose()`.

## Modified file: `src/ui/sceneTreePanel.ts`

Rewritten to use lit-html templates:

- `createTreeItem()` becomes a pure function returning `TemplateResult` using `html` tagged templates.
- Event handlers are inline (`@click`, `@input`) instead of event delegation.
- Uses `repeat()` directive for the node list, keyed by `node.id`.
- Uses `renderTo()` helper for lifecycle wiring.
- Public API unchanged: `createSceneTreePanel(container, sceneGraph): Disposable`.

### Nested tree rendering

`SceneNode` has a `children` property, but the current UI renders only top-level nodes from `sceneGraph.getNodes()`. This behavior is preserved — nested tree rendering is out of scope for this change.

### Template structure

```ts
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

### `data-selected` binding

CSS selectors use `[data-selected='true']`, so values must be strings `"true"` / `"false"` — not boolean attribute presence. Use `String(...)` to ensure string coercion.

## ESLint config

Add `eslint-plugin-lit` to the existing ESLint 9 flat config using the flat config format (not legacy `extends`), with recommended rules.

## Testing

- Existing tests in `tests/app.test.ts` must continue to pass without modification.
- lit-html works under JSDOM (used by Vitest) — `jsdom@24` supports `<template>` elements.
- Verify during implementation by running `npm test`.

## What stays the same

- All CSS/SASS
- `SceneGraph` API
- `Disposable` interface
- `index.html` structure
- Public API of `createSceneTreePanel`

## What gets removed

- `findNode()` helper (node reference available in closure)
- Event delegation logic
- All `document.createElement` calls in the file
