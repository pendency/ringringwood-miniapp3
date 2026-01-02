// scripts/importProducts.js
// 产品数据导入脚本
// 从Excel/CSV文件导入产品数据到JSON
// 注意：数据库是唯一数据源，此脚本仅用于生成JSON文件供参考

const fs = require('fs');
const path = require('path');
const config = require('../import.config.js');

// 日志记录
let logMessages = [];
let errorMessages = [];
let hasErrors = false;

/**
 * 记录日志
 * @param {string} message - 日志消息
 * @param {boolean} isError - 是否为错误
 */
function log(message, isError = false) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  logMessages.push(logMessage);
  
  if (isError) {
    errorMessages.push({ message, timestamp });
    hasErrors = true;
  }
}

/**
 * 保存日志到文件
 */
function saveLog() {
  try {
    fs.writeFileSync(path.resolve(config.logFilePath), logMessages.join('\n'));
    log(`日志已保存到 ${config.logFilePath}`);
    
    if (hasErrors) {
      fs.writeFileSync(
        path.resolve(config.errorJsonPath), 
        JSON.stringify(errorMessages, null, 2)
      );
      log(`错误信息已保存到 ${config.errorJsonPath}`);
    }
  } catch (error) {
    console.error('保存日志文件失败:', error);
  }
}

/**
 * 从CSV文件读取产品数据
 * @returns {Array} 产品数据数组
 */
function readProductsFromCSV() {
  try {
    const inputPath = path.resolve(config.inputFilePath || './产品信息管理模板.csv');
    log(`正在读取文件: ${inputPath}`);
    
    if (!fs.existsSync(inputPath)) {
      log(`文件不存在: ${inputPath}`, true);
      return null;
    }
    
    const content = fs.readFileSync(inputPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // 第一行是表头
    const headers = lines[0].split(',');
    
    // 解析每一行数据
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      // 处理CSV中的引号和逗号
      let line = lines[i];
      const values = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // 添加最后一个值
      values.push(currentValue);
      
      // 创建产品对象
      const product = {};
      for (let j = 0; j < headers.length; j++) {
        if (j < values.length) {
          product[headers[j]] = values[j];
        }
      }
      
      products.push(product);
    }
    
    log(`成功读取 ${products.length} 个产品`);
    return products;
  } catch (error) {
    log(`读取CSV文件失败: ${error.message}`, true);
    return null;
  }
}

/**
 * 将产品数据转换为应用所需的格式
 * @param {Array} rawProducts - 原始产品数据
 * @returns {Array} 转换后的产品数据
 */
