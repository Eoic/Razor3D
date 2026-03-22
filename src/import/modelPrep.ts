import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  ShaderMaterial,
  Vector3,
} from 'three';

import wireframeFrag from '@/shaders/wireframe.frag?raw';
import wireframeVert from '@/shaders/wireframe.vert?raw';
import { getTheme } from '@/theme/themeColors';

export const MODEL_TARGET_HEIGHT = 2.2;
export const MODEL_TARGET_SPAN = 2.6;

export function createModelGeometry(loadedGeometry: BufferGeometry): BufferGeometry {
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

export function addBarycentricAttribute(geometry: BufferGeometry): void {
  const position = geometry.getAttribute('position');
  const barycentric = new Float32Array(position.count * 3);

  for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 3) {
    barycentric.set([1, 0, 0], vertexIndex * 3);
    barycentric.set([0, 1, 0], (vertexIndex + 1) * 3);
    barycentric.set([0, 0, 1], (vertexIndex + 2) * 3);
  }

  geometry.setAttribute('barycentric', new BufferAttribute(barycentric, 3));
}

export function createWireframeMaterial(): ShaderMaterial {
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

export function createPreparedMesh(loadedGeometry: BufferGeometry): {
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
