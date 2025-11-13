<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FileUpload from '../components/FileUpload.vue'
import TableSelector from '../components/TableSelector.vue'
import FieldMapper from '../components/FieldMapper.vue'
import SQLiteService from '../services/SQLiteService'
import type { SQLiteInstance } from '../services/SQLiteService'
import { CSVService } from '../services/CSVService'

// Vuetify 导入
import { useTheme } from 'vuetify'

// 字段映射项接口
interface FieldMapping {
  originalName: string
  outputName: string
  included: boolean
}

// 状态管理
const isLoading = ref(false)
const errorMessage = ref('')
const databaseInstance = ref<SQLiteInstance | null>(null)
const tableList = ref<string[]>([])
const selectedFile = ref<string>('')
const selectedTable = ref<string>('')
const tableColumns = ref<{ name: string; type: string; notnull?: boolean; pk?: boolean }[]>([])
const fieldMappings = ref<FieldMapping[]>([])

// 移动端侧边栏状态
const isMobileSidebarOpen = ref(false)
const isMobile = computed(() => window.innerWidth <= 768)

// Vuetify 钩子
const theme = useTheme()

// 通知系统状态
const snackbarMessage = ref('')
const snackbarColor = ref('info')
const snackbarTimeout = ref(3000)
const snackbarVisible = ref(false)

// 处理文件选择事件
const handleFileSelected = async (file: File) => {
  isLoading.value = true
  errorMessage.value = ''
  selectedFile.value = file.name
  
  try {
    // 关闭之前的数据库连接（如果有）
    if (databaseInstance.value) {
      databaseInstance.value.close()
    }
    
    // 加载数据库
    databaseInstance.value = await SQLiteService.loadDatabase(file)
    
    // 获取表列表
    tableList.value = await SQLiteService.getTableNames(databaseInstance.value)
    
    if (tableList.value.length === 0) {
      showError('数据库中没有找到表')
    } else {
      // 默认不选择表，让用户手动选择
      selectedTable.value = ''
      tableColumns.value = []
      fieldMappings.value = []
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '加载数据库失败')
  } finally {
    isLoading.value = false
  }
}

// 处理表选择事件
const handleTableSelected = async (table: string) => {
  if (!databaseInstance.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    selectedTable.value = table
    // 获取表结构
    tableColumns.value = await SQLiteService.getTableStructure(databaseInstance.value, table)
    
    // 重置字段映射为默认状态
    fieldMappings.value = tableColumns.value.map(column => ({
      originalName: column.name,
      outputName: column.name,
      included: true
    }))
    
    // 在移动端自动收起侧边栏
    if (isMobile.value) {
      isMobileSidebarOpen.value = false
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '获取表结构失败')
  } finally {
    isLoading.value = false
  }
}

// 处理字段映射变化
const handleMappingsChanged = (mappings: FieldMapping[]) => {
  fieldMappings.value = mappings
}

// 导出CSV文件
const exportToCSV = async () => {
  if (!databaseInstance.value || !selectedTable.value || fieldMappings.value.length === 0) {
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // 获取表数据
    const tableData = await SQLiteService.getTableData(databaseInstance.value, selectedTable.value)
    
    // 转换为CSV
    const csvContent = CSVService.convertToCSV(tableData, fieldMappings.value)
    
    // 下载CSV文件
    const filename = `${selectedTable.value}_${new Date().toISOString().split('T')[0]}`
    CSVService.downloadCSV(csvContent, filename)
    
    showSuccess('CSV导出成功！')
  } catch (error) {
    showError(error instanceof Error ? error.message : '导出CSV失败')
  } finally {
    isLoading.value = false
  }
}

// 显示错误消息
const showError = (message: string) => {
  snackbarMessage.value = message
  snackbarColor.value = 'error'
  snackbarTimeout.value = 5000
  snackbarVisible.value = true
}

// 显示成功消息
const showSuccess = (message: string) => {
  snackbarMessage.value = message
  snackbarColor.value = 'success'
  snackbarTimeout.value = 3000
  snackbarVisible.value = true
}