function transformProducts(rawProducts) {
  if (!rawProducts || !Array.isArray(rawProducts)) {
    log('没有有效的产品数据可转换', true);
    return [];
  }
  
  log(`开始转换 ${rawProducts.length} 个产品数据...`);
  
  // 分类ID映射 - 更新为当前系统分类
  const categoryMap = {
    '经典桌面款': 'cat_classic',
    '玩趣设计款': 'cat_fun',
    '树脂设计款': 'cat_resin',
    '树脂定制款': 'cat_custom',
    '桌架专区': 'cat_frame',
    '椅子专区': 'cat_chair',
    // 兼容旧的分类名称
    '原木经典': 'cat_classic',
    '树脂美学': 'cat_resin',
    '玩趣设计': 'cat_fun',
    '高定专属': 'cat_custom'
  };
  
  // 产品ID集合，用于检查重复
  const productIds = new Set();
  
  // 转换后的产品
  const transformedProducts = [];
  
  for (const rawProduct of rawProducts) {
    try {
      // 检查必填字段
      if (!rawProduct['产品ID'] || !rawProduct['产品名称'] || !rawProduct['分类名称']) {
        log(`产品缺少必填字段: ${JSON.stringify(rawProduct)}`, true);
        continue;
      }
      
      // 检查产品ID是否重复
      const productId = rawProduct['产品ID'];
      if (productIds.has(productId)) {
        log(`产品ID重复: ${productId}`, true);
        continue;
      }
      productIds.add(productId);
      
      // 检查分类是否有效
      const categoryName = rawProduct['分类名称'];
      const categoryId = categoryMap[categoryName];
      if (!categoryId) {
        log(`未识别的分类: ${categoryName}, 产品ID: ${productId}`, true);
        continue;
      }
      
      // 处理主图（封面图）- 用于列表展示
      const mainImageUrl = rawProduct['主图URL'] ? rawProduct['主图URL'].trim() : '';
      
      // 处理详情图 - 用于产品详情页轮播和展示
      const detailImages = [];
      for (let i = 1; i <= 10; i++) {
        const imageField = `详情图URL${i}`;
        if (rawProduct[imageField] && rawProduct[imageField].trim()) {
          detailImages.push(rawProduct[imageField].trim());
        }
      }
      
      // 兼容旧格式：如果没有新字段，使用旧的图片URL字段
      if (!mainImageUrl && !detailImages.length) {
        // 旧格式：图片URL1 作为主图，图片URL2-10 作为详情图
        for (let i = 1; i <= 10; i++) {
          const imageField = `图片URL${i}`;
          if (rawProduct[imageField] && rawProduct[imageField].trim()) {
            if (i === 1) {
              // 第一张作为主图（如果没有单独的主图字段）
            } else {
              detailImages.push(rawProduct[imageField].trim());
            }
          }
        }
        // 如果有旧格式的图片URL1，用作主图
        if (rawProduct['图片URL1'] && rawProduct['图片URL1'].trim()) {
          if (!mainImageUrl) {
            // mainImageUrl 已经是空的，需要重新赋值
          }
        }
      }
      
      // 最终的主图URL
      let finalMainImageUrl = mainImageUrl;
      if (!finalMainImageUrl && rawProduct['图片URL1']) {
        finalMainImageUrl = rawProduct['图片URL1'].trim();
      }
      
      // 如果详情图为空但有旧格式的图片URL2-10，使用它们
      if (detailImages.length === 0) {
        for (let i = 2; i <= 10; i++) {
          const imageField = `图片URL${i}`;
          if (rawProduct[imageField] && rawProduct[imageField].trim()) {
            detailImages.push(rawProduct[imageField].trim());
          }
        }
      }
      
      // 处理视频
      let videoUrl = null;
      if (rawProduct['视频URL'] && rawProduct['视频URL'].trim()) {
        const videoPath = rawProduct['视频URL'].trim();
        const fileName = path.basename(videoPath);
        videoUrl = `/images/products/${fileName}`;
      }
      
      // 转换布尔值
      const isHot = rawProduct['是否热门（是/否）'] === '是';
      const isNew = rawProduct['是否灵感上新（是/否）'] === '是';
      const isActive = rawProduct['是否显示（是/否）'] !== '否'; // 默认显示
      
      // 处理价格
      let price = 'consult';
      if (rawProduct['价格（元）'] && rawProduct['价格（元）'] !== '联系销售') {
        price = parseFloat(rawProduct['价格（元）']) || 'consult';
      }
      
      // 创建参数数组
      const params = [];
      if (rawProduct['尺寸']) {
        params.push({ name: '尺寸', value: rawProduct['尺寸'] });
      }
      if (rawProduct['重量(约xxkg)']) {
        params.push({ name: '重量', value: rawProduct['重量(约xxkg)'] });
      }
      if (rawProduct['颜色']) {
        params.push({ name: '颜色', value: rawProduct['颜色'] });
      }
      if (rawProduct['适用场景']) {
        params.push({ name: '适用场景', value: rawProduct['适用场景'] });
      }
      
      // 构建转换后的产品对象
      const transformedProduct = {
        _id: productId,
        name: rawProduct['产品名称'],
        description: rawProduct['产品简介'] || '',
        price: price,
        originalPrice: price,
        categoryId: categoryId,
        // 主图（封面图）- 用于分类页面、列表展示
        imageUrl: finalMainImageUrl || '',
        imageUrls: finalMainImageUrl ? [finalMainImageUrl] : [],
        // 详情图 - 用于产品详情页轮播和展示
        images: detailImages,
        features: [],
        params: params,
        isHot: isHot,
        isNew: isNew,
        isRecommended: false,
        stock: 10,
        sales: 0,
        status: isActive ? 1 : 0,
        order: parseInt(rawProduct['排序优先级（数字，越小越靠前）']) || 999
      };
      
      // 如果有视频，添加到特性中
      if (videoUrl) {
        transformedProduct.features.push({
          title: '产品展示',
          video: videoUrl,
          description: '产品视频展示'
        });
      }
      
      transformedProducts.push(transformedProduct);
    } catch (error) {
      log(`处理产品 ${rawProduct['产品ID'] || '未知ID'} 时出错: ${error.message}`, true);
    }
  }
  
  log(`成功转换 ${transformedProducts.length} 个产品数据`);
  return transformedProducts;
}

