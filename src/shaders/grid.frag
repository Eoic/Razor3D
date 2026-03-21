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
