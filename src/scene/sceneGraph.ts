import type { Object3D } from 'three';
import { BackSide, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';

const SELECTION_OUTLINE_COLOR = '#4488ff';
const SELECTION_OUTLINE_NAME = '__selection-outline';
const SELECTION_OUTLINE_SCALE = 1.03;

export interface SceneChangeEvent {
  type: string;
  data: object;
}

export interface SceneNode {
  id: string;
  label: string;
  visible: boolean;
  color: string;
  object3D: Object3D;
  children: SceneNode[];
}

export class SceneGraph {
  private nodes: SceneNode[] = [];
  private selectedId: string | null = null;
  private listeners = new Set<(event: SceneChangeEvent) => void>();
  private selectionOutlines = new Map<string, Mesh[]>();

  addNode(node: SceneNode): void {
    this.nodes.push(node);
    this.notify({ type: 'node-added', data: { nodeId: node.id } });
  }

  removeNode(id: string): void {
    const node = this.findNode(id);
    if (node) {
      this.removeHighlight(node);
    }

    this.nodes = this.nodes.filter(n => n.id !== id);

    if (this.selectedId === id) {
      this.selectedId = null;
    }

    this.notify({ type: 'node-removed', data: { nodeId: id } });
  }

  getNodes(): readonly SceneNode[] {
    return this.nodes;
  }

  select(id: string | null): void {
    if (this.selectedId !== null) {
      const prev = this.findNode(this.selectedId);

      if (prev) {
        this.removeHighlight(prev);
      }
    }

    this.selectedId = id;

    if (id !== null) {
      const node = this.findNode(id);

      if (node) {
        this.applyHighlight(node);
      }
    }

    this.notify({ type: 'selection-changed', data: { selectedId: id } });
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setVisible(id: string, visible: boolean): void {
    const node = this.findNode(id);

    if (node) {
      node.visible = visible;
      node.object3D.visible = visible;
      this.notify({ type: 'visibility-changed', data: { nodeId: id, visible } });
    }
  }

  setColor(id: string, color: string): void {
    const node = this.findNode(id);

    if (node) {
      node.color = color;
      this.applyColor(node);
      this.notify({ type: 'color-changed', data: { nodeId: id, color } });
    }
  }

  clear(): void {
    for (const node of [...this.nodes]) {
      this.removeNode(node.id);
    }
    this.selectedId = null;
  }

  onChange(callback: (event: SceneChangeEvent) => void): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private findNode(id: string): SceneNode | undefined {
    for (const node of this.nodes) {
      if (node.id === id) {
        return node;
      }

      const found = this.findInChildren(node.children, id);

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  private findInChildren(children: SceneNode[], id: string): SceneNode | undefined {
    for (const child of children) {
      if (child.id === id) {
        return child;
      }

      const found = this.findInChildren(child.children, id);

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  private applyColor(node: SceneNode): void {
    node.object3D.traverse(child => {
      if (child instanceof Mesh && child.name !== SELECTION_OUTLINE_NAME) {
        const solidMat = child.userData.solidMaterial as MeshPhysicalMaterial | undefined;

        if (solidMat) {
          solidMat.color.set(node.color);
        } else if (child.material instanceof MeshPhysicalMaterial) {
          child.material.color.set(node.color);
        }
      }
    });
  }

  private applyHighlight(node: SceneNode): void {
    const existing = this.selectionOutlines.get(node.id);

    if (existing) {
      for (const outline of existing) {
        outline.visible = true;
      }

      return;
    }

    const outlines: Mesh[] = [];

    node.object3D.traverse(child => {
      if (child instanceof Mesh && child.name !== SELECTION_OUTLINE_NAME) {
        const outline = new Mesh(
          child.geometry,
          new MeshBasicMaterial({
            color: SELECTION_OUTLINE_COLOR,
            side: BackSide,
            depthWrite: false,
            toneMapped: false,
          })
        );

        outline.name = SELECTION_OUTLINE_NAME;
        outline.renderOrder = 1;
        outline.scale.setScalar(SELECTION_OUTLINE_SCALE);
        outline.raycast = () => null;
        child.add(outline);
        outlines.push(outline);
      }
    });

    this.selectionOutlines.set(node.id, outlines);
  }

  private removeHighlight(node: SceneNode): void {
    const outlines = this.selectionOutlines.get(node.id);

    if (!outlines) {
      return;
    }

    for (const outline of outlines) {
      outline.removeFromParent();

      if (outline.material instanceof MeshBasicMaterial) {
        outline.material.dispose();
      }
    }

    this.selectionOutlines.delete(node.id);
  }

  private notify(event: SceneChangeEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
