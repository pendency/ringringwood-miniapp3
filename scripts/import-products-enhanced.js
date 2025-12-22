// scripts/import-products-enhanced.js
// 增强版产品数据导入脚本
// 作用：使用新的数据处理器修复所有已知问题

const fs = require('fs');
const path = require('path');
const ProductDataProcessor = require('../utils/product-data-processor.js');
const { ProductConfig, getConfig, validateConfig } = require('../config/product-config.js');

/**
 * 增强版产品数据导入器
 * 解决图片路径、字段映射、数据验证等问题
 */
class EnhancedProductImporter {
  
  constructor() {
    this.processor = new ProductDataProcessor();
    this.config = ProductConfig;
    this.logMessages = [];
  }

  /**
   * 记录日志信息
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别 ('info', 'warn', 'error')
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logEntry);
    this.logMessages.push(logEntry);
    
    // 根据级别输出到不同的控制台方法
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }

  /**
   * 验证环境和配置
   * @returns {boolean} 验证是否通过
   */
  validateEnvironment() {
    this.log('开始验证环境和配置...');
    
    // 验证配置完整性
    if (!validateConfig()) {
      this.log('配置验证失败', 'error');
      return false;
    }

    // 检查CSV文件是否存在
    const csvPath = getConfig('paths.csvSourceFile');
    if (!fs.existsSync(csvPath)) {
      this.log(`CSV文件不存在: ${csvPath}`, 'error');
      return false;
    }

    // 检查图片目录是否存在
    const imageDir = './images/products/';
    if (!fs.existsSync(imageDir)) {
      this.log(`图片目录不存在: ${imageDir}`, 'error');
      return false;
    }

    this.log('环境验证通过');
    return true;
  }

