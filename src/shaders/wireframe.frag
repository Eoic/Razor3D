precision highp float;

uniform vec3 uLineColor;
uniform float uLineOpacity;
uniform float uLineWidth;

varying vec3 vBarycentric;

float edgeFactor() {
  vec3 derivative = fwidth(vBarycentric);
  vec3 edge = smoothstep(vec3(0.0), derivative * uLineWidth, vBarycentric);
  return 1.0 - min(min(edge.x, edge.y), edge.z);
}

void main() {
  float edge = edgeFactor();

  if (edge <= 0.001) {
    discard;
  }

  gl_FragColor = vec4(uLineColor, edge * uLineOpacity);
}
