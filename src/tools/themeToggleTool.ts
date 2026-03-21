import type { EditorTool } from './types';

import { darkTheme, defaultTheme, setTheme } from '@/theme/themeColors';

export function createThemeToggleTool(): EditorTool {
  return {
    buttonId: 'tool-theme-toggle',
    onActivate(): void {
      setTheme(darkTheme);
      document.documentElement.dataset.theme = 'dark';
      const icon = document.querySelector('#tool-theme-toggle i');

      if (icon) {
        icon.className = 'fa-solid fa-sun';
      }
    },
    onDeactivate(): void {
      setTheme(defaultTheme);
      delete document.documentElement.dataset.theme;
      const icon = document.querySelector('#tool-theme-toggle i');

      if (icon) {
        icon.className = 'fa-solid fa-moon';
      }
    },
  };
}
