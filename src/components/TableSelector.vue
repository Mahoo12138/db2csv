<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 定义属性
const props = defineProps({
  tables: {
    type: Array as () => string[],
    required: true,
    default: () => []
  },
  selectedTable: {
    type: String,
    required: true,
    default: ''
  },
  loading: {
    type: Boolean,
    required: false,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['table-selected'])

// 搜索查询
const searchQuery = ref('')

// 过滤后的表列表
const filteredTables = computed(() => {
  if (!searchQuery.value) return props.tables
  
  const query = searchQuery.value.toLowerCase()
  return props.tables.filter(table => 
    table.toLowerCase().includes(query)
  )
})

// 处理表选择
const handleTableSelect = (table: string) => {
  emit('table-selected', table)
}

// 监听表列表变化，清空搜索
watch(() => props.tables, () => {
  searchQuery.value = ''
}, { deep: true })

// 滚动到选中项
const scrollToSelected = () => {
  if (!props.selectedTable) return
  
  setTimeout(() => {
    const element = document.getElementById(`table-${props.selectedTable}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// 监听选中表变化，滚动到选中项
watch(() => props.selectedTable, scrollToSelected)
</script>

<template>
  <div class="table-selector">
    <!-- 搜索框 -->
    <v-container fluid class="p-4">
      <v-text-field
        v-model="searchQuery"
        label="搜索表"
        placeholder="输入表名查找..."
        density="compact"
        variant="outlined"
        :disabled="loading || tables.length === 0"
      >
        <template v-slot:prepend-inner>
          <v-icon>mdi-magnify</v-icon>
        </template>
        <template v-slot:append-inner v-if="searchQuery">
          <v-btn 
            icon 
            @click="searchQuery = ''" 
            size="small"
            :disabled="loading"
          >
            <v-icon size="small">mdi-close-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </v-container>
    
    <!-- 表格列表容器 -->
    <div class="table-list-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate size="40" color="primary"></v-progress-circular>
        <p class="mt-2 text-subtitle-2">加载表列表...</p>
      </div>
      <!-- 空状态 -->
      <div v-else-if="tables.length === 0" class="empty-state">
        <v-icon name="mdi-table-off" size="40" class="mb-2 text-surface-variant"></v-icon>
        <p class="text-subtitle-2">未找到数据表</p>
      </div>
      <!-- 搜索无结果状态 -->
      <div v-else-if="searchQuery && filteredTables.length === 0" class="search-empty-state">
        <v-icon name="mdi-alert-circle" size="40" class="mb-2 text-surface-variant"></v-icon>
        <p class="text-subtitle-2">没有找到匹配的表</p>
      </div>
      <!-- 表格列表 -->
      <v-list v-else class="table-list" density="compact">
        <v-list-item 
          v-for="table in filteredTables" 
          :key="table"
          :id="`table-${table}`"
          :class="{
            'selected': selectedTable === table
          }"
          @click="handleTableSelect(table)"
          :color="selectedTable === table ? 'primary-container' : ''"
          :prepend-icon="selectedTable === table ? 'mdi-check' : 'mdi-table'
          "
          :prepend-icon-color="selectedTable === table ? 'primary' : ''"
          class="transition-all duration-200"
        >
          <v-list-item-title class="truncate">{{ table }}</v-list-item-title>
          <v-tooltip 
            v-if="selectedTable === table"
            text="已选择"
            location="right"
            origin="center right"
            transition="v-tooltip-transition"
          >
            <v-btn
              icon
              size="small"
              color="primary"
              variant="text"
            >
              <v-icon size="small">mdi-check-circle</v-icon>
            </v-btn>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.table-selector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 表格列表容器 */
.table-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px 8px;
}

/* 加载状态 */
.loading-state,
.empty-state,
.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 150px;
}

/* 表格列表 */
.table-list {
  padding: 0;
}

/* 选中项样式增强 */
.selected {
  background-color: var(--v-primary-container);
}

/* 列表项悬停效果 */
.v-list-item:hover:not(.selected) {
  background-color: var(--v-surface-variant);
}

/* 过渡动画 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-200 {
  transition-duration: 200ms;
}

/* 自定义滚动条 */
.table-list-container::-webkit-scrollbar {
  width: 4px;
}

.table-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.table-list-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.table-list-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .table-list-container {
    padding: 0 2px 4px;
  }
  
  .loading-state,
  .empty-state,
  .search-empty-state {
    padding: 1.5rem 1rem;
  }
}
</style>