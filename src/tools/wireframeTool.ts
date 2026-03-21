import type { EditorTool } from './types';

import type { SlicerViewer } from '@/scene/createSlicerViewer';

export function createWireframeTool(viewer: SlicerViewer): EditorTool {
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
