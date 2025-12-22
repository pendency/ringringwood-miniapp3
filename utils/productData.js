// utils/productData.js
// 产品数据管理模块，供首页和分类页共用

const mockData = require('./mock-data.js');
import cloudProductData from './cloudProductData.js';
const { DEFAULT_IMAGES, PAGINATION_CONFIG } = require('../config/app-config.js');

// 云开发数据管理器
class CloudProductDataManager {
  constructor() {
    this.useCloud = true; // 是否使用云开发，可以通过配置切换
  }

  /**
   * 调用云函数获取产品列表
   */
  async callCloudFunction(action, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action,
          data
        }
      });
      
      if (result.result && result.result.success) {
        return result.result;
      } else {
        throw new Error(result.result?.error || '云函数调用失败');
      }
    } catch (error) {
      console.error('云函数调用失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品列表（云开发版本）
   */
  async getProductList(params = {}) {
    if (!this.useCloud) {
      return mockData.getProductList(params);
    }

    try {
      const result = await this.callCloudFunction('getProducts', params);
      return {
        data: result.data || [],
        total: result.total || 0
      };
    } catch (error) {
      console.warn('云开发获取产品失败，使用mock数据:', error);
      return mockData.getProductList(params);
    }
  }

  /**
   * 获取产品详情（云开发版本）
   */
  async getProductById(id) {
    if (!this.useCloud) {
      return mockData.getProductById(id);
    }

    try {
      const result = await this.callCloudFunction('getProductById', { id });
      return {
        data: result.data || null
      };
    } catch (error) {
      console.warn('云开发获取产品详情失败，使用mock数据:', error);
      return mockData.getProductById(id);
    }
  }

  /**
   * 获取分类列表（云开发版本）
   */
  async getCategoryList() {
    if (!this.useCloud) {
      return mockData.getCategoryList();
    }

    try {
      const result = await this.callCloudFunction('getCategories');
      return {
        data: result.data || []
      };
    } catch (error) {
      console.warn('云开发获取分类失败，使用mock数据:', error);
      return mockData.getCategoryList();
    }
  }

  /**
   * 获取轮播图列表（云开发版本）
   */
  async getBannerList() {
    // 轮播图暂时使用mock数据
    return mockData.getBannerList();
  }
}

// 创建云开发数据管理器实例
const cloudDataManager = new CloudProductDataManager();

/**
 * 产品数据管理类
 */
class ProductDataManager {
  constructor() {
    this.useCloudDB = true; // 🆕 优先使用云数据库直接读取
  }

  /**
   * 获取热门产品列表
   * @param {Object} options - 查询选项
   * @param {Number} options.limit - 限制返回数量
   * @returns {Promise<Array>} 产品列表
   */
  async getHotProducts(options = {}) {
    try {
      // 🆕 优先从云数据库获取数据
      if (this.useCloudDB) {
        const result = await cloudProductData.getProducts({
          isHot: options.isHot !== undefined ? options.isHot : true, // 使用传入的 isHot 参数，默认为 true
          limit: options.limit || PAGINATION_CONFIG.hotProductsLimit
        });
        
        if (result.success) {
          console.log('从云数据库获取热门产品:', result.data.length);
          return this.addFavoriteStatus(result.data);
        }
      }

      // 备用：使用原有云开发数据
      const result = await cloudDataManager.getProductList({ 
        isHot: true, 
        limit: options.limit || PAGINATION_CONFIG.hotProductsLimit 
      });
      // 转换数据格式以确保字段一致性
      return this.transformProductsForDisplay(result.data);
    } catch (error) {
      console.error('获取热门产品失败', error);
      return this.getFallbackHotProducts();
    }
  }

  /**
   * 获取分类列表
   * @returns {Promise<Array>} 分类列表
   */
  async getCategories() {
    try {
      // 🆕 从云数据库获取所有产品，然后提取分类信息
      if (this.useCloudDB) {
        const result = await cloudProductData.getProducts();
        
        if (result.success) {
          const categories = this.extractCategoriesFromProducts(result.data);
          console.log('从云数据库提取分类列表:', categories.length);
          
          return categories;
        }
      }

      // 备用：使用云开发数据
      const result = await cloudDataManager.getCategoryList();
      const categories = result.data.map(cat => ({
        ...cat,
        imageUrl: this.getCategoryImageUrl(cat.name)
      }));
      
      console.log('获取到的分类列表:', categories);
      
      // 检查每个分类是否有对应的产品
      for (const category of categories) {
        const productCount = await this.getProductCountByCategory(category._id);
        console.log(`分类 ${category.name} (${category._id}) 有 ${productCount} 个产品`);
      }
      
      return categories;
    } catch (error) {
      console.error('获取分类列表失败', error);
      return [];
    }
  }
  
  /**
   * 获取分类下的产品数量
   * @param {String} categoryId - 分类ID
   * @returns {Promise<Number>} 产品数量
   */
  async getProductCountByCategory(categoryId) {
    try {
      const result = await cloudDataManager.getProductList({ categoryId });
      return result.total || 0;
    } catch (error) {
      console.error('获取分类产品数量失败', error);
      return 0;
    }
  }

  /**
   * 根据分类获取产品列表
   * @param {String} categoryId - 分类ID
   * @param {Object} options - 查询选项
   * @param {Number} options.limit - 限制返回数量
   * @returns {Promise<Object>} 包含产品列表和总数的对象
   */
  async getProductsByCategory(categoryId, options = {}) {
    try {
      console.log('getProductsByCategory 调用，分类ID:', categoryId, '选项:', options);
      
      if (!categoryId) {
        console.error('分类ID为空，无法获取产品');
        return { products: [], total: 0 };
      }
      
      // 🆕 优先从云数据库获取数据
      if (this.useCloudDB) {
        const result = await cloudProductData.getProducts({
          categoryId: categoryId,
          limit: options.limit || 100,
          offset: options.offset || 0
        });
        
        if (result.success) {
          console.log('从云数据库获取分类产品:', result.data.length, '/', result.total);
          
          // 添加收藏状态
          const productsWithFavorite = this.addFavoriteStatus(result.data);
          
          return {
            products: productsWithFavorite,
            total: result.total
          };
        }
      }
      
      // 备用：使用云开发数据
      const result = await cloudDataManager.getProductList({ 
        categoryId: categoryId,
        limit: options.limit || 100
      });
      
      console.log('cloudDataManager.getProductList 返回结果:', result);
      console.log('获取到产品数量:', result.data ? result.data.length : 0);
      
      // 标记已收藏的产品
      const productsWithFavorite = this.addFavoriteStatus(result.data || []);
      
      const returnData = {
        products: productsWithFavorite,
        total: result.total || 0
      };
      
      console.log('getProductsByCategory 返回数据:', returnData);
      return returnData;
    } catch (error) {
      console.error('获取分类产品失败', error);
      return { products: [], total: 0 };
    }
  }
  
  /**
   * 获取新品列表
   * @param {Object} options - 查询选项
   * @param {Number} options.limit - 限制返回数量
   * @returns {Promise<Object>} 包含产品列表和总数的对象
   */
  async getNewProducts(options = {}) {
    try {
      // 🆕 优先从CSV获取数据
      if (this.useCSV) {
        const result = await csvDataLoader.getNewProducts({
          limit: options.limit || 100,
          offset: options.offset || 0
        });
        
        console.log('从CSV获取新品列表:', result.products.length, '/', result.total);
        
        // 添加收藏状态
        const productsWithFavorite = this.addFavoriteStatus(result.products);
        
        return {
          products: productsWithFavorite,
          total: result.total
        };
      }

      // 备用：使用云开发数据
      const result = await cloudDataManager.getProductList({ 
        isNew: true,
        limit: options.limit || 100
      });
      
      // 转换数据格式以确保字段一致性
      const transformedProducts = this.transformProductsForDisplay(result.data);
      
      // 标记已收藏的产品
      const productsWithFavorite = this.addFavoriteStatus(transformedProducts);
      
      return {
        products: productsWithFavorite,
        total: result.total
      };
    } catch (error) {
      console.error('获取新品列表失败', error);
      return { products: [], total: 0 };
    }
  }

  /**
   * 获取轮播图列表
   * @returns {Promise<Array>} 轮播图列表
   */
  async getBanners() {
    try {
      const result = await cloudDataManager.getBannerList();
      // 确保轮播图数据中的id字段与产品的_id格式一致
      return result.data.map(banner => {
        // 如果id不是以'prod_'开头，则添加前缀
        if (banner.id && !String(banner.id).startsWith('prod_')) {
          banner._id = 'prod_' + banner.id;
        } else {
          banner._id = banner.id;
        }
        return banner;
      });
    } catch (error) {
      console.error('获取轮播图失败', error);
      return this.getFallbackBanners();
    }
  }

  /**
   * 根据ID获取产品详情
   * @param {String} id - 产品ID
   * @returns {Promise<Object>} 产品详情
   */
  async getProductById(id) {
    try {
      console.log('productData.getProductById 被调用，ID:', id);
      
      // 🆕 优先从云数据库获取数据
      if (this.useCloudDB) {
        const result = await cloudProductData.getProductById(id);
        
        if (!result.success || !result.data) {
          console.error('云数据库中未找到产品:', id);
          return null;
        }

        const product = result.data;
        console.log('从云数据库获取产品数据:', product);
        console.log('产品images:', product.images);
        console.log('产品videoUrlTemp:', product.videoUrlTemp);
        console.log('产品videoUrl:', product.videoUrl);
        console.log('产品video:', product.video);

        // 获取收藏状态
        const favorites = wx.getStorageSync('favorites') || [];
        const isFavorite = favorites.some(item => item._id === id);

        // 转换数据格式以匹配页面模板
        const transformedProduct = {
          id: product._id,
          _id: product._id,
          name: product.name,
          brief: product.description,
          images: product.images || product.imageUrls || (product.image ? [product.image] : []), // 🔧 修复：优先使用云函数处理过的 images 数组
          imageUrls: product.imageUrls || (product.image ? [product.image] : []), // 保持 imageUrls 用于其他用途
          detailImages: [], // 所有图片都作为主图使用
          params: product.params || [],
          // 🔧 修复：正确处理视频数据 - 优先使用临时URL，回退到原始URL
          features: this.createFeaturesFromVideo(product.videoUrlTemp || product.videoUrl || product.video), 
          videos: (product.videoUrlTemp || product.videoUrl || product.video) ? [{
            title: '产品展示视频',
            url: product.videoUrlTemp || product.videoUrl || product.video
          }] : [],
          price: product.price,
          categoryId: product.categoryId,
          isFavorite: isFavorite,
          // 🆕 产品参数字段
          size: product.size || '',
          weight: product.weight || '',
          color: product.color || '',
          applicationScenario: product.applicationScenario || ''
        };

        console.log('转换后的产品数据:', transformedProduct);
        console.log('转换后的产品features:', transformedProduct.features);
        console.log('转换后的产品videos:', transformedProduct.videos);
        return transformedProduct;
      }

      // 备用：使用云开发数据
      const result = await cloudDataManager.getProductById(id);
      console.log('cloudDataManager.getProductById 返回结果:', result);

      if (!result.data) {
        console.error('未找到产品:', id);
        return null;
      }

      console.log('原始产品数据:', result.data);
      console.log('原始产品imageUrls:', result.data.imageUrls);
      console.log('原始产品images:', result.data.images);

      // 获取收藏列表，检查该产品是否已被收藏
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.some(item => item._id === id);

      // 转换数据格式以匹配页面模板
      // 合并主图和详情图
      const allImages = this.getProductImages(result.data);
      console.log('合并后的allImages:', allImages);

      const transformedProduct = {
        id: result.data._id,
        _id: result.data._id, // 保留原始ID字段
        name: result.data.name,
        brief: result.data.description,
        images: allImages, // 合并后的所有图片
        imageUrls: result.data.imageUrls || [], // 保留原始主图数组
        detailImages: result.data.images || [], // 保留原始详情图数组
        params: result.data.params || [],
        features: result.data.features || [],
        price: result.data.price,
        categoryId: result.data.categoryId,
        isFavorite: isFavorite,
        // 🆕 产品参数字段
        size: result.data.size || '',
        weight: result.data.weight || '',
        color: result.data.color || '',
        applicationScenario: result.data.applicationScenario || ''
      };

      console.log('转换后的产品数据:', transformedProduct);
      return transformedProduct;
    } catch (error) {
      console.error('获取产品详情失败:', error);
      return null;
    }
  }

  /**
   * 获取产品图片数组（合并主图和详情图）
   * @param {Object} product - 产品数据
   * @returns {Array} 图片数组
   */
  getProductImages(product) {
    const images = [];
    
    // 添加主图
    if (product.imageUrls && Array.isArray(product.imageUrls)) {
      images.push(...product.imageUrls);
      console.log('添加主图到images:', product.imageUrls);
    }
    
    // 添加详情图
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
      console.log('添加详情图到images:', product.images);
    }
    
    // 如果没有图片，返回默认图片
    return images.length > 0 ? images : [DEFAULT_IMAGES.product];
  }

  /**
   * 切换产品收藏状态
   * @param {String} id - 产品ID
   * @param {Object} productData - 产品数据
   * @returns {Boolean} 收藏状态
   */
  toggleProductFavorite(id, productData) {
    // 获取当前收藏列表
    let favorites = wx.getStorageSync('favorites') || [];
    const index = favorites.findIndex(fav => fav._id === id);
    
    // 创建要保存到收藏列表的产品对象
    const favoriteItem = {
      _id: id,
      name: productData.name,
      description: productData.description || productData.brief,
      // 优先使用处理后的 images 数组（包含临时URL），回退到 imageUrls
      imageUrls: productData.images || productData.imageUrls || [],
      // 保存原始价格数据，不添加格式化
      price: productData.price || '联系销售'
    };
    
    let isFavorite = false;
    
    if (index === -1) {
      // 未收藏，添加到收藏
      favorites.push(favoriteItem);
      isFavorite = true;
      
      wx.showToast({
        title: '已收藏',
        icon: 'success'
      });
    } else {
      // 已收藏，取消收藏
      favorites.splice(index, 1);
      isFavorite = false;
      
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    }
    
    // 更新本地存储
    wx.setStorageSync('favorites', favorites);
    return isFavorite;
  }

  /**
   * 获取分类图片URL
   * @param {String} categoryName - 分类名称
   * @returns {String} 图片URL
   */
  getCategoryImageUrl(categoryName) {
    if (categoryName.includes('原木')) {
      return DEFAULT_IMAGES.categoryWood;
    } else if (categoryName.includes('树脂')) {
      return DEFAULT_IMAGES.categoryResin;
    } else if (categoryName.includes('玩趣')) {
      return DEFAULT_IMAGES.categoryDesign;
    } else if (categoryName.includes('高定')) {
      return DEFAULT_IMAGES.categoryCustom;
    } else {
      return DEFAULT_IMAGES.categoryFrame;
    }
  }

  /**
   * 获取备用热门产品数据
   * @returns {Array} 备用热门产品列表
   */
  getFallbackHotProducts() {
    return [
      {
        _id: 'prod_1',
        name: '胡桃木实木大板',
        description: '天然实木，纹理清晰，自然质朴',
        imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/wood/wood1.jpeg']
      },
      {
        _id: 'prod_2',
        name: '冰晶玉石大板',
        description: '晶莹剔透，质感非凡',
        imageUrls: ['/images/wood2.jpg']
      },
      {
        _id: 'prod_3',
        name: '胡桃木小板',
        description: '精致小巧，实用美观',
        imageUrls: ['/images/wood3.jpg']
      },
      {
        _id: 'prod_4',
        name: '冰晶玉石小板',
        description: '精工细作，光彩夺目',
        imageUrls: ['/images/wood4.jpg']
      }
    ];
  }

  /**
   * 获取备用轮播图数据
   * @returns {Array} 备用轮播图列表
   */
  getFallbackBanners() {
    return [
      {
        id: 'prod_1',
        _id: 'prod_1', // 添加_id字段，确保与产品ID格式一致
        imageUrl: '/images/banner1.jpeg',
        title: '✧ 原木经典',
        subtitle: '厚实整板，稳重大气'
      },
      {
        id: 'prod_2',
        _id: 'prod_2',
        imageUrl: '/images/banner2.jpeg',
        title: '✧ 树脂美学',
        subtitle: '光影流动，自带焦点感'
      },
      {
        id: 'prod_3',
        _id: 'prod_3',
        imageUrl: '/images/banner3.jpeg',
        title: '✦ 玩趣设计',
        subtitle: '风格桌面，空间主角'
      },
      {
        id: 'prod_4',
        _id: 'prod_4',
        imageUrl: '/images/banner4.jpeg',
        title: '✦ 高定专属',
        subtitle: '材质尺寸自由搭配'
      },
      {
        id: 'prod_5',
        _id: 'prod_5',
        imageUrl: '/images/banner5.jpeg',
        title: '✦ 桌架专区',
        subtitle: '多样款式，自由组合'
      }
    ];
  }

  /**
   * 🆕 为产品列表添加收藏状态
   * @param {Array} products - 产品列表
   * @returns {Array} 添加收藏状态后的产品列表
   */
  addFavoriteStatus(products) {
    if (!Array.isArray(products)) {
      return [];
    }

    // 获取收藏列表
    const favorites = wx.getStorageSync('favorites') || [];
    const favoriteIds = favorites.map(item => item._id);
    
    return products.map(product => ({
      ...product,
      isFavorite: favoriteIds.includes(product._id),
      // 🆕 确保图片数据格式兼容性：将 image 字段转换为 imageUrls 数组
      imageUrls: product.imageUrls || (product.image ? [product.image] : [])
    }));
  }

  /**
   * 🆕 从产品数据中提取分类信息
   * @param {Array} products - 产品列表
   * @returns {Array} 分类列表
   */
  extractCategoriesFromProducts(products) {
    const categoryMap = new Map();
    
    // 分类ID到名称的映射
    const categoryMapping = {
      'cat_wood_001': '原木经典',
      'cat_resin_001': '树脂美学',
      'cat_design_001': '玩趣设计',
      'cat_custom_001': '高定专属',
      'cat_frame_001': '桌架专区',
      // 兼容旧格式
      'cat_wood': '原木经典',
      'cat_resin': '树脂美学',
      'cat_design': '玩趣设计',
      'cat_custom': '高定专属',
      'cat_frame': '桌架专区'
    };

    products.forEach(product => {
      if (product.categoryId && product.isVisible !== false) {
        const categoryId = product.categoryId;
        const categoryName = product.categoryName || categoryMapping[categoryId] || categoryId;
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            _id: categoryId,
            id: categoryId,
            name: categoryName,
            description: this.getCategoryDescription(categoryName),
            imageUrl: this.getCategoryImageUrl(categoryName),
            productCount: 0
          });
        }
        
        const category = categoryMap.get(categoryId);
        category.productCount++;
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => {
      // 按预定义顺序排序
      const order = ['原木经典', '树脂美学', '玩趣设计', '高定专属', '桌架专区'];
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      } else if (indexA !== -1) {
        return -1;
      } else if (indexB !== -1) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }

  /**
   * 🆕 从视频URL创建features数组
   * @param {String} videoUrl - 视频URL（可能是临时URL或云存储URL）
   * @returns {Array} features数组
   */
  createFeaturesFromVideo(videoUrl) {
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      return [];
    }

    return [{
      type: 'video',
      title: '产品展示视频',
      description: '产品视频展示',
      video: videoUrl.trim(),
      poster: ''
    }];
  }

  /**
   * 🆕 获取分类描述
   * @param {String} categoryName - 分类名称
   * @returns {String} 分类描述
   */
  getCategoryDescription(categoryName) {
    const descriptions = {
      '原木经典': '精选优质实木，展现自然纹理之美',
      '树脂美学': '创新树脂工艺，打造晶莹剔透质感',
      '玩趣设计': '独特创意设计，为空间增添艺术气息',
      '高定专属': '精心定制的独特作品，每一件都是艺术品',
      '桌架专区': '多样化桌架选择，稳固实用美观'
    };
    return descriptions[categoryName] || '';
  }

  /**
   * 转换产品数据格式以确保显示一致性
   * @param {Array} products - 原始产品数据
   * @returns {Array} 转换后的产品数据
   */
  transformProductsForDisplay(products) {
    if (!Array.isArray(products)) {
      return [];
    }
    
    return products.map(product => {
      // 确保必要字段存在
      const transformed = {
        ...product,
        // 确保name字段存在（优先使用name，如果没有则使用title）
        name: product.name || product.title || '',
        // 确保description字段存在（支持多种字段名）
        description: product.description || product.brief || product.desc || '',
        // 确保imageUrls数组存在
        imageUrls: product.imageUrls || [],
        // 保持其他字段
        _id: product._id,
        price: product.price,
        categoryId: product.categoryId,
        isHot: product.isHot,
        isNew: product.isNew
      };
      
      return transformed;
    });
  }
}

// 创建单例实例
const productDataManager = new ProductDataManager();

// 导出单例实例
module.exports = productDataManager;