// scripts/migrate-to-cloud.js - 数据迁移到云数据库脚本

/**
 * 在小程序中执行数据迁移
 * @param {Object} options - 迁移选项
 * @returns {Promise<Object>} 迁移结果
 */
async function migrateDataInMiniProgram(options = {}) {
  console.log('开始在小程序中执行数据迁移...');
  
  const {
    sourceType = 'local', // 数据源类型：local, csv, json
    targetCollection = 'products', // 目标集合
    batchSize = 20, // 批处理大小
    progressCallback = null // 进度回调函数
  } = options;

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    startTime: new Date(),
    endTime: null
  };

  try {
    let sourceData = [];

    // 根据数据源类型获取数据
    switch (sourceType) {
      case 'local':
        sourceData = await getLocalData();
        break;
      case 'csv':
        sourceData = await getCsvData(options.csvPath);
        break;
      case 'json':
        sourceData = await getJsonData(options.jsonPath);
        break;
      default:
        throw new Error(`不支持的数据源类型: ${sourceType}`);
    }

    results.total = sourceData.length;
    console.log(`获取到 ${results.total} 条数据，开始迁移...`);

    // 分批处理数据
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      
      try {
        const batchResult = await migrateBatch(batch, targetCollection);
        results.success += batchResult.success;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);

        // 调用进度回调
        if (progressCallback) {
          progressCallback({
            current: Math.min(i + batchSize, sourceData.length),
            total: sourceData.length,
            percentage: Math.round((Math.min(i + batchSize, sourceData.length) / sourceData.length) * 100),
            batch: Math.floor(i / batchSize) + 1
          });
        }

        // 避免请求过于频繁
        await sleep(100);
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 迁移失败:`, error);
        results.failed += batch.length;
        results.errors.push(`批次 ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    }

    results.endTime = new Date();
    console.log('数据迁移完成:', results);
    
    return results;
  } catch (error) {
    console.error('数据迁移失败:', error);
    results.endTime = new Date();
    results.errors.push(error.message);
    throw error;
  }
}

/**
 * 迁移单个批次的数据
 * @param {Array} batch - 批次数据
 * @param {string} collection - 目标集合
 * @returns {Promise<Object>} 批次迁移结果
 */
async function migrateBatch(batch, collection) {
  const batchResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const item of batch) {
    try {
      // 调用云函数进行数据迁移
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'migrateItem',
          collection: collection,
          data: item
        }
      });

      if (result.result && result.result.success) {
        batchResult.success++;
      } else {
        batchResult.failed++;
        batchResult.errors.push(`${item.productId || item.id}: ${result.result?.error || '未知错误'}`);
      }
    } catch (error) {
      batchResult.failed++;
      batchResult.errors.push(`${item.productId || item.id}: ${error.message}`);
    }
  }

  return batchResult;
}

/**
 * 获取本地数据
 * @returns {Promise<Array>} 本地数据
 */
async function getLocalData() {
  try {
    // 这里可以从本地存储或其他地方获取数据
    const productData = require('../utils/productData.js');
    
    if (productData && productData.products) {
      return productData.products;
    }
    
    return [];
  } catch (error) {
    console.error('获取本地数据失败:', error);
    return [];
  }
}

/**
 * 获取CSV数据
 * @param {string} csvPath - CSV文件路径
 * @returns {Promise<Array>} CSV数据
 */
async function getCsvData(csvPath) {
  try {
    if (!csvPath) {
      throw new Error('CSV文件路径不能为空');
    }

    const CSVProcessor = require('../utils/csv-processor.js');
    const csvProcessor = new CSVProcessor();
    
    const result = await csvProcessor.parseCSV(csvPath);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('获取CSV数据失败:', error);
    throw error;
  }
}

/**
 * 获取JSON数据
 * @param {string} jsonPath - JSON文件路径
 * @returns {Promise<Array>} JSON数据
 */
async function getJsonData(jsonPath) {
  try {
    if (!jsonPath) {
      throw new Error('JSON文件路径不能为空');
    }

    const fs = wx.getFileSystemManager();
    
    const content = await new Promise((resolve, reject) => {
      fs.readFile({
        filePath: jsonPath,
        encoding: 'utf8',
        success: (res) => resolve(res.data),
        fail: reject
      });
    });

    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('获取JSON数据失败:', error);
    throw error;
  }
}

/**
 * 验证数据完整性
 * @param {Array} data - 要验证的数据
 * @returns {Object} 验证结果
 */
function validateMigrationData(data) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(data)) {
    result.valid = false;
    result.errors.push('数据必须是数组格式');
    return result;
  }

  data.forEach((item, index) => {
    // 检查必填字段
    if (!item.productId) {
      result.errors.push(`第${index + 1}项：缺少productId字段`);
    }
    
    if (!item.title) {
      result.errors.push(`第${index + 1}项：缺少title字段`);
    }
    
    if (!item.categoryName) {
      result.errors.push(`第${index + 1}项：缺少categoryName字段`);
    }

    // 检查数据类型
    if (item.isHot !== undefined && typeof item.isHot !== 'boolean') {
      result.warnings.push(`第${index + 1}项：isHot字段应为布尔类型`);
    }
    
    if (item.isNew !== undefined && typeof item.isNew !== 'boolean') {
      result.warnings.push(`第${index + 1}项：isNew字段应为布尔类型`);
    }
  });

  if (result.errors.length > 0) {
    result.valid = false;
  }

  return result;
}

/**
 * 清理迁移数据
 * @param {Array} data - 原始数据
 * @returns {Array} 清理后的数据
 */
function cleanMigrationData(data) {
  return data.map(item => {
    const cleaned = { ...item };
    
    // 移除不需要的字段
    delete cleaned._id;
    delete cleaned._openid;
    
    // 确保必要字段存在
    if (!cleaned.createTime) {
      cleaned.createTime = new Date();
    }
    
    if (!cleaned.updateTime) {
      cleaned.updateTime = new Date();
    }
    
    if (cleaned.isVisible === undefined) {
      cleaned.isVisible = true;
    }
    
    // 清理空字符串
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string' && cleaned[key].trim() === '') {
        delete cleaned[key];
      }
    });
    
    return cleaned;
  });
}

/**
 * 工具函数：延迟
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取迁移进度
 * @param {Object} results - 迁移结果
 * @returns {Object} 进度信息
 */
function getMigrationProgress(results) {
  const { total, success, failed } = results;
  const completed = success + failed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    success,
    failed,
    percentage,
    remaining: total - completed
  };
}

module.exports = {
  migrateDataInMiniProgram,
  validateMigrationData,
  cleanMigrationData,
  getMigrationProgress
};























