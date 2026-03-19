import { createSlicerViewer } from '@/scene/createSlicerViewer';
import type { ModelViewMode } from '@/scene/modelViewMode';

export interface Disposable {
  dispose(): void;
}

interface ViewerHandle extends Disposable {
  setViewMode?(viewMode: ModelViewMode): void;
}

interface MountSlicerAppOptions {
  createViewer?: (container: HTMLElement) => ViewerHandle;
}

export function mountSlicerApp(root: HTMLElement, options: MountSlicerAppOptions = {}): Disposable {
  root.replaceChildren();

  const sceneRoot = document.createElement('div');
  sceneRoot.className = 'app-shell';

  const viewport = document.createElement('div');
  viewport.className = 'scene-frame';
  viewport.dataset.sceneRoot = 'true';

  const hud = document.createElement('aside');
  hud.className = 'hud';

  const controlsTitle = document.createElement('h3');
  controlsTitle.textContent = 'Controls';

  const controlsList = document.createElement('ul');
  controlsList.innerHTML = `
    <li>Orbit: Left Drag</li>
    <li>Pan: Right Drag</li>
    <li>Zoom: Wheel</li>
  `;

  hud.append(controlsTitle, controlsList);

  const toolRail = document.createElement('aside');
  toolRail.className = 'tool-rail';

  const toolbar = document.createElement('div');
  toolbar.className = 'tool-rail__group';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'View tools');

  toolRail.append(toolbar);

  sceneRoot.append(viewport, hud, toolRail);
  root.append(sceneRoot);

  const createViewer = options.createViewer ?? createSlicerViewer;
  const viewer = createViewer(viewport);
  let activeViewMode: ModelViewMode = 'solid';
  const wireframeButton = document.createElement('button');
  wireframeButton.type = 'button';
  wireframeButton.className = 'tool-button';
  wireframeButton.dataset.viewMode = 'wireframe';
  wireframeButton.setAttribute('aria-label', 'Wireframe');
  wireframeButton.title = 'Wireframe';
  wireframeButton.append(createToolIcon('wireframe'));
  wireframeButton.addEventListener('click', () => {
    activeViewMode = activeViewMode === 'wireframe' ? 'solid' : 'wireframe';
    viewer.setViewMode?.(activeViewMode);
    syncToolbar();
  });

  const syncToolbar = (): void => {
    const isActive = activeViewMode === 'wireframe';
    wireframeButton.dataset.active = String(isActive);
    wireframeButton.setAttribute('aria-pressed', String(isActive));
  };

  toolbar.append(wireframeButton);

  viewer.setViewMode?.(activeViewMode);
  syncToolbar();

  return {
    dispose(): void {
      viewer.dispose();
      root.replaceChildren();
    },
  };
}

function createToolIcon(viewMode: ModelViewMode): SVGSVGElement {
  const iconNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(iconNamespace, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('tool-button__icon');

  if (viewMode === 'solid') {
    const frontFace = document.createElementNS(iconNamespace, 'path');
    frontFace.setAttribute('d', 'M6 8.5 12 5l6 3.5v7L12 19l-6-3.5z');
    frontFace.setAttribute('fill', 'currentColor');
    frontFace.setAttribute('fill-opacity', '0.18');

    const outline = document.createElementNS(iconNamespace, 'path');
    outline.setAttribute('d', 'M12 4.2 5.3 8v8L12 19.8 18.7 16V8zm0 1.6 5.2 3v6.4L12 18.2l-5.2-3V8.8z');
    outline.setAttribute('fill', 'currentColor');

    svg.append(frontFace, outline);
    return svg;
  }

  const frame = document.createElementNS(iconNamespace, 'path');
  frame.setAttribute('d', 'M6 8.5 12 5l6 3.5v7L12 19l-6-3.5z');
  frame.setAttribute('fill', 'none');
  frame.setAttribute('stroke', 'currentColor');
  frame.setAttribute('stroke-width', '1.4');
  frame.setAttribute('stroke-linejoin', 'round');

  const frontEdge = document.createElementNS(iconNamespace, 'path');
  frontEdge.setAttribute('d', 'M6 8.5 12 12l6-3.5M12 12v7');
  frontEdge.setAttribute('fill', 'none');
  frontEdge.setAttribute('stroke', 'currentColor');
  frontEdge.setAttribute('stroke-width', '1.4');
  frontEdge.setAttribute('stroke-linecap', 'round');
  frontEdge.setAttribute('stroke-linejoin', 'round');

  svg.append(frame, frontEdge);
  return svg;
}
