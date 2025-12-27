/**
 * Product Manager 模块
 * 提供产品数据管理的统一接口，支持分类筛选、分页和标签筛选
 * Requirements: 7.2, 7.3, 7.4
 */

const mockData = require('./mock-data.js');

class ProductManager {
  constructor() {
    this.useCloud = true;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取产品列表
   * @param {Object} options - 查询选项
   * @param {string} options.categoryId - 分类ID筛选
   * @param {number} options.page - 页码（从1开始）
   * @param {number} options.pageSize - 每页数量
   * @param {boolean} options.isHot - 是否热门
   * @param {boolean} options.isNew - 是否新品
   * @param {boolean} options.isRecommended - 是否推荐
   * @returns {Promise<{products: Array, total: number}>}
   */
  async getProducts(options = {}) {
    try {
      // 优先使用云函数
      if (this.useCloud) {
        return await this._getProductsFromCloud(options);
      }
      // 回退到本地数据
      return await this._getProductsFromLocal(options);
    } catch (error) {
      console.error('[ProductManager] getProducts 失败:', error);
      // 云函数失败时回退到本地数据
      return await this._getProductsFromLocal(options);
    }
  }

  /**
   * 从云函数获取产品数据
   * @private
   */
  async _getProductsFromCloud(options) {
    const {
      categoryId,
      page = 1,
      pageSize = 10,
      isHot,
      isNew,
      isRecommended
    } = options;

    const result = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          categoryId,
          page,
          limit: pageSize,
          isHot,
          isNew,
          isRecommended
        }
      }
    });

    if (!result.result || !result.result.success) {
      throw new Error(result.result?.error || '云函数调用失败');
    }

    return {
      products: result.result.data || [],
      total: result.result.total || 0
    };
  }

  /**
   * 从本地数据获取产品
   * @private
   */
  async _getProductsFromLocal(options) {
    const {
      categoryId,
      page = 1,
      pageSize = 10,
      isHot,
      isNew,
      isRecommended
    } = options;

    let products = [...mockData.mockProducts];

    // 分类筛选
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    // isHot 筛选
    if (isHot !== undefined) {
      products = products.filter(p => !!p.isHot === isHot);
    }

    // isNew 筛选
    if (isNew !== undefined) {
      products = products.filter(p => !!p.isNew === isNew);
    }

    // isRecommended 筛选
    if (isRecommended !== undefined) {
      products = products.filter(p => !!p.isRecommended === isRecommended);
    }

    const total = products.length;

    // 分页处理
    const skip = (page - 1) * pageSize;
    products = products.slice(skip, skip + pageSize);

    return {
      products,
      total
    };
  }

  /**
   * 根据ID获取产品详情
   * @param {string} id - 产品ID
   * @returns {Promise<Object|null>}
   */
  async getProductById(id) {
    if (!id) {
      return null;
    }

    try {
      if (this.useCloud) {
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'getProductById',
            data: { id }
          }
        });

        if (result.result?.success) {
          return result.result.data;
        }
      }
    } catch (error) {
      console.error('[ProductManager] getProductById 云函数失败:', error);
    }

    // 回退到本地数据
    const product = mockData.mockProducts.find(p => p._id === id);
    return product || null;
  }

  /**
   * 获取分类列表
   * @returns {Promise<Array>}
   */
  async getCategories() {
    try {
      if (this.useCloud) {
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: { action: 'getCategories' }
        });

        if (result.result?.success) {
          return result.result.data || [];
        }
      }
    } catch (error) {
      console.error('[ProductManager] getCategories 云函数失败:', error);
    }

    return [...mockData.mockCategories];
  }

  /**
   * 获取轮播图数据
   * @returns {Promise<Array>}
   */
  async getBanners() {
    try {
      if (this.useCloud) {
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: { action: 'getBanners' }
        });

        if (result.result?.success) {
          return result.result.data || [];
        }
      }
    } catch (error) {
      console.error('[ProductManager] getBanners 云函数失败:', error);
    }

    return [...mockData.mockBanners];
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 创建单例实例
const productManager = new ProductManager();

module.exports = productManager;
