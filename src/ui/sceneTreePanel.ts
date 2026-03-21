import type { SceneGraph, SceneNode } from '@/scene/sceneGraph';
import type { Disposable } from '@/types/disposable';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSceneTreePanel(container: HTMLUListElement, sceneGraph: SceneGraph): Disposable {
  // ── Event delegation ───────────────────────────────────────────────

  container.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>('.scene-tree__item');
    if (!item) {
      return;
    }
    const nodeId = item.dataset.nodeId;
    if (!nodeId) {
      return;
    }

    // Visibility button clicked
    if (target.closest('.scene-tree__visibility')) {
      const node = findNode(sceneGraph.getNodes(), nodeId);
      if (node) {
        sceneGraph.setVisible(nodeId, !node.visible);
      }
      return;
    }

    // Color input clicked — don't toggle selection
    if (target.closest('.scene-tree__color')) {
      return;
    }

    // Otherwise toggle selection
    sceneGraph.select(sceneGraph.getSelectedId() === nodeId ? null : nodeId);
  });

  container.addEventListener('input', e => {
    const target = e.target as HTMLInputElement;
    if (target.type !== 'color') {
      return;
    }
    const item = target.closest<HTMLElement>('.scene-tree__item');
    const nodeId = item?.dataset.nodeId;
    if (nodeId) {
      sceneGraph.setColor(nodeId, target.value);
    }
  });

  // ── Render ─────────────────────────────────────────────────────────

  function render(): void {
    container.replaceChildren();
    const nodes = sceneGraph.getNodes();
    const selectedId = sceneGraph.getSelectedId();

    for (const node of nodes) {
      container.append(createTreeItem(node, selectedId));
    }
  }

  const unsubscribe = sceneGraph.onChange(render);
  render();

  return {
    dispose(): void {
      unsubscribe();
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

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

  // Label
  const label = document.createElement('span');
  label.className = 'scene-tree__label';
  label.textContent = node.label;

  // Visibility toggle button
  const visBtn = document.createElement('button');
  visBtn.type = 'button';
  visBtn.className = 'scene-tree__visibility';
  visBtn.setAttribute('aria-label', node.visible ? 'Hide' : 'Show');
  visBtn.title = node.visible ? 'Hide' : 'Show';
  visBtn.dataset.hidden = String(!node.visible);
  visBtn.append(createEyeIcon());

  // Color input
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'scene-tree__color';
  colorInput.value = node.color;
  colorInput.title = 'Object color';

  li.append(label, visBtn, colorInput);

  return li;
}

function createEyeIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('scene-tree__visibility-icon');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M10 4.5C5.5 4.5 2 10 2 10s3.5 5.5 8 5.5 8-5.5 8-5.5-3.5-5.5-8-5.5Z');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.3');
  path.setAttribute('stroke-linejoin', 'round');

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '10');
  circle.setAttribute('cy', '10');
  circle.setAttribute('r', '2.5');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '1.3');

  svg.append(path, circle);
  return svg;
}
