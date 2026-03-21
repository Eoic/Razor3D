import type { EditorTool } from './types';

export class ToolRegistry {
  private tools: Array<{ tool: EditorTool; button: HTMLButtonElement }> = [];
  private activeTools = new Set<string>();

  register(tool: EditorTool): void {
    const button = document.getElementById(tool.buttonId);

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Tool button #${tool.buttonId} not found in the document.`);
    }

    if (button.dataset.active === 'true') {
      this.activeTools.add(tool.buttonId);
    }

    button.addEventListener('click', () => {
      if (this.activeTools.has(tool.buttonId)) {
        this.activeTools.delete(tool.buttonId);
        tool.onDeactivate();
        button.dataset.active = 'false';
        button.setAttribute('aria-pressed', 'false');
      } else {
        this.activeTools.add(tool.buttonId);
        tool.onActivate();
        button.dataset.active = 'true';
        button.setAttribute('aria-pressed', 'true');
      }
    });

    this.tools.push({ tool, button });
  }

  dispose(): void {
    for (const { tool } of this.tools) {
      tool.dispose?.();
    }

    this.tools = [];
    this.activeTools.clear();
  }
}
