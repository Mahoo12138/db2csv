<template>
  <v-card class="export-mapping-card" elevation="0">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-file-export" class="mr-2" color="primary"></v-icon>
        导出映射
      </div>
      <div class="text-subtitle-2 text-secondary">
        {{ validMappings.length }}/{{ mappings.length }} 个有效映射
      </div>
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
          <p class="text-body-2 text-secondary">正在加载字段信息...</p>
        </v-col>
      </v-row>

      <!-- 空状态 -->
      <v-row v-else-if="!columns || columns.length === 0" class="justify-center">
        <v-col cols="12" class="text-center">
          <v-icon icon="mdi-table-large-off" size="80" color="grey-lighten-1" class="mb-4"></v-icon>
          <p class="text-body-1 text-secondary">请先选择一个数据表</p>
        </v-col>
      </v-row>

      <!-- 映射表格 -->
      <div v-else>
        <!-- 工具栏 -->
        <v-row class="mb-4" align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="搜索字段"
              placeholder="输入SQLite字段名或CSV列名..."
              density="compact"
              variant="outlined"
              hide-details
            >
              <template v-slot:prepend-inner>
                <v-icon>mdi-magnify</v-icon>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="text-right">
            <v-btn
              color="success"
              variant="tonal"
              @click="exportToCSV"
              :disabled="validMappings.length === 0 || isExporting"
              :loading="isExporting"
              class="mr-2"
            >
              <v-icon left>mdi-download</v-icon>
              导出CSV
            </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              @click="addNewMapping"
              :disabled="!canAddMapping"
            >
              <v-icon left>mdi-plus</v-icon>
              添加映射
            </v-btn>
            <v-btn
              color="secondary"
              variant="text"
              @click="resetToDefault"
              class="ml-2"
            >
              <v-icon left>mdi-refresh</v-icon>
              重置
            </v-btn>
          </v-col>
        </v-row>

        <!-- 映射表格 -->
        <v-data-table
          :headers="tableHeaders"
          :items="filteredMappings"
          :search="search"
          :items-per-page="itemsPerPage"
          :items-per-page-options="itemsPerPageOptions"
          hover
          class="elevation-1 mapping-table"
        >
          <!-- SQLite字段列 -->
          <template v-slot:item.sqliteField="{ item }">
            <div class="d-flex align-center">
              <v-icon 
                v-if="item.isCustom" 
                icon="mdi-plus-circle" 
                color="success" 
                size="small" 
                class="mr-2"
              ></v-icon>
              <v-icon 
                v-else 
                icon="mdi-database" 
                color="primary" 
                size="small" 
                class="mr-2"
              ></v-icon>
              <span :class="{ 'text-success': item.isCustom }">
                {{ item.sqliteField }}
              </span>
            </div>
          </template>

          <!-- CSV列名列（可编辑） -->
          <template v-slot:item.csvColumn="{ item }">
            <v-text-field
              v-model="item.csvColumn"
              density="compact"
              variant="outlined"
              hide-details
              :error="!isValidCsvColumn(item.csvColumn)"
              :error-messages="getCsvColumnError(item.csvColumn)"
              @update:model-value="updateMapping(item, 'csvColumn', $event)"
              class="csv-column-input"
            >
              <template v-slot:append-inner v-if="!isValidCsvColumn(item.csvColumn)">
                <v-icon icon="mdi-alert-circle" color="error" size="small"></v-icon>
              </template>
            </v-text-field>
          </template>

          <!-- 数据类型列 -->
          <template v-slot:item.dataType="{ item }">
            <v-chip
              :color="getDataTypeColor(item.dataType)"
              size="small"
              variant="tonal"
            >
              {{ item.dataType }}
            </v-chip>
          </template>

          <!-- 操作列 -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex align-center">
              <v-tooltip text="删除映射" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    color="error"
                    variant="text"
                    @click="removeMapping(item)"
                    :disabled="!canRemoveMapping(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- 底部插槽 -->
          <template v-slot:bottom>
            <div class="d-flex align-center justify-space-between pa-2">
              <div class="text-body-2 text-secondary">
                共 {{ mappings.length }} 个映射
              </div>
              <v-pagination
                v-model="page"
                :length="pageCount"
                :total-visible="5"
                density="comfortable"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card-text>




  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// 映射项接口
interface MappingItem {
  id: string
  sqliteField: string
  csvColumn: string
  dataType: string
  isCustom: boolean
  originalField?: string
}

// 列信息接口
interface ColumnInfo {
  name: string
  type: string
  notnull?: boolean
  pk?: boolean
}

// Props定义
interface Props {
  columns: ColumnInfo[]
  isLoading?: boolean
  databaseInstance: any
  tableName: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// 事件定义
const emit = defineEmits<{
  'update:mappings': [mappings: MappingItem[]]
}>()

// 状态管理
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(10)
const mappings = ref<MappingItem[]>([])
const isExporting = ref(false)

// 分页选项
const itemsPerPageOptions = [
  { value: 5, title: '5' },
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: -1, title: '全部' }
]

// 表格头定义
const tableHeaders = [
  { key: 'sqliteField', title: 'SQLite字段', sortable: true },
  { key: 'csvColumn', title: 'CSV列名', sortable: true },
  { key: 'dataType', title: '数据类型', sortable: true },
  { key: 'actions', title: '操作', sortable: false, align: 'center' as const }
]

// 计算属性
const filteredMappings = computed(() => {
  if (!search.value) return mappings.value
  
  const query = search.value.toLowerCase()
  return mappings.value.filter(mapping => 
    mapping.sqliteField.toLowerCase().includes(query) || 
    mapping.csvColumn.toLowerCase().includes(query)
  )
})

