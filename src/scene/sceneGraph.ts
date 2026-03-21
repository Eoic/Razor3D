import { Color, Mesh, MeshPhysicalMaterial } from 'three';
import type { Object3D } from 'three';

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
  private listeners = new Set<() => void>();
  private originalEmissives = new WeakMap<Object3D, { emissive: Color; emissiveIntensity: number }>();

  addNode(node: SceneNode): void {
    this.nodes.push(node);
    this.notify();
  }

  removeNode(id: string): void {
    this.nodes = this.nodes.filter(n => n.id !== id);
    if (this.selectedId === id) {
      this.selectedId = null;
    }
    this.notify();
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

    this.notify();
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setVisible(id: string, visible: boolean): void {
    const node = this.findNode(id);
    if (node) {
      node.visible = visible;
      node.object3D.visible = visible;
      this.notify();
    }
  }

  setColor(id: string, color: string): void {
    const node = this.findNode(id);
    if (node) {
      node.color = color;
      this.applyColor(node);
      this.notify();
    }
  }

  onChange(callback: () => void): () => void {
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
    const obj = node.object3D;
    if (obj instanceof Mesh && obj.material instanceof MeshPhysicalMaterial) {
      this.originalEmissives.set(obj, {
        emissive: obj.material.emissive.clone(),
        emissiveIntensity: obj.material.emissiveIntensity,
      });
      obj.material.emissive.set('#4488ff');
      obj.material.emissiveIntensity = 0.15;
    }
  }

  private removeHighlight(node: SceneNode): void {
    const obj = node.object3D;
    const original = this.originalEmissives.get(obj);
    if (original && obj instanceof Mesh && obj.material instanceof MeshPhysicalMaterial) {
      obj.material.emissive.copy(original.emissive);
      obj.material.emissiveIntensity = original.emissiveIntensity;
      this.originalEmissives.delete(obj);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
