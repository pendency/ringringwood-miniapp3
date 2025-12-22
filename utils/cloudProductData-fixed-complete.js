// utils/cloudProductData.js - 完整修复版本

class CloudProductData {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.tempUrlCache = new Map();
    this.tempUrlTimeout = 30 * 60 * 1000; // 临时URL缓存30分钟
  }

  /**
   * 🔧 修复点1: 获取产品数据（修复参数传递）
   */
  async getProducts(options = {}) {
    try {
      console.log('🔍 [cloudProductData] 开始获取产品数据...', options);
      
      const cacheKey = JSON.stringify(options);
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
        console.log('📦 [cloudProductData] 使用缓存的产品数据');
        return cached.data;
      }

      // 🔧 修复点2: 正确的参数传递结构
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProducts',
          data: {
            limit: options.limit || -1, // 默认获取所有数据
            includeHidden: options.includeHidden || false,
            categoryId: options.categoryId,
            isHot: options.isHot,
            isNew: options.isNew,
            isRecommended: options.isRecommended,
            keyword: options.keyword,
            page: options.page || 1
          }
        }
      });

      if (!result.result || !result.result.success) {
        throw new Error(result.result?.error || '获取产品数据失败');
      }

      const products = result.result.data || [];
      console.log(`✅ [cloudProductData] 从云数据库获取到 ${products.length} 条产品数据`);
      console.log('📊 [cloudProductData] 云函数返回结果:', {
        success: result.result.success,
        total: result.result.total,
        returned: result.result.returned,
        dataLength: products.length
      });

      // 数据规范化处理
      const normalizedProducts = this.normalizeProducts(products);
      console.log('🔄 [cloudProductData] 产品数据规范化完成');

      // 获取临时文件URL
      const productsWithTempUrls = await this.getTempFileUrls(normalizedProducts);
      console.log('🔗 [cloudProductData] 临时文件URL获取完成');

      // 🔧 修复点3: 移除重复筛选逻辑，直接使用云函数返回的数据
      const finalResult = {
        success: true,
        data: productsWithTempUrls,
        total: result.result.total,
        timestamp: Date.now()
      };

      // 缓存结果
      this.cache.set(cacheKey, {
        data: finalResult,
        timestamp: Date.now()
      });

      return finalResult;

    } catch (error) {
      console.error('❌ [cloudProductData] 获取产品数据失败:', error);
      
      // 显示用户友好的错误提示
      if (error.errMsg) {
        if (error.errMsg.includes('cloud function')) {
          wx.showToast({
            title: '数据服务暂时不可用',
            icon: 'none',
            duration: 3000
          });
        } else if (error.errMsg.includes('network')) {
          wx.showToast({
            title: '网络连接失败，请检查网络',
            icon: 'none',
            duration: 3000
          });
        }
      }

      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * 根据ID获取产品详情
   */
  async getProductById(id) {
    try {
      console.log('🔍 [cloudProductData] 获取产品详情:', id);
      
      // 🔧 修复点4: 正确的参数传递
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProductById',
          data: { id: id }
        }
      });
      
      if (!result.result || !result.result.success) {
        throw new Error(result.result?.error || '获取产品详情失败');
      }

      const product = result.result.data;
      if (product) {
        console.log('✅ [cloudProductData] 找到产品:', product.name || product.title);
        
        // 获取临时文件URL
        const productWithTempUrls = await this.getTempFileUrls([product]);
        
        return {
          success: true,
          data: productWithTempUrls[0] || product
        };
      }

      throw new Error('产品不存在');

    } catch (error) {
      console.error('❌ [cloudProductData] 获取产品详情失败:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * 数据规范化处理
   */
  normalizeProducts(products) {
    console.log('🔄 [cloudProductData] 开始产品数据规范化...');
    
    return products.map((product, index) => {
      try {
        const normalized = { ...product };

        // 布尔值规范化
        normalized.isHot = this.normalizeBoolean(product.isHot);
        normalized.isNew = this.normalizeBoolean(product.isNew);
        normalized.isVisible = this.normalizeBoolean(product.isVisible, true); // 默认可见

        // 数字规范化
        normalized.sortPriority = this.normalizeNumber(product.sortPriority, 999);
        
        if (product.price && typeof product.price === 'string' && !isNaN(parseFloat(product.price))) {
          normalized.price = parseFloat(product.price);
        }

        // 字符串规范化
        normalized.name = product.name || product.title || '';
        normalized.description = product.description || '';

        // 收集所有图片URL
        const imageUrls = [];
        for (let i = 1; i <= 10; i++) {
          const imageUrl = product[`imageUrl${i}`];
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
            imageUrls.push(this.cleanFileId(imageUrl.trim()));
          }
        }
        normalized.imageUrls = imageUrls;

        // 处理视频URL
        if (product.videoUrl && typeof product.videoUrl === 'string' && product.videoUrl.trim()) {
          normalized.videoUrl = this.cleanFileId(product.videoUrl.trim());
        }

        return normalized;

      } catch (error) {
        console.error(`❌ [cloudProductData] 规范化第 ${index + 1} 个产品时出错:`, error, product);
        return product; // 返回原始数据
      }
    });
  }

  /**
   * 布尔值规范化
   */
  normalizeBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const str = value.toLowerCase().trim();
      return str === 'true' || str === '是' || str === '1' || str === 'yes';
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    return defaultValue;
  }

  /**
   * 数字规范化
   */
  normalizeNumber(value, defaultValue = 0) {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  }

  /**
   * 清理文件ID（去除错误的前缀拼接）
   */
  cleanFileId(fileId) {
    if (!fileId || typeof fileId !== 'string') return fileId;

    // 去除多余的cloud://前缀
    let cleaned = fileId.trim();
    
    // 如果有多个cloud://前缀，只保留一个
    if (cleaned.indexOf('cloud://') !== cleaned.lastIndexOf('cloud://')) {
      const parts = cleaned.split('cloud://').filter(part => part.length > 0);
      if (parts.length > 0) {
        cleaned = 'cloud://' + parts[parts.length - 1];
      }
    }

    // 去除可能的空格和特殊字符
    cleaned = cleaned.replace(/\s+/g, '');

    return cleaned;
  }

  /**
   * 获取临时文件URL
   */
  async getTempFileUrls(products) {
    try {
      console.log('🔗 [cloudProductData] 开始获取临时文件URL...');
      
      // 收集所有需要获取临时URL的文件ID
      const allFileIds = new Set();
      
      products.forEach(product => {
        // 收集图片URL
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach(url => {
            if (url && url.startsWith('cloud://')) {
              allFileIds.add(url);
            }
          });
        }
        
        // 收集视频URL
        if (product.videoUrl && product.videoUrl.startsWith('cloud://')) {
          allFileIds.add(product.videoUrl);
        }
      });

      const fileIdsArray = Array.from(allFileIds);
      console.log(`🔗 [cloudProductData] 需要获取临时URL的文件数量: ${fileIdsArray.length}`);

      if (fileIdsArray.length === 0) {
        console.log('ℹ️ [cloudProductData] 没有需要获取临时URL的文件');
        return products;
      }

      // 分批获取临时URL（每批50个）
      const tempUrlMap = await this.batchGetTempFileUrls(fileIdsArray);
      console.log(`✅ [cloudProductData] 成功获取临时URL数量: ${Object.keys(tempUrlMap).size}`);

      // 将临时URL应用到产品数据
      const productsWithTempUrls = products.map(product => {
        const updatedProduct = { ...product };
        
        // 处理图片
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          updatedProduct.images = product.imageUrls
            .map(fileId => tempUrlMap[fileId])
            .filter(url => url); // 只保留成功获取到临时URL的图片
        } else {
          updatedProduct.images = [];
        }
        
        // 处理视频
        if (product.videoUrl && tempUrlMap[product.videoUrl]) {
          updatedProduct.videoUrlTemp = tempUrlMap[product.videoUrl];
        }

        return updatedProduct;
      });

      return productsWithTempUrls;

    } catch (error) {
      console.error('❌ [cloudProductData] 获取临时文件URL失败:', error);
      // 返回原始数据，但添加空的images数组
      return products.map(product => ({
        ...product,
        images: [],
        videoUrlTemp: null
      }));
    }
  }

  /**
   * 分批获取临时文件URL
   */
  async batchGetTempFileUrls(fileIds) {
    const tempUrlMap = {};
    const batchSize = 50; // 每批50个，避免接口限制
    
    console.log(`🔗 [cloudProductData] 开始分批获取临时URL，总数: ${fileIds.length}，批次大小: ${batchSize}`);

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`🔗 [cloudProductData] 处理第 ${batchNumber} 批，文件数: ${batch.length}`);

      try {
        const result = await wx.cloud.getTempFileURL({
          fileList: batch
        });

        if (result.fileList) {
          result.fileList.forEach(file => {
            if (file.status === 0 && file.tempFileURL) {
              tempUrlMap[file.fileID] = file.tempFileURL;
            } else {
              console.warn('⚠️ [cloudProductData] 获取临时URL失败:', file.fileID, file.errMsg);
            }
          });
        }

        console.log(`✅ [cloudProductData] 第 ${batchNumber} 批完成，成功: ${Object.keys(tempUrlMap).length}`);

        // 批次间延迟
        if (i + batchSize < fileIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`❌ [cloudProductData] 第 ${batchNumber} 批获取临时URL失败:`, error);
        
        // 显示用户友好的错误提示
        if (error.errMsg && error.errMsg.includes('permission denied')) {
          wx.showToast({
            title: '文件访问权限不足',
            icon: 'none',
            duration: 3000
          });
        }
      }
    }

    return tempUrlMap;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    this.tempUrlCache.clear();
    console.log('🗑️ [cloudProductData] 缓存已清除');
  }
}

// 创建单例
const cloudProductData = new CloudProductData();

export default cloudProductData;













