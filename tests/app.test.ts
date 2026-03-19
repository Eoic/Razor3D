import { describe, expect, it, vi } from 'vitest';

import { mountSlicerApp } from '@/app/mountSlicerApp';

describe('mountSlicerApp', () => {
  it('renders the Slicer shell and starts the viewer', () => {
    document.body.innerHTML = '<div id="app"></div>';

    const dispose = vi.fn();
    const createViewer = vi.fn(() => ({ dispose }));
    const root = document.querySelector<HTMLElement>('#app');

    if (!root) {
      throw new Error('Missing test root');
    }

    const app = mountSlicerApp(root, { createViewer });

    expect(root.querySelector('[data-scene-root]')).not.toBeNull();
    expect(root.querySelector('h1')?.textContent).toBe('Slicer');
    expect(createViewer).toHaveBeenCalledOnce();

    app.dispose();

    expect(dispose).toHaveBeenCalledOnce();
  });
});
