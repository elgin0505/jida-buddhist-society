import * as THREE from 'three';

/**
 * 禅意水墨水面 GPU 顶点与着色器定义 (InkWaterShader)
 *
 * 彻底消除主线程 CPU 逐帧 25,921 顶点位移计算与 51,200 次三角面法线遍历，
 * 将波浪正弦计算与法线解析求导完全卸载至 GPU 顶点着色器并行流水线中。
 */

export interface InkWaterUniforms {
  uTime: { value: number };
  uDeepColor?: { value: THREE.Color };
  uSurfaceColor?: { value: THREE.Color };
  uOpacity?: { value: number };
}

export const inkWaterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // GPU 顶点波动置换计算 (Vertex Wave Displacement)
    float waveX = pos.x * 0.2;
    float waveY = pos.y * 0.2;
    float z = sin(waveX + uTime * 0.4) * 0.12 +
              sin(waveY * 1.3 + uTime * 0.3) * 0.08 +
              sin((waveX + waveY) * 0.7 + uTime * 0.2) * 0.06;
    pos.z += z;

    // GPU 解析法线求导计算 (Analytical Normal Computation)
    // 替代 CPU 逐帧 51,200 次三角面 cross product + normalization
    vec3 displacedNormal = normal;
    float dzdx = cos(waveX + uTime * 0.4) * 0.024 + cos((waveX + waveY) * 0.7 + uTime * 0.2) * 0.042;
    float dzdy = cos(waveY * 1.3 + uTime * 0.3) * 0.0208 + cos((waveX + waveY) * 0.7 + uTime * 0.2) * 0.042;
    displacedNormal.x -= dzdx;
    displacedNormal.y -= dzdy;
    vNormal = normalize(normalMatrix * displacedNormal);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const inkWaterFragmentShader = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uSurfaceColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 norm = normalize(vNormal);

    // 菲涅尔水墨倒影反射模拟
    float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);
    vec3 waterColor = mix(uDeepColor, uSurfaceColor, fresnel * 0.85);

    // 镜面高光模拟水面波光
    vec3 lightDir = normalize(vec3(0.3, 0.8, 0.5));
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfVec), 0.0), 32.0) * 0.6;

    gl_FragColor = vec4(waterColor + vec3(spec), uOpacity);
  }
`;

/**
 * 原生 ShaderMaterial 规范定义
 */
export const InkWaterShader = {
  uniforms: {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color('#020617') },
    uSurfaceColor: { value: new THREE.Color('#0f2b3e') },
    uOpacity: { value: 0.95 },
  },
  vertexShader: inkWaterVertexShader,
  fragmentShader: inkWaterFragmentShader,
};

/**
 * 将 GPU 波动置换与解析法线注入 Three.js PBR 材质 (MeshPhysicalMaterial / MeshStandardMaterial)
 * 使得材质在保留高精度 PBR 光照、环境贴图反射与法线贴图细节的同时，享受 GPU 顶点波动的极速计算
 *
 * @param material Three.js 材质实例
 * @param uniforms 共享 uTime 引用
 */
export function applyInkWaterShader(
  material: THREE.Material,
  uniforms?: { uTime: { value: number } }
): { uTime: { value: number } } {
  const activeUniforms = uniforms || { uTime: { value: 0 } };

  material.userData = material.userData || {};
  material.userData.uTime = activeUniforms.uTime;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = activeUniforms.uTime;

    // 1. 注入 uTime 统一变量定义
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uTime;`
    );

    // 2. 注入 GPU 解析法线计算 (Analytical Normals)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
       float waveX = position.x * 0.2;
       float waveY = position.y * 0.2;
       float dzdx = cos(waveX + uTime * 0.4) * 0.024 + cos((waveX + waveY) * 0.7 + uTime * 0.2) * 0.042;
       float dzdy = cos(waveY * 1.3 + uTime * 0.3) * 0.0208 + cos((waveX + waveY) * 0.7 + uTime * 0.2) * 0.042;
       objectNormal.x -= dzdx;
       objectNormal.y -= dzdy;
       objectNormal = normalize(objectNormal);`
    );

    // 3. 注入 GPU 顶点位移 (Vertex Displacement)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float zWave = sin(waveX + uTime * 0.4) * 0.12 +
                     sin(waveY * 1.3 + uTime * 0.3) * 0.08 +
                     sin((waveX + waveY) * 0.7 + uTime * 0.2) * 0.06;
       transformed.z += zWave;`
    );
  };

  (material as any).customProgramCacheKey = () => 'InkWaterPBRShader_v1';

  return activeUniforms;
}

/**
 * 快速创建独立 GPU InkWater ShaderMaterial
 */
export function createInkWaterShaderMaterial(
  overrides?: Partial<typeof InkWaterShader.uniforms>
): THREE.ShaderMaterial {
  const uniforms = THREE.UniformsUtils.clone(InkWaterShader.uniforms);
  if (overrides) {
    Object.assign(uniforms, overrides);
  }
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: InkWaterShader.vertexShader,
    fragmentShader: InkWaterShader.fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
}

export default InkWaterShader;
