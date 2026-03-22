import { describe, expect, it, vi } from 'vitest';

import { createMenuBar } from '@/ui/menuBar';
import type { MenuDefinition } from '@/ui/menuBar.types';

function createContainer(): HTMLElement {
  const el = document.createElement('nav');
  document.body.appendChild(el);
  return el;
}

function fileMenu(overrides: { onImport?: () => void; onNew?: () => void } = {}): MenuDefinition {
  return {
    label: 'File',
    items: [
      { type: 'action', label: 'New Project', shortcut: 'Ctrl+N', onSelect: overrides.onNew ?? vi.fn() },
      { type: 'separator' },
      { type: 'action', label: 'Import Model…', shortcut: 'Ctrl+I', onSelect: overrides.onImport ?? vi.fn() },
      { type: 'action', label: 'Disabled Item', disabled: true, onSelect: vi.fn() },
    ],
  };
}

describe('createMenuBar', () => {
  it('renders a trigger button for each menu', () => {
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu()]);

    const trigger = container.querySelector('.menu-bar__trigger') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(trigger.textContent).toContain('File');

    bar.dispose();
  });

  it('opens dropdown on trigger click and closes on second click', () => {
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu()]);

    const trigger = container.querySelector('.menu-bar__trigger') as HTMLButtonElement;

    trigger.click();
    expect(container.querySelector('.menu-bar__dropdown')).not.toBeNull();

    trigger.click();
    expect(container.querySelector('.menu-bar__dropdown')).toBeNull();

    bar.dispose();
  });

  it('calls onSelect when a menu item is clicked and closes dropdown', () => {
    const onImport = vi.fn();
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu({ onImport })]);

    const trigger = container.querySelector('.menu-bar__trigger') as HTMLButtonElement;
    trigger.click();

    const items = container.querySelectorAll<HTMLButtonElement>('.menu-bar__item');
    const importItem = Array.from(items).find(i => i.textContent.includes('Import')) as HTMLButtonElement;
    importItem.click();

    expect(onImport).toHaveBeenCalledOnce();
    expect(container.querySelector('.menu-bar__dropdown')).toBeNull();

    bar.dispose();
  });

  it('displays keyboard shortcuts', () => {
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu()]);

    const trigger = container.querySelector('.menu-bar__trigger') as HTMLButtonElement;
    trigger.click();

    const shortcut = container.querySelector('.menu-bar__shortcut') as HTMLElement;
    expect(shortcut.textContent).toBe('Ctrl+N');

    bar.dispose();
  });

  it('closes dropdown when clicking outside', () => {
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu()]);

    const trigger = container.querySelector('.menu-bar__trigger') as HTMLButtonElement;
    trigger.click();
    expect(container.querySelector('.menu-bar__dropdown')).not.toBeNull();

    document.body.click();
    expect(container.querySelector('.menu-bar__dropdown')).toBeNull();

    bar.dispose();
  });

  it('cleans up on dispose', () => {
    const container = createContainer();
    const bar = createMenuBar(container, [fileMenu()]);

    bar.dispose();
    expect(container.querySelector('.menu-bar__trigger')).toBeNull();
  });
});
