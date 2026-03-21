export interface ThemeColors {
  // Scene
  sceneBackground: string;
  sceneFog: string;
  fogNear: number;
  fogFar: number;

  // Lighting
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  keyLight: string;
  keyLightIntensity: number;
  rimLight: string;
  rimLightIntensity: number;

  // Model
  modelColor: string;

  // Wireframe
  wireframeLineColor: string;

  // Grid
  gridColor: string;
  primaryGridColor: string;
  xAxisColor: string;
  zAxisColor: string;
}

export const defaultTheme: ThemeColors = {
  sceneBackground: '#f4ede1',
  sceneFog: '#f4ede1',
  fogNear: 14,
  fogFar: 34,

  hemisphereSky: '#fff5dd',
  hemisphereGround: '#4b301d',
  hemisphereIntensity: 2.4,
  keyLight: '#fff2da',
  keyLightIntensity: 3.4,
  rimLight: '#8ca7ff',
  rimLightIntensity: 1.1,

  modelColor: '#d36e4a',

  wireframeLineColor: '#19140f',

  gridColor: '#6d665d',
  primaryGridColor: '#887f74',
  xAxisColor: '#d14b43',
  zAxisColor: '#3f6edb',
};

export const darkTheme: ThemeColors = {
  sceneBackground: '#1a1a2e',
  sceneFog: '#1a1a2e',
  fogNear: 14,
  fogFar: 34,

  hemisphereSky: '#2a2a4a',
  hemisphereGround: '#0a0a14',
  hemisphereIntensity: 1.8,
  keyLight: '#c8c0f0',
  keyLightIntensity: 2.8,
  rimLight: '#6a8aff',
  rimLightIntensity: 1.6,

  modelColor: '#e8845c',

  wireframeLineColor: '#c8c0b8',

  gridColor: '#3a3650',
  primaryGridColor: '#4e4868',
  xAxisColor: '#e05a52',
  zAxisColor: '#5080e8',
};

let currentTheme: ThemeColors = { ...defaultTheme };
const listeners = new Set<(theme: ThemeColors) => void>();

export function getTheme(): ThemeColors {
  return currentTheme;
}

export function setTheme(theme: ThemeColors): void {
  currentTheme = { ...theme };
  for (const listener of listeners) {
    listener(currentTheme);
  }
}

export function onThemeChange(callback: (theme: ThemeColors) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
