<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from 'vuetify'

// 定义事件
const emit = defineEmits(['file-selected'])

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null)

// 上传状态
const isDragging = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const supportedExtensions = ['sqlite', 'db', 'sqlite3', 'db3']

// Vuetify 钩子
const theme = useTheme()

// 通知系统状态
const snackbarMessage = ref('')
const snackbarColor = ref('error')
const snackbarTimeout = ref(3000)
const snackbarVisible = ref(false)

// 触发文件选择对话框
const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
    // 清除input值，允许重复选择同一文件
    target.value = ''
  }
}

// 处理拖拽事件
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    processFile(e.dataTransfer.files[0])
  }
}

// 处理粘贴事件
const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  
  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]) {
    processFile(e.clipboardData.files[0])
  }
}

// 文件处理和验证
const processFile = (file: File) => {
  // 重置错误消息
  errorMessage.value = ''
  
  // 验证文件类型
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
  
  if (!supportedExtensions.includes(fileExtension)) {
    showError(`不支持的文件类型。请上传 SQLite 数据库文件 (${supportedExtensions.join(', ')})`)
    return
  }
  
  // 验证文件大小 (最大 100MB)
  const maxSizeMB = 100
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    showError(`文件太大。最大允许 ${maxSizeMB}MB`)
    return
  }
  
  // 开始上传状态
  isUploading.value = true
  
  // 模拟处理延迟，让用户看到上传动画
  setTimeout(() => {
    // 触发文件选择事件
    emit('file-selected', file)
    // 重置上传状态
    isUploading.value = false
  }, 800)
}

// 显示错误消息
const showError = (message: string) => {
  snackbarMessage.value = message
  snackbarColor.value = 'error'
  snackbarTimeout.value = 5000
  snackbarVisible.value = true
}

</script>

<template>
  <div class="file-upload-container">
    <!-- 上传区域 -->
    <v-card 
      :class="{
        'dragging': isDragging,
        'processing': isUploading
      }"
      elevation="2"
      :color="isDragging ? 'primary-container' : ''"
    >
      <v-card-text 
        class="upload-area text-center"
        @click="triggerFileSelect"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @paste="handlePaste"
      >
        <!-- 加载状态 -->
        <div v-if="isUploading" class="processing-state">
          <v-progress-circular indeterminate size="80" color="primary" class="mb-4"></v-progress-circular>
          <p class="text-subtitle-1">正在处理文件...</p>
        </div>
        <!-- 正常上传状态 -->
        <div v-else class="upload-content">
          <div class="upload-icon-container">
            <v-icon name="mdi-upload" size="64" class="upload-icon" />
            <div class="upload-icon-overlay">
              <v-icon name="mdi-database" size="32" class="text-white" />
            </div>
          </div>
          
          <div class="upload-text">
            <h3 class="text-xl font-semibold mb-2">拖拽或点击上传 SQLite 文件</h3>
            <p class="text-subtitle-2 text-opacity-80">
              支持 .sqlite, .sqlite3, .db, .db3 文件 (最大 100MB)
            </p>
          </div>
          
          <v-btn 
            color="primary"
            variant="elevated"
            size="large"
            :ripple="false"
            @click.stop="triggerFileSelect"
            class="mt-4 upload-button"
            style="min-width: 200px; padding: 0.75rem 2rem;"
          >
            <v-icon left>mdi-folder-open</v-icon>
            <span>选择文件</span>
          </v-btn>
          
          <p class="text-caption text-opacity-60 mt-4">或者直接粘贴文件 (Ctrl+V)</p>
        </div>
        <input 
          ref="fileInput"
          type="file" 
          accept=".sqlite,.sqlite3,.db,.db3" 
          class="file-input"
          @change="handleFileSelect"
        />
      </v-card-text>
    </v-card>
    <!-- 上传说明卡片 -->
    <v-card elevation="1" variant="outlined">
      <v-card-title class="px-6 py-4">
        <v-icon left color="primary">mdi-information-outline</v-icon>
        <span class="text-base font-medium">文件上传提示</span>
      </v-card-title>
      <v-card-text>
        <v-list density="compact">
          <v-list-item class="pa-0">
            <v-icon left color="success" size="small">mdi-check-circle</v-icon>
            <v-list-item-title class="text-sm">支持标准 SQLite 数据库格式</v-list-item-title>
          </v-list-item>
          <v-list-item class="pa-0">
            <v-icon left color="success" size="small">mdi-check-circle</v-icon>
            <v-list-item-title class="text-sm">所有处理在您的浏览器中进行，数据不会上传到服务器</v-list-item-title>
          </v-list-item>
          <v-list-item class="pa-0">
            <v-icon left color="warning" size="small">mdi-alert</v-icon>
            <v-list-item-title class="text-sm">大文件可能需要更长的处理时间</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
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
/* 基础样式 */
.file-upload-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 上传区域 */
  .upload-area {
    padding: 3rem;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    border-radius: 12px;
  }

  .upload-area:hover {
    transform: translateY(-2px);
  }

  .dragging {
    border-color: var(--v-primary-base);
    animation: pulseBackground 1.5s ease-in-out infinite;
  }

  .processing {
    background-color: var(--v-surface-variant-base);
    cursor: not-allowed;
    opacity: 0.9;
  }

  /* 上传内容 */
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
  }

  /* 上传图标容器 */
  .upload-icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
  }

  .upload-icon {
    color: var(--v-primary-base);
    opacity: 0.2;
    animation: float 4s ease-in-out infinite;
  }

  .upload-icon-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--v-primary-base);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s ease-in-out infinite;
  }

/* 处理状态 */
.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  animation: pulse 2s ease-in-out infinite;
}

/* 文件输入 */
.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* 上传按钮样式 */
.upload-button {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.upload-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

/* 装饰性背景元素 */
.upload-area::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(59, 130, 246, 0.05) 10px,
    rgba(59, 130, 246, 0.05) 20px
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.dragging .upload-area::before {
  opacity: 1;
  animation: rotate 20s linear infinite;
}

/* 动画定义 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulseBackground {
  0%, 100% { background-color: var(--v-primary-container-base); }
  50% { background-color: var(--v-primary-container-base); opacity: 0.9; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area {
    padding: 2rem 1.5rem;
  }
  
  .upload-icon-container {
    width: 100px;
    height: 100px;
  }
  
  .upload-icon {
    font-size: 52px;
  }
  
  .upload-icon-overlay {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .upload-area {
    padding: 1.5rem 1rem;
  }
  
  .upload-icon-container {
    width: 80px;
    height: 80px;
  }
  
  .upload-icon {
    font-size: 44px;
  }
  
  .upload-icon-overlay {
    width: 40px;
    height: 40px;
  }
}
</style>