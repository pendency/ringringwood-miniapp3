/**
 * Data Validator 模块
 * 提供分类和产品数据验证功能
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * 验证分类数据
 * @param {Object} category - 分类输入数据
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateCategory(category) {
  const errors = [];

  // 检查输入是否为对象
  if (!category || typeof category !== 'object') {
    return {
      valid: false,
      errors: ['分类数据必须是一个对象']
    };
  }

  // 验证分类名称（必填）- Requirements 10.1
  if (!category.name) {
    errors.push('分类名称不能为空');
  } else if (typeof category.name !== 'string') {
    errors.push('分类名称必须是字符串');
  } else if (category.name.trim() === '') {
    errors.push('分类名称不能为空白字符');
  } else if (category.name.trim().length > 50) {
    errors.push('分类名称不能超过50个字符');
  }

  // 验证分类描述（可选）
  if (category.description !== undefined && category.description !== null) {
    if (typeof category.description !== 'string') {
      errors.push('分类描述必须是字符串');
    } else if (category.description.length > 200) {
      errors.push('分类描述不能超过200个字符');
    }
  }

  // 验证排序权重（可选）
  if (category.order !== undefined && category.order !== null) {
    if (typeof category.order !== 'number' || !Number.isInteger(category.order)) {
      errors.push('排序权重必须是整数');
    } else if (category.order < 0) {
      errors.push('排序权重不能为负数');
    }
  }

  // 验证状态（可选）
  if (category.status !== undefined && category.status !== null) {
    if (typeof category.status !== 'number' || (category.status !== 0 && category.status !== 1)) {
      errors.push('状态必须是0（禁用）或1（启用）');
    }
  }

  // 验证图标URL（可选）
  if (category.icon !== undefined && category.icon !== null) {
    if (typeof category.icon !== 'string') {
      errors.push('分类图标URL必须是字符串');
    }
  }

  // 验证图片URL（可选）
  if (category.image !== undefined && category.image !== null) {
    if (typeof category.image !== 'string') {
      errors.push('分类图片URL必须是字符串');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证价格格式
 * @param {string|number} price - 价格值
 * @returns {boolean} 是否为有效价格
 */
function validatePrice(price) {
  // 允许 "consult" 或 "联系销售" 表示需要咨询价格 - Requirements 10.3
  if (price === 'consult' || price === '联系销售') {
    return true;
  }

  // 允许空值（价格可选）
  if (price === undefined || price === null || price === '') {
    return true;
  }

  // 如果是字符串，尝试转换为数字
  if (typeof price === 'string') {
    // 去除空格
    const trimmedPrice = price.trim();
    
    // 检查是否为 "consult" 或 "联系销售"
    if (trimmedPrice === 'consult' || trimmedPrice === '联系销售') {
      return true;
    }
    
    // 尝试解析为数字
    const numPrice = parseFloat(trimmedPrice);
    if (isNaN(numPrice)) {
      return false;
    }
    // 价格必须为非负数
    return numPrice >= 0;
  }

  // 如果是数字
  if (typeof price === 'number') {
    // 检查是否为有效数字且非负
    return !isNaN(price) && isFinite(price) && price >= 0;
  }

  return false;
}

/**
 * 验证产品数据
 * @param {Object} product - 产品输入数据
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateProduct(product) {
  const errors = [];

  // 检查输入是否为对象
  if (!product || typeof product !== 'object') {
    return {
      valid: false,
      errors: ['产品数据必须是一个对象']
    };
  }

  // 验证产品名称（必填）- Requirements 10.2
  if (!product.name) {
    errors.push('产品名称不能为空');
  } else if (typeof product.name !== 'string') {
    errors.push('产品名称必须是字符串');
  } else if (product.name.trim() === '') {
    errors.push('产品名称不能为空白字符');
  } else if (product.name.trim().length > 100) {
    errors.push('产品名称不能超过100个字符');
  }

  // 验证分类ID（必填）- Requirements 10.2
  if (!product.categoryId) {
    errors.push('产品分类不能为空');
  } else if (typeof product.categoryId !== 'string') {
    errors.push('产品分类ID必须是字符串');
  } else if (product.categoryId.trim() === '') {
    errors.push('产品分类不能为空白字符');
  }

  // 验证产品描述（可选）
  if (product.description !== undefined && product.description !== null) {
    if (typeof product.description !== 'string') {
      errors.push('产品描述必须是字符串');
    } else if (product.description.length > 1000) {
      errors.push('产品描述不能超过1000个字符');
    }
  }

  // 验证价格（可选）- Requirements 10.3
  if (product.price !== undefined && product.price !== null && product.price !== '') {
    if (!validatePrice(product.price)) {
      errors.push('价格格式无效，请输入有效数字或"联系销售"');
    }
  }

  // 验证原价（可选）
  if (product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== '') {
    if (!validatePrice(product.originalPrice)) {
      errors.push('原价格式无效，请输入有效数字');
    }
  }

  // 验证主图URL数组（可选）
  if (product.imageUrls !== undefined && product.imageUrls !== null) {
    if (!Array.isArray(product.imageUrls)) {
      errors.push('主图URL必须是数组');
    } else {
      for (let i = 0; i < product.imageUrls.length; i++) {
        if (typeof product.imageUrls[i] !== 'string') {
          errors.push(`主图URL[${i}]必须是字符串`);
          break;
        }
      }
    }
  }

  // 验证详情图片数组（可选）
  if (product.images !== undefined && product.images !== null) {
    if (!Array.isArray(product.images)) {
      errors.push('详情图片必须是数组');
    } else {
      for (let i = 0; i < product.images.length; i++) {
        if (typeof product.images[i] !== 'string') {
          errors.push(`详情图片[${i}]必须是字符串`);
          break;
        }
      }
    }
  }

  // 验证产品特点数组（可选）
  if (product.features !== undefined && product.features !== null) {
    if (!Array.isArray(product.features)) {
      errors.push('产品特点必须是数组');
    }
  }

  // 验证产品参数数组（可选）
  if (product.params !== undefined && product.params !== null) {
    if (!Array.isArray(product.params)) {
      errors.push('产品参数必须是数组');
    }
  }

  // 验证布尔字段（可选）
  const booleanFields = ['isHot', 'isNew', 'isRecommended'];
  for (const field of booleanFields) {
    if (product[field] !== undefined && product[field] !== null) {
      if (typeof product[field] !== 'boolean') {
        errors.push(`${field}必须是布尔值`);
      }
    }
  }

  // 验证状态（可选）
  if (product.status !== undefined && product.status !== null) {
    if (typeof product.status !== 'number' || (product.status !== 0 && product.status !== 1)) {
      errors.push('状态必须是0（下架）或1（上架）');
    }
  }

  // 验证排序权重（可选）
  if (product.order !== undefined && product.order !== null) {
    if (typeof product.order !== 'number' || !Number.isInteger(product.order)) {
      errors.push('排序权重必须是整数');
    } else if (product.order < 0) {
      errors.push('排序权重不能为负数');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateCategory,
  validateProduct,
  validatePrice
};
