/**
 * 测试用 Product Manager 模块
 * 不依赖微信 wx API，直接使用本地数据进行测试
 * Feature: wechat-miniprogram-product-sales
 */

const mockData = require('../../utils/mock-data.js');

class TestProductManager {
  constructor() {
    this.products = [...mockData.mockProducts];
    this.categories = [...mockData.mockCategories];
  }

  /**
   * 获取产品列表（本地数据版本）
   * @param {Object} options - 查询选项
   * @returns {{products: Array, total: number}}
   */
  getProducts(options = {}) {
    const {
      categoryId,
      page = 1,
      pageSize = 10,
      isHot,
      isNew,
      isRecommended
    } = options;

    let products = [...this.products];

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
   * 获取所有分类
   * @returns {Array}
   */
  getCategories() {
    return [...this.categories];
  }

  /**
   * 获取所有分类ID
   * @returns {string[]}
   */
  getCategoryIds() {
    return this.categories.map(c => c._id);
  }
}

module.exports = { TestProductManager };
