export interface EditorTool {
  /** Unique identifier for the tool */
  id: string;
  /** Human-readable label (used for aria-label and title) */
  label: string;
  /** Create the SVG icon for the toolbar button */
  createIcon(): SVGSVGElement;
  /** Called when the tool is toggled on */
  onActivate(): void;
  /** Called when the tool is toggled off */
  onDeactivate(): void;
  /** Optional cleanup */
  dispose?(): void;
}
