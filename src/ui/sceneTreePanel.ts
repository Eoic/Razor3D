import type { SceneGraph, SceneNode } from '@/scene/sceneGraph';
import type { Disposable } from '@/types/disposable';

export function createSceneTreePanel(container: HTMLUListElement, sceneGraph: SceneGraph): Disposable {
  container.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>('.scene-tree__item');

    if (!item) {
      return;
    }

    const nodeId = item.dataset.nodeId;

    if (!nodeId) {
      return;
    }

    if (target.closest('.scene-tree__visibility')) {
      const node = findNode(sceneGraph.getNodes(), nodeId);

      if (node) {
        sceneGraph.setVisible(nodeId, !node.visible);
      }

      return;
    }

    if (target.closest('.scene-tree__color')) {
      return;
    }

    sceneGraph.select(sceneGraph.getSelectedId() === nodeId ? null : nodeId);
  });

  container.addEventListener('input', event => {
    const target = event.target as HTMLInputElement;

    if (target.type !== 'color') {
      return;
    }

    const item = target.closest<HTMLElement>('.scene-tree__item');
    const nodeId = item?.dataset.nodeId;

    if (nodeId) {
      sceneGraph.setColor(nodeId, target.value);
    }
  });

  function render(): void {
    container.replaceChildren();
    const nodes = sceneGraph.getNodes();
    const selectedId = sceneGraph.getSelectedId();

    for (const node of nodes) {
      container.append(createTreeItem(node, selectedId));
    }
  }

  const unsubscribe = sceneGraph.onChange(event => {
    switch (event.type) {
      case 'node-added':
      case 'node-removed':
        render();
        break;
      case 'selection-changed':
        {
          const selectedId = event.data.selectedId as string | null;
          const uiNode = container.querySelector<HTMLElement>(`.scene-tree__item[data-node-id="${selectedId}"]`);

          if (!uiNode) {
            container.querySelectorAll('.scene-tree__item').forEach(item => {
              item.setAttribute('data-selected', 'false');
            });

            return;
          }

          uiNode.setAttribute('data-selected', 'true');
        }
        break;
      // case 'visibility-changed':
      // case 'color-changed':
    }
  });

  render();

  return {
    dispose(): void {
      unsubscribe();
    },
  };
}

function findNode(nodes: readonly SceneNode[], id: string): SceneNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findNode(node.children, id);

    if (found) {
      return found;
    }
  }

  return undefined;
}

function createTreeItem(node: SceneNode, selectedId: string | null): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'scene-tree__item';
  li.setAttribute('role', 'treeitem');
  li.dataset.nodeId = node.id;
  li.dataset.selected = String(node.id === selectedId);

  const itemIcon = document.createElement('i');
  itemIcon.className = 'scene-tree__item-icon fa-solid fa-cube';
  itemIcon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'scene-tree__label';
  label.textContent = node.label;

  const visBtn = document.createElement('button');
  visBtn.type = 'button';
  visBtn.className = 'scene-tree__visibility';
  visBtn.setAttribute('aria-label', node.visible ? 'Hide' : 'Show');
  visBtn.title = node.visible ? 'Hide' : 'Show';
  visBtn.dataset.hidden = String(!node.visible);

  const icon = document.createElement('i');
  icon.className = node.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  visBtn.append(icon);

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'scene-tree__color';
  colorInput.value = node.color;
  colorInput.title = 'Object color';
  li.append(itemIcon, label, visBtn, colorInput);

  return li;
}
