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

import type { Disposable } from '@/app/mountSlicerApp';

export function createSlicerViewer(container: HTMLElement): Disposable {
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
  scene.background = new Color('#f4ede1');
  scene.fog = new Fog('#f4ede1', 14, 34);

  const camera = new PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(6.5, 4.6, 6.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 3.5;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.1, 0);
  controls.update();

  scene.add(new HemisphereLight('#fff5dd', '#4b301d', 2.4));

  const keyLight = new DirectionalLight('#fff2da', 3.4);
  keyLight.position.set(6, 9, 5);
  scene.add(keyLight);

  const rimLight = new DirectionalLight('#8ca7ff', 1.1);
  rimLight.position.set(-5, 4, -6);
  scene.add(rimLight);

  const model = createExampleModel();
  scene.add(model.group);

  const grid = createInfiniteGrid();
  scene.add(grid.mesh);

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
      model.dispose();
      controls.dispose();
      window.removeEventListener('resize', resize);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
