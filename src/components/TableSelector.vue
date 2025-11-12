<script setup lang="ts">
import { ref, watch } from 'vue'

// 定义属性
const props = defineProps<{
  tables: string[],
  selectedTable: string
}>()

// 定义事件
const emit = defineEmits<{
  'table-selected': [table: string]
}>()

// 本地选中的表
const localSelectedTable = ref(props.selectedTable)

// 监听props变化
watch(() => props.selectedTable, (newVal) => {
  localSelectedTable.value = newVal
})

// 处理表选择
const handleTableSelect = (table: string) => {
  localSelectedTable.value = table
  emit('table-selected', table)
}

// 判断表是否被选中
const isTableSelected = (table: string): boolean => {
  return localSelectedTable.value === table
}
</script>

<template>
  <div class="table-selector-container">
    <h3>选择要转换的表</h3>
    <div class="table-options">
      <button
        v-for="table in tables"
        :key="table"
        :class="['table-button', { 'selected': isTableSelected(table) }]"
        @click="handleTableSelect(table)"
      >
        {{ table }}
      </button>
    </div>
    <div v-if="localSelectedTable" class="selected-info">
      当前选择: <strong>{{ localSelectedTable }}</strong>
    </div>
  </div>
</template>

<style scoped>
/* 表选择器容器 */
.table-selector-container {
  margin: 20px 0;
  padding: 25px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease;
}

/* 标题样式 */
h3 {
  margin-top: 0;
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

/* 表选项容器 */
.table-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

/* 表按钮样式 */
.table-button {
  padding: 10px 18px;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  outline: none;
}

.table-button:hover {
  background-color: #e8f5e9;
  border-color: #4caf50;
  transform: translateY(-1px);
}

.table-button.selected {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 选中信息 */
.selected-info {
  font-size: 14px;
  color: #666;
  margin-top: 15px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.selected-info strong {
  color: #4caf50;
  font-weight: 600;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-selector-container {
    padding: 20px;
  }
  
  h3 {
    font-size: 16px;
  }
  
  .table-options {
    gap: 8px;
  }
  
  .table-button {
    padding: 8px 14px;
    font-size: 13px;
    flex: 1 0 auto;
    text-align: center;
  }
}
</style>