<template>
  <v-card class="data-preview-card" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-table-eye" class="mr-2" color="primary"></v-icon>
      数据预览 - {{ tableName || '未选择表' }}
    </v-card-title>

    <v-card-text>
      <!-- 加载状态 -->
      <v-row v-if="isLoading" class="justify-center">
        <v-col cols="12" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="50"
            class="my-4"
          ></v-progress-circular>
          <p class="text-body-2 text-secondary">正在加载数据...</p>
        </v-col>
      </v-row>

      <!-- 错误状态 -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="clearError"
      >
        {{ error }}
      </v-alert>

      <!-- 空状态 -->
      <v-row v-else-if="!tableName" class="justify-center">
        <v-col cols="12" class="text-center">
          <v-icon icon="mdi-table-search" size="80" color="grey-lighten-1" class="mb-4"></v-icon>
          <p class="text-body-1 text-secondary">请在左侧选择一个数据表</p>
        </v-col>
      </v-row>

      <!-- 数据为空 -->
      <v-row v-else-if="tableData.length === 0" class="justify-center">
        <v-col cols="12" class="text-center">
          <v-icon icon="mdi-database-off" size="80" color="grey-lighten-1" class="mb-4"></v-icon>
          <p class="text-body-1 text-secondary">该表中没有数据</p>
        </v-col>
      </v-row>

      <!-- 数据表格 -->
      <div v-else>
        <v-data-table
          :headers="tableHeaders"
          :items="tableData"
          :loading="isLoading"
          :search="search"
          hover
          class="elevation-1"
        >
        </v-data-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import SQLiteService from '../services/SQLiteService'
import type { SQLiteInstance } from '../services/SQLiteService'

// Props定义
interface Props {
  databaseInstance: SQLiteInstance | null
  tableName: string
}

const props = defineProps<Props>()

// 状态管理
const isLoading = ref(false)
const error = ref('')
const tableData = ref<Record<string, any>[]>([])
const search = ref('')

// 计算属性
const tableHeaders = computed(() => {
  if (tableData.value.length === 0) return []
  
  return Object.keys(tableData.value[0]).map(key => ({
    key,
    title: key,
    sortable: true
  }))
})





// 方法定义
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toLocaleString('zh-CN')
  }
  return String(value)
}

const loadTableData = async () => {
  if (!props.databaseInstance || !props.tableName) {
    tableData.value = []
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // 使用数据库实例的queryTable方法获取数据
    const data = await props.databaseInstance.queryTable(props.tableName)
    tableData.value = data
  } catch (err) {
    console.error('加载表数据失败:', err)
    error.value = err instanceof Error ? err.message : '加载数据失败'
    tableData.value = []
  } finally {
    isLoading.value = false
  }
}

const clearError = () => {
  error.value = ''
}

// 监听器
watch(() => props.tableName, (newTableName) => {
  if (newTableName) {
    loadTableData()
  } else {
    tableData.value = []
    error.value = ''
  }
})

watch(() => props.databaseInstance, (newInstance) => {
  if (newInstance && props.tableName) {
    loadTableData()
  }
})



// 生命周期
onMounted(() => {
  if (props.databaseInstance && props.tableName) {
    loadTableData()
  }
})
</script>

<style scoped>
.data-preview-card {
  height: 100%;
  min-height: 400px;
}

.cell-content {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.v-data-table__th) {
  background-color: rgba(var(--v-theme-primary), 0.05);
  font-weight: 600 !important;
}

:deep(.v-data-table__td) {
  padding: 8px 16px !important;
}

@media (max-width: 768px) {
  .cell-content {
    max-width: 120px;
  }
}
</style>