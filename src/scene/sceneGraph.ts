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
  private selectionOutlines = new WeakMap<Object3D, Mesh>();

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
    const obj = node.object3D;

    if (obj instanceof Mesh && obj.material instanceof MeshPhysicalMaterial) {
      obj.material.color.set(node.color);
    }
  }

  private applyHighlight(node: SceneNode): void {
    const sceneObject = node.object3D;

    if (sceneObject instanceof Mesh) {
      const existingOutline = this.selectionOutlines.get(sceneObject);

      if (existingOutline) {
        existingOutline.visible = true;
        return;
      }

      const outline = new Mesh(
        sceneObject.geometry,
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
      sceneObject.add(outline);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.selectionOutlines.set(sceneObject, outline);
    }
  }

  private removeHighlight(node: SceneNode): void {
    const sceneObject = node.object3D;
    const outline = this.selectionOutlines.get(sceneObject);

    if (outline && sceneObject instanceof Mesh) {
      outline.removeFromParent();

      if (outline.material instanceof MeshBasicMaterial) {
        outline.material.dispose();
      }

      this.selectionOutlines.delete(sceneObject);
    }
  }

  private notify(event: SceneChangeEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
