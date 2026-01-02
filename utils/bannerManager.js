/**
 * Banner Manager 模块
 * 提供轮播图管理的工具函数
 * Requirements: 1.2, 2.1, 5.2, 7.3
 */

/**
 * 生成轮播图文件名
 * Requirements: 1.2
 * @param {string} extension - 文件扩展名（如 'jpeg', 'png'）
 * @param {number} [timestamp] - 可选的时间戳，默认使用当前时间
 * @returns {string} 格式为 banner_{timestamp}.{extension} 的文件名
 */
function generateBannerFilename(extension, timestamp) {
  const ts = timestamp !== undefined ? timestamp : Date.now();
  // 确保扩展名不包含点号
  const ext = extension.replace(/^\./, '');
  return `banner_${ts}.${ext}`;
}

/**
 * 验证轮播图数据
 * Requirements: 2.1
 * @param {Object} data - 轮播图输入数据
 * @param {string} data.image - 必填，云存储文件ID
 * @param {string} [data.title] - 可选，标题
 * @param {string} [data.subtitle] - 可选，副标题
 * @param {number} [data.order] - 可选，排序权重
 * @param {number} [data.status] - 可选，状态
 * @param {string} [data.productId] - 可选，关联产品ID
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateBannerData(data) {
  const errors = [];

  // 验证必填字段：image
  if (!data || !data.image || typeof data.image !== 'string' || data.image.trim() === '') {
    errors.push('图片地址(image)不能为空');
  }

  // 验证 order 字段（如果提供）
  if (data && data.order !== undefined && data.order !== null) {
    if (typeof data.order !== 'number' || !Number.isInteger(data.order) || data.order < 0) {
      errors.push('排序权重(order)必须是非负整数');
    }
  }

  // 验证 status 字段（如果提供）
  if (data && data.status !== undefined && data.status !== null) {
    if (data.status !== 0 && data.status !== 1) {
      errors.push('状态(status)必须是0或1');
    }
  }

  // 验证 productId 字段（如果提供且非空）
  if (data && data.productId !== undefined && data.productId !== null && data.productId !== '') {
    if (!validateProductId(data.productId)) {
      errors.push('产品ID(productId)格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 排序轮播图列表
 * Requirements: 5.2, 6.2, 6.4
 * 按 order 升序排序，相同 order 时按 createTime 升序排序
 * @param {Array} banners - 轮播图列表
 * @returns {Array} 排序后的轮播图列表
 */
function sortBanners(banners) {
  if (!Array.isArray(banners)) {
    return [];
  }

  return [...banners].sort((a, b) => {
    // 首先按 order 升序排序
    const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
    const orderB = b.order !== undefined && b.order !== null ? b.order : 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // order 相同时，按 createTime 升序排序
    const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
    const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
    
    return timeA - timeB;
  });
}

/**
 * 验证产品ID格式
 * Requirements: 7.3
 * 产品ID格式：字母数字、下划线、连字符组成
 * @param {string} productId - 产品ID
 * @returns {boolean} 是否为有效的产品ID格式
 */
function validateProductId(productId) {
  // 空字符串或 undefined/null 视为有效（productId 是可选的）
  if (productId === undefined || productId === null || productId === '') {
    return true;
  }

  // 必须是字符串
  if (typeof productId !== 'string') {
    return false;
  }

  // 产品ID格式：字母数字、下划线、连字符组成，长度1-100
  const productIdPattern = /^[a-zA-Z0-9_-]+$/;
  return productIdPattern.test(productId) && productId.length >= 1 && productId.length <= 100;
}

/**
 * 生成轮播图ID
 * Requirements: 2.2
 * @param {number} number - ID序号
 * @returns {string} 格式为 banner_{number} 的ID
 */
function generateBannerId(number) {
  return `banner_${number}`;
}

/**
 * 创建完整的轮播图数据对象
 * Requirements: 2.1 - 确保包含所有必需字段
 * @param {Object} input - 轮播图输入数据
 * @param {string} bannerId - 轮播图ID
 * @param {Date} [timestamp] - 可选的时间戳，用于 createTime 和 updateTime
 * @returns {Object} 包含所有必需字段的轮播图数据
 */
function createBannerData(input, bannerId, timestamp) {
  const now = timestamp || new Date();
  
  return {
    _id: bannerId,
    image: input.image || '',
    title: input.title !== undefined ? input.title : '轮播图',
    subtitle: input.subtitle !== undefined ? input.subtitle : '',
    order: input.order !== undefined ? input.order : 999,
    status: input.status !== undefined ? input.status : 1,
    productId: input.productId !== undefined ? input.productId : '',
    createTime: now,
    updateTime: now
  };
}

/**
 * 设置轮播图默认值
 * Requirements: 2.1, 6.3
 * @param {Object} data - 轮播图输入数据
 * @returns {Object} 包含默认值的轮播图数据
 */
function applyBannerDefaults(data) {
  return {
    image: data.image || '',
    title: data.title !== undefined ? data.title : '轮播图',
    subtitle: data.subtitle !== undefined ? data.subtitle : '',
    order: data.order !== undefined ? data.order : 999,
    status: data.status !== undefined ? data.status : 1,
    productId: data.productId !== undefined ? data.productId : ''
  };
}

/**
 * 应用轮播图更新
 * Requirements: 3.3 - 只更新提供的字段，未提供的字段保持不变
 * @param {Object} existingBanner - 现有的轮播图数据
 * @param {Object} updatePayload - 更新数据（只包含要更新的字段）
 * @returns {Object} 更新后的轮播图数据
 */
function applyBannerUpdate(existingBanner, updatePayload) {
  // 创建现有数据的副本
  const updatedBanner = { ...existingBanner };
  
  // 只更新 updatePayload 中明确提供的字段
  // Requirements: 3.3 - 未包含在更新负载中的字段保持不变
  if (updatePayload.image !== undefined) {
    updatedBanner.image = updatePayload.image;
  }
  if (updatePayload.title !== undefined) {
    updatedBanner.title = updatePayload.title;
  }
  if (updatePayload.subtitle !== undefined) {
    updatedBanner.subtitle = updatePayload.subtitle;
  }
  if (updatePayload.order !== undefined) {
    updatedBanner.order = updatePayload.order;
  }
  if (updatePayload.status !== undefined) {
    updatedBanner.status = updatePayload.status;
  }
  if (updatePayload.productId !== undefined) {
    updatedBanner.productId = updatePayload.productId;
  }
  if (updatePayload.link !== undefined) {
    updatedBanner.link = updatePayload.link;
  }
  
  // 更新时间戳
  updatedBanner.updateTime = updatePayload.updateTime || new Date();
  
  return updatedBanner;
}

module.exports = {
  generateBannerFilename,
  validateBannerData,
  sortBanners,
  validateProductId,
  generateBannerId,
  applyBannerDefaults,
  createBannerData,
  applyBannerUpdate
};
