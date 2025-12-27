/**
 * 测试用 Product Admin Manager 模块
 * 不依赖微信 wx API，使用内存数据进行测试
 * Feature: admin-management-system
 */

const { validateProduct } = require('../../utils/dataValidator.js');

class TestProductAdminManager {
  constructor() {
    this.products = new Map();
    this.idCounter = 1;
  }

  /**
   * 生成唯一ID
   * @private
   */
  _generateId() {
    return `product_${Date.now()}_${this.idCounter++}`;
  }

  /**
   * 获取产品列表（支持分页和筛选）
   * Requirements: 5.1, 5.2, 5.3, 5.4
   * @param {Object} options - 查询选项
   * @returns {{products: Array, total: number}}
   */
  getProducts(options = {}) {
    const {
      categoryId,
      keyword,
      page = 1,
      pageSize = 10,
      status
    } = options;

    let products = Array.from(this.products.values());

    // 分类筛选
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
      products = products.filter(p => p.status === status);
    }

    // 关键词搜索
    if (keyword && keyword.trim()) {
      const lowerKeyword = keyword.trim().toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(lowerKeyword)
      );
    }

    // 排序
    products.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return (b.createTime || 0) - (a.createTime || 0);
    });

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
   * 根据ID获取产品
   * @param {string} id - 产品ID
   * @returns {Object|null}
   */
  getProductById(id) {
    if (!id) {
      return null;
    }
    return this.products.get(id) || null;
  }

  /**
   * 新增产品
   * Requirements: 6.4
   * @param {Object} product - 产品输入数据
   * @returns {{success: boolean, id?: string, error?: string}}
   */
  addProduct(product) {
    // 数据验证
    const validation = validateProduct(product);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      };
    }

    const id = this._generateId();
    const now = Date.now();

    const productData = {
      _id: id,
      name: product.name.trim(),
      description: product.description || '',
      price: product.price !== undefined ? product.price : 0,
      originalPrice: product.originalPrice !== undefined ? product.originalPrice : 0,
      categoryId: product.categoryId,
      imageUrls: product.imageUrls || [],
      images: product.images || [],
      features: product.features || [],
      params: product.params || [],
      isHot: product.isHot || false,
      isNew: product.isNew || false,
      isRecommended: product.isRecommended || false,
      status: product.status !== undefined ? product.status : 1,
      order: product.order !== undefined ? product.order : 999,
      createTime: now,
      updateTime: now
    };

    this.products.set(id, productData);

    return {
      success: true,
      id
    };
  }

  /**
   * 更新产品
   * Requirements: 7.4
   * @param {string} id - 产品ID
   * @param {Object} product - 产品输入数据
   * @returns {{success: boolean, error?: string}}
   */
  updateProduct(id, product) {
    if (!id) {
      return {
        success: false,
        error: '产品ID不能为空'
      };
    }

    // 数据验证
    const validation = validateProduct(product);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      };
    }

    // 检查产品是否存在
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      return {
        success: false,
        error: '产品不存在'
      };
    }

    // 更新数据
    const updatedProduct = { ...existingProduct };
    
    if (product.name !== undefined) {
      updatedProduct.name = product.name.trim();
    }
    if (product.description !== undefined) {
      updatedProduct.description = product.description;
    }
    if (product.price !== undefined) {
      updatedProduct.price = product.price;
    }
    if (product.originalPrice !== undefined) {
      updatedProduct.originalPrice = product.originalPrice;
    }
    if (product.categoryId !== undefined) {
      updatedProduct.categoryId = product.categoryId;
    }
    if (product.imageUrls !== undefined) {
      updatedProduct.imageUrls = product.imageUrls;
    }
    if (product.images !== undefined) {
      updatedProduct.images = product.images;
    }
    if (product.features !== undefined) {
      updatedProduct.features = product.features;
    }
    if (product.params !== undefined) {
      updatedProduct.params = product.params;
    }
    if (product.isHot !== undefined) {
      updatedProduct.isHot = product.isHot;
    }
    if (product.isNew !== undefined) {
      updatedProduct.isNew = product.isNew;
    }
    if (product.isRecommended !== undefined) {
      updatedProduct.isRecommended = product.isRecommended;
    }
    if (product.status !== undefined) {
      updatedProduct.status = product.status;
    }
    if (product.order !== undefined) {
      updatedProduct.order = product.order;
    }
    
    updatedProduct.updateTime = Date.now();

    this.products.set(id, updatedProduct);

    return {
      success: true
    };
  }


  /**
   * 删除产品
   * Requirements: 8.2
   * @param {string} id - 产品ID
   * @returns {{success: boolean, error?: string}}
   */
  deleteProduct(id) {
    if (!id) {
      return {
        success: false,
        error: '产品ID不能为空'
      };
    }

    // 检查产品是否存在
    if (!this.products.has(id)) {
      return {
        success: false,
        error: '产品不存在'
      };
    }

    this.products.delete(id);

    return {
      success: true
    };
  }

  /**
   * 更新产品状态（上架/下架）
   * Requirements: 9.1, 9.2
   * @param {string} id - 产品ID
   * @param {number} status - 目标状态（0:下架, 1:上架）
   * @returns {{success: boolean, error?: string}}
   */
  updateProductStatus(id, status) {
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

    // 检查产品是否存在
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      return {
        success: false,
        error: '产品不存在'
      };
    }

    existingProduct.status = status;
    existingProduct.updateTime = Date.now();

    this.products.set(id, existingProduct);

    return {
      success: true
    };
  }

  /**
   * 批量更新产品状态
   * @param {string[]} ids - 产品ID数组
   * @param {number} status - 目标状态（0:下架, 1:上架）
   * @returns {{success: boolean, count: number, error?: string}}
   */
  batchUpdateStatus(ids, status) {
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

    let count = 0;
    const now = Date.now();

    for (const id of ids) {
      const product = this.products.get(id);
      if (product) {
        product.status = status;
        product.updateTime = now;
        this.products.set(id, product);
        count++;
      }
    }

    return {
      success: true,
      count
    };
  }

  /**
   * 清空所有产品（用于测试重置）
   */
  clear() {
    this.products.clear();
    this.idCounter = 1;
  }

  /**
   * 获取产品数量
   * @returns {number}
   */
  getProductCount() {
    return this.products.size;
  }
}

module.exports = { TestProductAdminManager };
