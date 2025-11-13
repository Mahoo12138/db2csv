<script setup lang="ts">
import { ref } from 'vue'

// 定义属性
defineProps<{ msg: string }>()

// 计数器
const count = ref(0)
</script>

<template>
  <v-container fluid class="py-8">
    <v-row justify="center">
      <v-col cols="12" class="text-center">
        <h1 class="text-3xl font-bold mb-6">{{ msg }}</h1>
        
        <!-- 示例卡片 -->
        <v-card
          class="mb-8 mx-auto"
          :max-width="theme.global.name === 'dark' ? 'md' : 'lg'"
          elevation="2"
        >
          <v-card-text class="text-center py-6">
            <v-btn
              @click="count++"
              color="primary"
              variant="elevated"
              class="mb-4"
            >
              计数: {{ count }}
            </v-btn>
            <p class="text-body-1">
              编辑
              <code>components/HelloWorld.vue</code> 以测试热模块替换
            </p>
          </v-card-text>
        </v-card>
        
        <!-- 链接列表 -->
        <v-card
          class="mx-auto"
          :max-width="theme.global.name === 'dark' ? 'md' : 'lg'"
          variant="outlined"
        >
          <v-list>
            <v-list-item link href="https://vuejs.org/guide/quick-start.html#local" target="_blank">
              <v-list-item-title>查看 create-vue，Vue + Vite 官方启动器</v-list-item-title>
              <v-list-item-action>
                <v-icon>mdi-open-in-new</v-icon>
              </v-list-item-action>
            </v-list-item>
            
            <v-list-item link href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support" target="_blank">
              <v-list-item-title>了解更多关于 Vue 的 IDE 支持</v-list-item-title>
              <v-list-item-action>
                <v-icon>mdi-open-in-new</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
        
        <p class="text-center mt-6 text-body-secondary">点击 Vite 和 Vue 徽标了解更多</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
h1 {
  color: var(--v-primary-base);
}

code {
  background-color: var(--v-surface-variant);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
