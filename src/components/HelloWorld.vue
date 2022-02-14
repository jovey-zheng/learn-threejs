<script setup lang="ts">
import { ref } from "vue";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

defineProps<{ msg: string }>();

const count = ref(0);

setTimeout(() => {
  // 创建一个场景
  const scene = new THREE.Scene();
  // 给场景增加背景色
  scene.background = new THREE.Color(0xcccccc);
  // 添加雾化效果
  scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const container = document.querySelector("#th") as any;

  // 渲染整个场景
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // vue logo 纹理
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d") as any;
  const img = document.querySelector("#logo");
  ctx.drawImage(img, 0, 0);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  // 定义一个盒型几何体，然后定义纹理，用 mesh 将纹理覆盖到盒子上，并添加到场景中
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({
    map: texture,
  });
  const cube = new THREE.Mesh(geometry, material);
  // 指定位置
  cube.position.set(0, 1.5, 0);
  scene.add(cube);

  // 增加一个球体，包裹上面的立方体
  const geometry1 = new THREE.SphereGeometry(1, 32, 16);
  const material1 = new THREE.MeshPhongMaterial({
    color: 0x42b983,
    // wireframe: true,
  });
  const sphere = new THREE.Mesh(geometry1, material1);
  scene.add(sphere);

  // 灯光，照亮场景
  const light1 = new THREE.AmbientLight(0xffffff);
  scene.add(light1);

  const light = new THREE.DirectionalLight(0xdfebff, 0.3);
  const d = 300;
  light.position.set(500, 100, 80);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.far = 100;
  light.shadowDarkness = 0.5;
  light.shadowCameraVisible = true;
  scene.add(light);

  // 轨道控制器，允许在指定区域用鼠标 360° 旋转
  const controls = new OrbitControls(camera, container);
  controls.minDistance = 5;
  controls.maxDistance = 10;
  controls.update();

  // 镜头的位置
  camera.position.set(10, 10, 10);

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    cube.rotation.y += 0.005;
    sphere.rotation.y += 0.005;
    render();
  }

  animate();
}, 1000);
</script>

<template>
  <!-- <h1>{{ msg }}</h1>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
  </p>

  <p>See <code>README.md</code> for more information.</p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">
      Vite Docs
    </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>

  <button type="button" @click="count++">count is: {{ count }}</button>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p> -->

  <div id="th"></div>
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