// 切换移动端侧边栏
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

// 切换暗色模式
const toggleTheme = () => {
  theme.global.name.value = theme.global.name.value === 'light' ? 'dark' : 'light'
}

// 监听窗口大小变化
onMounted(() => {
  const handleResize = () => {
    // 在桌面端自动展开侧边栏
    if (!isMobile.value) {
      isMobileSidebarOpen.value = true
    }
  }
  
  window.addEventListener('resize', handleResize)
  handleResize()
})

// 组件销毁时清理
onUnmounted(() => {
  if (databaseInstance.value) {
    databaseInstance.value.close()
  }
  window.removeEventListener('resize', () => {})
})
</script>

<template>
  <div class="home-container">
    <!-- 初始上传页面 -->
    <v-container 
      v-if="!selectedFile" 
      class="upload-page" 
      fill-height
      fluid
    >
      <v-layout align-center justify-center>
        <v-card class="text-center p-8" elevation="8" max-width="600">
          <v-toolbar flat color="transparent" class="mb-6 justify-end">
            <v-btn icon @click="toggleTheme">
              <v-icon>{{ theme.global.name === 'light' ? 'mdi-moon' : 'mdi-sun' }}</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-title class="text-center justify-center pb-4">
            <v-icon name="mdi-database-sql" size="80" class="mb-4 text-primary" />
            <div>
              <h1 class="text-3xl font-bold">SQLite 转 CSV 工具</h1>
              <p class="text-subtitle-1 text-opacity-90 mt-2">简单高效地将 SQLite 数据库文件转换为 CSV 格式</p>
            </div>
          </v-card-title>
          <v-card-text class="pt-2">
            <FileUpload @file-selected="handleFileSelected" />
          </v-card-text>
        </v-card>
      </v-layout>
    </v-container>
    
    <!-- 主应用界面 -->
    <v-app-bar v-else class="app-header" color="primary" elevation="4" app>
      <v-btn v-if="isMobile" icon @click="toggleMobileSidebar" class="mr-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-toolbar-title>SQLite 转 CSV 工具</v-toolbar-title>
      <v-spacer />
      <v-chip 
        variant="outlined" 
        color="white" 
        class="mr-4" 
        label 
        max-width="250"
        :text="selectedFile"
        show-overflow
      >
        <v-icon left small>mdi-database</v-icon>
      </v-chip>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.name === 'light' ? 'mdi-moon' : 'mdi-sun' }}</v-icon>
      </v-btn>
    </v-app-bar>
    
    <!-- 移动端导航按钮 -->
    <v-btn
      v-if="isMobile && !isMobileSidebarOpen && selectedTable"
      fab
      small
      color="primary"
      absolute
      left="16"
      top="72"
      z="5"
      @click="toggleMobileSidebar"
      density="comfortable"
    >
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    
    <v-main v-if="selectedFile">
      <v-container fluid class="main-layout" style="padding: 0;">
        <!-- 左侧表格列表菜单 -->
        <v-navigation-drawer 
          v-model="isMobileSidebarOpen" 
          :clipped="!isMobile"
          :permanent="!isMobile"
          color="surface-variant" 
          width="280"
          app
        >
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="font-semibold text-lg">数据库表</v-list-item-title>
                <v-list-item-subtitle>{{ tableList.length }} 个表</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <v-list v-if="!isLoading" density="compact" class="menu-content">
            <TableSelector
              :tables="tableList"
              :selected-table="selectedTable"
              :loading="isLoading"
              @table-selected="handleTableSelected"
            />
          </v-list>
          <v-progress-circular v-else class="ma-8" indeterminate></v-progress-circular>
        </v-navigation-drawer>
        
        <!-- 中间内容区域 -->
        <v-container class="content-area p-4" fluid>
          <!-- 加载状态 -->
          <v-card v-if="isLoading" class="ma-auto" min-height="400">
            <v-card-text class="d-flex flex-column items-center justify-center py-12">
              <v-progress-circular indeterminate size="60" color="primary"></v-progress-circular>
              <p class="mt-4 text-subtitle-1">正在处理中...</p>
            </v-card-text>
          </v-card>
          
          <!-- 空状态（未选择表） -->
          <v-card v-else-if="!selectedTable && tableList.length > 0" class="ma-auto" min-height="400">
            <v-card-text class="d-flex flex-column items-center justify-center py-12 text-center">
              <v-icon name="mdi-table-chart" size="80" class="mb-6 text-surface-variant"></v-icon>
              <h2 class="text-2xl font-semibold mb-2">请选择一个数据表</h2>
              <p class="text-subtitle-1 max-w-md">从左侧列表中选择一个表来查看和配置字段映射</p>
            </v-card-text>
          </v-card>
          
          <!-- 空表状态 -->
          <v-card v-else-if="tableList.length === 0" class="ma-auto" min-height="400">
            <v-card-text class="d-flex flex-column items-center justify-center py-12 text-center">
              <v-icon name="mdi-table-off" size="80" class="mb-6 text-surface-variant"></v-icon>
              <h2 class="text-2xl font-semibold mb-2">未找到数据表</h2>
              <p class="text-subtitle-1 max-w-md">当前数据库中没有数据表，请尝试上传其他数据库文件</p>
            </v-card-text>
          </v-card>
          
          <!-- 字段映射表格 -->
          <v-card v-else-if="selectedTable && tableColumns.length > 0" class="ma-auto" elevation="2">
            <v-card-title class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <v-icon name="mdi-table-chart" class="text-primary"></v-icon>
                <h2 class="text-xl font-semibold m-0">{{ selectedTable }}</h2>
              </div>
              <v-chip variant="outlined" color="primary" label>
                {{ tableColumns.length }} 个字段
              </v-chip>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="p-0">
              <FieldMapper
                :columns="tableColumns"
                @mappings-changed="handleMappingsChanged"
              />
            </v-card-text>
          </v-card>
        </v-container>
      </v-container>
    </v-main>
    
    <!-- 悬浮导出按钮 -->
    <v-speed-dial
      v-if="selectedTable && tableColumns.length > 0 && !isLoading"
      :model-value="true"
      location="bottom right"
      absolute
      bottom="24"
      right="24"
      elevation="8"
      class="export-button-container"
    >
      <template v-slot:activator>
        <v-btn
          color="primary"
          @click="exportToCSV"
          size="large"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </template>
      <v-btn
        color="primary"
        @click="exportToCSV"
        class="export-button"
      >
        <v-icon left>mdi-file-delimited-outline</v-icon>
        导出CSV
      </v-btn>
    </v-speed-dial>
    
    <!-- 通知组件 -->
    <v-snackbar
      v-model="snackbarVisible"
      :color="snackbarColor"
      :timeout="snackbarTimeout"
      bottom
      elevation="8"
    >
      {{ snackbarMessage }}
      <template v-slot:action>
        <v-btn text @click="snackbarVisible = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
/* 保留必要的全局样式，其余样式由Vuetify管理 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 初始上传页面样式 */
.upload-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 主布局样式 */
.main-layout {
  min-height: calc(100vh - 64px);
  display: flex;
  overflow: hidden;
}

/* 内容区域 */
.content-area {
  overflow-y: auto;
  min-height: calc(100vh - 64px);
  max-height: calc(100vh - 64px);
}

/* 菜单内容滚动 */
.menu-content {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

/* 导出按钮动画 */
.export-button-container {
  animation: fadeIn 0.5s ease-out, pulse 2s infinite;
  animation-delay: 0.5s, 1s;
}

/* 动画定义 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 响应式设计优化 */
@media (max-width: 600px) {
  .content-area {
    padding: 8px;
  }
  
  .export-button-container {
    bottom: 16px;
    right: 16px;
  }
}

/* 自定义滚动条样式，适配Vuetify主题 */
.menu-content::-webkit-scrollbar,
.content-area::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.menu-content::-webkit-scrollbar-track,
.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.menu-content::-webkit-scrollbar-thumb,
.content-area::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.menu-content::-webkit-scrollbar-thumb:hover,
.content-area::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>