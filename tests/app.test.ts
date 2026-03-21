import { describe, expect, it, vi } from 'vitest';

import { mountSlicerApp } from '@/app/mountSlicerApp';

describe('mountSlicerApp', () => {
  it('renders the Slicer shell and toggles wireframe mode on and off', () => {
    document.body.innerHTML = '<div id="app"></div>';

    const dispose = vi.fn();
    const setViewMode = vi.fn();
    const createViewer = vi.fn(() => ({ dispose, setViewMode }));
    const root = document.querySelector<HTMLElement>('#app');

    if (!root) {
      throw new Error('Missing test root');
    }

    const app = mountSlicerApp(root, { createViewer });

    expect(root.querySelector('[data-scene-root]')).not.toBeNull();
    expect(root.querySelector('.hud h3')?.textContent).toBe('Controls');
    expect(root.querySelector('.tool-rail')).not.toBeNull();
    expect(createViewer).toHaveBeenCalledOnce();

    const wireframeButton = root.querySelector<HTMLButtonElement>('[data-tool-id="wireframe"]');

    if (!wireframeButton) {
      throw new Error('Missing wireframe button');
    }

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
