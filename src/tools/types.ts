export interface EditorTool {
  /** ID of the button element in the HTML page */
  buttonId: string;
  /** Called when the tool is toggled on */
  onActivate(): void;
  /** Called when the tool is toggled off */
  onDeactivate(): void;
  /** Optional cleanup */
  dispose?(): void;
}
