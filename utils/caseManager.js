/**
 * Case Manager 模块
 * 提供客户案例管理的工具函数
 * Requirements: 3.1, 3.2, 3.4, 3.5, 4.4, 4.5, 4.7, 5.1, 5.2, 6.1, 6.2, 6.5
 */

/**
 * 验证案例数据完整性
 * Requirements: 3.1, 2.4, 4.2
 * @param {Object} caseData - 案例数据
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateCaseData(caseData) {
  const errors = [];

  // 验证必填字段：title
  if (!caseData || !caseData.title || typeof caseData.title !== 'string' || caseData.title.trim() === '') {
    errors.push('案例标题(title)不能为空');
  }

  // 验证 description 字段（如果提供）
  if (caseData && caseData.description !== undefined && caseData.description !== null) {
    if (typeof caseData.description !== 'string') {
      errors.push('案例描述(description)必须是字符串');
    }
  }

  // 验证 imageUrl 字段（如果提供且非空）
  if (caseData && caseData.imageUrl !== undefined && caseData.imageUrl !== null && caseData.imageUrl !== '') {
    if (typeof caseData.imageUrl !== 'string') {
      errors.push('图片地址(imageUrl)必须是字符串');
    }
  }

  // 验证 order 字段（如果提供）
  if (caseData && caseData.order !== undefined && caseData.order !== null) {
    if (typeof caseData.order !== 'number' || !Number.isInteger(caseData.order) || caseData.order < 0) {
      errors.push('排序权重(order)必须是非负整数');
    }
  }

  // 验证 status 字段（如果提供）
  if (caseData && caseData.status !== undefined && caseData.status !== null) {
    if (caseData.status !== 0 && caseData.status !== 1) {
      errors.push('状态(status)必须是0或1');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证图片文件格式和大小
 * Requirements: 4.4
 * @param {string} filePath - 文件路径
 * @param {number} [fileSize] - 文件大小（字节），可选
 * @returns {{valid: boolean, error: string}} 验证结果
 */
function validateImageFile(filePath, fileSize) {
  // 验证文件路径
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    return {
      valid: false,
      error: '文件路径不能为空'
    };
  }

  // 获取文件扩展名
  const extension = filePath.split('.').pop().toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png'];

  // 验证文件格式
  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: '仅支持 jpg、jpeg、png 格式'
    };
  }

  // 验证文件大小（如果提供）
  // 最大 2MB = 2 * 1024 * 1024 = 2097152 字节
  const maxSize = 2 * 1024 * 1024;
  if (fileSize !== undefined && fileSize !== null) {
    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return {
        valid: false,
        error: '文件大小无效'
      };
    }
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: '图片大小不能超过 2MB'
      };
    }
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * 按排序规则排序案例
 * Requirements: 6.1, 6.5
 * 按 order 升序排序，相同 order 时按 createTime 降序排序（最新的在前）
 * @param {Array} cases - 案例列表
 * @returns {Array} 排序后的案例列表
 */
function sortCases(cases) {
  if (!Array.isArray(cases)) {
    return [];
  }

  return [...cases].sort((a, b) => {
    // 首先按 order 升序排序
    const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
    const orderB = b.order !== undefined && b.order !== null ? b.order : 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // order 相同时，按 createTime 降序排序（最新的在前）
    const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
    const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;

    return timeB - timeA;
  });
}


/**
 * 生成案例ID
 * Requirements: 3.2
 * @param {number} number - ID序号
 * @returns {string} 格式为 custom{number} 的ID
 */
function generateCaseId(number) {
  return `custom${number}`;
}

/**
 * 生成案例图片云存储路径
 * Requirements: 5.1, 5.2, 5.4
 * @param {string} caseId - 案例ID
 * @param {string} extension - 文件扩展名
 * @returns {string} 云存储路径
 */
function generateCaseImagePath(caseId, extension) {
  // 确保扩展名不包含点号
  const ext = extension.replace(/^\./, '').toLowerCase();
  return `cases/custom/${caseId}.${ext}`;
}

/**
 * 从案例ID中提取序号
 * @param {string} caseId - 案例ID
 * @returns {number|null} 序号或null
 */
function extractCaseNumber(caseId) {
  if (!caseId || typeof caseId !== 'string') {
    return null;
  }
  const match = caseId.match(/^custom(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * 生成下一个案例ID
 * Requirements: 3.2, 5.3
 * @param {Array} existingCases - 现有案例列表
 * @returns {string} 新的案例ID
 */
function generateNextCaseId(existingCases) {
  if (!Array.isArray(existingCases) || existingCases.length === 0) {
    return 'custom1';
  }

  // 提取所有现有案例的序号
  const numbers = existingCases
    .map(c => extractCaseNumber(c._id))
    .filter(n => n !== null);

  if (numbers.length === 0) {
    return 'custom1';
  }

  // 找到最大序号并加1
  const maxNumber = Math.max(...numbers);
  return generateCaseId(maxNumber + 1);
}

/**
 * 过滤启用的案例
 * Requirements: 6.2
 * @param {Array} cases - 案例列表
 * @returns {Array} 启用的案例列表
 */
function filterActiveCases(cases) {
  if (!Array.isArray(cases)) {
    return [];
  }
  return cases.filter(c => c.status === 1);
}

/**
 * 创建完整的案例数据对象
 * Requirements: 3.1, 3.4
 * @param {Object} input - 案例输入数据
 * @param {string} caseId - 案例ID
 * @param {Date} [timestamp] - 可选的时间戳
 * @returns {Object} 包含所有必需字段的案例数据
 */
function createCaseData(input, caseId, timestamp) {
  const now = timestamp || new Date();

  return {
    _id: caseId,
    title: input.title || '',
    description: input.description !== undefined ? input.description : '',
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : '',
    order: input.order !== undefined ? input.order : 999,
    status: input.status !== undefined ? input.status : 1,
    createTime: now,
    updateTime: now
  };
}

/**
 * 应用案例更新
 * Requirements: 3.5
 * @param {Object} existingCase - 现有的案例数据
 * @param {Object} updatePayload - 更新数据
 * @returns {Object} 更新后的案例数据
 */
function applyCaseUpdate(existingCase, updatePayload) {
  const updatedCase = { ...existingCase };

  // 只更新 updatePayload 中明确提供的字段
  if (updatePayload.title !== undefined) {
    updatedCase.title = updatePayload.title;
  }
  if (updatePayload.description !== undefined) {
    updatedCase.description = updatePayload.description;
  }
  if (updatePayload.imageUrl !== undefined) {
    updatedCase.imageUrl = updatePayload.imageUrl;
  }
  if (updatePayload.order !== undefined) {
    updatedCase.order = updatePayload.order;
  }
  if (updatePayload.status !== undefined) {
    updatedCase.status = updatePayload.status;
  }

  // 更新时间戳
  updatedCase.updateTime = updatePayload.updateTime || new Date();

  return updatedCase;
}

/**
 * 设置案例默认值
 * @param {Object} data - 案例输入数据
 * @returns {Object} 包含默认值的案例数据
 */
function applyCaseDefaults(data) {
  return {
    title: data.title || '',
    description: data.description !== undefined ? data.description : '',
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : '',
    order: data.order !== undefined ? data.order : 999,
    status: data.status !== undefined ? data.status : 1
  };
}

// 导出函数
module.exports = {
  validateCaseData,
  validateImageFile,
  sortCases,
  generateCaseId,
  generateCaseImagePath,
  extractCaseNumber,
  generateNextCaseId,
  filterActiveCases,
  createCaseData,
  applyCaseUpdate,
  applyCaseDefaults
};
