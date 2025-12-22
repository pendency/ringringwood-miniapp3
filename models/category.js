// models/category.js - 分类数据模型

class CategoryModel {
  constructor() {
    this.db = wx.cloud.database();
    this.collection = this.db.collection('categories');
  }

  /**
   * 获取所有分类
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 分类列表
   */
  async getAll(options = {}) {
    const {
      limit = 100,
      skip = 0,
      orderBy = 'sortOrder',
      orderType = 'asc'
    } = options;

    try {
      const result = await this.collection
        .orderBy(orderBy, orderType)
        .skip(skip)
        .limit(limit)
        .get();

      return result.data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类列表（兼容方法）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 分类列表
   */
  async getCategoryList(options = {}) {
    return this.getAll(options);
  }

  /**
   * 静态方法：获取分类列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 分类列表
   */
  static async getCategoryList(options = {}) {
    const instance = new CategoryModel();
    return instance.getCategoryList(options);
  }

  /**
   * 根据ID获取分类
   * @param {string} categoryId - 分类ID
   * @returns {Promise<Object>} 分类信息
   */
  async getById(categoryId) {
    try {
      const result = await this.collection
        .where({ categoryId: categoryId })
        .get();

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('获取分类详情失败:', error);
      throw error;
    }
  }

  /**
   * 根据名称获取分类
   * @param {string} categoryName - 分类名称
   * @returns {Promise<Object>} 分类信息
   */
  async getByName(categoryName) {
    try {
      const result = await this.collection
        .where({ name: categoryName })
        .get();

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('根据名称获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取可见分类
   * @returns {Promise<Array>} 可见分类列表
   */
  async getVisibleCategories() {
    try {
      const result = await this.collection
        .where({ isVisible: true })
        .orderBy('sortOrder', 'asc')
        .get();

      return result.data;
    } catch (error) {
      console.error('获取可见分类失败:', error);
      throw error;
    }
  }

  /**
   * 创建分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<string>} 创建的分类ID
   */
  async create(categoryData) {
    try {
      const data = {
        ...categoryData,
        createTime: new Date(),
        updateTime: new Date(),
        isVisible: categoryData.isVisible !== false, // 默认可见
        sortOrder: categoryData.sortOrder || 999 // 默认排序
      };

      const result = await this.collection.add({ data });
      console.log('分类创建成功:', result._id);
      return result._id;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   * @param {string} categoryId - 分类ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async update(categoryId, updateData) {
    try {
      const data = {
        ...updateData,
        updateTime: new Date()
      };

      const result = await this.collection
        .where({ categoryId: categoryId })
        .update({ data });

      console.log('分类更新成功:', categoryId, '影响行数:', result.stats.updated);
      return result.stats.updated > 0;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   * @param {string} categoryId - 分类ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(categoryId) {
    try {
      // 检查是否有产品使用此分类
      const productDb = wx.cloud.database();
      const productCount = await productDb.collection('products')
        .where({ categoryName: categoryId })
        .count();

      if (productCount.total > 0) {
        throw new Error(`无法删除分类，还有 ${productCount.total} 个产品使用此分类`);
      }

      const result = await this.collection
        .where({ categoryId: categoryId })
        .remove();

      console.log('分类删除成功:', categoryId, '影响行数:', result.stats.removed);
      return result.stats.removed > 0;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const [totalResult, visibleResult] = await Promise.all([
        this.collection.count(),
        this.collection.where({ isVisible: true }).count()
      ]);

      // 获取每个分类的产品数量
      const categories = await this.getAll();
      const productDb = wx.cloud.database();
      
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const productCount = await productDb.collection('products')
            .where({ categoryName: category.name })
            .count();
          
          return {
            ...category,
            productCount: productCount.total
          };
        })
      );

      return {
        total: totalResult.total,
        visible: visibleResult.total,
        categories: categoryStats
      };
    } catch (error) {
      console.error('获取分类统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新分类排序
   * @param {Array} sortData - 排序数据 [{categoryId, sortOrder}]
   * @returns {Promise<number>} 更新的分类数量
   */
  async updateSortOrder(sortData) {
    try {
      let totalUpdated = 0;

      for (const item of sortData) {
        const result = await this.collection
          .where({ categoryId: item.categoryId })
          .update({
            data: {
              sortOrder: item.sortOrder,
              updateTime: new Date()
            }
          });
        
        totalUpdated += result.stats.updated;
      }

      console.log('批量更新排序完成:', totalUpdated, '个分类');
      return totalUpdated;
    } catch (error) {
      console.error('批量更新排序失败:', error);
      throw error;
    }
  }

  /**
   * 切换分类可见性
   * @param {string} categoryId - 分类ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async toggleVisibility(categoryId) {
    try {
      const category = await this.getById(categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }

      const result = await this.collection
        .where({ categoryId: categoryId })
        .update({
          data: {
            isVisible: !category.isVisible,
            updateTime: new Date()
          }
        });

      console.log('切换分类可见性成功:', categoryId, '新状态:', !category.isVisible);
      return result.stats.updated > 0;
    } catch (error) {
      console.error('切换分类可见性失败:', error);
      throw error;
    }
  }

  /**
   * 搜索分类
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async search(keyword) {
    try {
      const regex = new RegExp(keyword, 'i');
      
      const result = await this.collection
        .where({
          $or: [
            { name: regex },
            { description: regex }
          ]
        })
        .get();

      return result.data;
    } catch (error) {
      console.error('搜索分类失败:', error);
      throw error;
    }
  }

  /**
   * 初始化默认分类
   * @returns {Promise<Array>} 创建的分类ID数组
   */
  async initializeDefaultCategories() {
    const defaultCategories = [
      {
        categoryId: 'cat_wood',
        name: '实木系列',
        description: '精选优质实木，展现自然纹理之美',
        imageUrl: 'images/categories/wood.jpg',
        sortOrder: 1,
        isVisible: true
      },
      {
        categoryId: 'cat_design',
        name: '创意设计',
        description: '独特的创意设计，为空间增添艺术气息',
        imageUrl: 'images/categories/design.jpg',
        sortOrder: 2,
        isVisible: true
      },
      {
        categoryId: 'cat_custom',
        name: '定制系列',
        description: '精心定制的独特作品，每一件都是艺术品',
        imageUrl: 'images/categories/custom.jpg',
        sortOrder: 3,
        isVisible: true
      }
    ];

    try {
      const createdIds = [];
      
      for (const category of defaultCategories) {
        // 检查分类是否已存在
        const existing = await this.getById(category.categoryId);
        if (!existing) {
          const id = await this.create(category);
          createdIds.push(id);
          console.log('创建默认分类:', category.name);
        } else {
          console.log('分类已存在:', category.name);
        }
      }

      return createdIds;
    } catch (error) {
      console.error('初始化默认分类失败:', error);
      throw error;
    }
  }
}

module.exports = CategoryModel;
