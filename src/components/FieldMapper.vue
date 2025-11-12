<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ColumnInfo } from '../services/SQLiteService'

// 字段映射项接口
export interface FieldMapping {
  originalName: string
  outputName: string
  included: boolean
}

// 定义属性
const props = defineProps<{
  columns: ColumnInfo[]
}>()

// 定义事件
const emit = defineEmits<{
  'mappings-changed': [mappings: FieldMapping[]]
}>()

// 字段映射列表
const fieldMappings = ref<FieldMapping[]>([])

// 监听列变化，初始化映射
  watch(() => props.columns, (newColumns) => {
    if (newColumns && newColumns.length > 0) {
      fieldMappings.value = newColumns.map(column => ({
        originalName: column.name,
        outputName: column.name,
        included: true
      }))
      emitMappingsChange()
    }
  }, { immediate: true })

// 计算包含的字段数量
const includedFieldCount = computed(() => {
  return fieldMappings.value.filter(mapping => mapping.included).length
})

// 更新字段包含状态
const toggleFieldInclusion = (originalName: string) => {
  const mapping = fieldMappings.value.find(m => m.originalName === originalName)
  if (mapping) {
    mapping.included = !mapping.included
    emitMappingsChange()
  }
}

// 更新输出字段名
const updateOutputName = (originalName: string, newName: string) => {
  const mapping = fieldMappings.value.find(m => m.originalName === originalName)
  if (mapping) {
    mapping.outputName = newName
    emitMappingsChange()
  }
}

// 向上移动字段
  const moveFieldUp = (index: number) => {
    if (index > 0 && fieldMappings.value[index] && fieldMappings.value[index - 1]) {
      // 创建新数组
      const newMappings = [...fieldMappings.value]
      // 使用临时变量进行交换
      const temp = newMappings[index] as FieldMapping
      newMappings[index] = newMappings[index - 1] as FieldMapping
      newMappings[index - 1] = temp
      fieldMappings.value = newMappings
      emitMappingsChange()
    }
  }

  // 向下移动字段
  const moveFieldDown = (index: number) => {
    if (index < fieldMappings.value.length - 1 && fieldMappings.value[index] && fieldMappings.value[index + 1]) {
      // 创建新数组
      const newMappings = [...fieldMappings.value]
      // 使用临时变量进行交换
      const temp = newMappings[index] as FieldMapping
      newMappings[index] = newMappings[index + 1] as FieldMapping
      newMappings[index + 1] = temp
      fieldMappings.value = newMappings
      emitMappingsChange()
    }
  }

// 全选/取消全选
const toggleSelectAll = () => {
  const allIncluded = fieldMappings.value.every(m => m.included)
  fieldMappings.value.forEach(m => {
    m.included = !allIncluded
  })
  emitMappingsChange()
}

// 判断是否全选
const isAllSelected = computed(() => {
  return fieldMappings.value.length > 0 && fieldMappings.value.every(m => m.included)
})

// 判断是否部分选中
const isPartiallySelected = computed(() => {
  const includedCount = fieldMappings.value.filter(m => m.included).length
  return includedCount > 0 && includedCount < fieldMappings.value.length
})

// 发送映射变化事件
const emitMappingsChange = () => {
  emit('mappings-changed', [...fieldMappings.value])
}
</script>

<template>
  <div class="field-mapper-container">
    <h3>字段映射设置</h3>
    
    <div class="header-row">
      <span class="field-count">
        已选择 {{ includedFieldCount }}/{{ fieldMappings.length }} 个字段
      </span>
      <label class="select-all-label">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isPartiallySelected"
          @change="toggleSelectAll"
        />
        全选/取消全选
      </label>
    </div>
    
    <div class="mappings-list">
      <div 
        v-for="(mapping, index) in fieldMappings"
        :key="mapping.originalName"
        class="mapping-item"
      >
        <div class="mapping-controls">
          <button
            class="move-button"
            @click="moveFieldUp(index)"
            :disabled="index === 0"
            title="向上移动"
          >
            ↑
          </button>
          <button
            class="move-button"
            @click="moveFieldDown(index)"
            :disabled="index === fieldMappings.length - 1"
            title="向下移动"
          >
            ↓
          </button>
        </div>
        
        <div class="mapping-main">
          <input
            type="checkbox"
            :checked="mapping.included"
            @change="toggleFieldInclusion(mapping.originalName)"
            class="include-checkbox"
          />
          <div class="field-info">
            <div class="original-field">
              <span class="label">原始字段:</span>
              <span class="value">{{ mapping.originalName }}</span>
            </div>
            <div class="output-field">
              <span class="label">CSV输出字段名:</span>
              <input
                type="text"
                v-model="mapping.outputName"
                @input="updateOutputName(mapping.originalName, mapping.outputName)"
                class="output-name-input"
                :disabled="!mapping.included"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
/* 字段映射容器样式 */
.field-mapper-container {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 15px;
  font-weight: 600;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.field-count {
  font-size: 14px;
  color: #666;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s ease;
}

.select-all-label:hover {
  color: #4caf50;
}

.mappings-list {
  max-height: 400px;
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mapping-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.mapping-item:last-child {
  border-bottom: none;
}

.mapping-item:hover {
  background-color: #f8f9fa;
  transform: translateX(4px);
}

.mapping-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-right: 16px;
}

.move-button {
  width: 32px;
  height: 32px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.move-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

.move-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.mapping-main {
  display: flex;
  align-items: center;
  flex: 1;
}

.include-checkbox {
  margin-right: 16px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  transform: scale(1.1);
}

.field-info {
  flex: 1;
}

.original-field,
.output-field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.original-field:last-child,
.output-field:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 12px;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.output-name-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  transition: all 0.3s ease;
  outline: none;
}

.output-name-input:focus {
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.output-name-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .mapping-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }
  
  .mapping-controls {
    flex-direction: row;
    margin-bottom: 12px;
    margin-right: 0;
  }
  
  .label {
    width: 120px;
  }
  
  .output-name-input {
    min-width: 150px;
  }
}
</style>