// utils/fix-product-data.js
// 产品数据修复工具 - 可在小程序环境中运行
// 作用：修复CSV数据导入中的图片路径、字段映射等问题

/**
 * 产品数据修复器
 * 专门用于修复从CSV导入的产品数据中的各种问题
 */
class ProductDataFixer {
  
  constructor() {
    // 配置参数
    this.config = {
      // 云存储基础路径配置
      cloudEnvId: 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968',
      imageBaseDir: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/',
      videoBaseDir: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/',
      defaultImage: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg',
      
      // 支持的图片格式
      supportedImageFormats: ['.jpg', '.jpeg', '.png', '.webp'],
      
      // 支持的视频格式
      supportedVideoFormats: ['.mp4', '.mov', '.avi', '.webm'],
      
      // 分类映射
      categoryMapping: {
        'cat_wood': 'cat_wood',
        'cat_resin': 'cat_resin', 
        'cat_design': 'cat_design',
        'cat_custom': 'cat_custom',
        'cat_frame': 'cat_frame'
      },
      
      // 布尔值映射
      booleanMapping: {
        '是': true,
        '否': false,
        'true': true,
        'false': false,
        '1': true,
        '0': false
      }
    };
  }

  /**
   * 修复图片路径
   * @param {string} imagePath - 原始图片路径
   * @returns {string} 修复后的图片路径（云存储路径）
   * 
   * 原理：
   * 1. 如果已经是云存储路径，直接返回
   * 2. 标准化路径分隔符（\ 转为 /）
   * 3. 提取文件名
   * 4. 构建云存储路径
   */
  fixImagePath(imagePath) {
    if (!imagePath || !imagePath.trim()) {
      return '';
    }

    try {
      // 如果已经是云存储路径，直接返回
      if (imagePath.startsWith('cloud://')) {
        return imagePath;
      }
      
      // 标准化路径分隔符
      let normalizedPath = imagePath.replace(/\\/g, '/');
      
      // 提取文件名
      const fileName = normalizedPath.split('/').pop();
      
      // 检查文件扩展名
      const hasValidExtension = this.config.supportedImageFormats.some(format => 
        fileName.toLowerCase().endsWith(format)
      );
      
      if (!hasValidExtension) {
        console.warn(`不支持的图片格式: ${fileName}`);
        return '';
      }

      // 构建云存储路径
      return this.config.imageBaseDir + fileName;

    } catch (error) {
      console.warn(`图片路径处理失败: ${imagePath} - ${error.message}`);
      return '';
    }
  }

  /**
   * 修复视频路径
   * @param {string} videoPath - 原始视频路径
   * @returns {string} 修复后的视频路径（云存储路径）
   */
  fixVideoPath(videoPath) {
    if (!videoPath || !videoPath.trim()) {
      return '';
    }

    try {
      // 如果已经是云存储路径，直接返回
      if (videoPath.startsWith('cloud://')) {
        return videoPath;
      }
      
      // 标准化路径分隔符
      let normalizedPath = videoPath.replace(/\\/g, '/');
      
      // 提取文件名
      const fileName = normalizedPath.split('/').pop();
      
      // 检查文件扩展名
      const hasValidExtension = this.config.supportedVideoFormats.some(format => 
        fileName.toLowerCase().endsWith(format)
      );
      
      if (!hasValidExtension) {
        console.warn(`不支持的视频格式: ${fileName}`);
        return '';
      }

      // 构建云存储路径
      return this.config.videoBaseDir + fileName;

    } catch (error) {
      console.warn(`视频路径处理失败: ${videoPath} - ${error.message}`);
      return '';
    }
  }

  /**
   * 转换布尔值
   * @param {string} value - 原始值
   * @returns {boolean} 转换后的布尔值
   */
  convertBoolean(value) {
    if (typeof value === 'boolean') return value;
    
    const normalizedValue = String(value).trim();
    return this.config.booleanMapping[normalizedValue] || false;
  }

  /**
   * 处理价格信息
   * @param {string} priceValue - 原始价格值
   * @returns {string} 处理后的价格
   */
  fixPrice(priceValue) {
    if (!priceValue || !priceValue.trim()) {
      return '联系销售';
    }

    const normalizedPrice = String(priceValue).trim();
    
    // 检查是否为联系销售类型的关键词
    const contactSalesKeywords = ['联系销售', '咨询价', '面议', '定制'];
    for (const keyword of contactSalesKeywords) {
      if (normalizedPrice.includes(keyword)) {
        return '联系销售';
      }
    }

    // 尝试解析为数字
    const numericPrice = parseFloat(normalizedPrice.replace(/[^\d.]/g, ''));
    if (!isNaN(numericPrice) && numericPrice > 0) {
      return numericPrice.toString();
    }

    // 默认返回联系销售
    return '联系销售';
  }

  /**
   * 修复单个产品数据
   * @param {Object} product - 原始产品数据
   * @returns {Object} 修复后的产品数据
   * 
   * 原理：
   * 1. 修复图片路径数组
   * 2. 修复视频路径
   * 3. 标准化所有字段
   * 4. 确保数据格式正确
   */
  fixSingleProduct(product) {
    try {
      // 修复图片路径
      const fixedImageUrls = [];
      const fixedImages = [];
      
      // 处理主图（imageUrls数组）
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        for (const imageUrl of product.imageUrls) {
          const fixedPath = this.fixImagePath(imageUrl);
          if (fixedPath) {
            fixedImageUrls.push(fixedPath);
          }
        }
      }
      
      // 处理详情图（images数组）
      if (product.images && Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          const fixedPath = this.fixImagePath(imageUrl);
          if (fixedPath) {
            fixedImages.push(fixedPath);
          }
        }
      }

