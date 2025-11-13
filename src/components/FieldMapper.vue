<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// 定义字段映射类型
interface FieldMapping {
  source: string
  target: string
  include: boolean
}

// 定义属性
const props = defineProps({
  tableColumns: {
    type: Array as () => string[],
    default: () => []
  },
  selectedTable: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['mappings-changed'])

// 主题相关已移除

// 字段映射状态
const mappings = ref<FieldMapping[]>([])
// 全选状态
const selectAll = ref(false)
// 过滤条件
const filterQuery = ref('')
// 排序字段
const sortField = ref<keyof FieldMapping>('source')
// 排序方向
const sortDirection = ref<'asc' | 'desc'>('asc')

// 初始化映射
const initializeMappings = () => {
  if (!props.tableColumns || props.tableColumns.length === 0) {
    mappings.value = []
    return
  }

  // 创建映射
  const newMappings: FieldMapping[] = props.tableColumns.map(column => ({
    source: column,
    target: column,
    include: true
  }))

  mappings.value = newMappings
  updateSelectAll()
  emitMappings()
}

// 更新映射
const updateMapping = (index: number, field: 'target' | 'include', value: string | boolean) => {
  if (index >= 0 && index < mappings.value.length) {
    if (field === 'target' && typeof value === 'string') {
      mappings.value[index].target = value
    } else if (field === 'include' && typeof value === 'boolean') {
      mappings.value[index].include = value
    }
    updateSelectAll()
    emitMappings()
  }
}

// 切换全选
const toggleAll = () => {
  filteredMappings.value.forEach(mapping => {
    mapping.include = selectAll.value
  })
  emitMappings()
}

// 更新全选状态
const updateSelectAll = () => {
  if (filteredMappings.value.length === 0) {
    selectAll.value = false
    return
  }
  selectAll.value = filteredMappings.value.every(mapping => mapping.include)
}

// 切换排序字段
const changeSortField = (field: keyof FieldMapping) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// 获取排序图标
const getSortIcon = (field: keyof FieldMapping) => {
  if (sortField.value !== field) return 'mdi-sort'
  return sortDirection.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

// 清除过滤
const clearFilter = () => {
  filterQuery.value = ''
}

// 过滤后的映射
const filteredMappings = computed(() => {
  if (!filterQuery.value) return sortedMappings.value
  
  const query = filterQuery.value.toLowerCase()
  return sortedMappings.value.filter(mapping => 
    mapping.source.toLowerCase().includes(query) || 
    mapping.target.toLowerCase().includes(query)
  )
})

// 排序后的映射
const sortedMappings = computed(() => {
  const sorted = [...mappings.value]
  return sorted.sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'source') {
      comparison = a.source.localeCompare(b.source)
    } else if (sortField.value === 'target') {
      comparison = a.target.localeCompare(b.target)
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// 发射映射变更事件
const emitMappings = () => {
  const activeMappings = mappings.value.filter(mapping => mapping.include)
  emit('mappings-changed', activeMappings)
}

// 监听表格列变化
watch(() => props.tableColumns, () => {
  initializeMappings()
}, { deep: true })

// 监听过滤条件变化，更新全选状态
watch(() => filterQuery.value, () => {
  updateSelectAll()
})

// 监听过滤后映射的包含状态变化
watch(() => filteredMappings.value.map(m => m.include), () => {
  updateSelectAll()
}, { deep: true })

// 初始化
onMounted(() => {
  initializeMappings()
})
</script>

<template>
  <div class="field-mapper">
    <!-- 头部工具栏 -->
    <v-card class="mb-4" elevation="1">
      <v-card-content class="p-4">
        <v-row align="center" justify="space-between">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="filterQuery"
              label="过滤字段"
              placeholder="输入字段名搜索..."
              density="compact"
              variant="outlined"
              :disabled="loading || !selectedTable"
            >
              <template v-slot:prepend-inner>
                <v-icon>mdi-magnify</v-icon>
              </template>
              <template v-slot:append-inner v-if="filterQuery">
                <v-btn
                  icon
                  @click="clearFilter"
                  size="small"
                  :disabled="loading"
                >
                  <v-icon size="small">mdi-close-circle-outline</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="mt-4 md:mt-0">
            <div class="text-right">
              <span class="text-body-secondary text-sm">
                显示 {{ filteredMappings.length }}/{{ mappings.length }} 个字段
              </span>
            </div>
          </v-col>
        </v-row>
      </v-card-content>
    </v-card>

    <!-- 映射表格容器 -->
    <div class="mapping-table-container flex-1 overflow-hidden flex flex-col">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <v-container fluid class="h-full flex flex-col items-center justify-center">
          <v-progress-circular indeterminate size="50" color="primary" class="mb-4"></v-progress-circular>
          <p class="text-body-2 font-medium text-on-surface-variant mb-0">加载字段信息...</p>
        </v-container>
      </div>

      <!-- 空状态 - 无表格列 -->
      <div
        v-else-if="!props.tableColumns || props.tableColumns.length === 0"
        class="empty-state"
      >
        <v-container fluid class="h-full flex flex-col items-center justify-center text-center">
          <v-icon name="mdi-table-large-off" size="64" color="on-surface-variant" class="mb-4 opacity-60"></v-icon>
          <p class="text-body-1 font-semibold mb-2 text-on-surface">暂无字段信息</p>
          <p class="text-body-2 text-on-surface-variant max-w-xs mb-0">
            请先在左侧选择一个表格以查看其字段
          </p>
        </v-container>
      </div>

      <!-- 空状态 - 搜索无结果 -->
      <div
        v-else-if="filteredMappings.length === 0"
        class="empty-state search-empty"
      >
        <v-container fluid class="h-full flex flex-col items-center justify-center text-center">
          <v-icon name="mdi-magnify-off" size="64" color="on-surface-variant" class="mb-4 opacity-60"></v-icon>
          <p class="text-body-1 font-semibold mb-2 text-on-surface">未找到匹配字段</p>
          <p class="text-body-2 text-on-surface-variant max-w-xs mb-4">
            没有匹配 "{{ filterQuery }}" 的字段
          </p>
          <v-btn
            variant="text"
            color="primary"
            @click="clearFilter"
            class="clear-search-button"
          >
            <v-icon left>mdi-refresh</v-icon>
            清除搜索
          </v-btn>
        </v-container>
      </div>

      <!-- 表格内容 -->
      <div v-else class="table-container overflow-auto">
        <table class="mapping-table w-full">
          <thead>
            <tr>
              <th class="checkbox-column">
                <v-checkbox
                  v-model="selectAll"
                  :disabled="filteredMappings.length === 0 || loading"
                  @change="toggleAll"
                  density="compact"
                />
              </th>
              <th
                class="source-column cursor-pointer"
                @click="changeSortField('source')"
              >
                <div class="sortable-header flex items-center gap-2">
                  <span class="font-semibold text-sm text-on-surface-variant">源字段 (数据库)</span>
                  <v-icon :name="getSortIcon('source')" class="sort-icon text-on-surface-variant" size="small" />
                </div>
              </th>
              <th
                class="target-column cursor-pointer"
                @click="changeSortField('target')"
              >
                <div class="sortable-header flex items-center gap-2">
                  <span class="font-semibold text-sm text-on-surface-variant">目标字段 (CSV)</span>
                  <v-icon :name="getSortIcon('target')" class="sort-icon text-on-surface-variant" size="small" />
                </div>
              </th>
              <th class="actions-column"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(mapping, index) in filteredMappings"
              :key="index"
              class="table-row"
            >
              <td class="checkbox-column">
                <v-checkbox
                  v-model="mapping.include"
                  @change="updateMapping(index, 'include', mapping.include)"
                  :disabled="loading"
                  density="compact"
                />
              </td>
              <td class="source-column">
                <div class="source-field text-body-1 truncate" :title="mapping.source">
                  {{ mapping.source }}
                </div>
              </td>
              <td class="target-column">
                <v-text-field
                  v-model="mapping.target"
                  @update:modelValue="updateMapping(index, 'target', $event)"
                  density="compact"
                  variant="outlined"
                  :disabled="loading"
                  hide-details
                />
              </td>
              <td class="actions-column"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.field-mapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 映射表格容器 */
.mapping-table-container {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* 表格容器 */
.table-container {
  flex: 1;
  overflow: auto;
}

/* 加载状态 */
.loading-state,
.empty-state,
.search-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格样式 */
.mapping-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* 表头样式 */
.mapping-table thead {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.mapping-table th {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

/* 表格行样式 */
.table-row {
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f5f5f5;
  opacity: 0.7;
}

.table-row td {
  padding: 8px;
  border-bottom: 1px solid #eeeeee;
}

/* 列宽样式 */
.checkbox-column {
  width: 48px;
  text-align: center;
}

.source-column {
  width: 30%;
  min-width: 150px;
}

.target-column {
  flex: 1;
  min-width: 200px;
}

.actions-column {
  width: 60px;
}

/* 排序图标样式 */
.sort-icon {
  transition: transform 0.2s;
}

/* 可排序表头 */
.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover .sort-icon {
  color: #1976d2;
}

/* 源字段样式 */
.source-field {
  padding: 8px 0;
}

/* 自定义滚动条 */
.table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: transparent;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background-color: #9e9e9e;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mapping-table-container {
    font-size: 14px;
  }
  
  .mapping-table th,
  .mapping-table td {
    padding: 6px 4px;
  }
  
  .source-column {
    min-width: 120px;
  }
  
  .target-column {
    min-width: 150px;
  }
}

@media (max-width: 600px) {
  .checkbox-column {
    width: 40px;
  }
  
  .actions-column {
    width: 50px;
  }
}

/* 减少动画的偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .field-mapper {
    animation: none;
  }
}
</style>