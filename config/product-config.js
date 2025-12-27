// config/product-config.js
// 产品数据配置文件 - 统一管理所有产品相关的配置参数
// 作用：避免硬编码，方便维护和修改

/**
 * 产品数据配置对象
 * 包含所有产品数据处理相关的配置参数
 */
const ProductConfig = {
  
  // ==================== 文件路径配置 ====================
  paths: {
    // CSV源文件路径（相对于项目根目录）
    csvSourceFile: './产品信息管理模板.csv',
    
    // 生成的JSON文件路径
    generatedJsonFile: './utils/generated-products.json',
    
    // mock数据文件路径
    mockDataFile: './utils/mock-data.js',
    
    // 产品图片基础目录
    imageBaseDir: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/',
    
    // 默认图片路径
    defaultImage: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg',
    
    // 日志文件路径
    logFile: './scripts/import-log.txt',
    
    // 错误记录文件路径
    errorFile: './scripts/import-errors.json'
  },

  // ==================== CSV字段映射配置 ====================
  csvFields: {
    // CSV文件中的字段名映射到系统内部字段名
    productId: 'productId',           // 产品ID
    title: 'title',                   // 产品标题
    categoryName: 'categoryName',     // 分类名称
    isHot: 'isHot',                   // 是否热门
    isNew: 'isNew',                   // 是否新品
    description: 'description',       // 产品描述（注意：CSV中第6列是description但没有表头）
    price: 'price',                   // 价格
    isVisible: 'isVisible',           // 是否显示
    sortPriority: 'sortPriority',     // 排序优先级
    size: 'size',                     // 尺寸
    weight: 'weight',                 // 重量
    color: 'color',                   // 颜色
    applicationScenario: 'applicationScenario', // 适用场景
    videoUrl: 'videoUrl',             // 视频URL
    
    // 图片字段（支持最多10张图片）
    imageFields: [
      'imageUrl1', 'imageUrl2', 'imageUrl3', 'imageUrl4', 'imageUrl5',
      'imageUrl6', 'imageUrl7', 'imageUrl8', 'imageUrl9', 'imageUrl10'
    ]
  },

  // ==================== 分类映射配置 ====================
  categoryMapping: {
    // CSV中的分类名称映射到系统分类ID
    'cat_wood': 'cat_wood',           // 原木经典
    'cat_resin': 'cat_resin',         // 树脂美学  
    'cat_design': 'cat_design',       // 玩趣设计
    'cat_custom': 'cat_custom',       // 高定专属
    'cat_frame': 'cat_frame'          // 桌架专区
  },

  // ==================== 数据转换配置 ====================
  dataTransform: {
    // 布尔值转换映射
    booleanMapping: {
      '是': true,
      '否': false,
      'true': true,
      'false': false,
      '1': true,
      '0': false
    },
    
    // 价格处理配置
    priceConfig: {
      // 当价格为以下值时，显示为"联系销售"
      contactSalesKeywords: ['联系销售', '咨询价', '面议', '定制'],
      // 默认价格显示文本
      contactSalesText: '联系销售'
    },
    
    // 默认值配置
    defaults: {
      stock: 10,                      // 默认库存
      sales: 0,                       // 默认销量
      isRecommended: false,           // 默认不推荐
      status: 1,                      // 默认状态（1=显示，0=隐藏）
      order: 999                      // 默认排序优先级
    }
  },

  // ==================== 图片处理配置 ====================
  imageConfig: {
    // 支持的图片格式
    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
    
    // 图片路径处理规则
    pathProcessing: {
      // 是否自动转换反斜杠为正斜杠
      normalizeSlashes: true,
      
      // 是否移除路径前缀（如 images\products\ 转为 products/）
      removePrefix: true,
      
      // 基础路径前缀
      basePrefix: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/'
    },
    
    // 缺失图片处理
    missingImageHandling: {
      // 是否使用默认图片替代缺失的图片
      useDefaultImage: true,
      
      // 默认图片路径（使用云存储路径）
      defaultImagePath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg',
      
      // 是否在控制台输出缺失图片警告
      logMissingImages: true
    }
  },

  // ==================== 视频处理配置 ====================
  videoConfig: {
    // 支持的视频格式
    supportedFormats: ['.mp4', '.mov', '.avi', '.webm'],
    
    // 视频路径处理规则
    pathProcessing: {
      // 基础路径前缀
      basePrefix: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/',
      
      // 是否自动转换反斜杠为正斜杠
      normalizeSlashes: true
    },
    
    // 视频在产品特性中的配置
    featureConfig: {
      title: '产品展示',
      description: '产品视频展示'
    }
  },

  // ==================== 验证规则配置 ====================
  validation: {
    // 必填字段
    requiredFields: ['productId', 'title', 'categoryName'],
    
    // 产品ID格式验证规则
    productIdPattern: /^[a-zA-Z0-9_-]+$/,
    
    // 最大字段长度限制
    maxLengths: {
      title: 100,
      description: 500,
      size: 50,
      weight: 30,
      color: 30,
      applicationScenario: 200
    }
  },

  // ==================== 日志配置 ====================
  logging: {
    // 是否启用详细日志
    enableVerboseLogging: true,
    
    // 是否记录成功的操作
    logSuccessOperations: true,
    
    // 是否记录警告信息
    logWarnings: true,
    
    // 日志级别：'error', 'warn', 'info', 'debug'
    logLevel: 'info'
  }
};

/**
 * 获取配置项的辅助函数
 * @param {string} path - 配置路径，如 'paths.csvSourceFile'
 * @returns {any} 配置值
 * 
 * 使用示例：
 * const csvPath = getConfig('paths.csvSourceFile');
 * const defaultImage = getConfig('imageConfig.missingImageHandling.defaultImagePath');
 */
function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], ProductConfig);
}

/**
 * 验证配置完整性
 * @returns {boolean} 配置是否有效
 */
function validateConfig() {
  const requiredPaths = [
    'paths.csvSourceFile',
    'paths.imageBaseDir',
    'csvFields.productId',
    'categoryMapping'
  ];
  
  for (const path of requiredPaths) {
    if (!getConfig(path)) {
      console.error(`配置项缺失: ${path}`);
      return false;
    }
  }
  
  return true;
}

// 导出配置对象和辅助函数
module.exports = {
  ProductConfig,
  getConfig,
  validateConfig
};
