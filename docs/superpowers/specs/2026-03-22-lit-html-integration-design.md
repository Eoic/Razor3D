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

- Re-exports `html`, `nothing`, `render` from `lit-html`.
- Exports a `renderTo(container, stateSource, templateFn)` helper:
  - Subscribes to a state source's `onChange` callback.
  - Calls lit-html `render()` with the template function's result on each change.
  - Does an initial render immediately.
  - Returns a `Disposable` that unsubscribes on `dispose()`.

The state source interface is any object with an `onChange(callback): unsubscribe` method, matching the existing `SceneGraph` pattern.

## Modified file: `src/ui/sceneTreePanel.ts`

Rewritten to use lit-html templates:

- `createTreeItem()` becomes a pure function returning `TemplateResult` using `html` tagged templates.
- Event handlers are inline (`@click`, `@input`) instead of event delegation.
- Uses `repeat()` directive for the node list, keyed by `node.id`.
- Uses `renderTo()` helper for lifecycle wiring.
- Public API unchanged: `createSceneTreePanel(container, sceneGraph): Disposable`.

### Template structure

```ts
function treeItem(node: SceneNode, selectedId: string | null, sceneGraph: SceneGraph) {
  return html`
    <li class="scene-tree__item" role="treeitem"
        data-node-id=${node.id} data-selected=${node.id === selectedId}
        @click=${() => sceneGraph.select(sceneGraph.getSelectedId() === node.id ? null : node.id)}>
      <i class="scene-tree__item-icon fa-solid fa-cube" aria-hidden="true"></i>
      <span class="scene-tree__label">${node.label}</span>
      <button type="button" class="scene-tree__visibility"
              @click=${(e: Event) => { e.stopPropagation(); sceneGraph.setVisible(node.id, !node.visible); }}>
        <i class=${node.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'}></i>
      </button>
      <input type="color" class="scene-tree__color" .value=${node.color}
             @input=${(e: Event) => sceneGraph.setColor(node.id, (e.target as HTMLInputElement).value)}
             @click=${(e: Event) => e.stopPropagation()}>
    </li>`;
}
```

## ESLint config

Add `eslint-plugin-lit` to the existing ESLint flat config with recommended rules.

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
