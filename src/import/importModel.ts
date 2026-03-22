import { BufferGeometry, Group, Mesh } from 'three';
import type { Material, MeshPhysicalMaterial, ShaderMaterial } from 'three';

import type { ModelFormat } from './modelLoaders';
import { loadFbx, loadGltf, loadStl } from './modelLoaders';
import { createPreparedMesh } from './modelPrep';

export interface ImportedModel {
  group: Group;
  solidMaterial: MeshPhysicalMaterial;
  wireframeMaterial: ShaderMaterial;
}

export async function importModel(buffer: ArrayBuffer, format: ModelFormat): Promise<ImportedModel> {
  switch (format) {
    case 'stl': {
      const geometry = await loadStl(buffer);
      const prepared = createPreparedMesh(geometry);
      const group = new Group();
      group.add(prepared.mesh);
      return {
        group,
        solidMaterial: prepared.solidMaterial,
        wireframeMaterial: prepared.wireframeMaterial,
      };
    }
    case 'gltf':
    case 'glb': {
      const scene = await loadGltf(buffer);
      return prepareGroupModel(scene);
    }
    case 'fbx': {
      const scene = await loadFbx(buffer);
      return prepareGroupModel(scene);
    }
  }
}

function prepareGroupModel(source: Group): ImportedModel {
  const group = new Group();
  let lastSolidMaterial: MeshPhysicalMaterial | null = null;
  let lastWireframeMaterial: ShaderMaterial | null = null;

  const meshes: Mesh<BufferGeometry, Material>[] = [];

  source.traverse(child => {
    if (child instanceof Mesh) {
      meshes.push(child as Mesh<BufferGeometry, Material>);
    }
  });

  for (const originalMesh of meshes) {
    const sourceGeometry = originalMesh.geometry instanceof BufferGeometry ? originalMesh.geometry : null;

    if (!sourceGeometry) {
      continue;
    }

    const prepared = createPreparedMesh(sourceGeometry);
    group.add(prepared.mesh);
    lastSolidMaterial = prepared.solidMaterial;
    lastWireframeMaterial = prepared.wireframeMaterial;
  }

  if (!lastSolidMaterial || !lastWireframeMaterial) {
    // Fallback: create materials from an empty geometry so the interface is satisfied
    const fallback = createPreparedMesh(new BufferGeometry());
    group.add(fallback.mesh);
    lastSolidMaterial = fallback.solidMaterial;
    lastWireframeMaterial = fallback.wireframeMaterial;
  }

  return {
    group,
    solidMaterial: lastSolidMaterial,
    wireframeMaterial: lastWireframeMaterial,
  };
}
