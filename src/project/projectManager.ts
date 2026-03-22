import { applyNodeState, buildModelFileRecords, restoreCamera, serializeScene } from './serialization';

import { importModel } from '@/import/importModel';
import type { ModelFormat } from '@/import/modelLoaders';
import type { Viewer } from '@/scene/createViewer';
import {
  deleteProject as dbDeleteProject,
  getAllProjects,
  getModelFiles,
  getProject,
  saveProject as dbSaveProject,
} from '@/storage/database';
import type { ProjectRecord } from '@/storage/types';

export interface ProjectManager {
  createNew(): void;
  save(name?: string): Promise<void>;
  open(id: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  listProjects(): Promise<ProjectRecord[]>;
  addModelFile(nodeId: string, fileId: string, buffer: ArrayBuffer, format: ModelFormat): void;
  getCurrentProjectId(): string | null;
  getCurrentProjectName(): string | null;
}

export function createProjectManager(viewer: Viewer): ProjectManager {
  let currentProjectId: string | null = null;
  let currentProjectName: string | null = null;

  // Maps nodeId → { fileId, buffer, format }
  const modelFileData = new Map<string, { fileId: string; buffer: ArrayBuffer; format: ModelFormat }>();

  function createNew(): void {
    viewer.sceneGraph.clear();
    // Remove all model groups from the Three.js scene
    for (const node of viewer.sceneGraph.getNodes()) {
      viewer.scene.remove(node.object3D);
    }
    modelFileData.clear();
    currentProjectId = null;
    currentProjectName = null;
    viewer.resetCamera();
  }

  async function save(name?: string): Promise<void> {
    const projectName = name ?? currentProjectName ?? 'Untitled Project';

    if (!currentProjectId) {
      currentProjectId = crypto.randomUUID();
    }

    currentProjectName = projectName;

    // Build a map from nodeId → modelFileId for serialization
    const nodeToFileId = new Map<string, string>();
    for (const [nodeId, entry] of modelFileData) {
      nodeToFileId.set(nodeId, entry.fileId);
    }

    const serialized = serializeScene(viewer.sceneGraph, viewer.camera, viewer.controls, nodeToFileId);

    // Build model file records, adding format info to nodes
    for (const nodeRecord of serialized.nodes) {
      const entry = modelFileData.get(nodeRecord.id);
      if (entry) {
        nodeRecord.sourceFormat = entry.format;
      }
    }

    const fileRecordMap = new Map<string, { fileId: string; buffer: ArrayBuffer }>();
    for (const [, entry] of modelFileData) {
      fileRecordMap.set(entry.fileId, { fileId: entry.fileId, buffer: entry.buffer });
    }

    const project: ProjectRecord = {
      id: currentProjectId,
      name: projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      camera: serialized.camera,
      nodes: serialized.nodes,
    };

    const modelFiles = buildModelFileRecords(currentProjectId, fileRecordMap);

    await dbSaveProject(project, modelFiles);
  }

  async function open(id: string): Promise<void> {
    const project = await getProject(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const files = await getModelFiles(id);
    const fileMap = new Map(files.map(f => [f.id, f]));

    // Clear current scene
    for (const node of viewer.sceneGraph.getNodes()) {
      viewer.scene.remove(node.object3D);
    }
    viewer.sceneGraph.clear();
    modelFileData.clear();

    // Re-import each model from stored bytes
    for (const nodeRecord of project.nodes) {
      const fileRecord = fileMap.get(nodeRecord.modelFileId);
      if (!fileRecord) {
        continue;
      }

      const format = (nodeRecord.sourceFormat || 'stl') as ModelFormat;
      const model = await importModel(fileRecord.data, format);

      const sceneNode = {
        id: nodeRecord.id,
        label: nodeRecord.label,
        visible: nodeRecord.visible,
        color: nodeRecord.color,
        object3D: model.group,
        children: [],
      };

      applyNodeState(sceneNode, nodeRecord);
      viewer.scene.add(model.group);
      viewer.sceneGraph.addNode(sceneNode);

      modelFileData.set(nodeRecord.id, {
        fileId: nodeRecord.modelFileId,
        buffer: fileRecord.data,
        format,
      });
    }

    restoreCamera(viewer.camera, viewer.controls, project.camera);

    currentProjectId = project.id;
    currentProjectName = project.name;
  }

  async function deleteProjectFn(id: string): Promise<void> {
    await dbDeleteProject(id);

    if (currentProjectId === id) {
      createNew();
    }
  }

  async function listProjects(): Promise<ProjectRecord[]> {
    return getAllProjects();
  }

  function addModelFile(nodeId: string, fileId: string, buffer: ArrayBuffer, format: ModelFormat): void {
    modelFileData.set(nodeId, { fileId, buffer, format });
  }

  return {
    createNew,
    save,
    open,
    deleteProject: deleteProjectFn,
    listProjects,
    addModelFile,
    getCurrentProjectId: () => currentProjectId,
    getCurrentProjectName: () => currentProjectName,
  };
}
