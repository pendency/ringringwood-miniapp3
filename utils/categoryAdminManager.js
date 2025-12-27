/**
 * Category Admin Manager 模块
 * 提供分类管理的CRUD操作接口
 * Requirements: 1.1, 1.2, 2.3, 2.4, 3.3, 3.4, 4.2, 4.3, 4.4
 */

const { validateCategory } = require('./dataValidator.js');
const cacheManager = require('./cacheManager.js');

class CategoryAdminManager {
  constructor() {
    this.useCloud = true;
    this.collectionName = 'categories';
  }

  /**
   * 获取数据库实例
   * @private
   */
  _getDb() {
    if (typeof wx !== 'undefined' && wx.cloud) {
      return wx.cloud.database();
    }
    throw new Error('云数据库不可用');
  }

  /**
   * 清除分类缓存
   * @private
   */
  _clearCategoryCache() {
    console.log('[CategoryAdminManager] 清除分类缓存');
    cacheManager.remove(cacheManager.KEYS.CATEGORIES);
  }

  /**
   * 获取所有分类
   * Requirements: 1.1, 1.2
   * @returns {Promise<Category[]>} 分类列表
   */
  async getCategories() {
    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);
      
      // 按排序权重升序获取所有分类
      const result = await collection
        .orderBy('order', 'asc')
        .limit(100)
        .get();

