<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from './components/FileUpload.vue'
import TableSelector from './components/TableSelector.vue'
import FieldMapper from './components/FieldMapper.vue'
import SQLiteService from './services/SQLiteService'
import type { SQLiteInstance, ColumnInfo } from './services/SQLiteService'
import { CSVService } from './services/CSVService'

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
const tableColumns = ref<ColumnInfo[]>([])
const fieldMappings = ref<FieldMapping[]>([])

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
      errorMessage.value = '数据库中没有找到表'
    } else {
      console.log('找到的表:', tableList.value)
      // 默认选择第一个表
      if (tableList.value.length > 0 && tableList.value[0]) {
        handleTableSelected(tableList.value[0])
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载数据库失败'
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
    console.log('表结构:', tableColumns.value)
    
    // 重置字段映射为默认状态
    fieldMappings.value = tableColumns.value.map(column => ({
      originalName: column.name,
      outputName: column.name,
      included: true
    }))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取表结构失败'
  } finally {
    isLoading.value = false
  }
}

// 处理字段映射变化
const handleMappingsChanged = (mappings: FieldMapping[]) => {
  fieldMappings.value = mappings
  console.log('字段映射已更新:', mappings)
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
    
    console.log('CSV导出成功')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '导出CSV失败'
  } finally {
    isLoading.value = false
  }
}

// 组件销毁时关闭数据库连接
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (databaseInstance.value) {
    databaseInstance.value.close()
  }
})
</script>

<template>
  <div class="app-container">
    <h1>SQLite 转 CSV 工具</h1>
    <FileUpload @file-selected="handleFileSelected" />
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">正在加载数据库...</div>
    
    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    
    <!-- 表列表 -->
      <div v-if="tableList.length > 0" class="table-section">
        <TableSelector
          :tables="tableList"
          :selected-table="selectedTable"
          @table-selected="handleTableSelected"
        />
        <!-- 表结构展示 -->
        <div v-if="selectedTable && tableColumns.length > 0" class="table-structure">
          <h4>表结构: {{ selectedTable }}</h4>
          <table class="columns-table">
            <thead>
              <tr>
                <th>列名</th>
                <th>数据类型</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="column in tableColumns" :key="column.name">
                <td>{{ column.name }}</td>
                <td>{{ column.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 字段映射组件 -->
        <div v-if="selectedTable && tableColumns.length > 0" class="field-mapping-section">
          <FieldMapper
            :columns="tableColumns"
            @mappings-changed="handleMappingsChanged"
          />
          
          <!-- 导出按钮 -->
          <button 
            class="export-button"
            @click="exportToCSV"
            :disabled="isLoading || fieldMappings.length === 0"
          >
            {{ isLoading ? '导出中...' : '导出CSV' }}
          </button>
        </div>
      </div>
  </div>
</template>

<style scoped>
/* 全局容器样式 */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 头部样式 */
header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 0;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  font-size: 2.8rem;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

/* 文件上传区域 */
.file-upload-section {
  margin-bottom: 30px;
  padding: 30px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  background-color: white;
  transition: all 0.3s ease;
}

.file-upload-section:hover {
  border-color: #4caf50;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.1);
}

/* 错误消息 */
.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 15px;
  border-left: 4px solid #d32f2f;
  animation: slideIn 0.3s ease;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
}

.loading-indicator::after {
  content: '';
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 10px;
}

/* 表选择区域 */
.table-section {
  margin-top: 30px;
}

/* 表结构展示 */
.table-structure {
  margin-top: 20px;
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease;
}

.table-structure h4 {
  margin-top: 0;
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 20px;
  border-bottom: 2px solid #4caf50;
  padding-bottom: 10px;
}

/* 表格样式 */
.columns-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.columns-table th,
.columns-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.columns-table th {
  background-color: #4caf50;
  color: white;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.columns-table tr:last-child td {
  border-bottom: none;
}

.columns-table tr:hover {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}

/* 导出按钮 */
.export-button {
  margin-top: 20px;
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.export-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.export-button:active:not(:disabled) {
  transform: translateY(0);
}

.export-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 字段映射区域 */
.field-mapping-section {
  margin-top: 30px;
  padding: 25px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease;
}

/* 动画效果 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .file-upload-section,
  .table-structure,
  .field-mapping-section {
    padding: 20px;
  }
  
  .columns-table th,
  .columns-table td {
    padding: 10px;
    font-size: 14px;
  }
}
</style>
