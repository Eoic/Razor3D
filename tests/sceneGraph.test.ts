import { describe, expect, it } from 'vitest';
import { BackSide, BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';

import { SceneGraph } from '@/scene/sceneGraph';

describe('SceneGraph selection', () => {
  it('adds an outline mesh instead of tinting the selected model material', () => {
    const sceneGraph = new SceneGraph();
    const material = new MeshPhysicalMaterial({ color: '#d36e4a' });
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
    const initialEmissive = material.emissive.clone();
    const initialEmissiveIntensity = material.emissiveIntensity;

    sceneGraph.addNode({
      id: 'model',
      label: 'Model',
      visible: true,
      color: '#d36e4a',
      object3D: mesh,
      children: [],
    });

    sceneGraph.select('model');

    const outline = mesh.children.find(child => child.name === '__selection-outline');

    expect(material.emissive.equals(initialEmissive)).toBe(true);
    expect(material.emissiveIntensity).toBe(initialEmissiveIntensity);
    expect(outline).toBeInstanceOf(Mesh);
    expect((outline as Mesh).material).toBeInstanceOf(MeshBasicMaterial);
    expect(((outline as Mesh).material as MeshBasicMaterial).side).toBe(BackSide);
  });

  it('removes the outline when selection is cleared', () => {
    const sceneGraph = new SceneGraph();
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshPhysicalMaterial({ color: '#d36e4a' }));

    sceneGraph.addNode({
      id: 'model',
      label: 'Model',
      visible: true,
      color: '#d36e4a',
      object3D: mesh,
      children: [],
    });

    sceneGraph.select('model');
    sceneGraph.select(null);

    expect(mesh.children.find(child => child.name === '__selection-outline')).toBeUndefined();
  });

  it('does not create an outline for non-mesh objects', () => {
    const sceneGraph = new SceneGraph();
    const group = new Group();

    sceneGraph.addNode({
      id: 'group',
      label: 'Group',
      visible: true,
      color: '#ffffff',
      object3D: group,
      children: [],
    });

    sceneGraph.select('group');

    expect(group.children).toHaveLength(0);
  });
});
