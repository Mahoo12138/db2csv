<script setup lang="ts">
import { ref } from 'vue'

// 定义事件
const emit = defineEmits<{
  fileSelected: [file: File]
}>()

// 文件引用
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')

// 处理文件选择
  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const file = target.files[0]
      
      if (!file) {
        return
      }
      
      // 检查文件扩展名
      const isValid = file.name.endsWith('.db') || file.name.endsWith('.sqlite')
      if (!isValid) {
        alert('请上传SQLite数据库文件(.db或.sqlite格式)')
        target.value = ''
        return
      }
      selectedFileName.value = file.name
      emit('fileSelected', file)
    }
  }

// 清除选择
const clearSelection = () => {
  selectedFileName.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="file-upload-container">
    <h3>上传SQLite数据库文件</h3>
    <div class="upload-area">
      <input
        ref="fileInput"
        type="file"
        accept=".db,.sqlite"
        @change="handleFileChange"
        class="file-input"
      />
      <button 
        type="button" 
        @click="fileInput?.click()"
        class="upload-button"
      >
        选择文件
      </button>
      <span v-if="selectedFileName" class="selected-file">
        {{ selectedFileName }}
        <button @click="clearSelection" class="clear-button">清除</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 文件上传容器 */
.file-upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #42b883;
  background-color: #f8fff8;
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.1);
}

.file-input {
  display: none;
}

.upload-button {
  padding: 12px 32px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 15px;
}

.upload-button:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.selected-file {
  margin-top: 20px;
  padding: 16px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.3s ease;
}

.clear-button {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-button:hover {
  background-color: #ffebee;
  transform: rotate(90deg);
}

/* 动画效果 */
@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-upload-container {
    padding: 15px;
  }
  
  .upload-area {
    padding: 30px 15px;
    min-height: 180px;
  }
  
  .upload-button {
    width: 100%;
    padding: 12px 20px;
  }
  
  .selected-file {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>