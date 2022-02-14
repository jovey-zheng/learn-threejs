<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'

import HelloWorld from "./components/HelloWorld.vue";
import Model from "./components/model.vue";

const stat = ref(false);
</script>

<template>
  <img id="logo" alt="Vue logo" style="display: none" src="./assets/logo.png" />
  <button id="btn" @click="stat = !stat">switch</button>
  <HelloWorld v-if="stat" msg="Hello Vue 3 + TypeScript + Vite" />
  <Model v-else />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}

#btn {
  position: fixed;
}

html,
body {
  margin: 0;
  padding: 0;
}
</style>
