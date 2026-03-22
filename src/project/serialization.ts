import type { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { SceneGraph, SceneNode } from '@/scene/sceneGraph';
import type { CameraState, ModelFileRecord, SceneNodeRecord } from '@/storage/types';

export interface SerializedScene {
  camera: CameraState;
  nodes: SceneNodeRecord[];
}

export function serializeScene(
  sceneGraph: SceneGraph,
  camera: PerspectiveCamera,
  controls: OrbitControls,
  modelFileMap: Map<string, string>
): SerializedScene {
  const nodes = sceneGraph.getNodes().map(node => serializeNode(node, modelFileMap));

  return {
    camera: {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    },
    nodes,
  };
}

function serializeNode(node: SceneNode, modelFileMap: Map<string, string>): SceneNodeRecord {
  const obj = node.object3D;
  const q = obj.quaternion;

  return {
    id: node.id,
    label: node.label,
    visible: node.visible,
    color: node.color,
    modelFileId: modelFileMap.get(node.id) ?? '',
    sourceFormat: '',
    sourceFileName: node.label,
    transform: {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [q.x, q.y, q.z, q.w],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    },
  };
}

export function restoreCamera(camera: PerspectiveCamera, controls: OrbitControls, state: CameraState): void {
  camera.position.set(...state.position);
  controls.target.set(...state.target);
  controls.update();
}

export function applyNodeState(node: SceneNode, record: SceneNodeRecord): void {
  node.object3D.position.set(...record.transform.position);
  node.object3D.quaternion.set(...record.transform.rotation);
  node.object3D.scale.set(...record.transform.scale);
  node.visible = record.visible;
  node.object3D.visible = record.visible;
  node.color = record.color;
}

export function buildModelFileRecords(
  projectId: string,
  modelFileMap: Map<string, { fileId: string; buffer: ArrayBuffer }>
): ModelFileRecord[] {
  const records: ModelFileRecord[] = [];
  for (const [, entry] of modelFileMap) {
    records.push({
      id: entry.fileId,
      projectId,
      data: entry.buffer,
    });
  }
  return records;
}
