import { html, render } from 'lit-html';

import type { ProjectRecord } from '@/storage/types';

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  document.body.appendChild(overlay);
  return overlay;
}

function removeOverlay(overlay: HTMLDivElement): void {
  render(html``, overlay);
  overlay.remove();
}

export function promptProjectName(defaultName = ''): Promise<string | null> {
  return new Promise(resolve => {
    const overlay = createOverlay();

    function submit(form: HTMLFormElement): void {
      const input = form.querySelector<HTMLInputElement>('.dialog__input');
      const value = input?.value.trim();
      removeOverlay(overlay);
      resolve(value || null);
    }

    function cancel(): void {
      removeOverlay(overlay);
      resolve(null);
    }

    const template = html`
      <div class="dialog" role="dialog" aria-label="Save project">
        <h3 class="dialog__title">Save Project</h3>
        <form
          class="dialog__body"
          @submit=${(e: Event) => {
            e.preventDefault();
            submit(e.target as HTMLFormElement);
          }}
        >
          <label class="dialog__label" for="project-name-input">Project name</label>
          <input
            id="project-name-input"
            class="dialog__input"
            type="text"
            .value=${defaultName}
            placeholder="My Project"
            autofocus
          />
          <div class="dialog__actions">
            <button type="button" class="dialog__button dialog__button--secondary" @click=${cancel}>Cancel</button>
            <button type="submit" class="dialog__button dialog__button--primary">Save</button>
          </div>
        </form>
      </div>
    `;

    render(template, overlay);

    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        cancel();
      }
    });
  });
}

export function pickProject(projects: ProjectRecord[]): Promise<string | null> {
  return new Promise(resolve => {
    const overlay = createOverlay();

    function select(id: string): void {
      removeOverlay(overlay);
      resolve(id);
    }

    function cancel(): void {
      removeOverlay(overlay);
      resolve(null);
    }

    const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

    const template = html`
      <div class="dialog" role="dialog" aria-label="Open project">
        <h3 class="dialog__title">Open Project <span class="dialog__count">${sorted.length}</span></h3>
        <div class="dialog__body">
          ${sorted.length === 0
            ? html`<p class="dialog__empty">No saved projects.</p>`
            : html`
                <ul class="dialog__list">
                  ${sorted.map(
                    p => html`
                      <li>
                        <button
                          class="dialog__list-item"
                          @click=${() => {
                            select(p.id);
                          }}
                        >
                          <span class="dialog__list-item-name">${p.name}</span>
                          <span class="dialog__list-item-date">${formatDate(p.updatedAt)}</span>
                        </button>
                      </li>
                    `
                  )}
                </ul>
              `}
          <div class="dialog__actions">
            <button type="button" class="dialog__button dialog__button--secondary" @click=${cancel}>Cancel</button>
          </div>
        </div>
      </div>
    `;

    render(template, overlay);

    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        cancel();
      }
    });
  });
}

export function confirmDelete(projectName: string): Promise<boolean> {
  return new Promise(resolve => {
    const overlay = createOverlay();

    function confirm(): void {
      removeOverlay(overlay);
      resolve(true);
    }

    function cancel(): void {
      removeOverlay(overlay);
      resolve(false);
    }

    const template = html`
      <div class="dialog" role="alertdialog" aria-label="Delete project">
        <h3 class="dialog__title">Delete Project</h3>
        <div class="dialog__body">
          <p class="dialog__message">
            Are you sure you want to delete <strong>${projectName}</strong>? This action cannot be undone.
          </p>
          <div class="dialog__actions">
            <button type="button" class="dialog__button dialog__button--secondary" @click=${cancel}>Cancel</button>
            <button type="button" class="dialog__button dialog__button--danger" @click=${confirm}>Delete</button>
          </div>
        </div>
      </div>
    `;

    render(template, overlay);

    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        cancel();
      }
    });
  });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
