import type { ModelFormat } from './modelLoaders';

const FORMAT_EXTENSIONS: Record<string, ModelFormat> = {
  '.stl': 'stl',
  '.gltf': 'gltf',
  '.glb': 'glb',
  '.fbx': 'fbx',
};

const ACCEPT = Object.keys(FORMAT_EXTENSIONS).join(',');

export interface FileSelection {
  file: File;
  buffer: ArrayBuffer;
  format: ModelFormat;
}

export function openFilePicker(): Promise<FileSelection | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const nameParts = file.name.split('.');
      const rawExt = nameParts.pop();
      if (!rawExt) {
        resolve(null);
        return;
      }

      const ext = '.' + rawExt.toLowerCase();
      const format = FORMAT_EXTENSIONS[ext];
      if (!format) {
        resolve(null);
        return;
      }

      void file.arrayBuffer().then(buffer => {
        resolve({ file, buffer, format });
      });
    });

    input.click();
  });
}
