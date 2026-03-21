import { describe, expect, it, vi } from 'vitest';

import { mountSlicerApp } from '@/app/mountSlicerApp';
import { SceneGraph } from '@/scene/sceneGraph';

describe('mountSlicerApp', () => {
  it('wires up the viewer and toggles wireframe mode on and off', () => {
    document.body.innerHTML = `
      <div id="app" class="app-shell">
        <div class="scene-frame" data-scene-root="true"></div>
        <aside class="tool-rail">
          <div class="tool-rail__group" role="toolbar" aria-label="View tools">
            <button id="tool-wireframe" type="button" class="tool-button" aria-label="Wireframe" aria-pressed="false" title="Wireframe"></button>
          </div>
        </aside>
      </div>
    `;

    const dispose = vi.fn();
    const setViewMode = vi.fn();
    const sceneGraph = new SceneGraph();
    const createViewer = vi.fn(() => ({ dispose, setViewMode, sceneGraph }));
    const root = document.querySelector<HTMLElement>('#app');

    if (!root) {
      throw new Error('Missing test root');
    }

    const app = mountSlicerApp(root, { createViewer });

    expect(createViewer).toHaveBeenCalledOnce();

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
});
