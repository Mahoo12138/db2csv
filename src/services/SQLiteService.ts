import initSqlJs from 'sql.js/dist/sql-wasm.js'
// import initSqlJs from 'sql.js'
import workletURL from "sql.js/dist/sql-wasm.wasm?url";

// SQLite数据库实例接口
export interface SQLiteInstance {
  database: any
  close: () => void
  getTableNames: () => Promise<string[]>
  getTableSchema: (tableName: string) => Promise<{name: string; type: string; notnull?: boolean; pk?: boolean}[]>
  queryTable: (tableName: string) => Promise<Record<string, any>[]>
}

// 表信息接口
export interface TableInfo {
  name: string
  columns: ColumnInfo[]
}

// 列信息接口
export interface ColumnInfo {
  name: string
  type: string
}

// 行数据类型
export type RowData = Record<string, any>

// SQLite服务类
class SQLiteService {
  private sqljs: any = null

  // 初始化SQL.js库
  private async initialize() {
    if (!this.sqljs) {
      try {
        console.log('开始初始化SQL.js，尝试加载wasm文件...');

        // 直接使用debug版本的sql.js
        this.sqljs = await initSqlJs({
          locateFile: () => workletURL,
        });

        console.log('SQL.js初始化成功！');
      } catch (error) {
        console.error('SQL.js初始化失败:', error);
        // 直接抛出错误，便于调试
        throw error;
      }
    }
    return this.sqljs;
  }

  // 从文件加载数据库
  async loadDatabase(file: File): Promise<SQLiteInstance> {
    // 兼容旧的方法名，内部调用新方法
    return this.createInstance(file)
  }

  // 创建数据库实例（新方法名）
  async createInstance(file: File): Promise<SQLiteInstance> {
    try {
      await this.initialize()

      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      // 创建数据库实例
      const database = new this.sqljs.Database(data)

      return {
        database,
        close: () => database.close(),
        getTableNames: async () => {
          try {
            const result = database.exec(
              "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
            if (result.length === 0 || result[0].values.length === 0) {
              return []
            }
            return result[0].values.map((row: any[]) => row[0])
          } catch (error) {
            console.error('获取表名失败:', error)
            throw new Error('无法获取数据库中的表信息')
          }
        },
        getTableSchema: async (tableName: string) => {
          try {
            const result = database.exec(`PRAGMA table_info(${tableName})`)
            if (result.length === 0 || result[0].values.length === 0) {
              return []
            }
            return result[0].values.map((row: any[]) => ({
              name: row[1], // 列名
              type: row[2], // 数据类型
              notnull: row[3] === 1, // 是否非空
              pk: row[5] === 1 // 是否为主键
            }))
          } catch (error) {
            console.error(`获取表${tableName}结构失败:`, error)
            throw new Error(`无法获取表${tableName}的结构信息`)
          }
        },
        queryTable: async (tableName: string) => {
          try {
            const result = database.exec(`SELECT * FROM ${tableName}`)
            if (result.length === 0) {
              return []
            }
            const columns = result[0].columns
            const values = result[0].values
            return values.map((row: any[]) => {
              const rowData: Record<string, any> = {}
              columns.forEach((col: string, index: number) => {
                rowData[col] = row[index]
              })
              return rowData
            })
          } catch (error) {
            console.error(`获取表${tableName}数据失败:`, error)
            throw new Error(`无法获取表${tableName}的数据`)
          }
        }
      }
    } catch (error) {
      console.error('加载SQLite数据库失败:', error)
      throw new Error('无法加载SQLite数据库文件，请确保文件格式正确')
    }
  }

  // 获取数据库中的所有表名
  async getTableNames(instance: SQLiteInstance): Promise<string[]> {
    try {
      // 查询SQLite系统表获取所有表名
      const result = instance.database.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )

      if (result.length === 0 || result[0].values.length === 0) {
        return []
      }

      // 提取表名
      return result[0].values.map((row: any[]) => row[0])
    } catch (error) {
      console.error('获取表名失败:', error)
      throw new Error('无法获取数据库中的表信息')
    }
  }

  // 获取表的结构信息
  async getTableStructure(instance: SQLiteInstance, tableName: string): Promise<ColumnInfo[]> {
    try {
      const result = instance.database.exec(`PRAGMA table_info(${tableName})`)

      if (result.length === 0 || result[0].values.length === 0) {
        return []
      }

      // 提取列信息
      return result[0].values.map((row: any[]) => ({
        name: row[1], // 列名
        type: row[2]  // 数据类型
      }))
    } catch (error) {
      console.error(`获取表${tableName}结构失败:`, error)
      throw new Error(`无法获取表${tableName}的结构信息`)
    }
  }

  // 获取表的所有数据
  async getTableData(instance: SQLiteInstance, tableName: string): Promise<RowData[]> {
    try {
      const result = instance.database.exec(`SELECT * FROM ${tableName}`)

      if (result.length === 0) {
        return []
      }

      const columns = result[0].columns
      const values = result[0].values

      // 将结果转换为对象数组
      return values.map((row: any[]) => {
        const rowData: RowData = {}
        columns.forEach((col: string, index: number) => {
          rowData[col] = row[index]
        })
        return rowData
      })
    } catch (error) {
      console.error(`获取表${tableName}数据失败:`, error)
      throw new Error(`无法获取表${tableName}的数据`)
    }
  }

  // 执行自定义SQL查询
  async executeQuery(instance: SQLiteInstance, query: string): Promise<RowData[]> {
    try {
      const result = instance.database.exec(query)

      if (result.length === 0) {
        return []
      }

      const columns = result[0].columns
      const values = result[0].values

      return values.map((row: any[]) => {
        const rowData: RowData = {}
        columns.forEach((col: string, index: number) => {
          rowData[col] = row[index]
        })
        return rowData
      })
    } catch (error) {
      console.error('执行SQL查询失败:', error)
      throw new Error('SQL查询执行失败')
    }
  }
}

// 导出单例实例
export default new SQLiteService()