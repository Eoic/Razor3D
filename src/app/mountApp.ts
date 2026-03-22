import { openFilePicker } from '@/import/fileDialog';
import { importModel } from '@/import/importModel';
import { createProjectManager } from '@/project/projectManager';
import { createExampleModel } from '@/scene/createExampleModel';
import { createViewer, type Viewer } from '@/scene/createViewer';
import { ToolRegistry } from '@/tools/registry';
import { createThemeToggleTool } from '@/tools/themeToggleTool';
import { createWireframeTool } from '@/tools/wireframeTool';
import type { Disposable } from '@/types/disposable';
import { createMenuBar, type MenuBarHandle } from '@/ui/menuBar';
import type { MenuDefinition } from '@/ui/menuBar.types';
import { confirmDelete, pickProject, promptProjectName } from '@/ui/projectDialogs';
import { createSceneTreePanel } from '@/ui/sceneTreePanel';

interface MountOptions {
  createViewer?: (container: HTMLElement) => Viewer;
}

export function mountApp(root: HTMLElement, options: MountOptions = {}): Disposable {
  const viewport = root.querySelector<HTMLElement>('[data-scene-root]');

  if (!viewport) {
    throw new Error('Missing [data-scene-root] element inside #app.');
  }

  const viewerFactory = options.createViewer ?? createViewer;
  const viewer = viewerFactory(viewport);
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

  // ── Example model ─────────────────────────────────────────────────────

  const exampleModel = createExampleModel();
  viewer.scene.add(exampleModel.group);
  exampleModel.onReady(() => {
    viewer.sceneGraph.addNode({
      id: 'example-model',
      label: 'Example Model',
      visible: true,
      color: '#b0b0b0',
      object3D: exampleModel.group,
      children: [],
    });
  });

  // ── Project manager ───────────────────────────────────────────────────

  const pm = createProjectManager(viewer);
  let menuBar: MenuBarHandle | null = null;

  function updateStatus(): void {
    const name = pm.getCurrentProjectName() ?? 'Untitled';
    menuBar?.setStatus(name);
  }

  async function handleImportModel(): Promise<void> {
    const selection = await openFilePicker();
    if (!selection) {
      return;
    }

    const model = await importModel(selection.buffer, selection.format);
    viewer.scene.add(model.group);

    const nodeId = crypto.randomUUID();
    const fileId = crypto.randomUUID();

    viewer.sceneGraph.addNode({
      id: nodeId,
      label: selection.file.name,
      visible: true,
      color: '#b0b0b0',
      object3D: model.group,
      children: [],
    });

    pm.addModelFile(nodeId, fileId, selection.buffer, selection.format);
  }

  function handleNewProject(): void {
    pm.createNew();
    updateStatus();
  }

  async function handleOpenProject(): Promise<void> {
    const projects = await pm.listProjects();
    const id = await pickProject(projects);
    if (id) {
      await pm.open(id);
      updateStatus();
    }
  }

  async function handleSave(): Promise<void> {
    if (pm.getCurrentProjectId()) {
      await pm.save();
    } else {
      await handleSaveAs();
    }
    updateStatus();
  }

  async function handleSaveAs(): Promise<void> {
    const name = await promptProjectName(pm.getCurrentProjectName() ?? '');
    if (name) {
      await pm.save(name);
      updateStatus();
    }
  }

  async function handleRename(): Promise<void> {
    const name = await promptProjectName(pm.getCurrentProjectName() ?? '');
    if (name) {
      await pm.rename(name);
      updateStatus();
    }
  }

  async function handleDeleteProject(): Promise<void> {
    const projects = await pm.listProjects();
    const id = await pickProject(projects);
    if (!id) {
      return;
    }

    const project = projects.find(p => p.id === id);
    if (!project) {
      return;
    }

    const confirmed = await confirmDelete(project.name);
    if (confirmed) {
      await pm.deleteProject(id);
      updateStatus();
    }
  }

  // ── Menu bar ──────────────────────────────────────────────────────────

  const fileMenu: MenuDefinition = {
    label: 'File',
    items: [
      {
        type: 'action',
        label: 'New Project',
        shortcut: 'Ctrl+N',
        onSelect() {
          handleNewProject();
        },
      },
      {
        type: 'action',
        label: 'Open Project…',
        shortcut: 'Ctrl+O',
        onSelect() {
          void handleOpenProject();
        },
      },
      { type: 'separator' },
      {
        type: 'action',
        label: 'Save',
        shortcut: 'Ctrl+S',
        onSelect() {
          void handleSave();
        },
      },
      {
        type: 'action',
        label: 'Save As…',
        shortcut: 'Ctrl+Shift+S',
        onSelect() {
          void handleSaveAs();
        },
      },
      { type: 'separator' },
      {
        type: 'action',
        label: 'Import Model…',
        shortcut: 'Ctrl+I',
        onSelect() {
          void handleImportModel();
        },
      },
      { type: 'separator' },
      {
        type: 'action',
        label: 'Rename Project…',
        onSelect() {
          void handleRename();
        },
      },
      {
        type: 'action',
        label: 'Delete Project',
        onSelect() {
          void handleDeleteProject();
        },
      },
    ],
  };

  const menuBarContainer = root.querySelector<HTMLElement>('.menu-bar');
  menuBar = menuBarContainer ? createMenuBar(menuBarContainer, [fileMenu]) : null;
  updateStatus();

  return {
    dispose(): void {
      menuBar?.dispose();
      homeButton?.removeEventListener('click', onHomeClick);
      sceneTreePanel?.dispose();
      exampleModel.dispose();
      registry.dispose();
      viewer.dispose();
    },
  };
}
