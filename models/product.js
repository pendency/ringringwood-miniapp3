// models/product.js - 产品数据模型

class ProductModel {
  constructor() {
    this.db = wx.cloud.database();
    this.collection = this.db.collection('products');
  }

  /**
   * 获取所有产品
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 产品列表
   */
  async getAll(options = {}) {
    const {
      limit = 100,
      skip = 0,
      orderBy = 'createTime',
      orderType = 'desc'
    } = options;

    try {
      const result = await this.collection
        .orderBy(orderBy, orderType)
        .skip(skip)
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('获取产品列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品列表（兼容方法）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 产品列表
   */
  async getProductList(options = {}) {
    return this.getAll(options);
  }

  /**
   * 静态方法：获取产品列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 产品列表
   */
  static async getProductList(options = {}) {
    const instance = new ProductModel();
    return instance.getProductList(options);
  }

  /**
   * 根据ID获取产品
   * @param {string} productId - 产品ID
   * @returns {Promise<Object>} 产品信息
   */
  async getById(productId) {
    try {
      const result = await this.collection
        .where({ productId: productId })
        .get();

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('获取产品详情失败:', error);
      throw error;
    }
  }

  /**
   * 根据分类获取产品
   * @param {string} categoryName - 分类名称
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 产品列表
   */
  async getByCategory(categoryName, options = {}) {
    const {
      limit = 100,
      skip = 0,
      orderBy = 'sortPriority',
      orderType = 'asc'
    } = options;

    try {
      const result = await this.collection
        .where({ categoryName: categoryName, isVisible: true })
        .orderBy(orderBy, orderType)
        .skip(skip)
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('获取分类产品失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门产品
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 热门产品列表
   */
  async getHotProducts(limit = 10) {
    try {
      const result = await this.collection
        .where({ isHot: true, isVisible: true })
        .orderBy('sortPriority', 'asc')
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('获取热门产品失败:', error);
      throw error;
    }
  }

  /**
   * 获取新品
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 新品列表
   */
  async getNewProducts(limit = 10) {
    try {
      const result = await this.collection
        .where({ isNew: true, isVisible: true })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('获取新品失败:', error);
      throw error;
    }
  }

  /**
   * 创建产品
   * @param {Object} productData - 产品数据
   * @returns {Promise<string>} 创建的产品ID
   */
  async create(productData) {
    try {
      const data = {
        ...productData,
        createTime: new Date(),
        updateTime: new Date(),
        isVisible: productData.isVisible !== false // 默认可见
      };

      const result = await this.collection.add({ data });
      console.log('产品创建成功:', result._id);
      return result._id;
    } catch (error) {
      console.error('创建产品失败:', error);
      throw error;
    }
  }

  /**
   * 更新产品
   * @param {string} productId - 产品ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async update(productId, updateData) {
    try {
      const data = {
        ...updateData,
        updateTime: new Date()
      };

      const result = await this.collection
        .where({ productId: productId })
        .update({ data });

      console.log('产品更新成功:', productId, '影响行数:', result.stats.updated);
      return result.stats.updated > 0;
    } catch (error) {
      console.error('更新产品失败:', error);
      throw error;
    }
  }

  /**
   * 删除产品
   * @param {string} productId - 产品ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(productId) {
    try {
      const result = await this.collection
        .where({ productId: productId })
        .remove();

      console.log('产品删除成功:', productId, '影响行数:', result.stats.removed);
      return result.stats.removed > 0;
    } catch (error) {
      console.error('删除产品失败:', error);
      throw error;
    }
  }

  /**
   * 搜索产品
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async search(keyword, options = {}) {
    const {
      limit = 50,
      skip = 0
    } = options;

    try {
      // 使用正则表达式进行模糊搜索
      const regex = new RegExp(keyword, 'i');
      
      const result = await this.collection
        .where({
          $or: [
            { title: regex },
            { description: regex },
            { categoryName: regex }
          ],
          isVisible: true
        })
        .skip(skip)
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('搜索产品失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const [totalResult, visibleResult, hotResult, newResult] = await Promise.all([
        this.collection.count(),
        this.collection.where({ isVisible: true }).count(),
        this.collection.where({ isHot: true, isVisible: true }).count(),
        this.collection.where({ isNew: true, isVisible: true }).count()
      ]);

      return {
        total: totalResult.total,
        visible: visibleResult.total,
        hot: hotResult.total,
        new: newResult.total
      };
    } catch (error) {
      console.error('获取产品统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新产品可见性
   * @param {Array} productIds - 产品ID数组
   * @param {boolean} isVisible - 是否可见
   * @returns {Promise<number>} 更新的产品数量
   */
  async batchUpdateVisibility(productIds, isVisible) {
    try {
      let totalUpdated = 0;

      for (const productId of productIds) {
        const result = await this.collection
          .where({ productId: productId })
          .update({
            data: {
              isVisible: isVisible,
              updateTime: new Date()
            }
          });
        
        totalUpdated += result.stats.updated;
      }

      console.log('批量更新可见性完成:', totalUpdated, '个产品');
      return totalUpdated;
    } catch (error) {
      console.error('批量更新可见性失败:', error);
      throw error;
    }
  }
}

module.exports = ProductModel;
