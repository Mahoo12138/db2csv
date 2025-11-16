<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import FileUpload from "../components/FileUpload.vue";
import FieldMapper from "../components/FieldMapper.vue";
import DataPreview from "../components/DataPreview.vue";
import ExportMapping from "../components/ExportMapping.vue";
import SQLiteService from "../services/SQLiteService";
import type { SQLiteInstance } from "../services/SQLiteService";
import { CSVService } from "../services/CSVService";

// Vuetify 导入
import { useTheme } from "vuetify";

// 字段映射项接口
interface FieldMapping {
  originalName: string;
  outputName: string;
  included: boolean;
}

// 状态管理
const isLoading = ref(false);
const errorMessage = ref("");
const databaseInstance = ref<SQLiteInstance | null>(null);
const tableList = ref<string[]>([]);
const selectedFile = ref<string>("");
const selectedTable = ref<string>("");
const tableColumns = ref<
  { name: string; type: string; notnull?: boolean; pk?: boolean }[]
>([]);
const fieldMappings = ref<FieldMapping[]>([]);

// 移动端侧边栏状态
const isSidebarOpen = ref(false);
const isMobile = computed(() => window.innerWidth <= 768);

// Vuetify 钩子
const theme = useTheme();

// 通知系统状态
const snackbarMessage = ref("");
const snackbarColor = ref("info");
const snackbarTimeout = ref(3000);
const snackbarVisible = ref(false);
const tab = ref("preview");
// 处理文件选择事件
const handleFileSelected = async (file: File) => {
  isLoading.value = true;
  errorMessage.value = "";
  selectedFile.value = file.name;

  try {
    // 关闭之前的数据库连接（如果有）
    if (databaseInstance.value) {
      databaseInstance.value.close();
    }

    // 重置状态
    tableList.value = [];
    selectedTable.value = "";
    tableColumns.value = [];
    fieldMappings.value = [];

    // 创建新的数据库实例
    databaseInstance.value = await SQLiteService.createInstance(file);

    // 获取表列表
    tableList.value = await databaseInstance.value.getTableNames();

    // 显示成功通知
    showNotification("数据库加载成功", "success");
    isSidebarOpen.value = true;
  } catch (error) {
    console.error("文件处理错误:", error);
    errorMessage.value =
      error instanceof Error ? error.message : "处理文件时发生错误";
    showNotification(errorMessage.value, "error");
  } finally {
    isLoading.value = false;
  }
};

// 处理表选择事件
const handleTableSelected = async (table: string) => {
  if (!databaseInstance.value || table === selectedTable.value) return;

  isLoading.value = true;
  selectedTable.value = table;

  try {
    // 获取表结构
    tableColumns.value = await databaseInstance.value.getTableSchema(table);

    // 初始化字段映射
    fieldMappings.value = tableColumns.value.map((column) => ({
      originalName: column.name,
      outputName: column.name,
      included: true,
    }));

    // 在移动设备上选择表后关闭侧边栏
    if (isMobile.value) {
      isSidebarOpen.value = false;
    }
  } catch (error) {
    console.error("获取表结构错误:", error);
    errorMessage.value =
      error instanceof Error ? error.message : "获取表结构时发生错误";
    showNotification(errorMessage.value, "error");
  } finally {
    isLoading.value = false;
  }
};

// 更新字段映射
const updateFieldMappings = (mappings: FieldMapping[]) => {
  fieldMappings.value = mappings;
};

// 全选字段
const selectAllFields = () => {
  fieldMappings.value = fieldMappings.value.map((mapping) => ({
    ...mapping,
    included: true,
  }));
};

// 取消全选字段
const selectNoneFields = () => {
  fieldMappings.value = fieldMappings.value.map((mapping) => ({
    ...mapping,
    included: false,
  }));
};

// 是否有选中的字段
const hasSelectedFields = computed(() => {
  return fieldMappings.value.some((mapping) => mapping.included);
});

