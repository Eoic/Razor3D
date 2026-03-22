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
      const isActive = this.activeTools.has(tool.buttonId);

      if (isActive) {
        this.activeTools.delete(tool.buttonId);
        tool.onDeactivate();
      } else {
        this.activeTools.add(tool.buttonId);
        tool.onActivate();
      }

      button.dataset.active = String(!isActive);
      button.setAttribute('aria-pressed', String(!isActive));
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
