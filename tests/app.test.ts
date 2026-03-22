import { Group, PerspectiveCamera, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { describe, expect, it, vi } from 'vitest';

import { mountApp } from '@/app/mountApp';
import { SceneGraph } from '@/scene/sceneGraph';

const TEST_HTML = `
  <div id="app" class="app-shell">
    <nav id="menu-bar" class="menu-bar" role="menubar" aria-label="Application menu"></nav>
    <div class="scene-frame" data-scene-root="true"></div>
    <button id="btn-home-view" type="button" class="action-button" aria-label="Reset camera" title="Reset camera"></button>
    <aside class="tool-rail">
      <div class="tool-rail__group" role="toolbar" aria-label="View tools">
        <button id="tool-wireframe" type="button" class="tool-button" aria-label="Wireframe" aria-pressed="false" title="Wireframe"></button>
        <button id="tool-theme-toggle" type="button" class="tool-button" aria-label="Toggle light mode" aria-pressed="true" data-active="true" title="Toggle light mode">
          <i class="fa-solid fa-sun"></i>
        </button>
      </div>
    </aside>
    <aside class="scene-tree">
      <h3 class="scene-tree__title">Scene</h3>
      <ul class="scene-tree__list" role="tree" aria-label="Scene objects"></ul>
    </aside>
  </div>
`;

function setup(): {
  app: { dispose(): void };
  setViewMode: ReturnType<typeof vi.fn>;
  resetCamera: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  sceneGraph: SceneGraph;
} {
  document.body.innerHTML = TEST_HTML;

  const dispose = vi.fn();
  const setViewMode = vi.fn();
  const resetCamera = vi.fn();
  const sceneGraph = new SceneGraph();
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const controls = new OrbitControls(camera);
  const createViewer = vi.fn(() => ({
    dispose,
    setViewMode,
    resetCamera,
    sceneGraph,
    scene,
    camera,
    controls,
  }));
  const root = document.querySelector<HTMLElement>('#app');

  if (!root) {
    throw new Error('Missing test root');
  }

  const app = mountApp(root, { createViewer });
  return { app, setViewMode, resetCamera, dispose, sceneGraph };
}

describe('mountApp', () => {
  it('wires up the viewer and toggles wireframe mode on and off', () => {
    const { app, setViewMode, dispose } = setup();

    const wireframeButton = document.getElementById('tool-wireframe') as HTMLButtonElement;

    wireframeButton.click();

    expect(setViewMode).toHaveBeenLastCalledWith('wireframe');
    expect(wireframeButton.getAttribute('aria-pressed')).toBe('true');

    wireframeButton.click();

    expect(setViewMode).toHaveBeenLastCalledWith('solid');
    expect(wireframeButton.getAttribute('aria-pressed')).toBe('false');

    app.dispose();

    expect(dispose).toHaveBeenCalledOnce();
  });

  it('toggles light theme on and back to dark', () => {
    const { app } = setup();

    const themeButton = document.getElementById('tool-theme-toggle') as HTMLButtonElement;
    const icon = themeButton.querySelector('i');

    // Starts active (dark theme)
    expect(themeButton.getAttribute('aria-pressed')).toBe('true');

    // Click deactivates → light theme
    themeButton.click();

    expect(themeButton.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(icon?.className).toBe('fa-solid fa-moon');

    // Click activates → dark theme
    themeButton.click();

    expect(themeButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(icon?.className).toBe('fa-solid fa-sun');

    app.dispose();
  });

  it('resets camera when home button is clicked', () => {
    const { app, resetCamera } = setup();

    const homeButton = document.getElementById('btn-home-view') as HTMLButtonElement;
    homeButton.click();

    expect(resetCamera).toHaveBeenCalledOnce();

    app.dispose();
  });

  it('shows a model icon alongside scene tree items', () => {
    const { app, sceneGraph } = setup();

    sceneGraph.addNode({
      id: 'example-model',
      label: 'Example Model',
      visible: true,
      color: '#ffffff',
      object3D: new Group(),
      children: [],
    });

    const item = document.querySelector('.scene-tree__item');
    const icon = document.querySelector('.scene-tree__item-icon');

    expect(item).not.toBeNull();
    expect(icon?.className).toContain('fa-cube');

    app.dispose();
  });
});
