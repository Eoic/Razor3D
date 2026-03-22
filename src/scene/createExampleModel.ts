import {
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  ShaderMaterial,
} from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import type { ModelViewMode } from './modelViewMode';

import { createPreparedMesh } from '@/import/modelPrep';
import { onThemeChange } from '@/theme/themeColors';

const MODEL_URL = '/models/example.stl';
const DEFAULT_VIEW_MODE: ModelViewMode = 'solid';

export interface ExampleModel {
  readonly group: Group;
  readonly mesh: Mesh<BufferGeometry, Material> | null;
  dispose(): void;
  setViewMode(viewMode: ModelViewMode): void;
  update(elapsedTime: number): void;
  onReady(callback: () => void): void;
}

export function createExampleModel(initialViewMode: ModelViewMode = DEFAULT_VIEW_MODE): ExampleModel {
  const group = new Group();
  const disposableResources: Array<{ dispose(): void }> = [];
  const readyCallbacks: Array<() => void> = [];
  let disposed = false;
  let mesh: Mesh<BufferGeometry, Material> | null = null;
  let solidMaterial: MeshPhysicalMaterial | null = null;
  let wireframeMaterial: ShaderMaterial | null = null;
  let viewMode = initialViewMode;

  const unsubscribeTheme = onThemeChange(nextTheme => {
    if (solidMaterial) {
      solidMaterial.color.set(nextTheme.modelColor);
    }

    if (wireframeMaterial) {
      const lineColorUniform = wireframeMaterial.uniforms['uLineColor'];

      if (lineColorUniform) {
        (lineColorUniform.value as Color).set(nextTheme.wireframeLineColor);
      }
    }
  });

  const loader = new STLLoader();

  void loader
    .loadAsync(MODEL_URL)
    .then(geometry => {
      if (disposed) {
        geometry.dispose();
        return;
      }

      const loadedModel = createPreparedMesh(geometry);
      mesh = loadedModel.mesh;
      solidMaterial = loadedModel.solidMaterial;
      wireframeMaterial = loadedModel.wireframeMaterial;

      group.add(mesh);
      applyViewMode(mesh, viewMode, solidMaterial, wireframeMaterial);

      disposableResources.push(mesh.geometry);
      trackMaterialDisposables(disposableResources, solidMaterial, wireframeMaterial);

      for (const cb of readyCallbacks) {
        cb();
      }
    })
    .catch((error: unknown) => {
      console.error(`Failed to load STL model from ${MODEL_URL}.`, error);
    });

  return {
    group,
    get mesh() {
      return mesh;
    },
    dispose(): void {
      disposed = true;
      unsubscribeTheme();

      for (const resource of disposableResources) {
        resource.dispose();
      }
    },
    setViewMode(nextViewMode: ModelViewMode): void {
      viewMode = nextViewMode;

      if (mesh && solidMaterial && wireframeMaterial) {
        applyViewMode(mesh, viewMode, solidMaterial, wireframeMaterial);
      }
    },
    update(_elapsedTime: number): void {
      // Intentionally static.
    },
    onReady(callback: () => void): void {
      if (mesh) {
        callback();
      } else {
        readyCallbacks.push(callback);
      }
    },
  };
}

function trackMaterialDisposables(
  disposableResources: Array<{ dispose(): void }>,
  ...materials: Array<Material | Material[]>
): void {
  for (const material of materials) {
    if (Array.isArray(material)) {
      disposableResources.push(...material);
      continue;
    }

    disposableResources.push(material);
  }
}

function applyViewMode(
  mesh: Mesh<BufferGeometry, Material>,
  viewMode: ModelViewMode,
  solidMaterial: MeshPhysicalMaterial,
  wireframeMaterial: ShaderMaterial
): void {
  mesh.material = viewMode === 'wireframe' ? wireframeMaterial : solidMaterial;
}
