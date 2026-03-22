import type { ModelFileRecord, ProjectRecord } from './types';

const DB_NAME = 'slicer-projects';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const MODEL_FILES_STORE = 'modelFiles';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(MODEL_FILES_STORE)) {
        const store = db.createObjectStore(MODEL_FILES_STORE, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open database'));
    };
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'));
    };
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error('Transaction failed'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('Transaction aborted'));
    };
  });
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(PROJECTS_STORE, 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);
    return await promisifyRequest(store.getAll() as IDBRequest<ProjectRecord[]>);
  } finally {
    db.close();
  }
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(PROJECTS_STORE, 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);
    return (await promisifyRequest(store.get(id))) as ProjectRecord | undefined;
  } finally {
    db.close();
  }
}

export async function getModelFiles(projectId: string): Promise<ModelFileRecord[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(MODEL_FILES_STORE, 'readonly');
    const store = tx.objectStore(MODEL_FILES_STORE);
    const index = store.index('projectId');
    return await promisifyRequest(index.getAll(projectId) as IDBRequest<ModelFileRecord[]>);
  } finally {
    db.close();
  }
}

export async function saveProject(project: ProjectRecord, modelFiles: ModelFileRecord[]): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction([PROJECTS_STORE, MODEL_FILES_STORE], 'readwrite');
    const projectStore = tx.objectStore(PROJECTS_STORE);
    const fileStore = tx.objectStore(MODEL_FILES_STORE);

    projectStore.put(project);

    // Remove old model files for this project
    const index = fileStore.index('projectId');
    const existingKeys = await promisifyRequest(index.getAllKeys(project.id));
    for (const key of existingKeys) {
      fileStore.delete(key);
    }

    // Add new model files
    for (const file of modelFiles) {
      fileStore.put(file);
    }

    await promisifyTransaction(tx);
  } finally {
    db.close();
  }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction([PROJECTS_STORE, MODEL_FILES_STORE], 'readwrite');
    const projectStore = tx.objectStore(PROJECTS_STORE);
    const fileStore = tx.objectStore(MODEL_FILES_STORE);

    projectStore.delete(id);

    // Remove associated model files
    const index = fileStore.index('projectId');
    const keys = await promisifyRequest(index.getAllKeys(id));
    for (const key of keys) {
      fileStore.delete(key);
    }

    await promisifyTransaction(tx);
  } finally {
    db.close();
  }
}
