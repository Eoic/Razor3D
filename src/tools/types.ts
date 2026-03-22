export interface EditorTool {
  buttonId: string;
  onActivate(): void;
  onDeactivate(): void;
  dispose?(): void;
}
