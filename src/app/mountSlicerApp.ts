import { createSlicerViewer } from '@/scene/createSlicerViewer';
import type { SlicerViewer } from '@/scene/createSlicerViewer';
import { ToolRegistry } from '@/tools/registry';
import { createThemeToggleTool } from '@/tools/themeToggleTool';
import { createWireframeTool } from '@/tools/wireframeTool';
import type { Disposable } from '@/types/disposable';
import { createSceneTreePanel } from '@/ui/sceneTreePanel';

interface MountSlicerAppOptions {
  createViewer?: (container: HTMLElement) => SlicerViewer;
}

export function mountSlicerApp(root: HTMLElement, options: MountSlicerAppOptions = {}): Disposable {
  const viewport = root.querySelector<HTMLElement>('[data-scene-root]');

  if (!viewport) {
    throw new Error('Missing [data-scene-root] element inside #app.');
  }

  const createViewer = options.createViewer ?? createSlicerViewer;
  const viewer = createViewer(viewport);

  const registry = new ToolRegistry();
  registry.register(createWireframeTool(viewer));
  registry.register(createThemeToggleTool());

  const homeButton = document.getElementById('btn-home-view');
  const onHomeClick = (): void => {
    viewer.resetCamera();
  };
  homeButton?.addEventListener('click', onHomeClick);

  const sceneTreeList = root.querySelector<HTMLUListElement>('.scene-tree__list');
  const sceneTreePanel = sceneTreeList ? createSceneTreePanel(sceneTreeList, viewer.sceneGraph) : null;

  return {
    dispose(): void {
      homeButton?.removeEventListener('click', onHomeClick);
      sceneTreePanel?.dispose();
      registry.dispose();
      viewer.dispose();
    },
  };
}
