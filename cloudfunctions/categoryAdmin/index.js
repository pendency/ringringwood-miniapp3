/**
 * categoryAdmin 云函数
 * 提供分类管理的CRUD操作
 * Requirements: 1.1, 2.3, 3.3, 4.4
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 集合名称
const COLLECTION_NAME = 'categories';
const PRODUCTS_COLLECTION = 'products';

/**
 * 格式化分类数据
 * @param {Object} item - 原始分类数据
 * @returns {Object} 格式化后的分类数据
 */
function formatCategory(item) {
  return {
    _id: item._id,
    name: item.name || '',
    description: item.description || '',
    icon: item.icon || '',
    image: item.image || '',
    order: item.order !== undefined ? item.order : 999,
    status: item.status !== undefined ? item.status : 1,
    createTime: item.createTime || null,
    updateTime: item.updateTime || null
  };
}

/**
 * 验证分类数据
 * @param {Object} category - 分类数据
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateCategory(category) {
  const errors = [];

  if (!category) {
    errors.push('分类数据不能为空');
    return { valid: false, errors };
  }

  // 验证分类名称
  if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
    errors.push('分类名称不能为空');
  }

  // 验证排序权重（如果提供）
  if (category.order !== undefined && typeof category.order !== 'number') {
    errors.push('排序权重必须是数字');
  }

  // 验证状态（如果提供）
  if (category.status !== undefined && ![0, 1].includes(category.status)) {
    errors.push('状态值必须是0或1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 根据名称查找分类
 * @param {string} name - 分类名称
 * @returns {Promise<Object|null>}
 */
async function findCategoryByName(name) {
  if (!name) {
    return null;
  }

  try {
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection
      .where({ name: name })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      return formatCategory(result.data[0]);
    }
    return null;
  } catch (error) {
    console.error('[categoryAdmin] findCategoryByName 失败:', error);
    return null;
  }
}

/**
 * 检查分类下是否有产品
 * @param {string} categoryId - 分类ID
 * @returns {Promise<boolean>}
 */
