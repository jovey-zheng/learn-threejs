<template>
  <div id="model"></div>

  <!-- 纹理图案，隐藏无需展示，只做数据获取 -->
  <div id="svgTextContainer" class="hide"></div>
  <div id="svgPathContainer" class="hide"></div>

  <!-- 颜色选择器 -->
  <div v-if="/ZONE/.test(selectedMaterial)" id="colors-picker">
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

  <!-- 文案输入区 -->
  <div v-else-if="/TEXT/.test(selectedMaterial)" id="text-input">
    <!-- 文案 -->
    <div>
      <label for="textVal">{{ selectedMaterial }} Text:</label>
      <input v-model="textVal" type="text" id="textVal" />
    </div>
    <!-- 字号 -->
    <div>
      <label for="textFontSize">{{ selectedMaterial }} FontSize:</label>
      <input v-model="textFontSize" type="number" id="textFontSize" />
    </div>
    <!-- 字体 -->
    <div>
      <label for="textFontFamily">{{ selectedMaterial }} FontFamily:</label>
      <select id="textFontFamily" @change="changeFont">
        <option v-for="f in fonts" :key="f" :value="f" :selected="f === font">
          {{ f }}
        </option>
      </select>
    </div>

    <button @click="applyTextChange">apply</button>
  </div>

  <!-- 衣服样式选择器 -->
  <div id="materials-picker">
    <div
      v-for="m in pathIds"
      class="material"
      :key="m"
      :class="{ selected: m === selectedMaterial }"
      @click="selectedMaterial = m"
    >
      {{ m }}
    </div>
  </div>

  <!-- 文字样式选择器 -->
  <div id="texts-picker">
    <div
      v-for="t in textIds"
      class="text"
      :key="t"
      :class="{ selected: t === selectedMaterial }"
      @click="selectedMaterial = t"
    >
      {{ t }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watchEffect, reactive, ref } from "vue";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import useColor from "../hooks/colors";
import useFont from "../hooks/fonts";

export default defineComponent({
  name: "Model",
  setup() {
    let object;
    let width = window.innerWidth;
    let height = window.innerHeight;
    // 创建一个场景
    const scene = new THREE.Scene();
    // 默认配色方案
    const [colors, color, changeColor] = useColor();
    // 文字字体
    const [fonts, font, changeFont] = useFont();
    // 支持自定义的衣服样式集合
    const pathIds = reactive([]);
    // 支持自定义的文字样式集合
    const textIds = reactive([]);
    // 已选中的素材 Id
    const selectedMaterial = ref("");
    // 文字样式的文案替换
    const textVal = ref("MY TEAM");
    const textFontSize = ref(60);

    // 渲染模型到场景中
    function renderModel() {
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
        patternImg.width = 100;
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
            const textureMaterial = new THREE.MeshPhongMaterial({
              map: texture,
            });

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
          const scale = height / 4;
          object.scale.set(scale, scale, scale);
          // 模型位置信息
          object.position.set(0, -scale * 1.5, 0);
          object.rotation.set(0, Math.PI / 2, 0);
          // 阴影
          object.receiveShadow = true;
          object.castShadow = true;
          // 模型放入场景中
          scene.add(object);
        });
      }
    }

    /**
     * 自定义颜色的原理：
     * 1. 利用 svg 可以变色的特性，并且可以用 path 标签分成不同区块（布料区域）
     * 2. 利用选择颜色来改变 svg 中某个 path 的 fill 属性，进而改变 svg 内的颜色
     * 3. 通过重新读取 svg 数据，生成新的纹理，并且将纹理重新覆盖到模型上
     * 4. 清除原有模型，重新载入模型，则完成自定义颜色的逻辑
     *
     * 自定义文字的原理：
     * 1. 与上述基本相同，不同的是利用的是 svg 中 text 标签
     * 2. 通过修改 text 标签的 innerHTML，来改变文案
     * 2. 通过修改 text 标签的 style 来自定义 font-family 与 font-size
     */
    watchEffect(() => {
      // 切换了颜色，需要重新加载模型
      if (color.value) {
        document
          .getElementById(selectedMaterial.value)
          .setAttribute("fill", color.value);

        renderModel();
      }

      // 切换到文字样式，设置输入框内的值
      if (/TEXT/.test(selectedMaterial.value)) {
        const el = document.getElementById(selectedMaterial.value);

        textVal.value = el.innerHTML;
        textFontSize.value = el.attributes["font-size"].value;
        font.value = el.attributes["font-family"].value;
      }
    });

    // 修改文字样式的文案
    const applyTextChange = () => {
      const el = document.getElementById(selectedMaterial.value);
      el.innerHTML = textVal.value;
      el.style.fontSize = textFontSize.value;
      el.style.fontFamily = font.value;

      el.attributes["font-size"].value = textFontSize.value;
      el.attributes["font-family"].value = font.value;

      renderModel();
    };

    onMounted(async () => {
      const container = document.querySelector("#model") as any;

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

      // 获取衣服样式中可以换颜色（可定制）的部分
      document.querySelectorAll("#svgPathContainer path").forEach((p) => {
        p.id && p.attributes["fill"] && pathIds.push(p.id);
      });
      // 获取文字样式中可以换颜色（可定制）的部分
      document.querySelectorAll("#svgTextContainer text").forEach((t) => {
        t.id && textIds.push(t.id);
      });

      // 默认选中第一个 ZONE(base)
      selectedMaterial.value = pathIds[0];

      renderModel();

      // 渲染整个场景
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      // 开启阴影效果，柔和过渡
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.soft = true;

      window.addEventListener("resize", () => {
        width = window.innerWidth;
        height = window.innerHeight;

        // 当视窗宽度小于高度时，则以正方形的方式缩放
        // if (width < height) {
        //   height = width;
        // }
        // 镜头要跟随移动
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
      });

      function render() {
        renderer.render(scene, camera);
      }

      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        render();
      }

      animate();
    });

    return {
      color,
      colors,
      changeColor,
      pathIds,
      textIds,
      selectedMaterial,
      textVal,
      textFontSize,
      font,
      fonts,
      changeFont,
      applyTextChange,
    };
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

#colors-picker,
#text-input {
  position: fixed;
  top: 40px;
  right: 20px;
  width: 200px;
  display: flex;
  flex-wrap: wrap;
}
#text-input {
  width: 240px;
  flex-direction: column;
  align-items: center;
}
#text-input div,
#text-input button {
  margin-top: 8px;
}

.color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 4px;
  box-shadow: 0 0 2px #1b1b1b;
  cursor: pointer;
}

#materials-picker,
#texts-picker {
  position: fixed;
  top: 40px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
#materials-picker {
  left: 20px;
}
#texts-picker {
  left: 140px;
}

.material,
.text {
  padding: 2px;
  margin-top: 5px;
  border: 1px solid #111111;
  border-radius: 4px;
  transition: all 0.1s linear;
}
.material:hover,
.text:hover {
  cursor: pointer;
  box-shadow: 0 0 2px #111111;
}

.selected {
  color: #fff;
  background-color: #2495ff;
}
</style>
