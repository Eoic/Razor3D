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
