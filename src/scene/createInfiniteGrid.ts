import { Color, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';

export interface InfiniteGrid {
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  update(camera: PerspectiveCamera): void;
}

export function createInfiniteGrid(): InfiniteGrid {
  const uniforms = {
    uCameraPosition: { value: new Vector3() },
    uGridColor: { value: new Color('#6d665d') },
    uPrimaryGridColor: { value: new Color('#887f74') },
    uXAxisColor: { value: new Color('#d14b43') },
    uZAxisColor: { value: new Color('#3f6edb') },
    uFadeDistance: { value: 140 },
    uPrimaryScale: { value: 5 },
    uSecondaryScale: { value: 1 },
  };

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec3 vWorldPosition;

      uniform vec3 uCameraPosition;
      uniform vec3 uGridColor;
      uniform vec3 uPrimaryGridColor;
      uniform vec3 uXAxisColor;
      uniform vec3 uZAxisColor;
      uniform float uFadeDistance;
      uniform float uPrimaryScale;
      uniform float uSecondaryScale;

      float gridFactor(vec2 coordinate, float scale) {
        vec2 scaled = coordinate / scale;
        vec2 grid = abs(fract(scaled - 0.5) - 0.5) / fwidth(scaled);
        float line = min(grid.x, grid.y);
        return 1.0 - min(line, 1.0);
      }

      void main() {
        vec2 coordinate = vWorldPosition.xz;
        float distanceToCamera = distance(coordinate, uCameraPosition.xz);
        float fade = 1.0 - smoothstep(uFadeDistance * 0.25, uFadeDistance, distanceToCamera);
        float primary = gridFactor(coordinate, uPrimaryScale);
        float secondary = gridFactor(coordinate, uSecondaryScale) * 0.42;
        float xAxis = 1.0 - min(abs(vWorldPosition.z) / fwidth(vWorldPosition.z), 1.0);
        float zAxis = 1.0 - min(abs(vWorldPosition.x) / fwidth(vWorldPosition.x), 1.0);
        float axis = max(xAxis, zAxis);
        float alpha = max(max(primary * 0.92, secondary), axis) * fade;

        if (alpha <= 0.001) {
          discard;
        }

        vec3 color = uGridColor;
        color = mix(color, uPrimaryGridColor, primary);
        color = mix(color, uXAxisColor, xAxis);
        color = mix(color, uZAxisColor, zAxis);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const mesh = new Mesh(new PlaneGeometry(1, 1, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.scale.set(420, 420, 1);

  return {
    mesh,
    update(camera: PerspectiveCamera): void {
      mesh.position.x = camera.position.x;
      mesh.position.z = camera.position.z;
      uniforms.uCameraPosition.value.copy(camera.position);
    },
  };
}
