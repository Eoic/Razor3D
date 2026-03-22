import type { BufferGeometry, Group } from 'three';

export type ModelFormat = 'stl' | 'gltf' | 'glb' | 'fbx';

export async function loadStl(buffer: ArrayBuffer): Promise<BufferGeometry> {
  const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
  return new STLLoader().parse(buffer);
}

export async function loadGltf(buffer: ArrayBuffer): Promise<Group> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const result = await new GLTFLoader().parseAsync(buffer, '');
  return result.scene;
}

export async function loadFbx(buffer: ArrayBuffer): Promise<Group> {
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  return new FBXLoader().parse(buffer, '');
}
