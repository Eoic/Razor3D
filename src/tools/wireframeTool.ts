import type { EditorTool } from './types';

import type { Viewer } from '@/scene/createViewer';

export function createWireframeTool(viewer: Viewer): EditorTool {
  return {
    buttonId: 'tool-wireframe',
    onActivate(): void {
      viewer.setViewMode('wireframe');
    },
    onDeactivate(): void {
      viewer.setViewMode('solid');
    },
  };
}
