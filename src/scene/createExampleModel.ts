import { BufferGeometry, Color, Group, Material, Mesh, MeshPhysicalMaterial, Vector3 } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const MODEL_URL = '/models/example.stl';
const MODEL_TARGET_HEIGHT = 2.2;
const MODEL_TARGET_SPAN = 2.6;

export interface ExampleModel {
  group: Group;
  dispose(): void;
  update(elapsedTime: number): void;
}

export function createExampleModel(): ExampleModel {
  const group = new Group();
  const disposableResources: Array<{ dispose(): void }> = [];
  let disposed = false;

  const loader = new STLLoader();

  void loader
    .loadAsync(MODEL_URL)
    .then(geometry => {
      if (disposed) {
        geometry.dispose();
        return;
      }

      const mesh = createLoadedModel(geometry);

      group.add(mesh);

      disposableResources.push(mesh.geometry);
      trackMaterialDisposables(disposableResources, mesh.material);
    })
    .catch((error: unknown) => {
      console.error(`Failed to load STL model from ${MODEL_URL}.`, error);
    });

  return {
    group,
    dispose(): void {
      disposed = true;

      for (const resource of disposableResources) {
        resource.dispose();
      }
    },
    update(_elapsedTime: number): void {
      // Intentionally static.
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

function createLoadedModel(geometry: BufferGeometry): Mesh {
  geometry.computeVertexNormals();
  geometry.center();
  geometry.rotateX(Math.PI * 1.5);
  geometry.computeBoundingBox();

  const size = geometry.boundingBox?.getSize(new Vector3());
  const height = Math.max(size?.y ?? 0, Number.EPSILON);
  const footprint = Math.max(size?.x ?? 0, size?.z ?? 0, Number.EPSILON);
  const scale = Math.min(MODEL_TARGET_HEIGHT / height, MODEL_TARGET_SPAN / footprint);

  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();

  const scaledHeight = geometry.boundingBox?.getSize(new Vector3()).y ?? MODEL_TARGET_HEIGHT;

  const mesh = new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color: new Color('#d36e4a'),
      roughness: 0.24,
      metalness: 0.22,
      clearcoat: 0.68,
      clearcoatRoughness: 0.16,
    })
  );
  mesh.position.y = scaledHeight * 0.5;

  return mesh;
}