      // 如果没有有效图片，使用默认图片
      if (fixedImageUrls.length === 0) {
        fixedImageUrls.push(this.config.defaultImage);
      }

      // 修复视频路径
      let fixedVideoUrl = '';
      if (product.features && Array.isArray(product.features)) {
        for (const feature of product.features) {
          if (feature.video) {
            fixedVideoUrl = this.fixVideoPath(feature.video);
            break;
          }
        }
      }

      // 修复特性数组
      const fixedFeatures = [];
      
      // 添加视频特性（如果有视频）
      if (fixedVideoUrl) {
        fixedFeatures.push({
          title: '产品展示',
          video: fixedVideoUrl,
          description: '产品视频展示',
          type: 'video'
        });
      }

      // 添加默认特性
      if (product.categoryId === 'cat_wood') {
        fixedFeatures.push(
          {
            title: '天然木纹',
            description: '每一块木板都有独特的纹理，展现自然年轮的美感',
            type: 'text'
          },
          {
            title: '环保材质',
            description: '全部采用环保材料，不含甲醛等有害物质',
            type: 'text'
          }
        );
      } else if (product.categoryId === 'cat_custom') {
        fixedFeatures.push(
          {
            title: '定制工艺',
            description: '精心定制的独特作品，每一件都是艺术品',
            type: 'text'
          },
          {
            title: '独一无二',
            description: '根据客户需求量身定制，独特设计',
            type: 'text'
          }
        );
      }

      // 确保参数数组格式正确
      const fixedParams = [];
      if (product.params && Array.isArray(product.params)) {
        for (const param of product.params) {
          if (param.name && param.value) {
            fixedParams.push({
              name: param.name,
              value: param.value
            });
          }
        }
      }

      // 返回修复后的产品数据
      return {
        ...product,
        imageUrls: fixedImageUrls,
        images: fixedImages,
        features: fixedFeatures,
        params: fixedParams,
        price: this.fixPrice(product.price),
        isHot: this.convertBoolean(product.isHot),
        isNew: this.convertBoolean(product.isNew),
        isRecommended: this.convertBoolean(product.isRecommended || false),
        status: product.status || 1,
        stock: product.stock || 10,
        sales: product.sales || 0
      };

    } catch (error) {
      console.error(`修复产品 ${product._id || '未知'} 时出错:`, error);
      return product; // 返回原始数据
    }
  }

  /**
   * 批量修复产品数据
   * @param {Array} products - 产品数组
   * @returns {Array} 修复后的产品数组
   */
  fixProducts(products) {
    if (!Array.isArray(products)) {
      console.error('输入的产品数据不是数组');
      return [];
    }

    console.log(`开始修复 ${products.length} 个产品的数据...`);
    
    const fixedProducts = [];
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const fixedProduct = this.fixSingleProduct(product);
        fixedProducts.push(fixedProduct);
        successCount++;
      } catch (error) {
        console.error(`修复产品失败:`, error);
        fixedProducts.push(product); // 保留原始数据
        errorCount++;
      }
    }

    console.log(`修复完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`);
    return fixedProducts;
  }

  /**
   * 验证修复结果
   * @param {Array} products - 修复后的产品数组
   * @returns {Object} 验证结果
   */
  validateFixedProducts(products) {
    const result = {
      totalProducts: products.length,
      validImages: 0,
      validVideos: 0,
      validParams: 0,
      issues: []
    };

    for (const product of products) {
      // 检查图片
      if (product.imageUrls && product.imageUrls.length > 0) {
        const hasValidImage = product.imageUrls.some(url => 
          url && url !== this.config.defaultImage
        );
        if (hasValidImage) {
          result.validImages++;
        } else {
          result.issues.push(`产品 ${product._id} 只有默认图片`);
        }
      }

      // 检查视频
      if (product.features && product.features.some(f => f.video)) {
        result.validVideos++;
      }

      // 检查参数
      if (product.params && product.params.length > 0) {
        result.validParams++;
      } else {
        result.issues.push(`产品 ${product._id} 缺少参数信息`);
      }
    }

    return result;
  }

  /**
   * 生成修复报告
   * @param {Object} validationResult - 验证结果
   * @returns {string} 格式化的报告
   */
  generateFixReport(validationResult) {
    const report = [
      '=== 产品数据修复报告 ===',
      `修复时间: ${new Date().toLocaleString()}`,
      '',
      '修复统计:',
      `- 总产品数: ${validationResult.totalProducts}`,
      `- 有效图片: ${validationResult.validImages}`,
      `- 包含视频: ${validationResult.validVideos}`,
      `- 包含参数: ${validationResult.validParams}`,
      `- 发现问题: ${validationResult.issues.length}`,
      ''
    ];

    if (validationResult.issues.length > 0) {
      report.push('问题详情:');
      validationResult.issues.slice(0, 10).forEach(issue => {
        report.push(`- ${issue}`);
      });
      
      if (validationResult.issues.length > 10) {
        report.push(`... 还有 ${validationResult.issues.length - 10} 个问题`);
      }
    }

    return report.join('\n');
  }
}

// 导出修复器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductDataFixer;
} else {
  // 在浏览器环境中，将类添加到全局对象
  window.ProductDataFixer = ProductDataFixer;
}
