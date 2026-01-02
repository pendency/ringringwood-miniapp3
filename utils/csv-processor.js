/**
 * CSV处理器模块
 * 用于解析和处理产品数据CSV文件
 */

const fs = wx.getFileSystemManager();

const csvProcessor = {
  // 缓存的分类映射
  _categoryMapCache: null,
  _categoryMapCacheTime: 0,
  _categoryMapCacheTTL: 5 * 60 * 1000, // 5分钟缓存

  /**
   * 从数据库动态加载分类映射
   * @returns {Promise<Object>} 分类名称到ID的映射
   */
  async loadCategoryMap() {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (this._categoryMapCache && (now - this._categoryMapCacheTime) < this._categoryMapCacheTTL) {
      return this._categoryMapCache;
    }

    try {
      // 从云函数获取所有分类
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getCategories'
        }
      });

      if (result.result && result.result.success && result.result.data) {
        const categoryMap = {};
        
        // 构建分类名称到ID的映射
        result.result.data.forEach(category => {
          if (category.name && category._id) {
            categoryMap[category.name] = category._id;
          }
        });

        // 添加兼容旧分类名称的映射
        const legacyMappings = {
          '原木经典': 'cat_classic',
          '树脂美学': 'cat_resin',
          '玩趣设计': 'cat_fun',
          '高定专属': 'cat_custom'
        };

        // 合并旧映射（如果数据库中没有对应的分类）
        Object.keys(legacyMappings).forEach(oldName => {
          if (!categoryMap[oldName]) {
            categoryMap[oldName] = legacyMappings[oldName];
          }
        });

        // 更新缓存
        this._categoryMapCache = categoryMap;
        this._categoryMapCacheTime = now;

        console.log('[CSV处理器] 已加载分类映射:', categoryMap);
        return categoryMap;
      }
    } catch (error) {
      console.error('[CSV处理器] 加载分类映射失败:', error);
    }

    // 如果加载失败，返回默认映射
    return {
      '经典桌面款': 'cat_classic',
      '玩趣设计款': 'cat_fun',
      '树脂设计款': 'cat_resin',
      '树脂定制款': 'cat_custom',
      '桌架专区': 'cat_frame',
      '椅子专区': 'cat_chair',
      '原木经典': 'cat_classic',
      '树脂美学': 'cat_resin',
      '玩趣设计': 'cat_fun',
      '高定专属': 'cat_custom'
    };
  },

  /**
   * 清除分类映射缓存
   */
  clearCategoryMapCache() {
    this._categoryMapCache = null;
    this._categoryMapCacheTime = 0;
  },
  /**
   * 解析CSV文件
   * @param {string} filePath - CSV文件路径
   * @returns {Promise<{success: boolean, data: Array, warnings: Array, error?: string}>}
   */
  async parseCSV(filePath) {
    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          data: [],
          warnings: [],
          error: 'CSV文件为空'
        };
      }
      
      // 解析CSV内容
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return {
          success: false,
          data: [],
          warnings: [],
          error: 'CSV文件格式无效，至少需要标题行和一行数据'
        };
      }
      
      // 解析标题行
      const headers = this.parseCSVLine(lines[0]);
      
      // 动态加载分类映射
      const categoryMap = await this.loadCategoryMap();
      
      // 解析数据行
      const products = [];
      const warnings = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          
          if (values.length < 3) {
            warnings.push(`第${i + 1}行数据不完整，已跳过`);
            continue;
          }
          
          const product = {};
          for (let j = 0; j < headers.length; j++) {
            if (j < values.length) {
              product[headers[j].trim()] = values[j].trim();
            }
          }
          
          // 转换产品数据，传入动态加载的分类映射
          const transformedProduct = this.transformProduct(product, i + 1, warnings, categoryMap);
          if (transformedProduct) {
            products.push(transformedProduct);
          }
        } catch (lineError) {
          warnings.push(`第${i + 1}行解析失败: ${lineError.message}`);
        }
      }
      
      return {
        success: true,
        data: products,
        warnings: warnings
      };
    } catch (error) {
      console.error('CSV解析失败:', error);
      return {
        success: false,
        data: [],
        warnings: [],
        error: error.message
      };
    }
  },
  
  /**
   * 解析CSV行，处理引号和逗号
   * @param {string} line - CSV行内容
   * @returns {Array<string>}
   */
  parseCSVLine(line) {
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    values.push(currentValue);
    
    return values;
  },
  
  /**
   * 转换单个产品数据
   * @param {Object} rawProduct - 原始产品数据
   * @param {number} lineNumber - 行号
   * @param {Array} warnings - 警告数组
   * @param {Object} categoryMap - 分类映射（可选，如果不提供则使用默认映射）
   * @returns {Object|null}
   */
  transformProduct(rawProduct, lineNumber, warnings, categoryMap = null) {
    // 如果没有提供分类映射，使用默认映射
    const defaultCategoryMap = {
      '经典桌面款': 'cat_classic',
      '玩趣设计款': 'cat_fun',
      '树脂设计款': 'cat_resin',
      '树脂定制款': 'cat_custom',
      '桌架专区': 'cat_frame',
      '椅子专区': 'cat_chair',
      // 兼容旧的分类名称
      '原木经典': 'cat_classic',
      '树脂美学': 'cat_resin',
      '玩趣设计': 'cat_fun',
      '高定专属': 'cat_custom'
    };
    
    const effectiveCategoryMap = categoryMap || defaultCategoryMap;
    
    try {
      // 获取必填字段（支持中英文字段名）
      const productId = rawProduct['产品ID'] || rawProduct['productId'] || '';
      const title = rawProduct['产品名称'] || rawProduct['title'] || '';
      const categoryName = rawProduct['分类名称'] || rawProduct['categoryName'] || '';
      
      if (!productId || !title || !categoryName) {
        warnings.push(`第${lineNumber}行缺少必填字段（产品ID、产品名称或分类名称）`);
        return null;
      }
      
      // 获取分类ID
      let categoryId = effectiveCategoryMap[categoryName];
      if (!categoryId && categoryName.startsWith('cat_')) {
        categoryId = categoryName;
      }
      
      if (!categoryId) {
        warnings.push(`第${lineNumber}行分类"${categoryName}"未识别，使用默认分类`);
        categoryId = 'cat_wood';
      }
      
      // 处理图片路径 - 区分主图和详情图
      const mainImageUrl = rawProduct['主图URL'] || rawProduct['mainImageUrl'] || '';
      const detailImages = [];
      
      // 获取详情图 URL1-10
      for (let i = 1; i <= 10; i++) {
        const detailFieldCN = `详情图URL${i}`;
        const detailFieldEN = `detailImageUrl${i}`;
        // 兼容旧格式 图片URL1-10
        const oldFieldCN = `图片URL${i}`;
        const oldFieldEN = `imageUrl${i}`;
        const imagePath = rawProduct[detailFieldCN] || rawProduct[detailFieldEN] || rawProduct[oldFieldCN] || rawProduct[oldFieldEN] || '';
        
        if (imagePath && imagePath.trim()) {
          detailImages.push(imagePath.trim());
        }
      }
      
      // 构建 imageUrls（主图）和 images（详情图）
      const imageUrls = mainImageUrl && mainImageUrl.trim() ? [mainImageUrl.trim()] : [];
      // 如果没有主图但有详情图，使用第一张详情图作为主图
      if (imageUrls.length === 0 && detailImages.length > 0) {
        imageUrls.push(detailImages.shift());
      }
      
      // 处理视频
      let videoUrl = null;
      const videoField = rawProduct['视频URL'] || rawProduct['videoUrl'] || '';
      if (videoField && videoField.trim()) {
        videoUrl = videoField.trim();
      }
      
      // 转换布尔值
      const isHot = this.convertToBoolean(rawProduct['是否热门（是/否）'] || rawProduct['isHot']);
      const isNew = this.convertToBoolean(rawProduct['是否灵感上新（是/否）'] || rawProduct['isNew']);
      const isActive = this.convertToBoolean(rawProduct['是否显示（是/否）'] || rawProduct['isVisible']);
      
      // 处理价格
      let price = '联系销售';
      const priceField = rawProduct['价格（元）'] || rawProduct['price'] || '';
      if (priceField) {
        if (priceField === '联系销售' || priceField.toLowerCase() === 'consult') {
          price = '联系销售';
        } else {
          const parsedPrice = parseFloat(priceField);
          price = isNaN(parsedPrice) ? '联系销售' : parsedPrice;
        }
      }
      
      // 创建参数数组 - 支持多种参数字段名
      const params = [];
      
      // 规格/尺寸
      const specField = rawProduct['规格'] || rawProduct['尺寸'] || rawProduct['size'] || rawProduct['spec'] || '';
      if (specField) {
        params.push({ name: '规格', value: specField });
      }
      
      // 重量
      const weightField = rawProduct['重量'] || rawProduct['重量(约xxkg)'] || rawProduct['weight'] || '';
      if (weightField) {
        params.push({ name: '重量', value: weightField });
      }
      
      // 颜色
      const colorField = rawProduct['颜色'] || rawProduct['color'] || '';
      if (colorField) {
        params.push({ name: '颜色', value: colorField });
      }
      
      // 材质
      const materialField = rawProduct['材质'] || rawProduct['material'] || '';
      if (materialField) {
        params.push({ name: '材质', value: materialField });
      }
      
      // 适用场景
      const scenarioField = rawProduct['适用场景'] || rawProduct['applicationScenario'] || rawProduct['场景'] || '';
      if (scenarioField) {
        params.push({ name: '适用场景', value: scenarioField });
      }
      
      // 动态添加其他以"参数_"开头的字段
      Object.keys(rawProduct).forEach(key => {
        if (key.startsWith('参数_') && rawProduct[key] && rawProduct[key].trim()) {
          const paramName = key.replace('参数_', '');
          params.push({ name: paramName, value: rawProduct[key].trim() });
        }
      });
      
      // 处理产品特点
      const features = [];
      
      // 支持 产品特点1、产品特点2... 格式（每个特点作为标题）
      for (let i = 1; i <= 10; i++) {
        const featureField = rawProduct[`产品特点${i}`] || rawProduct[`feature${i}`] || '';
        if (featureField && featureField.trim()) {
          features.push({ title: featureField.trim(), description: '' });
        }
      }
      
      // 支持 特点_标题1 + 特点_描述1 格式（标题+描述配对）
      for (let i = 1; i <= 10; i++) {
        const titleField = rawProduct[`特点_标题${i}`] || rawProduct[`featureTitle${i}`] || '';
        const descField = rawProduct[`特点_描述${i}`] || rawProduct[`featureDesc${i}`] || '';
        if (titleField && titleField.trim()) {
          features.push({ 
            title: titleField.trim(), 
            description: descField ? descField.trim() : '' 
          });
        }
      }
      
      // 🆕 提取尺寸字段用于筛选功能 - Feature: category-filter-search
      // 支持多种字段名：规格、尺寸、size、spec
      const sizeValue = rawProduct['规格'] || rawProduct['尺寸'] || rawProduct['size'] || rawProduct['spec'] || '';
      
      // 构建转换后的产品对象
      const transformedProduct = {
        _id: productId,
        name: title,
        description: rawProduct['产品简介'] || rawProduct['description'] || '',
        price: price,
        originalPrice: price,
        categoryId: categoryId,
        imageUrls: imageUrls, // 主图数组
        images: detailImages, // 详情图数组
        video: videoUrl || '', // 视频URL
        videoUrl: videoUrl || '', // 兼容字段
        features: features, // 产品特点数组
        params: params,
        // 🆕 尺寸字段 - 用于筛选功能
        size: sizeValue, // 格式: "长*宽*高cm" 或 "长*宽cm"
        isHot: isHot,
        isNew: isNew,
        isRecommended: false,
        stock: 10,
        sales: 0,
        status: isActive ? 1 : 0,
        order: parseInt(rawProduct['排序优先级（数字，越小越靠前）'] || rawProduct['sortPriority']) || 999
      };
      
      return transformedProduct;
    } catch (error) {
      warnings.push(`第${lineNumber}行转换失败: ${error.message}`);
      return null;
    }
  },
  
  /**
   * 转换布尔值
   * @param {string} value - 原始值
   * @returns {boolean}
   */
  convertToBoolean(value) {
    if (!value) return false;
    const strValue = String(value).toLowerCase().trim();
    return strValue === '是' || strValue === 'true' || strValue === '1' || strValue === 'yes';
  },

  /**
   * 批量导入产品数据到云数据库
   * @param {Array} products - 产品数据数组
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<{success: number, failed: number, errors: Array}>}
   */
  async batchImport(products, onProgress) {
    const result = {
      success: 0,
      failed: 0,
      errors: []
    };

    if (!products || products.length === 0) {
      result.errors.push('没有可导入的产品数据');
      return result;
    }

    const total = products.length;
    const batchSize = 10; // 每批处理10条
    const batches = Math.ceil(total / batchSize);

    console.log(`开始批量导入，共 ${total} 条数据，分 ${batches} 批处理`);

    for (let batch = 0; batch < batches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, total);
      const batchProducts = products.slice(start, end);

      console.log(`处理第 ${batch + 1}/${batches} 批，产品 ${start + 1} - ${end}`);

      for (let i = 0; i < batchProducts.length; i++) {
        const product = batchProducts[i];
        const currentIndex = start + i + 1;

        try {
          // 准备产品数据，转换字段名以匹配云函数期望的格式
          const productData = {
            name: product.name,
            description: product.description || '',
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            categoryId: product.categoryId,
            imageUrls: product.imageUrls || [],
            images: product.images || [],
            video: product.video || product.videoUrl || '',
            videoUrl: product.videoUrl || product.video || '',
            features: product.features || [],
            params: product.params || [],
            // 🆕 尺寸字段 - 用于筛选功能 (Feature: category-filter-search)
            size: product.size || '',
            isHot: product.isHot || false,
            isNew: product.isNew || false,
            isRecommended: product.isRecommended || false,
            status: product.status !== undefined ? product.status : 1,
            order: product.order || 999
          };

          // 先尝试检查产品是否存在（通过 getProductById）
          let productExists = false;
          if (product._id) {
            try {
              const checkResult = await wx.cloud.callFunction({
                name: 'productManager',
                data: {
                  action: 'getProductById',
                  data: { id: product._id }
                }
              });
              productExists = checkResult.result && checkResult.result.success;
            } catch (checkError) {
              // 产品不存在，继续新增
              productExists = false;
            }
          }

          let saveResult;
          if (productExists) {
            // 产品存在，使用 updateProduct
            console.log(`📝 更新产品: ${product._id}`);
            saveResult = await wx.cloud.callFunction({
              name: 'productManager',
              data: {
                action: 'updateProduct',
                data: {
                  id: product._id,
                  ...productData
                }
              }
            });
          } else {
            // 产品不存在，使用 addProduct
            // 传递 CSV 中的产品ID，让云函数使用指定的ID
            console.log(`➕ 新增产品: ${product.name} (ID: ${product._id})`);
            saveResult = await wx.cloud.callFunction({
              name: 'productManager',
              data: {
                action: 'addProduct',
                data: {
                  ...productData,
                  customProductId: product._id // 传递自定义产品ID
                }
              }
            });
          }

          if (saveResult.result && saveResult.result.success) {
            result.success++;
            console.log(`✅ 产品 ${product._id || product.name} 导入成功`);
          } else {
            result.failed++;
            const errorMsg = saveResult.result?.error || '未知错误';
            result.errors.push(`产品 ${product._id || product.name}: ${errorMsg}`);
            console.error(`❌ 产品 ${product._id || product.name} 导入失败:`, errorMsg);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`产品 ${product._id || product.name}: ${error.message}`);
          console.error(`❌ 产品 ${product._id || product.name} 导入异常:`, error);
        }

        // 更新进度
        if (onProgress) {
          onProgress({
            current: currentIndex,
            total: total,
            batch: batch + 1,
            totalBatches: batches,
            percentage: Math.round((currentIndex / total) * 100)
          });
        }
      }

      // 批次间延迟，避免请求过快
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`批量导入完成，成功: ${result.success}，失败: ${result.failed}`);
    return result;
  },
  
  /**
   * 验证CSV文件格式
   * @param {string} filePath - CSV文件路径
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateCSV(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (!content || content.trim().length === 0) {
        return { valid: false, error: 'CSV文件为空' };
      }
      
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return { valid: false, error: '至少需要标题行和一行数据' };
      }
      
      const headers = this.parseCSVLine(lines[0]);
      
      // 检查必要的列
      const requiredColumns = ['产品ID', '产品名称', '分类名称'];
      const requiredColumnsEN = ['productId', 'title', 'categoryName'];
      
      const hasRequiredCN = requiredColumns.every(col => 
        headers.some(h => h.trim() === col)
      );
      
      const hasRequiredEN = requiredColumnsEN.every(col => 
        headers.some(h => h.trim() === col)
      );
      
      if (!hasRequiredCN && !hasRequiredEN) {
        return { 
          valid: false, 
          error: '缺少必要的列：产品ID、产品名称、分类名称' 
        };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
};

module.exports = csvProcessor;
