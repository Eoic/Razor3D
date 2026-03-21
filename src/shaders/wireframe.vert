attribute vec3 barycentric;

varying vec3 vBarycentric;

void main() {
  vBarycentric = barycentric;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
