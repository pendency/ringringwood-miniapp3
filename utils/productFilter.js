/**
 * 产品筛选工具模块
 * Feature: category-filter-search
 * 
 * 提供产品筛选和搜索功能，包括：
 * - 尺寸解析
 * - 关键词搜索
 * - 长度/宽度范围筛选
 * - 组合筛选
 * 
 * Requirements: 2.2, 3.2, 4.2, 5.1
 */

/**
 * 从产品对象中获取尺寸字符串
 * 支持多种数据来源：
 * 1. product.size 字段
 * 2. product.params 数组中的 "规格" 或 "尺寸" 参数
 * 
 * @param {Object} product - 产品对象
 * @returns {string|null} 尺寸字符串，如 "200*80*4.5"
 */
function getSizeFromProduct(product) {
  if (!product) {
    return null;
  }
  
  // 优先使用 size 字段
  if (product.size && typeof product.size === 'string') {
    return product.size;
  }
  
  // 从 params 数组中查找尺寸信息
  if (product.params && Array.isArray(product.params)) {
    for (const param of product.params) {
      if (param && param.name && param.value) {
        // 标准化参数名称：移除所有空格（包括全角空格）、括号及其内容
        const normalizedName = param.name
          .toLowerCase()
          .replace(/[\s\u3000]+/g, '')  // 移除所有空格（包括全角空格 \u3000）
          .replace(/[（(].*?[）)]/g, ''); // 移除括号及其内容（支持全角和半角括号）
        
        // 检查是否包含"规格"或"尺寸"关键词
        if (normalizedName.includes('规格') || 
            normalizedName.includes('尺寸') || 
            normalizedName.includes('size') || 
            normalizedName.includes('spec')) {
          return param.value;
        }
      }
    }
  }
  
  return null;
}

/**
 * 解析产品尺寸字符串
 * 支持格式: "长*宽*高cm" 或 "长*宽cm" 或 "200*80*4.5"
 * 
 * @param {string} sizeStr - 尺寸字符串，如 "120*60*5cm" 或 "200*80*4.5"
 * @returns {Object} { length: number|null, width: number|null, height: number|null }
 * 
 * Requirements: 2.2, 3.2
 */
function parseSize(sizeStr) {
  const result = { length: null, width: null, height: null };
  
  if (!sizeStr || typeof sizeStr !== 'string') {
    return result;
  }
  
  // 移除空格并转为小写
  const normalized = sizeStr.trim().toLowerCase();
  
  if (!normalized) {
    return result;
  }
  
  // 移除单位 (cm, CM, 厘米等)
  const withoutUnit = normalized.replace(/cm|厘米/gi, '').trim();
  
  // 按 * 或 x 或 × 分割
  const parts = withoutUnit.split(/[*xX×]/);
  
  if (parts.length < 2) {
    return result;
  }
  
  // 解析各个维度
  const parsedValues = parts.map(part => {
    const num = parseFloat(part.trim());
    return isNaN(num) ? null : num;
  });
  
  // 赋值：长度、宽度、高度
  if (parsedValues[0] !== null) {
    result.length = parsedValues[0];
  }
  if (parsedValues[1] !== null) {
    result.width = parsedValues[1];
  }
  if (parsedValues.length > 2 && parsedValues[2] !== null) {
    result.height = parsedValues[2];
  }
  
  return result;
}

/**
 * 从产品对象中解析尺寸
 * 自动从 size 字段或 params 数组中获取尺寸信息
 * 
 * @param {Object} product - 产品对象
 * @returns {Object} { length: number|null, width: number|null, height: number|null }
 */
function parseSizeFromProduct(product) {
  const sizeStr = getSizeFromProduct(product);
  return parseSize(sizeStr);
}

/**
 * 根据搜索关键词筛选产品
 * 大小写不敏感匹配产品标题
 * 
 * @param {Array} products - 产品列表
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 筛选后的产品列表
 * 
 * Requirements: 4.2, 4.6
 */
