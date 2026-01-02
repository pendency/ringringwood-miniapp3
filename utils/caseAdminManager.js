/**
 * Case Admin Manager 模块
 * 提供案例管理的CRUD操作接口
 * Requirements: 3.2, 3.4, 3.5, 4.5, 4.7, 6.2
 */

const { validateCaseData, sortCases, filterActiveCases } = require('./caseManager.js');

class CaseAdminManager {
  constructor() {
    this.useCloud = true;
    this.collectionName = 'cases';
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
   * 获取所有启用的案例（用于前台展示）
   * Requirements: 6.2
   * @returns {Promise<Array>} 案例列表
   */
  async getActiveCases() {
    try {
      const allCases = await this.getAllCases();
      const activeCases = filterActiveCases(allCases);
      return sortCases(activeCases);
    } catch (error) {
      console.error('[CaseAdminManager] getActiveCases 失败:', error);
      throw new Error('获取案例列表失败: ' + error.message);
    }
  }

  /**
   * 获取所有案例（用于管理后台）
   * Requirements: 4.2
   * @returns {Promise<Array>} 案例列表
   */
  async getAllCases() {
    try {
      // 通过云函数获取案例列表
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getCases'
        }
      });

      console.log('[CaseAdminManager] getAllCases 云函数返回:', result);

      if (result.result && result.result.success) {
        const cases = result.result.data || [];
        return sortCases(cases.map(item => this._formatCase(item)));
      } else {
        throw new Error(result.result?.error || '获取案例列表失败');
      }
    } catch (error) {
      console.error('[CaseAdminManager] getAllCases 失败:', error);
      throw new Error('获取案例列表失败: ' + error.message);
    }
  }

  /**
   * 根据ID获取案例
   * @param {string} id - 案例ID
   * @returns {Promise<Object|null>} 案例数据或null
   */
  async getCaseById(id) {
    if (!id) {
      return null;
    }

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);

      const result = await collection.doc(id).get();

      if (result.data) {
        return this._formatCase(result.data);
      }
      return null;
    } catch (error) {
      // 如果是文档不存在的错误，返回null
      if (error.errCode === -1 || error.message.includes('not exist')) {
        return null;
      }
      console.error('[CaseAdminManager] getCaseById 失败:', error);
      throw new Error('获取案例详情失败: ' + error.message);
    }
  }


  /**
   * 获取下一个案例ID
   * Requirements: 3.2
   * @returns {Promise<string>} 新的案例ID
   */
  async getNextCaseId() {
    try {
      // 通过云函数获取下一个案例ID
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getNextCaseId'
        }
      });

      console.log('[CaseAdminManager] getNextCaseId 云函数返回:', result);

      if (result.result && result.result.success) {
        return result.result.nextId;
      } else {
        throw new Error(result.result?.error || '获取案例ID失败');
      }
    } catch (error) {
      console.error('[CaseAdminManager] getNextCaseId 失败:', error);
      throw new Error('获取案例ID失败: ' + error.message);
    }
  }

  /**
   * 创建新案例
   * Requirements: 3.4, 4.5
   * @param {Object} caseData - 案例数据
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  async createCase(caseData) {
    try {
      // 数据验证
      const validation = validateCaseData(caseData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      console.log('[CaseAdminManager] createCase 开始');
      console.log('[CaseAdminManager] 输入数据:', JSON.stringify(caseData));

      // 通过云函数新增案例
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'addCase',
          data: {
            title: caseData.title,
            description: caseData.description || '',
            imageUrl: caseData.imageUrl || '',
            order: caseData.order !== undefined ? caseData.order : 999,
            status: caseData.status !== undefined ? caseData.status : 1
          }
        }
      });

      console.log('[CaseAdminManager] 云函数返回结果:', JSON.stringify(result));

      if (result.result && result.result.success) {
        console.log('[CaseAdminManager] createCase 成功, ID:', result.result.id);
        return {
          success: true,
          id: result.result.id
        };
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败';
        console.error('[CaseAdminManager] createCase 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CaseAdminManager] createCase 失败:', error);
      return {
        success: false,
        error: '新增案例失败: ' + error.message
      };
    }
  }

  /**
   * 更新案例
   * Requirements: 3.5
   * @param {string} id - 案例ID
   * @param {Object} caseData - 案例数据
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateCase(id, caseData) {
    if (!id) {
      return {
        success: false,
        error: '案例ID不能为空'
      };
    }

    try {
      console.log('[CaseAdminManager] updateCase 开始，ID:', id);
      console.log('[CaseAdminManager] 输入数据:', JSON.stringify(caseData));

      // 数据验证
      const validation = validateCaseData(caseData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 通过云函数更新案例
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'updateCase',
          data: {
            id: id,
            title: caseData.title,
            description: caseData.description,
            imageUrl: caseData.imageUrl,
            order: typeof caseData.order === 'number' ? caseData.order : parseInt(caseData.order) || 999,
            status: caseData.status
          }
        }
      });

      console.log('[CaseAdminManager] 云函数返回结果:', JSON.stringify(result));

      if (result.result && result.result.success) {
        console.log('[CaseAdminManager] updateCase 成功');
        return {
          success: true
        };
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败';
        console.error('[CaseAdminManager] updateCase 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CaseAdminManager] updateCase 失败:', error);
      return {
        success: false,
        error: '更新案例失败: ' + error.message
      };
    }
  }

  /**
   * 删除案例
   * Requirements: 4.7
   * @param {string} id - 案例ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteCase(id) {
    if (!id) {
      return {
        success: false,
        error: '案例ID不能为空'
      };
    }

    try {
      console.log('[CaseAdminManager] deleteCase 开始，ID:', id);

      // 通过云函数删除案例（同时删除云存储中的图片）
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'deleteCase',
          data: { id: id }
        }
      });

      console.log('[CaseAdminManager] 云函数返回结果:', JSON.stringify(result));

      if (result.result && result.result.success) {
        console.log('[CaseAdminManager] deleteCase 成功');
        return {
          success: true
        };
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败';
        console.error('[CaseAdminManager] deleteCase 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[CaseAdminManager] deleteCase 失败:', error);
      return {
        success: false,
        error: '删除案例失败: ' + error.message
      };
    }
  }

  /**
   * 格式化案例数据
   * @private
   * @param {Object} item - 原始案例数据
   * @returns {Object}
   */
  _formatCase(item) {
    return {
      _id: item._id,
      title: item.title || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      order: item.order !== undefined ? item.order : 999,
      status: item.status !== undefined ? item.status : 1,
      createTime: item.createTime || null,
      updateTime: item.updateTime || null
    };
  }
}

// 创建单例实例
const caseAdminManager = new CaseAdminManager();

module.exports = caseAdminManager;
