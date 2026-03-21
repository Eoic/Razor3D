import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createExampleModel } from './createExampleModel';
import { createInfiniteGrid } from './createInfiniteGrid';
import type { ModelViewMode } from './modelViewMode';
import { SceneGraph } from './sceneGraph';

import { getTheme, onThemeChange } from '@/theme/themeColors';
import type { Disposable } from '@/types/disposable';

export interface SlicerViewer extends Disposable {
  setViewMode(viewMode: ModelViewMode): void;
  readonly sceneGraph: SceneGraph;
}

export function createSlicerViewer(container: HTMLElement): SlicerViewer {
  const theme = getTheme();

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.className = 'scene-canvas';
  container.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(theme.sceneBackground);
  scene.fog = new Fog(theme.sceneFog, theme.fogNear, theme.fogFar);

  const camera = new PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(6.5, 4.6, 6.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.4;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.1, 0);
  controls.update();

  const hemisphereLight = new HemisphereLight(theme.hemisphereSky, theme.hemisphereGround, theme.hemisphereIntensity);
  scene.add(hemisphereLight);

  const keyLight = new DirectionalLight(theme.keyLight, theme.keyLightIntensity);
  keyLight.position.set(6, 9, 5);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLight, theme.rimLightIntensity);
  rimLight.position.set(-5, 4, -6);
  scene.add(rimLight);

  const model = createExampleModel();
  scene.add(model.group);

  const sceneGraph = new SceneGraph();

  model.onReady(() => {
    if (model.mesh) {
      sceneGraph.addNode({
        id: 'example-model',
        label: 'Example Model',
        visible: true,
        color: getTheme().modelColor,
        object3D: model.mesh,
        children: [],
      });
    }
  });

  const grid = createInfiniteGrid();
  scene.add(grid.mesh);

  const fog = scene.fog;

  const unsubscribeTheme = onThemeChange(nextTheme => {
    (scene.background as Color).set(nextTheme.sceneBackground);
    fog.color.set(nextTheme.sceneFog);
    fog.near = nextTheme.fogNear;
    fog.far = nextTheme.fogFar;

    hemisphereLight.color.set(nextTheme.hemisphereSky);
    hemisphereLight.groundColor.set(nextTheme.hemisphereGround);
    hemisphereLight.intensity = nextTheme.hemisphereIntensity;

    keyLight.color.set(nextTheme.keyLight);
    keyLight.intensity = nextTheme.keyLightIntensity;

    rimLight.color.set(nextTheme.rimLight);
    rimLight.intensity = nextTheme.rimLightIntensity;
  });

  let animationFrameId = 0;

  const resize = (): void => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  window.addEventListener('resize', resize);
  resize();

  const render = (time: number): void => {
    const elapsedTime = time * 0.001;

    controls.update();
    model.update(elapsedTime);
    grid.update(camera);
    renderer.render(scene, camera);

    animationFrameId = window.requestAnimationFrame(render);
  };

  animationFrameId = window.requestAnimationFrame(render);

  return {
    dispose(): void {
      window.cancelAnimationFrame(animationFrameId);
      unsubscribeTheme();
      model.dispose();
      grid.dispose();
      controls.dispose();
      window.removeEventListener('resize', resize);
      renderer.dispose();
      renderer.domElement.remove();
    },
    setViewMode(viewMode: ModelViewMode): void {
      model.setViewMode(viewMode);
    },
    sceneGraph,
  };
}