// 导出到CSV
const exportToCSV = async () => {
  if (!databaseInstance.value || !selectedTable.value) return;

  isLoading.value = true;

  try {
    // 获取选中的字段映射
    const selectedMappings = fieldMappings.value.filter(
      (mapping) => mapping.included
    );
    if (selectedMappings.length === 0) {
      throw new Error("请至少选择一个字段导出");
    }

    // 获取表数据
    const data = await databaseInstance.value.queryTable(selectedTable.value);

    // 转换为CSV
    const csvContent = CSVService.convertToCSV(data, selectedMappings);

    // 下载CSV文件
    CSVService.downloadCSV(csvContent, `${selectedTable.value}.csv`);

    // 显示成功通知
    showNotification("CSV文件导出成功", "success");
  } catch (error) {
    console.error("导出CSV错误:", error);
    errorMessage.value =
      error instanceof Error ? error.message : "导出CSV时发生错误";
    showNotification(errorMessage.value, "error");
  } finally {
    isLoading.value = false;
  }
};

// 处理映射更新
const handleMappingUpdate = (exportMappings: any[]) => {
  // 将导出映射转换为字段映射格式
  fieldMappings.value = exportMappings.map(mapping => ({
    originalName: mapping.sqliteField,
    outputName: mapping.csvColumn,
    included: true // 默认包含所有映射
  }));
  
  showNotification("映射配置已更新", "success");
};



// 切换主题
const toggleTheme = () => {
  theme.global.name.value =
    theme.global.name.value === "light" ? "dark" : "light";
};

// 显示通知
const showNotification = (
  message: string,
  color: "info" | "success" | "warning" | "error" = "info"
) => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbarVisible.value = true;
};

// 切换移动端侧边栏
const toggleMobileSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 组件卸载时清理
onUnmounted(() => {
  if (databaseInstance.value) {
    databaseInstance.value.close();
  }
});
</script>

