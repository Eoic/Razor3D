import { createSlicerViewer } from '@/scene/createSlicerViewer';
import type { SlicerViewer } from '@/scene/createSlicerViewer';
import { ToolRegistry } from '@/tools/registry';
import { createWireframeTool } from '@/tools/wireframeTool';
import type { Disposable } from '@/types/disposable';

interface MountSlicerAppOptions {
  createViewer?: (container: HTMLElement) => SlicerViewer;
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

  const registry = new ToolRegistry();
  registry.register(createWireframeTool(viewer));
  registry.mount(toolbar);

  return {
    dispose(): void {
      registry.dispose();
      viewer.dispose();
      root.replaceChildren();
    },
  };
}