async function checkCategoryHasProducts(categoryId) {
  if (!categoryId) {
    return false;
  }

  try {
    const productsCollection = db.collection(PRODUCTS_COLLECTION);
    
    // 数据库中使用 categoryName 字段存储分类ID
    const result = await productsCollection
      .where({ categoryName: categoryId })
      .count();

    return result.total > 0;
  } catch (error) {
    console.error('[categoryAdmin] checkCategoryHasProducts 失败:', error);
    // 出错时返回true，防止误删除
    return true;
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const { action, data = {} } = event;
  const debugMode = true;

  if (debugMode) {
    console.log('[categoryAdmin] 收到请求:', { action, data });
  }

  try {
    // ========== getCategories: 获取所有分类 ==========
    // Requirements: 1.1
    if (action === 'getCategories') {
      const collection = db.collection(COLLECTION_NAME);
      
      // 按排序权重升序获取所有分类
      const result = await collection
        .orderBy('order', 'asc')
        .limit(100)
        .get();

      const categories = result.data.map(item => formatCategory(item));

      if (debugMode) {
        console.log('[categoryAdmin] getCategories 成功, 数量:', categories.length);
      }

      return {
        success: true,
        data: categories,
        total: categories.length
      };
    }

    // ========== getCategoryById: 根据ID获取分类 ==========
    if (action === 'getCategoryById') {
      const categoryId = data.id || event.id;

      if (!categoryId) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      const collection = db.collection(COLLECTION_NAME);
      
      try {
        const result = await collection.doc(categoryId).get();
        
        if (result.data) {
          return {
            success: true,
            data: formatCategory(result.data)
          };
        }
        return {
          success: false,
          error: '分类不存在'
        };
      } catch (error) {
        // 文档不存在
        if (error.errCode === -1 || error.message.includes('not exist')) {
          return {
            success: false,
            error: '分类不存在'
          };
        }
        throw error;
      }
    }

    // ========== addCategory: 新增分类 ==========
    // Requirements: 2.3
    if (action === 'addCategory') {
      const category = data.category || data;

      // 数据验证
      const validation = validateCategory(category);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 检查分类名称是否重复
      const existingCategory = await findCategoryByName(category.name.trim());
      if (existingCategory) {
        return {
          success: false,
          error: '分类名称已存在'
        };
      }

      const collection = db.collection(COLLECTION_NAME);

      // 构建分类数据
      const categoryData = {
        name: category.name.trim(),
        description: category.description || '',
        icon: category.icon || '',
        image: category.image || '',
        order: category.order !== undefined ? category.order : 999,
        status: category.status !== undefined ? category.status : 1,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      const result = await collection.add({
        data: categoryData
      });

      if (debugMode) {
        console.log('[categoryAdmin] addCategory 成功, ID:', result._id);
      }

      return {
        success: true,
        id: result._id
      };
    }

    // ========== updateCategory: 更新分类 ==========
    // Requirements: 3.3
    if (action === 'updateCategory') {
      const categoryId = data.id || event.id;
      const category = data.category || data;

      if (!categoryId) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      // 数据验证
      const validation = validateCategory(category);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 检查分类是否存在
      const collection = db.collection(COLLECTION_NAME);
      let existingCategory;
      
      try {
        const result = await collection.doc(categoryId).get();
        existingCategory = result.data;
      } catch (error) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      if (!existingCategory) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      // 检查分类名称是否与其他分类重复
      if (category.name) {
        const duplicateCategory = await findCategoryByName(category.name.trim());
        if (duplicateCategory && duplicateCategory._id !== categoryId) {
          return {
            success: false,
            error: '分类名称已存在'
          };
        }
      }

      // 构建更新数据
      const updateData = {
        updateTime: db.serverDate()
      };

      if (category.name !== undefined) {
        updateData.name = category.name.trim();
      }
      if (category.description !== undefined) {
        updateData.description = category.description;
      }
      if (category.icon !== undefined) {
        updateData.icon = category.icon;
      }
      if (category.image !== undefined) {
        updateData.image = category.image;
      }
      if (category.order !== undefined) {
        updateData.order = category.order;
      }
      if (category.status !== undefined) {
        updateData.status = category.status;
      }

      await collection.doc(categoryId).update({
        data: updateData
      });

      if (debugMode) {
        console.log('[categoryAdmin] updateCategory 成功, ID:', categoryId);
      }

      return {
        success: true
      };
    }

    // ========== deleteCategory: 删除分类 ==========
    // Requirements: 4.4
    if (action === 'deleteCategory') {
      const categoryId = data.id || event.id;

      if (!categoryId) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      // 检查分类是否存在
      const collection = db.collection(COLLECTION_NAME);
      let existingCategory;
      
      try {
        const result = await collection.doc(categoryId).get();
        existingCategory = result.data;
      } catch (error) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      if (!existingCategory) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      // 检查分类下是否有产品 - Requirements 4.2, 4.3
      const hasProducts = await checkCategoryHasProducts(categoryId);
      if (hasProducts) {
        return {
          success: false,
          error: '该分类下有产品，请先删除或移动产品'
        };
      }

      await collection.doc(categoryId).remove();

      if (debugMode) {
        console.log('[categoryAdmin] deleteCategory 成功, ID:', categoryId);
      }

      return {
        success: true
      };
    }

    // ========== checkCategoryHasProducts: 检查分类下是否有产品 ==========
    if (action === 'checkCategoryHasProducts') {
      const categoryId = data.categoryId || data.id || event.categoryId;

      if (!categoryId) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      const hasProducts = await checkCategoryHasProducts(categoryId);

      return {
        success: true,
        hasProducts: hasProducts
      };
    }

    // ========== testConnection: 测试数据库连接 ==========
    if (action === 'testConnection') {
      const count = await db.collection(COLLECTION_NAME).count();
      return {
        success: true,
        message: '数据库连接正常',
        total: count.total
      };
    }

    // 未知 action
    return {
      success: false,
      error: '未知的操作类型: ' + action
    };

  } catch (error) {
    console.error('[categoryAdmin] 云函数执行异常:', error);
    return {
      success: false,
      error: error.message || '云函数执行失败'
    };
  }
};
