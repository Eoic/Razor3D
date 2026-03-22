export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface SceneNodeRecord {
  id: string;
  label: string;
  visible: boolean;
  color: string;
  modelFileId: string;
  sourceFormat: string;
  sourceFileName: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  camera: CameraState;
  nodes: SceneNodeRecord[];
}

export interface ModelFileRecord {
  id: string;
  projectId: string;
  data: ArrayBuffer;
}
