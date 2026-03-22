export interface MenuItemAction {
  type: 'action';
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onSelect(): void;
}

export interface MenuItemSeparator {
  type: 'separator';
}

export type MenuItem = MenuItemAction | MenuItemSeparator;

export interface MenuDefinition {
  label: string;
  items: MenuItem[];
}
