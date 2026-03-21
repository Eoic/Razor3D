import { Color, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';

import gridFrag from '@/shaders/grid.frag?raw';
import gridVert from '@/shaders/grid.vert?raw';
import { getTheme, onThemeChange } from '@/theme/themeColors';

export interface InfiniteGrid {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  dispose(): void;
  update(camera: PerspectiveCamera): void;
}

export function createInfiniteGrid(): InfiniteGrid {
  const theme = getTheme();

  const uniforms = {
    uCameraPosition: { value: new Vector3() },
    uGridColor: { value: new Color(theme.gridColor) },
    uPrimaryGridColor: { value: new Color(theme.primaryGridColor) },
    uXAxisColor: { value: new Color(theme.xAxisColor) },
    uZAxisColor: { value: new Color(theme.zAxisColor) },
    uFadeDistance: { value: 140 },
    uPrimaryScale: { value: 5 },
    uSecondaryScale: { value: 1 },
  };

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: gridVert,
    fragmentShader: gridFrag,
  });

  const mesh = new Mesh(new PlaneGeometry(1, 1, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.scale.set(420, 420, 1);

  const unsubscribeTheme = onThemeChange(nextTheme => {
    uniforms.uGridColor.value.set(nextTheme.gridColor);
    uniforms.uPrimaryGridColor.value.set(nextTheme.primaryGridColor);
    uniforms.uXAxisColor.value.set(nextTheme.xAxisColor);
    uniforms.uZAxisColor.value.set(nextTheme.zAxisColor);
  });

  return {
    mesh,
    dispose(): void {
      unsubscribeTheme();
    },
    update(camera: PerspectiveCamera): void {
      mesh.position.x = camera.position.x;
      mesh.position.z = camera.position.z;
      uniforms.uCameraPosition.value.copy(camera.position);
    },
  };
}