/**
 * 保存转换后的产品数据到JSON文件
 * @param {Array} products - 转换后的产品数据
 */
function saveProductsToJson(products) {
  try {
    const outputPath = path.resolve(config.outputJsonPath);
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    log(`产品数据已保存到 ${outputPath}`);
    return true;
  } catch (error) {
    log(`保存JSON文件失败: ${error.message}`, true);
    return false;
  }
}

/**
 * 将产品数据合并到mock-data.js
 * @param {Array} products - 转换后的产品数据
 */
function injectToMockData(products) {
  try {
    const mockDataPath = path.resolve('./utils/mock-data.js');
    
    if (!fs.existsSync(mockDataPath)) {
      log(`mock-data.js 文件不存在: ${mockDataPath}`, true);
      return false;
    }
    
    // 读取mock-data.js文件
    let content = fs.readFileSync(mockDataPath, 'utf8');
    
    // 查找mockProducts数组的位置
    const mockProductsStart = content.indexOf('const mockProducts = [');
    if (mockProductsStart === -1) {
      log('在mock-data.js中找不到mockProducts数组', true);
      return false;
    }
    
    // 找到mockProducts数组的结束位置
    let bracketCount = 0;
    let mockProductsEnd = mockProductsStart;
    let inString = false;
    let escapeNext = false;
    
    for (let i = mockProductsStart; i < content.length; i++) {
      const char = content[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' || char === "'") {
        inString = !inString;
        continue;
      }
      
      if (inString) continue;
      
      if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          mockProductsEnd = i + 1;
          break;
        }
      }
    }
    
    if (mockProductsEnd === mockProductsStart) {
      log('无法确定mockProducts数组的结束位置', true);
      return false;
    }
    
    // 构建新的mockProducts数组
    const newMockProducts = `const mockProducts = ${JSON.stringify(products, null, 2)}`;
    
    // 替换原有的mockProducts数组
    const newContent = 
      content.substring(0, mockProductsStart) + 
      newMockProducts + 
      content.substring(mockProductsEnd);
    
    // 写回文件
    fs.writeFileSync(mockDataPath, newContent);
    log(`产品数据已成功合并到 ${mockDataPath}`);
    return true;
  } catch (error) {
    log(`合并到mock-data.js失败: ${error.message}`, true);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  log('开始导入产品数据...');
  
  // 读取CSV文件
  const rawProducts = readProductsFromCSV();
  if (!rawProducts) {
    log('读取产品数据失败，导入终止', true);
    saveLog();
    return;
  }
  
  // 转换产品数据
  const transformedProducts = transformProducts(rawProducts);
  if (transformedProducts.length === 0) {
    log('没有有效的产品数据可导入，导入终止', true);
    saveLog();
    return;
  }
  
  // 保存为JSON
  const jsonSaved = saveProductsToJson(transformedProducts);
  if (!jsonSaved) {
    log('保存JSON文件失败，导入终止', true);
    saveLog();
    return;
  }
  
  // 如果配置了自动合并到mock-data.js
  if (config.autoInjectToMockData) {
    const injected = injectToMockData(transformedProducts);
    if (!injected) {
      log('合并到mock-data.js失败', true);
    }
  }
  
  log('产品数据导入完成！');
  saveLog();
}

// 执行主函数
main().catch(error => {
  log(`导入过程中发生未捕获错误: ${error.message}`, true);
  saveLog();
});