const pageCount = computed(() => {
  if (itemsPerPage.value === -1) return 1
  return Math.ceil(filteredMappings.value.length / itemsPerPage.value)
})

const validMappings = computed(() => {
  return mappings.value.filter(mapping => 
    isValidCsvColumn(mapping.csvColumn) && 
    mapping.sqliteField.trim() !== ''
  )
})

const canAddMapping = computed(() => {
  return props.columns && props.columns.length > 0
})

// 方法定义
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

const initializeMappings = () => {
  if (!props.columns || props.columns.length === 0) {
    mappings.value = []
    return
  }

  // 根据列信息创建默认映射
  mappings.value = props.columns.map(column => ({
    id: generateId(),
    sqliteField: column.name,
    csvColumn: column.name, // 默认CSV列名与SQLite字段名相同
    dataType: column.type,
    isCustom: false,
    originalField: column.name
  }))
}

const isValidCsvColumn = (csvColumn: string): boolean => {
  if (!csvColumn || csvColumn.trim() === '') return false
  
  // CSV列名验证规则
  const trimmedColumn = csvColumn.trim()
  if (trimmedColumn.length === 0) return false
  
  // 检查是否包含非法字符
  const invalidChars = /[,"\n\r]/
  if (invalidChars.test(trimmedColumn)) return false
  
  return true
}

const getCsvColumnError = (csvColumn: string): string => {
  if (!csvColumn || csvColumn.trim() === '') {
    return 'CSV列名不能为空'
  }
  
  const trimmedColumn = csvColumn.trim()
  
  // 检查非法字符
  const invalidChars = /[,"\n\r]/
  if (invalidChars.test(trimmedColumn)) {
    return '列名不能包含逗号、引号或换行符'
  }
  
  return ''
}

const getDataTypeColor = (dataType: string): string => {
  const type = dataType.toLowerCase()
  if (type.includes('int')) return 'primary'
  if (type.includes('text') || type.includes('varchar')) return 'success'
  if (type.includes('real') || type.includes('float') || type.includes('double')) return 'warning'
  if (type.includes('bool')) return 'info'
  if (type.includes('date') || type.includes('time')) return 'secondary'
  return 'grey'
}

const updateMapping = (item: MappingItem, field: keyof MappingItem, value: any) => {
  const index = mappings.value.findIndex(m => m.id === item.id)
  if (index >= 0) {
    mappings.value[index] = { ...mappings.value[index], [field]: value }
    emit('update:mappings', mappings.value)
  }
}

const addNewMapping = () => {
  const newMapping: MappingItem = {
    id: generateId(),
    sqliteField: `custom_field_${mappings.value.length + 1}`,
    csvColumn: `custom_column_${mappings.value.length + 1}`,
    dataType: 'TEXT',
    isCustom: true
  }
  
  mappings.value.push(newMapping)
  emit('update:mappings', mappings.value)
}

const removeMapping = (item: MappingItem) => {
  const index = mappings.value.findIndex(m => m.id === item.id)
  if (index >= 0) {
    mappings.value.splice(index, 1)
    emit('update:mappings', mappings.value)
  }
}

const canRemoveMapping = (item: MappingItem): boolean => {
  // 保留至少一个映射
  return mappings.value.length > 1 || item.isCustom
}

const resetToDefault = () => {
  initializeMappings()
  emit('update:mappings', mappings.value)
}



const exportToCSV = async () => {
  if (!props.databaseInstance || !props.tableName || validMappings.value.length === 0) {
    return
  }

  isExporting.value = true

  try {
    // 获取SQLite数据
    const data = await props.databaseInstance.queryTable(props.tableName)
    
    if (data.length === 0) {
      alert('表中没有数据可以导出')
      return
    }

    // 根据映射关系转换数据
    const csvData = data.map((row: any) => {
      const csvRow: any = {}
      validMappings.value.forEach(mapping => {
        const value = row[mapping.sqliteField]
        csvRow[mapping.csvColumn] = formatValueForCSV(value, mapping.dataType)
      })
      return csvRow
    })

    // 生成CSV内容
    const csvContent = convertToCSV(csvData)
    
    // 下载CSV文件
    downloadCSV(csvContent, `${props.tableName}_export_${new Date().toISOString().slice(0, 10)}.csv`)
    
  } catch (error) {
    console.error('导出CSV失败:', error)
    alert('导出失败: ' + (error as Error).message)
  } finally {
    isExporting.value = false
  }
}

const formatValueForCSV = (value: any, dataType: string): string => {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  // 处理字符串中的特殊字符
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = []
  
  // 添加表头
  csvRows.push(headers.join(','))
  
  // 添加数据行
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      return formatValueForCSV(value, 'TEXT')
    })
    csvRows.push(values.join(','))
  })
  
  return csvRows.join('\n')
}

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// 监听器
watch(() => props.columns, (newColumns) => {
  if (newColumns && newColumns.length > 0) {
    initializeMappings()
  }
}, { deep: true, immediate: true })

// 生命周期
onMounted(() => {
  initializeMappings()
})
</script>

<style scoped>
.export-mapping-card {
  height: 100%;
  min-height: 400px;
}

.mapping-table {
  border-radius: 8px;
}

.csv-column-input {
  max-width: 200px;
}



:deep(.v-data-table__th) {
  background-color: rgba(var(--v-theme-primary), 0.05);
  font-weight: 600 !important;
}

:deep(.v-data-table__td) {
  padding: 8px 16px !important;
}

@media (max-width: 768px) {
  .csv-column-input {
    max-width: 150px;
  }
  

}
</style>