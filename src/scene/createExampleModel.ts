import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  ShaderMaterial,
  Vector3,
} from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import type { ModelViewMode } from './modelViewMode';

import wireframeFrag from '@/shaders/wireframe.frag?raw';
import wireframeVert from '@/shaders/wireframe.vert?raw';
import { getTheme, onThemeChange } from '@/theme/themeColors';

const MODEL_URL = '/models/example.stl';
const MODEL_TARGET_HEIGHT = 2.2;
const MODEL_TARGET_SPAN = 2.6;
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

      const loadedModel = createLoadedModel(geometry);
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

function createLoadedModel(loadedGeometry: BufferGeometry): {
  mesh: Mesh<BufferGeometry, Material>;
  solidMaterial: MeshPhysicalMaterial;
  wireframeMaterial: ShaderMaterial;
} {
  const geometry = createModelGeometry(loadedGeometry);
  const scaledHeight = geometry.boundingBox?.getSize(new Vector3()).y ?? MODEL_TARGET_HEIGHT;
  const theme = getTheme();
  const solidMaterial = new MeshPhysicalMaterial({
    color: new Color(theme.modelColor),
    roughness: 0.24,
    metalness: 0.22,
    clearcoat: 0.68,
    clearcoatRoughness: 0.16,
  });
  const wireframeMaterial = createWireframeMaterial();
  const mesh = new Mesh<BufferGeometry, Material>(geometry, solidMaterial);
  mesh.position.y = scaledHeight * 0.5;

  return { mesh, solidMaterial, wireframeMaterial };
}

function createModelGeometry(loadedGeometry: BufferGeometry): BufferGeometry {
  const geometry = loadedGeometry.index ? loadedGeometry.toNonIndexed() : loadedGeometry;

  if (geometry !== loadedGeometry) {
    loadedGeometry.dispose();
  }

  geometry.computeVertexNormals();
  geometry.center();
  geometry.rotateX(Math.PI * 1.5);
  geometry.computeBoundingBox();

  const size = geometry.boundingBox?.getSize(new Vector3());
  const height = Math.max(size?.y ?? 0, Number.EPSILON);
  const footprint = Math.max(size?.x ?? 0, size?.z ?? 0, Number.EPSILON);
  const scale = Math.min(MODEL_TARGET_HEIGHT / height, MODEL_TARGET_SPAN / footprint);

  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  addBarycentricAttribute(geometry);

  return geometry;
}

function addBarycentricAttribute(geometry: BufferGeometry): void {
  const position = geometry.getAttribute('position');
  const barycentric = new Float32Array(position.count * 3);

  for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 3) {
    barycentric.set([1, 0, 0], vertexIndex * 3);
    barycentric.set([0, 1, 0], (vertexIndex + 1) * 3);
    barycentric.set([0, 0, 1], (vertexIndex + 2) * 3);
  }

  geometry.setAttribute('barycentric', new BufferAttribute(barycentric, 3));
}

function createWireframeMaterial(): ShaderMaterial {
  const theme = getTheme();
  return new ShaderMaterial({
    side: DoubleSide,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    uniforms: {
      uLineColor: { value: new Color(theme.wireframeLineColor) },
      uLineOpacity: { value: 0.96 },
      uLineWidth: { value: 1.35 },
    },
    vertexShader: wireframeVert,
    fragmentShader: wireframeFrag,
  });
}

function applyViewMode(
  mesh: Mesh<BufferGeometry, Material>,
  viewMode: ModelViewMode,
  solidMaterial: MeshPhysicalMaterial,
  wireframeMaterial: ShaderMaterial
): void {
  mesh.material = viewMode === 'wireframe' ? wireframeMaterial : solidMaterial;
}