      return result.data.map(item => this._formatCategory(item));
    } catch (error) {
      console.error('[CategoryAdminManager] getCategories 失败:', error);
      throw new Error('获取分类列表失败: ' + error.message);
    }
  }

  /**
   * 根据ID获取分类
   * @param {string} id - 分类ID
   * @returns {Promise<Category|null>} 分类数据或null
   */
  async getCategoryById(id) {
    if (!id) {
      return null;
    }

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.doc(id).get();
      
      if (result.data) {
        return this._formatCategory(result.data);
      }
      return null;
    } catch (error) {
      // 如果是文档不存在的错误，返回null
      if (error.errCode === -1 || error.message.includes('not exist')) {
        return null;
      }
      console.error('[CategoryAdminManager] getCategoryById 失败:', error);
      throw new Error('获取分类详情失败: ' + error.message);
    }
  }

  /**
   * 新增分类
   * Requirements: 2.3, 2.4
   * @param {CategoryInput} category - 分类输入数据
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  async addCategory(category) {
    try {
      // 数据验证
      const validation = validateCategory(category);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      console.log('[CategoryAdminManager] addCategory 开始');
      console.log('[CategoryAdminManager] 输入数据:', JSON.stringify(category));

      // 通过云函数新增分类（绕过客户端权限限制）
      const cloudResult = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'addCategory',
          data: {
            name: category.name,
            description: category.description || '',
            icon: category.icon || '',
            image: category.image || '',
            order: category.order !== undefined ? category.order : 999,
            status: category.status !== undefined ? category.status : 1
          }
        }
      });

      console.log('[CategoryAdminManager] 云函数返回结果:', JSON.stringify(cloudResult));

      if (cloudResult.result && cloudResult.result.success) {
        console.log('[CategoryAdminManager] addCategory 成功, ID:', cloudResult.result.id);
        // 清除分类缓存，确保前端获取最新数据
        this._clearCategoryCache();
        return {
          success: true,
          id: cloudResult.result.id
        };
      } else {
        const errorMsg = cloudResult.result ? cloudResult.result.error : '云函数调用失败';
        console.error('[CategoryAdminManager] addCategory 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CategoryAdminManager] addCategory 失败:', error);
      return {
        success: false,
        error: '新增分类失败: ' + error.message
      };
    }
  }

  /**
   * 更新分类
   * Requirements: 3.3, 3.4
   * @param {string} id - 分类ID
   * @param {CategoryInput} category - 分类输入数据
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateCategory(id, category) {
    if (!id) {
      return {
        success: false,
        error: '分类ID不能为空'
      };
    }

    try {
      console.log('[CategoryAdminManager] updateCategory 开始，ID:', id);
      console.log('[CategoryAdminManager] 输入数据:', JSON.stringify(category));

      // 数据验证
      const validation = validateCategory(category);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 通过云函数更新分类（绕过客户端权限限制）
      console.log('[CategoryAdminManager] 调用云函数 updateCategory');
      
      const cloudResult = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'updateCategory',
          data: {
            id: id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            image: category.image,
            order: typeof category.order === 'number' ? category.order : parseInt(category.order) || 999,
            status: category.status
          }
        }
      });

      console.log('[CategoryAdminManager] 云函数返回结果:', JSON.stringify(cloudResult));

      if (cloudResult.result && cloudResult.result.success) {
        console.log('[CategoryAdminManager] updateCategory 成功');
        // 清除分类缓存，确保前端获取最新数据
        this._clearCategoryCache();
        return {
          success: true
        };
      } else {
        const errorMsg = cloudResult.result ? cloudResult.result.error : '云函数调用失败';
        console.error('[CategoryAdminManager] updateCategory 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CategoryAdminManager] updateCategory 失败:', error);
      return {
        success: false,
        error: '更新分类失败: ' + error.message
      };
    }
  }

  /**
   * 删除分类
   * Requirements: 4.2, 4.3, 4.4
   * @param {string} id - 分类ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteCategory(id) {
    if (!id) {
      return {
        success: false,
        error: '分类ID不能为空'
      };
    }

    try {
      console.log('[CategoryAdminManager] deleteCategory 开始，ID:', id);

      // 通过云函数删除分类（绕过客户端权限限制）
      const cloudResult = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'deleteCategory',
          data: { id: id }
        }
      });

      console.log('[CategoryAdminManager] 云函数返回结果:', JSON.stringify(cloudResult));

      if (cloudResult.result && cloudResult.result.success) {
        console.log('[CategoryAdminManager] deleteCategory 成功');
        // 清除分类缓存，确保前端获取最新数据
        this._clearCategoryCache();
        return {
          success: true
        };
      } else {
        const errorMsg = cloudResult.result ? cloudResult.result.error : '云函数调用失败';
        console.error('[CategoryAdminManager] deleteCategory 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CategoryAdminManager] deleteCategory 失败:', error);
      return {
        success: false,
        error: '删除分类失败: ' + error.message
      };
    }
  }

  /**
   * 检查分类下是否有产品
   * Requirements: 4.2
   * @param {string} categoryId - 分类ID
   * @returns {Promise<boolean>}
   */
  async checkCategoryHasProducts(categoryId) {
    if (!categoryId) {
      return false;
    }

    try {
      const db = this._getDb();
      const productsCollection = db.collection('products');

      // 查询该分类下的产品数量
      // 注意：数据库中使用 categoryName 字段存储分类ID
      const result = await productsCollection
        .where({
          categoryName: categoryId
        })
        .count();

      return result.total > 0;
    } catch (error) {
      console.error('[CategoryAdminManager] checkCategoryHasProducts 失败:', error);
      // 出错时返回true，防止误删除
      return true;
    }
  }

  /**
   * 根据名称查找分类
   * @private
   * @param {string} name - 分类名称
   * @returns {Promise<Category|null>}
   */
  async _findCategoryByName(name) {
    if (!name) {
      return null;
    }

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);

      const result = await collection
        .where({
          name: name
        })
        .limit(1)
        .get();

      if (result.data && result.data.length > 0) {
        return this._formatCategory(result.data[0]);
      }
      return null;
    } catch (error) {
      console.error('[CategoryAdminManager] _findCategoryByName 失败:', error);
      return null;
    }
  }

  /**
   * 格式化分类数据
   * @private
   * @param {Object} item - 原始分类数据
   * @returns {Category}
   */
  _formatCategory(item) {
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
}

// 创建单例实例
const categoryAdminManager = new CategoryAdminManager();

module.exports = categoryAdminManager;