<template>
  <v-app>
    <v-layout class="rounded rounded-md border">
      <v-app-bar color="primary">
        <v-toolbar-title>SQLite 转 CSV 工具</v-toolbar-title>
      </v-app-bar>

      <v-navigation-drawer
        v-model="isSidebarOpen"
        color="surface-variant"
        width="280"
        app
      >
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="font-semibold text-lg"
                >数据库表</v-list-item-title
              >
              <v-list-item-subtitle
                >{{ tableList.length }} 个表</v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-list
          v-if="selectedFile && !isLoading"
          density="compact"
          class="menu-content"
        >
          <v-list-item
            v-for="table in tableList"
            :key="table"
            @click="handleTableSelected(table)"
            class="table-item"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-table"></v-icon>
            </template>
            <v-list-item-title>{{ table }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-list v-else class="menu-content">
          <v-list-item disabled>
            <v-list-item-title>请先上传数据库文件</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-container fluid class="main-layout">
          <template v-if="!selectedFile">
            <div v-if="isLoading">
              <v-card class="ma-auto text-center p-8" elevation="2">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
                <h3 class="mt-4">正在处理...</h3>
              </v-card>
            </div>

            <!-- 文件上传区域 - 未选择文件时显示 -->
            <v-card
              v-else-if="!selectedFile"
              class="ma-auto text-center p-4 md:p-8"
              elevation="2"
              style="width: 95%; max-width: 600px"
            >
              <v-card-title class="text-center justify-center pb-4">
                <v-icon
                  name="mdi-database-sql"
                  size="80"
                  class="mb-4 text-primary icon-large"
                />
                <div>
                  <h2 class="text-2xl font-bold">SQLite 转 CSV 工具</h2>
                  <p class="text-subtitle-1 mt-2">
                    轻松将 SQLite 数据库转换为 CSV 格式
                  </p>
                </div>
              </v-card-title>
              <v-card-text>
                <FileUpload @file-selected="handleFileSelected" />
              </v-card-text>
              <v-card-actions class="justify-center">
                <p class="text-sm text-body-secondary">
                  支持 SQLite (*.db, *.sqlite) 文件格式
                </p>
              </v-card-actions>
            </v-card>

            <!-- 选择表提示 - 已选择文件但未选择表时显示 -->
            <v-card
              v-else-if="!selectedTable && tableList.length > 0"
              class="ma-auto"
              min-height="400"
            >
              <v-card-text
                class="d-flex flex-column items-center justify-center py-12 text-center"
              >
                <v-icon
                  name="mdi-table-chart"
                  size="80"
                  class="mb-6 text-surface-variant icon-large"
                ></v-icon>
                <h2 class="text-2xl font-semibold mb-2">请选择一个数据表</h2>
                <p class="text-subtitle-1 max-w-md">
                  从左侧列表中选择一个表来查看和配置字段映射
                </p>
              </v-card-text>
            </v-card>

            <!-- 无表提示 - 已选择文件但无表时显示 -->
            <v-card
              v-else-if="tableList.length === 0"
              class="ma-auto"
              min-height="400"
            >
              <v-card-text
                class="d-flex flex-column items-center justify-center py-12 text-center"
              >
                <v-icon
                  name="mdi-table-off"
                  size="80"
                  class="mb-6 text-surface-variant icon-large"
                ></v-icon>
                <h2 class="text-2xl font-semibold mb-2">未找到数据表</h2>
                <p class="text-subtitle-1 max-w-md">
                  当前数据库中没有数据表，请尝试上传其他数据库文件
                </p>
              </v-card-text>
            </v-card>

            <!-- 字段映射区域 - 已选择表时显示 -->
            <div v-else-if="selectedTable && tableColumns.length > 0">
              <v-card class="w-100 max-w-5xl mx-auto" elevation="2">
                <v-card-title class="flex justify-between items-center">
                  <div>
                    <h2 class="text-xl font-semibold">
                      表字段映射: {{ selectedTable }}
                    </h2>
                    <p class="text-subtitle-2 text-body-secondary">
                      配置要导出的字段和名称
                    </p>
                  </div>
                  <div>
                    <v-btn
                      color="primary"
                      class="mr-2"
                      @click="selectAllFields"
                    >
                      全选
                    </v-btn>
                    <v-btn color="secondary" @click="selectNoneFields">
                      取消全选
                    </v-btn>
                  </div>
                </v-card-title>
                <v-card-text>
                  <FieldMapper
                    :columns="tableColumns"
                    :mappings="fieldMappings"
                    @update-mappings="updateFieldMappings"
                  ></FieldMapper>
                </v-card-text>
                <v-card-actions class="justify-end">
                  <v-btn
                    color="primary"
                    :disabled="!hasSelectedFields"
                    @click="exportToCSV"
                  >
                    导出 CSV
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>

            <!-- 错误提示 -->
            <v-card
              v-if="errorMessage"
              class="ma-auto text-center p-8"
              elevation="2"
            >
              <v-icon
                name="mdi-alert-circle"
                size="80"
                class="mb-4 text-error"
              />
              <h3 class="text-xl font-bold mb-2">操作失败</h3>
              <p class="text-error mb-4">{{ errorMessage }}</p>
              <v-btn color="primary" @click="errorMessage = ''">关闭</v-btn>
            </v-card>
          </template>

          <template v-else>
            <v-tabs color="primary" v-model="tab">
              <v-tab value="preview">数据预览</v-tab>
              <v-tab value="export">数据导出</v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="preview">
                <DataPreview 
                  :database-instance="databaseInstance" 
                  :table-name="selectedTable"
                />
              </v-tabs-window-item>
              <v-tabs-window-item value="export">
                <ExportMapping 
                  :columns="tableColumns"
                  :is-loading="isLoading"
                  :database-instance="databaseInstance"
                  :table-name="selectedTable"
                  @update:mappings="handleMappingUpdate"
                />
              </v-tabs-window-item>
            </v-tabs-window>
          </template>
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<style scoped></style>