function filterByKeyword(products, keyword) {
  if (!Array.isArray(products)) {
    return [];
  }
  
  if (!keyword || typeof keyword !== 'string') {
    return products;
  }
  
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return products;
  }
  
  // 转为小写进行大小写不敏感匹配
  const lowerKeyword = trimmedKeyword.toLowerCase();
  
  return products.filter(product => {
    if (!product) return false;
    
    // 匹配产品名称
    const name = product.name || product.title || '';
    return name.toLowerCase().includes(lowerKeyword);
  });
}

/**
 * 根据长度范围筛选产品
 * 
 * @param {Array} products - 产品列表
 * @param {Object} range - 长度范围 { min: number, max: number }
 * @returns {Array} 筛选后的产品列表
 * 
 * Requirements: 2.2
 */
function filterByLength(products, range) {
  if (!Array.isArray(products)) {
    return [];
  }
  
  if (!range || typeof range !== 'object') {
    return products;
  }
  
  const { min, max } = range;
  
  // 如果没有有效的范围，返回原列表
  if (min === undefined && max === undefined) {
    return products;
  }
  
  return products.filter(product => {
    if (!product) {
      return false;
    }
    
    // 使用新的函数从产品中获取尺寸（支持 size 字段和 params 数组）
    const dimensions = parseSizeFromProduct(product);
    if (dimensions.length === null) {
      return false;
    }
    
    const length = dimensions.length;
    
    // 检查是否在范围内
    const minOk = min === undefined || min === null || length >= min;
    const maxOk = max === undefined || max === null || max === Infinity || length < max;
    
    return minOk && maxOk;
  });
}

/**
 * 根据宽度范围筛选产品
 * 
 * @param {Array} products - 产品列表
 * @param {Object} range - 宽度范围 { min: number, max: number }
 * @returns {Array} 筛选后的产品列表
 * 
 * Requirements: 3.2
 */
function filterByWidth(products, range) {
  if (!Array.isArray(products)) {
    return [];
  }
  
  if (!range || typeof range !== 'object') {
    return products;
  }
  
  const { min, max } = range;
  
  // 如果没有有效的范围，返回原列表
  if (min === undefined && max === undefined) {
    return products;
  }
  
  return products.filter(product => {
    if (!product) {
      return false;
    }
    
    // 使用新的函数从产品中获取尺寸（支持 size 字段和 params 数组）
    const dimensions = parseSizeFromProduct(product);
    if (dimensions.width === null) {
      return false;
    }
    
    const width = dimensions.width;
    
    // 检查是否在范围内
    const minOk = min === undefined || min === null || width >= min;
    const maxOk = max === undefined || max === null || max === Infinity || width < max;
    
    return minOk && maxOk;
  });
}

/**
 * 组合筛选 - 应用所有筛选条件
 * 产品必须同时满足所有激活的筛选条件
 * 
 * @param {Array} products - 产品列表
 * @param {Object} filters - 筛选条件
 * @param {string} [filters.keyword] - 搜索关键词
 * @param {Object} [filters.lengthRange] - 长度范围 { min, max }
 * @param {Object} [filters.widthRange] - 宽度范围 { min, max }
 * @returns {Array} 筛选后的产品列表
 * 
 * Requirements: 2.2, 3.2, 4.2, 5.1
 */
function applyFilters(products, filters) {
  if (!Array.isArray(products)) {
    return [];
  }
  
  if (!filters || typeof filters !== 'object') {
    return products;
  }
  
  let result = products;
  
  // 应用关键词筛选
  if (filters.keyword) {
    result = filterByKeyword(result, filters.keyword);
  }
  
  // 应用长度筛选
  if (filters.lengthRange) {
    result = filterByLength(result, filters.lengthRange);
  }
  
  // 应用宽度筛选
  if (filters.widthRange) {
    result = filterByWidth(result, filters.widthRange);
  }
  
  return result;
}

/**
 * 检查是否有激活的筛选条件
 * 
 * @param {Object} filters - 筛选条件
 * @returns {boolean} 是否有激活的筛选
 */
function hasActiveFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return false;
  }
  
  // 检查关键词
  if (filters.keyword && filters.keyword.trim()) {
    return true;
  }
  
  // 检查长度范围
  if (filters.lengthRange && (filters.lengthRange.min !== undefined || filters.lengthRange.max !== undefined)) {
    return true;
  }
  
  // 检查宽度范围
  if (filters.widthRange && (filters.widthRange.min !== undefined || filters.widthRange.max !== undefined)) {
    return true;
  }
  
  return false;
}

// 预定义的筛选选项配置
const FILTER_OPTIONS = {
  length: [
    { min: null, max: null, label: '不限' },
    { min: 0, max: 150, label: '150cm以下' },
    { min: 150, max: 180, label: '150-180cm' },
    { min: 180, max: 210, label: '180-210cm' },
    { min: 210, max: 240, label: '210-240cm' },
    { min: 240, max: 270, label: '240-270cm' },
    { min: 270, max: 300, label: '270-300cm' },
    { min: 300, max: 350, label: '300-350cm' },
    { min: 350, max: 400, label: '350-400cm' },
    { min: 400, max: 500, label: '400-500cm' },
    { min: 500, max: Infinity, label: '500cm以上' }
  ],
  width: [
    { min: null, max: null, label: '不限' },
    { min: 0, max: 60, label: '60cm以下' },
    { min: 60, max: 80, label: '60-80cm' },
    { min: 80, max: 100, label: '80-100cm' },
    { min: 100, max: 120, label: '100-120cm' },
    { min: 120, max: 140, label: '120-140cm' },
    { min: 140, max: Infinity, label: '140cm以上' }
  ]
};

// 排序选项配置
const SORT_OPTIONS = [
  { value: 'default', label: '默认排序' },
  { value: 'newest', label: '最新优先' },
  { value: 'priceAsc', label: '价格升序' },
  { value: 'priceDesc', label: '价格降序' }
];

/**
 * 解析产品价格为数字
 * @param {string|number} price - 价格值
 * @returns {number} 数字价格，"联系销售" 返回 Infinity
 * 
 * Requirements: 7.9
 */
function parsePrice(price) {
  if (price === '联系销售' || price === null || price === undefined) {
    return Infinity;
  }
  
  if (typeof price === 'number') {
    return price;
  }
  
  // 移除货币符号和空格
  const cleanPrice = String(price).replace(/[¥￥\s,]/g, '');
  const num = parseFloat(cleanPrice);
  
  return isNaN(num) ? Infinity : num;
}

/**
 * 排序产品列表
 * @param {Array} products - 产品列表
 * @param {string} sortOption - 排序方式 ('default', 'newest', 'priceAsc', 'priceDesc')
 * @returns {Array} 排序后的产品列表（新数组）
 * 
 * Requirements: 7.3, 7.4, 7.5, 7.6, 7.9
 */
function sortProducts(products, sortOption) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }
  
  if (!sortOption || sortOption === 'default') {
    return products;
  }
  
  // 创建副本避免修改原数组
  const sorted = [...products];
  
  switch (sortOption) {
    case 'newest':
      // 按创建时间降序（最新优先）
      sorted.sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
        return timeB - timeA;
      });
      break;
      
    case 'priceAsc':
      // 按价格升序（最低优先，"联系销售" 排最后）
      sorted.sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceA - priceB;
      });
      break;
      
    case 'priceDesc':
      // 按价格降序（最高优先，"联系销售" 排最前）
      sorted.sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceB - priceA;
      });
      break;
      
    default:
      // 默认不排序
      break;
  }
  
  return sorted;
}

module.exports = {
  parseSize,
  parseSizeFromProduct,
  getSizeFromProduct,
  filterByKeyword,
  filterByLength,
  filterByWidth,
  applyFilters,
  hasActiveFilters,
  sortProducts,
  parsePrice,
  FILTER_OPTIONS,
  SORT_OPTIONS
};
