import { createSlicerViewer } from '@/scene/createSlicerViewer';

export interface Disposable {
  dispose(): void;
}

interface MountSlicerAppOptions {
  createViewer?: (container: HTMLElement) => Disposable;
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
  hud.innerHTML = `
    <p class="hud__kicker">Three.js Workspace</p>
    <h1>Slicer</h1>
    <p>Orbit the scene, inspect the shader grid, and use the procedural model as a working baseline.</p>
    <ul>
      <li>Orbit: Left Drag</li>
      <li>Pan: Right Drag</li>
      <li>Zoom: Wheel</li>
    </ul>
  `;

  sceneRoot.append(viewport, hud);
  root.append(sceneRoot);

  const createViewer = options.createViewer ?? createSlicerViewer;
  const viewer = createViewer(viewport);

  return {
    dispose(): void {
      viewer.dispose();
      root.replaceChildren();
    },
  };
}
