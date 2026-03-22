import { html, render } from 'lit-html';

import type { MenuDefinition, MenuItem, MenuItemAction } from './menuBar.types';

import type { Disposable } from '@/types/disposable';

function isAction(item: MenuItem): item is MenuItemAction {
  return item.type === 'action';
}

export interface MenuBarHandle extends Disposable {
  setStatus(text: string): void;
}

export function createMenuBar(container: HTMLElement, menus: MenuDefinition[]): MenuBarHandle {
  let openIndex = -1;
  let statusText = '';

  function renderMenuBar(): void {
    render(menuBarTemplate(), container);
  }

  function setOpen(index: number): void {
    openIndex = index;
    renderMenuBar();
  }

  function close(): void {
    setOpen(-1);
  }

  function menuBarTemplate() {
    return html`
      ${menus.map(
        (menu, i) => html`
          <div class="menu-bar__menu">
            <button
              class="menu-bar__trigger ${openIndex === i ? 'menu-bar__trigger--open' : ''}"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded="${openIndex === i}"
              @click=${() => {
                setOpen(openIndex === i ? -1 : i);
              }}
              @mouseenter=${() => {
                if (openIndex !== -1 && openIndex !== i) {
                  setOpen(i);
                }
              }}
              @keydown=${(e: KeyboardEvent) => {
                handleTriggerKeydown(e, i);
              }}
            >
              ${menu.label}
            </button>
            ${openIndex === i ? dropdownTemplate(menu.items) : ''}
          </div>
        `
      )}
      ${statusText ? html`<span class="menu-bar__status">${statusText}</span>` : ''}
    `;
  }

  function dropdownTemplate(items: MenuItem[]) {
    return html`
      <div class="menu-bar__dropdown" role="menu">
        ${items.map(item =>
          item.type === 'separator'
            ? html`<div class="menu-bar__separator" role="separator"></div>`
            : html`
                <button
                  class="menu-bar__item"
                  role="menuitem"
                  ?disabled=${item.disabled ?? false}
                  @click=${() => {
                    close();
                    item.onSelect();
                  }}
                  @keydown=${(e: KeyboardEvent) => {
                    handleItemKeydown(e, item);
                  }}
                >
                  <span class="menu-bar__item-label">${item.label}</span>
                  ${item.shortcut ? html`<kbd class="menu-bar__shortcut">${item.shortcut}</kbd>` : ''}
                </button>
              `
        )}
      </div>
    `;
  }

  function handleTriggerKeydown(e: KeyboardEvent, index: number): void {
    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        e.preventDefault();
        setOpen(index);
        requestAnimationFrame(() => {
          const firstItem = container.querySelector<HTMLButtonElement>(
            '.menu-bar__dropdown .menu-bar__item:not([disabled])'
          );
          firstItem?.focus();
        });
        break;
      case 'ArrowRight': {
        e.preventDefault();
        const next = (index + 1) % menus.length;
        focusTrigger(next);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = (index - 1 + menus.length) % menus.length;
        focusTrigger(prev);
        break;
      }
      case 'Escape':
        e.preventDefault();
        close();
        focusTrigger(index);
        break;
    }
  }

  function handleItemKeydown(e: KeyboardEvent, item: MenuItemAction): void {
    const dropdown = container.querySelector('.menu-bar__dropdown');
    if (!dropdown) {
      return;
    }

    const items = Array.from(dropdown.querySelectorAll<HTMLButtonElement>('.menu-bar__item:not([disabled])'));
    const current = document.activeElement as HTMLButtonElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = idx + 1 < items.length ? idx + 1 : 0;
        items[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = idx - 1 >= 0 ? idx - 1 : items.length - 1;
        items[prev]?.focus();
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        close();
        item.onSelect();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        if (openIndex >= 0) {
          focusTrigger(openIndex);
        }
        break;
    }
  }

  function focusTrigger(index: number): void {
    const triggers = container.querySelectorAll<HTMLButtonElement>('.menu-bar__trigger');
    triggers[index]?.focus();
    if (openIndex !== -1) {
      setOpen(index);
    }
  }

  function onDocumentClick(e: MouseEvent): void {
    if (openIndex === -1) {
      return;
    }
    if (!container.contains(e.target as Node)) {
      close();
    }
  }

  // Filter actions for keyboard shortcuts
  const allActions = menus.flatMap(m => m.items.filter(isAction));

  function onKeyboardShortcut(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) {
      return;
    }

    for (const action of allActions) {
      if (!action.shortcut || action.disabled) {
        continue;
      }

      const match = matchShortcut(action.shortcut, e);
      if (match) {
        e.preventDefault();
        action.onSelect();
        return;
      }
    }
  }

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeyboardShortcut);
  renderMenuBar();

  return {
    setStatus(text: string): void {
      statusText = text;
      renderMenuBar();
    },
    dispose(): void {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeyboardShortcut);
      render(html``, container);
    },
  };
}

function matchShortcut(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.split('+').map(s => s.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const needsShift = parts.includes('shift');

  if (needsShift !== e.shiftKey) {
    return false;
  }
  return e.key.toLowerCase() === key;
}
