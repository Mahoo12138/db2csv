<script setup lang="ts">
// 导入路由视图组件
// Vuetify 导入
import { useTheme } from 'vuetify'

// Vuetify 主题管理
const theme = useTheme()
</script>

<template>
  <v-app>
    <!-- 路由视图，用于展示不同页面 -->
    <router-view />
  </v-app>
</template>

<style>
/* 保留必要的全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}
</style>