  /**
   * 读取CSV文件
   * @returns {string|null} CSV文件内容
   */
  readCSVFile() {
    try {
      const csvPath = getConfig('paths.csvSourceFile');
      this.log(`正在读取CSV文件: ${csvPath}`);
      
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      this.log(`CSV文件读取成功，文件大小: ${csvContent.length} 字符`);
      
      return csvContent;
    } catch (error) {
      this.log(`读取CSV文件失败: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * 保存转换后的产品数据为JSON
   * @param {Array} products - 产品数据数组
   * @returns {boolean} 保存是否成功
   */
  saveProductsToJSON(products) {
    try {
      const outputPath = getConfig('paths.generatedJsonFile');
      this.log(`正在保存产品数据到: ${outputPath}`);
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 保存JSON文件
      const jsonContent = JSON.stringify(products, null, 2);
      fs.writeFileSync(outputPath, jsonContent, 'utf8');
      
      this.log(`产品数据保存成功，共 ${products.length} 个产品`);
      return true;
    } catch (error) {
      this.log(`保存产品数据失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 更新mock-data.js文件
   * @param {Array} products - 产品数据数组
   * @returns {boolean} 更新是否成功
   */
  updateMockData(products) {
    try {
      const mockDataPath = getConfig('paths.mockDataFile');
      this.log(`正在更新mock数据文件: ${mockDataPath}`);
      
      if (!fs.existsSync(mockDataPath)) {
        this.log(`mock数据文件不存在: ${mockDataPath}`, 'error');
        return false;
      }

      // 读取现有的mock-data.js文件
      let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
      
      // 查找mockProducts数组的开始和结束位置
      const startMarker = 'const mockProducts = [';
      const endMarker = '];';
      
      const startIndex = mockDataContent.indexOf(startMarker);
      if (startIndex === -1) {
        this.log('在mock-data.js中找不到mockProducts数组', 'error');
        return false;
      }

      // 找到对应的结束位置
      let bracketCount = 0;
      let endIndex = -1;
      for (let i = startIndex + startMarker.length; i < mockDataContent.length; i++) {
        if (mockDataContent[i] === '[') {
          bracketCount++;
        } else if (mockDataContent[i] === ']') {
          if (bracketCount === 0) {
            endIndex = i + 1;
            break;
          }
          bracketCount--;
        }
      }

      if (endIndex === -1) {
        this.log('在mock-data.js中找不到mockProducts数组的结束位置', 'error');
        return false;
      }

      // 构建新的产品数据字符串
      const productsString = JSON.stringify(products, null, 2);
      const newMockProducts = `const mockProducts = ${productsString};`;

      // 替换原有的mockProducts数组
      const newMockDataContent = 
        mockDataContent.substring(0, startIndex) + 
        newMockProducts + 
        mockDataContent.substring(endIndex);

      // 写入更新后的文件
      fs.writeFileSync(mockDataPath, newMockDataContent, 'utf8');
      
      this.log(`mock数据文件更新成功，共更新 ${products.length} 个产品`);
      return true;
    } catch (error) {
      this.log(`更新mock数据文件失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 保存日志文件
   */
  saveLogFile() {
    try {
      const logPath = getConfig('paths.logFile');
      const logDir = path.dirname(logPath);
      
      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // 保存日志
      const logContent = this.logMessages.join('\n');
      fs.writeFileSync(logPath, logContent, 'utf8');
      
      console.log(`日志已保存到: ${logPath}`);
    } catch (error) {
      console.error(`保存日志失败: ${error.message}`);
    }
  }

  /**
   * 保存错误报告
   * @param {Object} stats - 处理统计信息
   */
  saveErrorReport(stats) {
    if (stats.errorCount === 0 && stats.warningCount === 0) {
      return; // 没有错误和警告，不需要保存报告
    }

    try {
      const errorPath = getConfig('paths.errorFile');
      const errorDir = path.dirname(errorPath);
      
      // 确保错误报告目录存在
      if (!fs.existsSync(errorDir)) {
        fs.mkdirSync(errorDir, { recursive: true });
      }

      // 构建错误报告
      const errorReport = {
        timestamp: new Date().toISOString(),
        summary: {
          processedCount: stats.processedCount,
          errorCount: stats.errorCount,
          warningCount: stats.warningCount
        },
        errors: stats.errors,
        warnings: stats.warnings
      };

      // 保存错误报告
      const reportContent = JSON.stringify(errorReport, null, 2);
      fs.writeFileSync(errorPath, reportContent, 'utf8');
      
      this.log(`错误报告已保存到: ${errorPath}`);
    } catch (error) {
      this.log(`保存错误报告失败: ${error.message}`, 'error');
    }
  }

  /**
   * 执行完整的导入流程
   * @returns {boolean} 导入是否成功
   */
  async executeImport() {
    this.log('=== 开始增强版产品数据导入 ===');
    
    try {
      // 1. 验证环境
      if (!this.validateEnvironment()) {
        this.log('环境验证失败，导入终止', 'error');
        return false;
      }

      // 2. 读取CSV文件
      const csvContent = this.readCSVFile();
      if (!csvContent) {
        this.log('读取CSV文件失败，导入终止', 'error');
        return false;
      }

      // 3. 解析CSV数据
      this.log('开始解析CSV数据...');
      const rawProducts = this.processor.parseCSV(csvContent);
      if (rawProducts.length === 0) {
        this.log('没有解析到有效的产品数据，导入终止', 'error');
        return false;
      }

      // 4. 转换产品数据
      this.log('开始转换产品数据...');
      const transformedProducts = this.processor.transformProducts(rawProducts);
      if (transformedProducts.length === 0) {
        this.log('没有成功转换的产品数据，导入终止', 'error');
        return false;
      }

      // 5. 保存JSON文件
      if (!this.saveProductsToJSON(transformedProducts)) {
        this.log('保存JSON文件失败', 'error');
        return false;
      }

      // 6. 更新mock-data.js
      if (!this.updateMockData(transformedProducts)) {
        this.log('更新mock数据失败', 'error');
        return false;
      }

      // 7. 获取处理统计信息
      const stats = this.processor.getProcessingStats();
      
      // 8. 保存错误报告（如果有错误或警告）
      this.saveErrorReport(stats);

      // 9. 输出最终统计
      this.log('=== 导入完成 ===');
      this.log(`成功处理: ${stats.processedCount} 个产品`);
      this.log(`错误数量: ${stats.errorCount}`);
      this.log(`警告数量: ${stats.warningCount}`);

      return true;

    } catch (error) {
      this.log(`导入过程中发生未预期的错误: ${error.message}`, 'error');
      return false;
    } finally {
      // 保存日志文件
      this.saveLogFile();
    }
  }
}

/**
 * 主函数 - 执行导入
 */
async function main() {
  const importer = new EnhancedProductImporter();
  const success = await importer.executeImport();
  
  if (success) {
    console.log('\n✅ 产品数据导入成功！');
    process.exit(0);
  } else {
    console.log('\n❌ 产品数据导入失败！');
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('导入脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = EnhancedProductImporter;
