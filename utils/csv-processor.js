/**
 * CSV处理器模块
 * 用于解析和处理产品数据CSV文件
 */

const fs = wx.getFileSystemManager();

const csvProcessor = {
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
          
          // 转换产品数据
          const transformedProduct = this.transformProduct(product, i + 1, warnings);
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
   * @returns {Object|null}
   */
  transformProduct(rawProduct, lineNumber, warnings) {
    // 分类ID映射
    const categoryMap = {
      '原木经典': 'cat_wood',
      '树脂美学': 'cat_resin',
      '玩趣设计': 'cat_design',
      '高定专属': 'cat_custom',
      '桌架专区': 'cat_frame'
    };
    
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
      let categoryId = categoryMap[categoryName];
      if (!categoryId && categoryName.startsWith('cat_')) {
        categoryId = categoryName;
      }
      
      if (!categoryId) {
        warnings.push(`第${lineNumber}行分类"${categoryName}"未识别，使用默认分类`);
        categoryId = 'cat_wood';
      }
      
      // 处理图片路径
      const imageUrls = [];
      for (let i = 1; i <= 10; i++) {
        const imageFieldCN = `图片URL${i}`;
        const imageFieldEN = `imageUrl${i}`;
        const imagePath = rawProduct[imageFieldCN] || rawProduct[imageFieldEN] || '';
        
        if (imagePath && imagePath.trim()) {
          imageUrls.push(imagePath.trim());
        }
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
      let price = 'consult';
      const priceField = rawProduct['价格（元）'] || rawProduct['price'] || '';
      if (priceField && priceField !== '联系销售') {
        const parsedPrice = parseFloat(priceField);
        price = isNaN(parsedPrice) ? 'consult' : parsedPrice;
      }
      
      // 创建参数数组
      const params = [];
      
      const sizeField = rawProduct['尺寸'] || rawProduct['size'] || '';
      if (sizeField) {
        params.push({ name: '尺寸', value: sizeField });
      }
      
      const weightField = rawProduct['重量(约xxkg)'] || rawProduct['weight'] || '';
      if (weightField) {
        params.push({ name: '重量', value: weightField });
      }
      
      const colorField = rawProduct['颜色'] || rawProduct['color'] || '';
      if (colorField) {
        params.push({ name: '颜色', value: colorField });
      }
      
      const scenarioField = rawProduct['适用场景'] || rawProduct['applicationScenario'] || '';
      if (scenarioField) {
        params.push({ name: '适用场景', value: scenarioField });
      }
      
      // 构建转换后的产品对象
      const transformedProduct = {
        _id: productId,
        name: title,
        description: rawProduct['产品简介'] || rawProduct['description'] || '',
        price: price,
        originalPrice: price,
        categoryId: categoryId,
        imageUrls: imageUrls.length > 0 ? [imageUrls[0]] : [],
        images: imageUrls.slice(1),
        features: [],
        params: params,
        isHot: isHot,
        isNew: isNew,
        isRecommended: false,
        stock: 10,
        sales: 0,
        status: isActive ? 1 : 0,
        order: parseInt(rawProduct['排序优先级（数字，越小越靠前）'] || rawProduct['sortPriority']) || 999
      };
      
      // 如果有视频，添加到特性中
      if (videoUrl) {
        transformedProduct.features.push({
          title: '产品展示',
          video: videoUrl,
          description: '产品视频展示'
        });
      }
      
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
