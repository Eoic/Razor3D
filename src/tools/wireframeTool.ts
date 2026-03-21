import type { EditorTool } from './types';

import type { SlicerViewer } from '@/scene/createSlicerViewer';

export function createWireframeTool(viewer: SlicerViewer): EditorTool {
  return {
    id: 'wireframe',
    label: 'Wireframe',
    createIcon(): SVGSVGElement {
      // Create the wireframe SVG icon — a cube outline with internal edges
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.classList.add('tool-button__icon');

      const frame = document.createElementNS(ns, 'path');
      frame.setAttribute('d', 'M6 8.5 12 5l6 3.5v7L12 19l-6-3.5z');
      frame.setAttribute('fill', 'none');
      frame.setAttribute('stroke', 'currentColor');
      frame.setAttribute('stroke-width', '1.4');
      frame.setAttribute('stroke-linejoin', 'round');

      const frontEdge = document.createElementNS(ns, 'path');
      frontEdge.setAttribute('d', 'M6 8.5 12 12l6-3.5M12 12v7');
      frontEdge.setAttribute('fill', 'none');
      frontEdge.setAttribute('stroke', 'currentColor');
      frontEdge.setAttribute('stroke-width', '1.4');
      frontEdge.setAttribute('stroke-linecap', 'round');
      frontEdge.setAttribute('stroke-linejoin', 'round');

      svg.append(frame, frontEdge);
      return svg;
    },
    onActivate(): void {
      viewer.setViewMode('wireframe');
    },
    onDeactivate(): void {
      viewer.setViewMode('solid');
    },
  };
}
