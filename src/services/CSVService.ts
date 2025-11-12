/**
 * CSVService - 用于处理CSV文件的转换和导出
 */

// 字段映射接口
export interface FieldMapping {
  originalName: string;
  outputName: string;
  included: boolean;
}

// 数据行接口
export interface DataRow {
  [key: string]: any;
}

export class CSVService {
  /**
   * 将表格数据转换为CSV格式
   * @param data 表格数据行数组
   * @param mappings 字段映射配置
   * @returns CSV格式的字符串
   */
  static convertToCSV(data: DataRow[], mappings: FieldMapping[]): string {
    if (!data || data.length === 0 || !mappings || mappings.length === 0) {
      return '';
    }

    // 过滤出已包含的字段
    const includedMappings = mappings.filter(mapping => mapping.included);
    
    if (includedMappings.length === 0) {
      return '';
    }

    // 生成CSV标题行
    const headers = includedMappings.map(mapping => mapping.outputName);
    const headerLine = headers.map(header => this.escapeCSV(header)).join(',');

    // 生成数据行
    const dataLines = data.map(row => {
      return includedMappings.map(mapping => {
        const value = row[mapping.originalName] ?? '';
        return this.escapeCSV(String(value));
      }).join(',');
    });

    // 组合标题和数据行
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * 转义CSV中的特殊字符
   * @param text 需要转义的文本
   * @returns 转义后的文本
   */
  private static escapeCSV(text: string): string {
    // 如果文本包含逗号、引号或换行符，则需要用引号包裹
    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
      // 将双引号替换为两个双引号
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return text;
  }

  /**
   * 下载CSV文件
   * @param csvContent CSV内容
   * @param filename 文件名（不含扩展名）
   */
  static downloadCSV(csvContent: string, filename: string): void {
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 创建下载链接
    const link = document.createElement('a')
    
    // 检查是否支持IE的msSaveBlob（使用类型断言）
    const msSaveBlob = (navigator as any).msSaveBlob
    
    if (msSaveBlob) {
      msSaveBlob(blob, `${filename}.csv`)
    } else {
      // 创建URL
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      
      // 添加到DOM并触发点击
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}