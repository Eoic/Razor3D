import type { EditorTool } from './types';

export class ToolRegistry {
  private tools = new Map<string, { tool: EditorTool; button: HTMLButtonElement }>();
  private activeTools = new Set<string>();

  register(tool: EditorTool): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-button';
    button.dataset.toolId = tool.id;
    button.dataset.active = 'false';
    button.setAttribute('aria-label', tool.label);
    button.setAttribute('aria-pressed', 'false');
    button.title = tool.label;

    button.append(tool.createIcon());

    button.addEventListener('click', () => {
      if (this.activeTools.has(tool.id)) {
        this.activeTools.delete(tool.id);
        tool.onDeactivate();
        button.dataset.active = 'false';
        button.setAttribute('aria-pressed', 'false');
      } else {
        this.activeTools.add(tool.id);
        tool.onActivate();
        button.dataset.active = 'true';
        button.setAttribute('aria-pressed', 'true');
      }
    });

    this.tools.set(tool.id, { tool, button });
  }

  mount(container: HTMLElement): void {
    for (const { button } of this.tools.values()) {
      container.append(button);
    }
  }

  dispose(): void {
    for (const { tool } of this.tools.values()) {
      tool.dispose?.();
    }
    this.tools.clear();
    this.activeTools.clear();
  }
}
