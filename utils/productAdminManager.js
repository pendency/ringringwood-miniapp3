/**
 * Product Admin Manager 模块
 * 提供产品管理的CRUD操作接口
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.4, 7.4, 8.2, 9.1, 9.2
 */

const { validateProduct } = require('./dataValidator.js');

class ProductAdminManager {
  constructor() {
    this.useCloud = true;
    this.collectionName = 'products';
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
   * 获取产品列表（支持分页和筛选）
   * Requirements: 5.1, 5.2, 5.3, 5.4
   * @param {Object} options - 查询选项
   * @param {string} options.categoryId - 分类ID筛选
   * @param {string} options.keyword - 关键词搜索
   * @param {number} options.page - 页码（从1开始）
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.status - 状态筛选（0:下架, 1:上架）
   * @returns {Promise<{products: Product[], total: number}>}
   */
  async getProducts(options = {}) {
    const {
      categoryId,
      keyword,
      page = 1,
      pageSize = 10,
      status
    } = options;

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);

      // 构建查询条件
      const whereConditions = {};

      // 分类筛选 - Requirements 5.4
      if (categoryId) {
        whereConditions.categoryName = categoryId;
      }

      // 状态筛选 - 处理数据库中可能没有status字段的情况
      // 没有status字段的产品默认视为上架(status=1)
      if (status !== undefined && status !== null) {
        const _ = db.command;
        if (status === 1) {
          // 查询上架产品：status=1 或 status字段不存在
          whereConditions.status = _.eq(1).or(_.exists(false));
        } else if (status === 0) {
          // 查询下架产品：status=0
          whereConditions.status = 0;
        }
      }

      // 关键词搜索 - Requirements 5.5
      // 注意：云数据库不支持模糊搜索，需要使用正则表达式
      if (keyword && keyword.trim()) {
        whereConditions.name = db.RegExp({
          regexp: keyword.trim(),
          options: 'i'
        });
      }

      // 获取总数
      const countResult = await collection
        .where(whereConditions)
        .count();
      const total = countResult.total;

      // 分页查询 - Requirements 5.3
      const skip = (page - 1) * pageSize;
      const result = await collection
        .where(whereConditions)
        .orderBy('order', 'asc')
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const products = result.data.map(item => this._formatProduct(item));

      return {
        products,
        total
      };
    } catch (error) {
      console.error('[ProductAdminManager] getProducts 失败:', error);
      throw new Error('获取产品列表失败: ' + error.message);
    }
  }


  /**
   * 根据ID获取产品
   * @param {string} id - 产品ID
   * @returns {Promise<Product|null>} 产品数据或null
   */
  async getProductById(id) {
    if (!id) {
      return null;
    }

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);

      const result = await collection.doc(id).get();

      if (result.data) {
        return this._formatProduct(result.data);
      }
      return null;
    } catch (error) {
      // 如果是文档不存在的错误，返回null
      if (error.errCode === -1 || error.message.includes('not exist')) {
        return null;
      }
      console.error('[ProductAdminManager] getProductById 失败:', error);
      throw new Error('获取产品详情失败: ' + error.message);
    }
  }

  /**
   * 新增产品
   * Requirements: 6.4
   * @param {ProductInput} product - 产品输入数据
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  async addProduct(product) {
    try {
      // 数据验证
      const validation = validateProduct(product);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      console.log('[ProductAdminManager] addProduct 开始');
      console.log('[ProductAdminManager] 产品数据:', JSON.stringify(product));

      // 通过云函数新增产品（绕过客户端权限限制）
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'addProduct',
          data: {
            name: product.name,
            description: product.description || '',
            price: product.price !== undefined ? product.price : 0,
            originalPrice: product.originalPrice !== undefined ? product.originalPrice : 0,
            categoryId: product.categoryId,
            imageUrls: product.imageUrls || [],
            images: product.images || [],
            videoUrl: product.videoUrl || '', // 产品视频URL
            features: product.features || [],
            params: product.params || [],
            isHot: product.isHot || false,
            isNew: product.isNew || false,
            isRecommended: product.isRecommended || false,
            status: product.status !== undefined ? product.status : 1,
            order: product.order !== undefined ? product.order : 999
          }
        }
      });

      console.log('[ProductAdminManager] 云函数返回结果:', JSON.stringify(result));

      if (result.result && result.result.success) {
        console.log('[ProductAdminManager] addProduct 成功, ID:', result.result.id);
        return {
          success: true,
          id: result.result.id
        };
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败';
        console.error('[ProductAdminManager] addProduct 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[ProductAdminManager] addProduct 失败:', error);
      return {
        success: false,
        error: '新增产品失败: ' + error.message
      };
    }
  }


  /**
   * 更新产品
   * Requirements: 7.4
   * @param {string} id - 产品ID
   * @param {ProductInput} product - 产品输入数据
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateProduct(id, product) {
    if (!id) {
      return {
        success: false,
        error: '产品ID不能为空'
      };
    }

    try {
      // 数据验证
      const validation = validateProduct(product);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      console.log('[ProductAdminManager] updateProduct 开始，ID:', id);
      console.log('[ProductAdminManager] 更新数据:', JSON.stringify(product));

      // 通过云函数更新产品（绕过客户端权限限制）
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'updateProduct',
          data: {
            id: id,
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            categoryId: product.categoryId,
            imageUrls: product.imageUrls,
            images: product.images,
            videoUrl: product.videoUrl, // 产品视频URL
            features: product.features,
            params: product.params,
            isHot: product.isHot,
            isNew: product.isNew,
            isRecommended: product.isRecommended,
            status: product.status,
            order: product.order
          }
        }
      });

      console.log('[ProductAdminManager] 云函数返回结果:', JSON.stringify(result));

      if (result.result && result.result.success) {
        console.log('[ProductAdminManager] updateProduct 成功');
        return {
          success: true
        };
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败';
        console.error('[ProductAdminManager] updateProduct 失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('[ProductAdminManager] updateProduct 失败:', error);
      return {
        success: false,
        error: '更新产品失败: ' + error.message
      };
    }
  }

  /**
   * 删除产品
   * Requirements: 8.2
   * @param {string} id - 产品ID
   * @returns {Promise<{success: boolean, error?: string, deletedFiles?: number}>}
   */
  async deleteProduct(id) {
    if (!id) {
      return {
        success: false,
        error: '产品ID不能为空'
      };
    }

    try {
      // 通过云函数删除产品（同时删除云存储中的图片）
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'deleteProduct',
          data: {
            id: id
          }
        }
      });

      if (result.result && result.result.success) {
        console.log('[ProductAdminManager] 产品删除成功，删除文件数:', result.result.deletedFiles);
        return {
          success: true,
          deletedFiles: result.result.deletedFiles || 0
        };
      } else {
        return {
          success: false,
          error: result.result?.error || '删除产品失败'
        };
      }
    } catch (error) {
      console.error('[ProductAdminManager] deleteProduct 失败:', error);
      return {
        success: false,
        error: '删除产品失败: ' + error.message
      };
    }
  }


  /**
   * 更新产品状态（上架/下架）
   * Requirements: 9.1, 9.2
   * @param {string} id - 产品ID
   * @param {number} status - 目标状态（0:下架, 1:上架）
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateProductStatus(id, status) {
    if (!id) {
      return {
        success: false,
        error: '产品ID不能为空'
      };
    }

    if (status !== 0 && status !== 1) {
      return {
        success: false,
        error: '状态值无效，必须是0（下架）或1（上架）'
      };
    }

    try {
      // 通过云函数更新状态，确保有写入权限
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'updateProductStatus',
          data: {
            id: id,
            status: status
          }
        }
      });

      console.log('[ProductAdminManager] updateProductStatus 云函数返回:', result);

      if (result.result && result.result.success) {
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: (result.result && result.result.error) || '更新产品状态失败'
        };
      }
    } catch (error) {
      console.error('[ProductAdminManager] updateProductStatus 失败:', error);
      return {
        success: false,
        error: '更新产品状态失败: ' + error.message
      };
    }
  }

  /**
   * 批量更新产品状态
   * @param {string[]} ids - 产品ID数组
   * @param {number} status - 目标状态（0:下架, 1:上架）
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  async batchUpdateStatus(ids, status) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        count: 0,
        error: '产品ID列表不能为空'
      };
    }

    if (status !== 0 && status !== 1) {
      return {
        success: false,
        count: 0,
        error: '状态值无效，必须是0（下架）或1（上架）'
      };
    }

    try {
      const db = this._getDb();
      const collection = db.collection(this.collectionName);
      const _ = db.command;

      // 批量更新
      const result = await collection
        .where({
          _id: _.in(ids)
        })
        .update({
          data: {
            status: status,
            updateTime: db.serverDate()
          }
        });

      return {
        success: true,
        count: result.stats.updated || 0
      };
    } catch (error) {
      console.error('[ProductAdminManager] batchUpdateStatus 失败:', error);
      return {
        success: false,
        count: 0,
        error: '批量更新状态失败: ' + error.message
      };
    }
  }


  /**
   * 格式化产品数据
   * @private
   * @param {Object} item - 原始产品数据
   * @returns {Product}
   */
  _formatProduct(item) {
    // 处理图片URL - 支持多种字段格式
    let imageUrls = [];
    
    // 优先使用 imageUrls 数组
    if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
      imageUrls = item.imageUrls.filter(url => url && url.trim());
    } else {
      // 从 imageUrl1-10 字段构建图片数组
      for (let i = 1; i <= 10; i++) {
        const imageUrl = item[`imageUrl${i}`];
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
          imageUrls.push(imageUrl.trim());
        }
      }
    }
    
    // 如果还是没有图片，尝试使用 imageUrl 单字段
    if (imageUrls.length === 0 && item.imageUrl) {
      imageUrls = [item.imageUrl];
    }
    
    // 如果还是没有图片，尝试使用 images 数组
    if (imageUrls.length === 0 && item.images && Array.isArray(item.images)) {
      imageUrls = item.images.filter(url => url && url.trim());
    }

    return {
      _id: item._id,
      name: item.name || item.title || '',
      description: item.description || '',
      price: item.price !== undefined ? item.price : 0,
      originalPrice: item.originalPrice !== undefined ? item.originalPrice : 0,
      categoryId: item.categoryName || item.categoryId || '', // 映射 categoryName 到 categoryId
      imageUrls: imageUrls,
      images: item.images || [],
      imageUrl: item.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : ''), // 单个图片URL字段
      features: item.features || [],
      params: item.params || [],
      // 修复：正确处理布尔字段，支持字符串 'TRUE'/'FALSE' 和布尔值
      isHot: item.isHot === true || item.isHot === 'TRUE' || item.isHot === '是',
      isNew: item.isNew === true || item.isNew === 'TRUE' || item.isNew === '是',
      isRecommended: item.isRecommended === true || item.isRecommended === 'TRUE' || item.isRecommended === '是',
      status: item.status !== undefined ? item.status : 1,
      order: item.order !== undefined ? item.order : 999,
      createTime: item.createTime || null,
      updateTime: item.updateTime || null
    };
  }
}

// 创建单例实例
const productAdminManager = new ProductAdminManager();

module.exports = productAdminManager;
