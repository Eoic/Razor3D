import { createSlicerViewer } from '@/scene/createSlicerViewer';
import type { SlicerViewer } from '@/scene/createSlicerViewer';
import { ToolRegistry } from '@/tools/registry';
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

  const sceneTreeList = root.querySelector<HTMLUListElement>('.scene-tree__list');
  const sceneTreePanel = sceneTreeList ? createSceneTreePanel(sceneTreeList, viewer.sceneGraph) : null;

  return {
    dispose(): void {
      sceneTreePanel?.dispose();
      registry.dispose();
      viewer.dispose();
    },
  };
}
