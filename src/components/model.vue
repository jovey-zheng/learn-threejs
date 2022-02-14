<template>
  <div id="model"></div>

  <!-- 纹理图案，隐藏无需展示，只做数据获取 -->
  <div id="svgTextContainer" class="hide"></div>
  <div id="svgPathContainer" class="hide"></div>

  <!-- 颜色选择器 -->
  <div id="picker">
    <div
      v-for="c in colors"
      class="color"
      :title="c"
      :key="c"
      :style="{ background: c }"
      @click="changeColor(c)"
    ></div>
    <p>pick: {{ color }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, watchEffect } from "vue";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useColor } from "../hooks/colors";

export default defineComponent({
  name: "Model",
  setup() {
    const [colors, color, changeColor] = useColor();

    return {
      color,
      colors,
      changeColor,
    };
  },
  async mounted() {
    let object;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const container = document.querySelector("#model") as any;

    // 创建一个场景
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 100, 1200);
    camera.position.set(500, 0, 0);
    scene.add(camera);
    // 添加轨道控制器，支持 360° 查看
    const controls = new OrbitControls(camera, container);
    controls.minDistance = 200;
    controls.maxDistance = 700;
    controls.update();

    // 环境灯，照亮场景
    scene.add(new THREE.AmbientLight(0x666666));

    // 直射光，照亮模型上的各个纹理，具有阴影效果
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

    // 多角度不同的灯光
    const lights = [
      {
        color: 0xffffff,
        intensity: 0.53,
        position: { x: -500, y: 320, z: 500 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
      {
        color: 0xffffff,
        intensity: 0.3,
        position: { x: 200, y: 50, z: 500 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
      {
        color: 0xffffff,
        intensity: 0.4,
        position: { x: 0, y: 100, z: -500 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
      {
        color: 0xffffff,
        intensity: 0.3,
        position: { x: 1, y: 0, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
      {
        color: 0xffffff,
        intensity: 0.3,
        position: { x: -1, y: 0, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
    ];
    lights.forEach(function (light) {
      const dlight = new THREE.DirectionalLight(light.color, light.intensity);
      const p = light.position;
      const l = light.lookAt;
      dlight.position.set(p.x, p.y, p.z);
      dlight.lookAt(l.x, l.y, l.z);
      scene.add(dlight);
    });

    // 加载完整的衣服设计稿
    const res = await fetch("img/pattern.svg");
    const svg = await res.text();

    // 注入两个相同的 svg
    document.querySelector("#svgPathContainer").innerHTML = svg;
    document.querySelector("#svgTextContainer").innerHTML = svg;

    // 移除 path 的 text 标签部分，衣服样式
    document
      .querySelectorAll("#svgPathContainer text")
      .forEach((t) => t.remove());
    // 移除 text 的 path 标签部分，文字样式
    document
      .querySelectorAll("#svgTextContainer path")
      .forEach((p) => p.remove());

    // 衣服样式
    const pathSvg = document
      .getElementById("svgPathContainer")
      .querySelector("svg");
    // 将 dom 序列化为 string
    const svgData = new XMLSerializer().serializeToString(pathSvg);
    // 文字样式
    const textSvg = document
      .getElementById("svgTextContainer")
      .querySelector("svg");
    // 将 dom 序列化为 string
    const svgTextData = new XMLSerializer().serializeToString(textSvg);

    // 创建新纹理，取 svg 的宽高
    // 纹理的样式需要一定的比例才能覆盖整个模型，纹理内的图标有特殊位置要求
    const canvas = document.createElement("canvas");
    canvas.width = pathSvg.width.baseVal.value;
    canvas.height = pathSvg.height.baseVal.value;
    const ctx = canvas.getContext("2d") as any;

    // 创建衣服样式的载体，后面添加到 canvas 的画布上
    const img = document.createElement("img");
    img.setAttribute(
      "src",
      "data:image/svg+xml;base64," +
        window.btoa(unescape(encodeURIComponent(svgData)))
    );

    // 通过层叠图片的形式创建新的材质纹理
    img.onload = function () {
      // 将衣服样式添加到画布上
      ctx.drawImage(img, 0, 0);

      // 衣服表面纹理，一个个的小洞，增强真实感
      const patternImg = document.createElement("img");
      patternImg.widht = 100;
      patternImg.height = 100;
      patternImg.src = "img/pattern.png";

      patternImg.onload = function () {
        // 样式图案
        ctx.globalAlpha = 0.4;
        ctx.scale(0.3, 0.3);
        // 创建花样，重复这个图片（底图）
        const pattern = ctx.createPattern(patternImg, "repeat");
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width * 3.33, canvas.height * 3.33);
        ctx.globalAlpha = 1;
        ctx.scale(3.33, 3.33);

        // 创建文字样式的载体，后面添加到 canvas 的画布上
        const textImg = document.createElement("img");
        textImg.setAttribute(
          "src",
          "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(svgTextData)))
        );
        textImg.onload = function () {
          ctx.drawImage(textImg, 0, 0);

          // 生成新纹理
          const texture = new THREE.Texture(canvas);
          texture.needsUpdate = true;
          const textureMaterial = new THREE.MeshPhongMaterial({ map: texture });

          loadModal(textureMaterial);
        };
      };
    };

    // 加载一个模型
    function loadModal(textureMaterial) {
      // 模型 loading 管理器，可以监听模型加载的进度（可选）
      const manager = new THREE.LoadingManager();
      const loader = new THREE.OBJLoader2(manager);
      // 加载模型文件
      loader.load("model.obj", function (data) {
        // 避免重复载入模型
        if (object != null) {
          scene.remove(object);
        }
        // 模型的具体数据对象（可以 console data 相关信息）
        object = data.detail.loaderRootNode;

        // 覆盖模型的材质纹理
        object.traverse(function (node) {
          if (node.isMesh) {
            node.material = textureMaterial;
            node.geometry.uvsNeedUpdate = true;
          }
        });

        // 缩放模型
        const scale = height / 3;
        object.scale.set(scale, scale, scale);
        // 模型位置信息
        object.position.set(0, -scale * 1.4, 0);
        object.rotation.set(0, Math.PI / 2, 0);
        // 阴影
        object.receiveShadow = true;
        object.castShadow = true;
        // 模型放入场景中
        scene.add(object);
      });
    }

    // 渲染整个场景
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    // 开启阴影效果，柔和过渡
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;

    function render() {
      renderer.render(scene, camera);
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      render();
    }

    animate();
  },
});
</script>

<style scoped>
#model {
  background-color: #b2d3f1;
}

.hide {
  display: none;
}

#picker {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 200px;
  display: flex;
  flex-wrap: wrap;
}

.color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 4px;
  box-shadow: 0 0 2px #1b1b1b;
  cursor: pointer;
}
</style>
