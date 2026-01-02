// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 分类ID到中文名称的映射
const categoryMapping = {
  'cat_classic': '经典桌面款',
  'cat_fun': '玩趣设计款',
  'cat_resin': '树脂设计款',
  'cat_custom': '树脂定制款',
  'cat_frame': '桌架专区',
  'cat_chair': '椅子专区',
  // 旧分类ID映射（兼容）
  'cat_wood': '经典桌面款',
  'cat_design': '玩趣设计款',
  '8f6c3a63694e9d8a096b05cc732a6a58': '椅子专区'
};

// 🆕 分类ID到产品ID前缀的映射
const categoryIdPrefixMapping = {
  'cat_classic': 'classic',
  'cat_fun': 'fun',
  'cat_resin': 'resin',
  'cat_custom': 'custom',
  'cat_frame': 'frame',
  'cat_chair': 'chair'
};

// 🆕 旧分类ID到新分类ID的映射（用于数据迁移）
const oldToNewCategoryMapping = {
  // 新格式（带 cat_ 前缀）
  'cat_wood': 'cat_classic',      // 经典桌面款
  'cat_design': 'cat_fun',        // 玩趣设计款
  'cat_resin': 'cat_resin',       // 树脂设计款
  'cat_custom': 'cat_custom',     // 树脂定制款
  'cat_frame': 'cat_frame',       // 桌架专区
  'cat_chair': 'cat_chair',       // 椅子专区
  // 旧格式（不带 cat_ 前缀）
  'wood': 'cat_classic',          // 经典桌面款
  'design': 'cat_fun',            // 玩趣设计款
  'resin': 'cat_resin',           // 树脂设计款
  'custom': 'cat_custom',         // 树脂定制款
  'frame': 'cat_frame',           // 桌架专区
  'chair': 'cat_chair',           // 椅子专区
  'other': 'cat_chair',           // 椅子专区（旧名称 other）
  // 哈希ID
  '8f6c3a63694e9d8a096b05cc732a6a58': 'cat_chair'  // 椅子专区（旧哈希ID）
};

// 🆕 获取分类对应的ID前缀（支持新旧分类ID）
function getCategoryPrefix(categoryId) {
  // 如果是旧分类ID，先转换为新分类ID
  const newCategoryId = oldToNewCategoryMapping[categoryId] || categoryId;
  return categoryIdPrefixMapping[newCategoryId] || 'prod';
}

// 🆕 生成规范化的产品ID
async function generateProductId(categoryId) {
  const prefix = categoryIdPrefixMapping[categoryId] || 'prod';
  
  try {
    // 查询该分类下所有产品，找出最大序号
    const result = await db.collection('products')
      .where({
        categoryName: categoryId
      })
      .field({ _id: true })
      .limit(1000)
      .get();
    
    let maxNumber = 0;
    
    if (result.data && result.data.length > 0) {
      // 遍历所有产品ID，提取数字部分找最大值
      result.data.forEach(item => {
        const id = item._id;
        // 匹配ID末尾的数字
        const match = id.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }
    
    return `${prefix}${maxNumber + 1}`;
  } catch (error) {
    console.error('生成产品ID失败:', error);
    // 如果查询失败，使用时间戳作为后备方案
    return `${prefix}${Date.now()}`;
  }
}

// 🆕 生成规范化的轮播图ID
// Requirements: 2.2 - Banner ID format: banner_{number}
async function generateBannerId() {
  try {
    const result = await db.collection('banners')
      .field({ _id: true })
      .limit(100)
      .get();
    
    let maxNumber = 0;
    
    if (result.data && result.data.length > 0) {
      result.data.forEach(item => {
        const id = item._id;
        // 匹配 banner_{number} 或 banner{number} 格式
        const match = id.match(/banner_?(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }
    
    // 返回规范化格式: banner_{number}
    return `banner_${maxNumber + 1}`;
  } catch (error) {
    console.error('生成轮播图ID失败:', error);
    return `banner_${Date.now()}`;
  }
}

// 🆕 生成规范化的案例ID
// Requirements: 3.2 - Case ID format: custom{number}
async function generateCaseId() {
  try {
    const result = await db.collection('cases')
      .field({ _id: true })
      .limit(100)
      .get();
    
    let maxNumber = 0;
    
    if (result.data && result.data.length > 0) {
      result.data.forEach(item => {
        const id = item._id;
        // 匹配 custom{number} 格式
        const match = id.match(/^custom(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }
    
    // 返回规范化格式: custom{number}
    return `custom${maxNumber + 1}`;
  } catch (error) {
    console.error('生成案例ID失败:', error);
    return `custom${Date.now()}`;
  }
}

// 🆕 验证轮播图数据
// Requirements: 2.1 - Banner data validation
function validateBannerData(data) {
  const errors = [];

  // 验证必填字段：image
  if (!data || !data.image || typeof data.image !== 'string' || data.image.trim() === '') {
    errors.push('图片地址(image)不能为空');
  }

  // 验证 order 字段（如果提供）
  if (data && data.order !== undefined && data.order !== null) {
    if (typeof data.order !== 'number' || !Number.isInteger(data.order) || data.order < 0) {
      errors.push('排序权重(order)必须是非负整数');
    }
  }

  // 验证 status 字段（如果提供）
  if (data && data.status !== undefined && data.status !== null) {
    if (data.status !== 0 && data.status !== 1) {
      errors.push('状态(status)必须是0或1');
    }
  }

  // 验证 productId 字段（如果提供且非空）
  if (data && data.productId !== undefined && data.productId !== null && data.productId !== '') {
    if (!validateProductIdFormat(data.productId)) {
      errors.push('产品ID(productId)格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 🆕 验证产品ID格式
// Requirements: 7.3 - Product ID validation
function validateProductIdFormat(productId) {
  // 空字符串或 undefined/null 视为有效（productId 是可选的）
  if (productId === undefined || productId === null || productId === '') {
    return true;
  }

  // 必须是字符串
  if (typeof productId !== 'string') {
    return false;
  }

  // 产品ID格式：字母数字、下划线、连字符组成，长度1-100
  const productIdPattern = /^[a-zA-Z0-9_-]+$/;
  return productIdPattern.test(productId) && productId.length >= 1 && productId.length <= 100;
}

// 🆕 验证案例数据
// Requirements: 3.1 - Case data validation
function validateCaseData(data) {
  const errors = [];

  // 验证必填字段：title
  if (!data || !data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('案例标题(title)不能为空');
  }

  // 验证 description 字段（如果提供）
  if (data && data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('案例描述(description)必须是字符串');
    }
  }

  // 验证 imageUrl 字段（如果提供且非空）
  if (data && data.imageUrl !== undefined && data.imageUrl !== null && data.imageUrl !== '') {
    if (typeof data.imageUrl !== 'string') {
      errors.push('图片地址(imageUrl)必须是字符串');
    }
  }

  // 验证 order 字段（如果提供）
  if (data && data.order !== undefined && data.order !== null) {
    if (typeof data.order !== 'number' || !Number.isInteger(data.order) || data.order < 0) {
      errors.push('排序权重(order)必须是非负整数');
    }
  }

  // 验证 status 字段（如果提供）
  if (data && data.status !== undefined && data.status !== null) {
    if (data.status !== 0 && data.status !== 1) {
      errors.push('状态(status)必须是0或1');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 转换本地路径为云存储路径
function convertToCloudPath(path) {
  if (!path || typeof path !== 'string') {
    return '';
  }
  
  // 如果已经是云存储路径，直接返回
  if (path.startsWith('cloud://')) {
    return path;
  }
  
  // 🔧 修复：处理各种本地路径格式
  let fileName = '';
  
  // 处理包含 images\products\ 或 images/products/ 的路径
  if (path.includes('images\\products\\') || path.includes('images/products/')) {
    fileName = path.split(/[\\\/]/).pop();
  }
  // 处理直接的文件名（可能包含路径分隔符）
  else if (path.includes('\\') || path.includes('/')) {
    fileName = path.split(/[\\\/]/).pop();
  }
  // 处理纯文件名
  else {
    fileName = path;
  }
  
  // 如果提取到了文件名，转换为云存储路径
  if (fileName && fileName.trim() !== '') {
    // 🔧 修复：根据文件扩展名判断是视频还是图片
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.mov') || 
        lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.webm')) {
      // 🆕 视频文件需要添加 custom/ 子目录
      return `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/${fileName}`;
    } else {
      // 默认作为图片处理
      return `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/${fileName}`;
    }
  }
  
  // 如果是HTTP URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  
  return path;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data = {} } = event;
  const debugMode = true; // 开启调试模式，方便日志排查

  try {
    if (action === 'getProducts') {
      let {
        limit = 100,
        page = 1,
        pageSize,
        categoryId, 
        isHot, 
        isNew,
        isRecommended,
        includeHidden = false
      } = data;

      // 支持 pageSize 参数（优先级高于 limit）
      const effectiveLimit = pageSize !== undefined ? pageSize : limit;

      // 构建查询条件
      const where = {};

      // 分类筛选 - 支持 categoryId 参数
      if (categoryId) {
        where.categoryName = categoryId;
      }

      // isHot 筛选 - 支持布尔值和字符串类型
      if (isHot !== undefined) {
        if (typeof isHot === 'boolean') {
          where.isHot = isHot ? "TRUE" : "FALSE";
        } else if (typeof isHot === 'string') {
          where.isHot = isHot;
        }
      }

      // isNew 筛选 - Requirements 7.4
      if (isNew !== undefined) {
        if (typeof isNew === 'boolean') {
          where.isNew = isNew ? "TRUE" : "FALSE";
        } else if (typeof isNew === 'string') {
          where.isNew = isNew;
        }
      }

      // isRecommended 筛选 - Requirements 7.4
      if (isRecommended !== undefined) {
        if (typeof isRecommended === 'boolean') {
          where.isRecommended = isRecommended ? "TRUE" : "FALSE";
        } else if (typeof isRecommended === 'string') {
          where.isRecommended = isRecommended;
        }
      }

      // 状态筛选 - Requirements 9.1, 9.2
      // 注意：数据库中可能有些产品没有status字段，默认视为上架(status=1)
      if (data.status !== undefined && data.status !== null && data.status !== '') {
        const _ = db.command;
        if (data.status === 1) {
          // 查询上架产品：status=1 或 status字段不存在
          where.status = _.eq(1).or(_.exists(false));
        } else if (data.status === 0) {
          // 查询下架产品：status=0
          where.status = 0;
        }
      }

      // 可见性筛选
      if (!includeHidden) {
        if (!debugMode) {
          where.isVisible = true;
        }
      }

      if (debugMode) console.log('🔹 查询条件:', where);

      // 处理 limit=-1 获取全部数据
      const queryLimit = effectiveLimit === -1 ? 1000 : effectiveLimit;
      const skipCount = effectiveLimit === -1 ? 0 : (page - 1) * effectiveLimit;

      const collection = db.collection('products');
      const queryResult = await collection
        .where(where)
        .orderBy('order', 'asc')  // 🆕 按排序权重升序排列
        .orderBy('createTime', 'desc')  // 🆕 相同排序权重时按创建时间降序
        .skip(skipCount)
        .limit(queryLimit)
        .get();

      if (debugMode) console.log('🔹 原始数据条数:', queryResult.data.length);

      // 🔹 打印样本数据用于调试
      if (debugMode && queryResult.data.length > 0) {
        console.log('🔹 样本原始数据:', queryResult.data[0]);
        console.log('🔹 样本数据字段:', Object.keys(queryResult.data[0]));
      }

      // 数据字段映射（根据诊断结果优化）
      const formattedData = queryResult.data.map(item => {
        // 🔧 修复：正确处理价格字段，支持字符串类型的价格（如"联系销售"）
        let price = '';
        if (item.price !== null && item.price !== undefined) {
          // 如果是字符串类型的价格（如"联系销售"），直接使用
          if (typeof item.price === 'string' && isNaN(Number(item.price))) {
            price = item.price;
          } else {
            price = Number(item.price);
          }
        }
        else if (item.productPrice) price = Number(item.productPrice);
        else if (item.salePrice) price = Number(item.salePrice);
        else if (item.originalPrice) price = Number(item.originalPrice);
        else if (item.cost) price = Number(item.cost);
        else if (item.amount) price = Number(item.amount);
        else price = 0;

        // 处理分类字段映射
        let categoryId = '';
        let categoryName = '';
        
        // 数据库中categoryName字段存储的是categoryId(如cat_wood)
        if (item.categoryName) {
          categoryId = item.categoryName; // cat_wood
          categoryName = categoryMapping[item.categoryName] || item.categoryName; // 原木经典
        } else if (item.categoryId) {
          categoryId = item.categoryId;
          categoryName = categoryMapping[item.categoryId] || item.categoryId;
        }

                return {
          _id: item._id,
          id: item._id,
          name: item.title || item.name || item.productName || '未知产品',
          price: price,
          // 🔧 修复：优先使用 imageUrls 数组，回退到 imageUrl1 等字段
          image: (item.imageUrls && item.imageUrls[0]) || item.imageUrl1 || item.image || item.mainImage || item.imageUrl || '',
          imageUrls: (item.imageUrls && item.imageUrls.length > 0) 
            ? item.imageUrls.filter(Boolean) 
            : [item.imageUrl1 || item.image || item.mainImage || item.imageUrl || ''].filter(Boolean),
          // 🆕 产品视频URL
          videoUrl: item.videoUrl || item.video || '',
          categoryId: categoryId,
          categoryName: categoryName,
          // 标签字段 - Requirements 7.4
          isHot: item.isHot === true || item.isHot === 'TRUE' || item.isHot === '是',
          isNew: item.isNew === true || item.isNew === 'TRUE' || item.isNew === '是',
          isRecommended: item.isRecommended === true || item.isRecommended === 'TRUE' || item.isRecommended === '是',
          isVisible: !!item.isVisible,
          includeHidden: !!item.includeHidden,
          // 状态字段 - Requirements 9.1, 9.2
          status: item.status !== undefined ? item.status : 1,
          // 🆕 排序权重字段
          order: item.order !== undefined ? item.order : 999,
          // 🆕 产品参数字段
          size: item.size || '',
          weight: item.weight || '',
          color: item.color || '',
          applicationScenario: item.applicationScenario || '',
          // 🆕 产品规格参数数组 - 用于筛选功能 (Feature: category-filter-search)
          params: item.params || [],
          // 🆕 创建时间 - 用于排序功能 (Feature: category-filter-search)
          createTime: item.createTime || null,
          // 添加原始数据用于调试
          _originalData: debugMode ? item : undefined
        };
      });

      // 检查字段问题（统计而不是逐个列举）
      const fieldIssues = [];
      let missingNameCount = 0;
      let missingImageCount = 0;
      let zeroPriceCount = 0;
      let missingCategoryCount = 0;

      formattedData.forEach(item => {
        if (!item.name || item.name === '未知产品') missingNameCount++;
        if (!item.image) missingImageCount++;
        if (item.price === 0) zeroPriceCount++;
        if (!item.categoryId) missingCategoryCount++;
      });

      if (missingNameCount > 0) fieldIssues.push(`${missingNameCount}个产品缺少 name 字段`);
      if (missingImageCount > 0) fieldIssues.push(`${missingImageCount}个产品缺少 image 字段`);
      if (zeroPriceCount > 0) fieldIssues.push(`${zeroPriceCount}个产品 price 为 0`);
      if (missingCategoryCount > 0) fieldIssues.push(`${missingCategoryCount}个产品缺少 categoryId`);

      if (debugMode) {
        console.log('🔹 字段问题统计:', {
          missingNameCount,
          missingImageCount,
          zeroPriceCount,
          missingCategoryCount
        });
      }

      // 🔹 详细检查返回数据结构 - 特别关注 image 字段
      if (debugMode && formattedData.length > 0) {
        console.log('🔹 === 返回数据结构检查 ===');
        
        // 检查前3个产品的完整数据结构
        const sampleCount = Math.min(3, formattedData.length);
        for (let i = 0; i < sampleCount; i++) {
          const product = formattedData[i];
          console.log(`🔹 产品 ${i + 1} 完整数据:`, product);
          
          // 特别检查 image 字段
          console.log(`🔹 产品 ${i + 1} image 字段详情:`, {
            hasImageField: 'image' in product,
            imageValue: product.image,
            imageType: typeof product.image,
            imageLength: product.image ? product.image.length : 0,
            isFileID: product.image ? product.image.startsWith('cloud://') : false,
            isHttpsUrl: product.image ? product.image.startsWith('https://') : false
          });
          
          // 检查原始数据中的图片字段
          if (product._originalData) {
            const original = product._originalData;
            console.log(`🔹 产品 ${i + 1} 原始图片字段:`, {
              imageUrl1: original.imageUrl1,
              image: original.image,
              mainImage: original.mainImage,
              imageUrl: original.imageUrl,
              hasAnyImageField: !!(original.imageUrl1 || original.image || original.mainImage || original.imageUrl)
            });
          }
        }
        
        // 统计所有产品的 image 字段情况
        const imageStats = {
          totalProducts: formattedData.length,
          hasImageField: 0,
          hasImageValue: 0,
          fileIDCount: 0,
          httpsUrlCount: 0,
          emptyImageCount: 0
        };
        
        formattedData.forEach(product => {
          if ('image' in product) imageStats.hasImageField++;
          if (product.image) {
            imageStats.hasImageValue++;
            if (product.image.startsWith('cloud://')) imageStats.fileIDCount++;
            else if (product.image.startsWith('https://')) imageStats.httpsUrlCount++;
          } else {
            imageStats.emptyImageCount++;
          }
        });
        
        console.log('🔹 所有产品 image 字段统计:', imageStats);
        
        // 检查数据丢失情况
        if (imageStats.emptyImageCount > 0) {
          console.log('⚠️  检测到图片字段丢失，追踪数据来源...');
          
          // 检查原始数据库查询结果
          if (queryResult.data.length > 0) {
            const rawSample = queryResult.data[0];
            console.log('🔹 原始数据库记录的图片相关字段:', {
              imageUrl1: rawSample.imageUrl1,
              image: rawSample.image,
              mainImage: rawSample.mainImage,
              imageUrl: rawSample.imageUrl,
              allFields: Object.keys(rawSample).filter(key => 
                key.toLowerCase().includes('image') || 
                key.toLowerCase().includes('pic') || 
                key.toLowerCase().includes('photo')
              )
            });
          }
        }
        
        console.log('🔹 === 返回数据结构检查完成 ===');
      }
    
    return {
      success: true,
        total: queryResult.data.length,
        data: formattedData,
        // 分页信息 - Requirements 7.3
        page: page,
        pageSize: effectiveLimit,
        hasMore: effectiveLimit !== -1 && formattedData.length === effectiveLimit,
        debug: {
          queryCondition: where,
          rawDataCount: queryResult.data.length,
          fieldIssues
        }
      };
    }

    // 根据ID获取单个产品详情
    if (action === 'getProductById') {
      if (debugMode) {
        console.log('🔹 getProductById 参数调试:');
        console.log('  - event:', event);
        console.log('  - data:', data);
        console.log('  - data.id:', data.id);
        console.log('  - event.id:', event.id);
      }
      
      // 支持多种参数传递方式
      const productId = data.id || event.id;
      
      if (!productId) {
        return {
          success: false,
          error: 'ID参数为空'
        };
      }

      if (debugMode) console.log('🔹 查询产品ID:', productId);

      const collection = db.collection('products');
      const queryResult = await collection.doc(productId).get();

      if (!queryResult.data) {
        return {
          success: false,
          error: '产品不存在'
        };
      }

      const item = queryResult.data;
      if (debugMode) console.log('🔹 原始产品数据:', item);

      // 🔧 修复：正确处理价格字段，支持字符串类型的价格（如"联系销售"）
      let price = '';
      if (item.price !== null && item.price !== undefined) {
        // 如果是字符串类型的价格（如"联系销售"），直接使用
        if (typeof item.price === 'string' && isNaN(Number(item.price))) {
          price = item.price;
        } else {
          price = Number(item.price);
        }
      }
      else if (item.productPrice) price = Number(item.productPrice);
      else if (item.salePrice) price = Number(item.salePrice);
      else if (item.originalPrice) price = Number(item.originalPrice);
      else price = 0;

      // 处理分类字段
      let categoryId = '';
      let categoryName = '';
      
      if (item.categoryName) {
        categoryId = item.categoryName;
        categoryName = categoryMapping[item.categoryName] || item.categoryName;
      } else if (item.categoryId) {
        categoryId = item.categoryId;
        categoryName = categoryMapping[item.categoryId] || item.categoryId;
      }

      // 🔧 修复：构建图片数组 - 区分主图和详情图
      // 1. 首先从 imageUrls 数组获取主图（新增产品保存的格式）
      let mainImages = []; // 主图数组
      let detailImages = []; // 详情图数组
      
      if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
        mainImages = item.imageUrls.filter(url => url && url.trim());
      } else {
        // 回退到 imageUrl1 字段（旧数据格式）- 只取第一张作为主图
        if (item.imageUrl1 && item.imageUrl1.trim()) {
          mainImages.push(item.imageUrl1);
        }
      }
      
      // 2. 获取详情图
      // 优先从 images 数组获取
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        detailImages = item.images.filter(url => url && url.trim());
      }
      
      // 如果 images 数组为空，回退到 imageUrl2-10 字段（旧数据格式）
      if (detailImages.length === 0) {
        for (let i = 2; i <= 10; i++) {
          const imageField = `imageUrl${i}`;
          if (item[imageField] && item[imageField].trim()) {
            detailImages.push(item[imageField]);
          }
        }
      }
      
      // 3. 合并主图和详情图用于轮播展示（避免重复）
      const allImages = [...mainImages];
      const existingUrls = new Set(mainImages);
      detailImages.forEach(url => {
        if (url && url.trim() && !existingUrls.has(url.trim())) {
          allImages.push(url.trim());
        }
      });

      // 处理视频字段 - 支持多种字段名
      const rawVideoUrl = item.video || item.videoUrl || item.vediourl || '';
      const convertedVideoUrl = convertToCloudPath(rawVideoUrl);
      
      if (debugMode) {
        console.log('🔹 视频字段处理:', {
          originalVideo: item.video,
          originalVideoUrl: item.videoUrl,
          originalVediourl: item.vediourl,
          rawVideoUrl: rawVideoUrl,
          convertedVideoUrl: convertedVideoUrl,
          isConversionWorking: rawVideoUrl !== convertedVideoUrl
        });
      }

      const formattedProduct = {
        _id: item._id,
        id: item._id,
        name: item.title || item.name || item.productName || '未知产品',
        price: price,
        description: item.description || item.desc || '',
        categoryId: categoryId,
        categoryName: categoryName,
        images: allImages, // 所有图片（主图+详情图，用于轮播）
        detailImages: detailImages, // 只有详情图（用于详情图展示栏）
        video: convertedVideoUrl || '',
        videoUrl: convertedVideoUrl || '',
        // 🆕 产品特点和参数字段
        features: item.features || [],
        params: item.params || [],
        // 标签字段 - Requirements 7.4
        isHot: item.isHot === true || item.isHot === 'TRUE' || item.isHot === '是',
        isNew: item.isNew === true || item.isNew === 'TRUE' || item.isNew === '是',
        isRecommended: item.isRecommended === true || item.isRecommended === 'TRUE' || item.isRecommended === '是',
        isVisible: !!item.isVisible,
        // 🆕 产品参数字段
        size: item.size || '',
        weight: item.weight || '',
        color: item.color || '',
        applicationScenario: item.applicationScenario || '',
        // 添加原始数据用于调试
        _originalData: debugMode ? item : undefined
      };

      if (debugMode) {
        console.log('🔹 格式化后的产品数据:', formattedProduct);
        console.log('🔹 产品参数字段:', {
          size: formattedProduct.size,
          weight: formattedProduct.weight,
          color: formattedProduct.color,
          applicationScenario: formattedProduct.applicationScenario
        });
      }

      return {
        success: true,
        data: formattedProduct
      };
    }

    // 测试数据库连接
    if (action === 'testConnection') {
      const count = await db.collection('products').count();
      return {
        success: true,
        message: '数据库连接正常',
        total: count.total
      };
    }

    // 新增产品 - Requirements 6.4
    if (action === 'addProduct') {
      const product = data;
      
      if (debugMode) console.log('🔹 addProduct 参数:', product);

      // 数据验证
      const validationResult = validateProductData(product);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.errors.join('; ')
        };
      }

      const collection = db.collection('products');

      // 🆕 支持自定义产品ID（用于CSV导入）
      let productId;
      if (product.customProductId && product.customProductId.trim()) {
        // 使用CSV中指定的产品ID
        productId = product.customProductId.trim();
        if (debugMode) console.log('🔹 使用自定义产品ID:', productId);
        
        // 检查ID是否已存在
        try {
          const existingProduct = await collection.doc(productId).get();
          if (existingProduct.data) {
            return {
              success: false,
              error: `产品ID "${productId}" 已存在`
            };
          }
        } catch (err) {
          // 产品不存在，可以继续创建
        }
      } else {
        // 自动生成规范化的产品ID
        productId = await generateProductId(product.categoryId);
        if (debugMode) console.log('🔹 生成的产品ID:', productId);
      }

      // 构建产品数据
      const productData = {
        _id: productId, // 使用指定或生成的ID
        name: product.name ? product.name.trim() : '',
        title: product.name ? product.name.trim() : '', // 兼容旧字段
        description: product.description || '',
        price: product.price !== undefined ? product.price : 0,
        originalPrice: product.originalPrice !== undefined ? product.originalPrice : 0,
        categoryName: product.categoryId, // 数据库中使用 categoryName 存储分类ID
        imageUrl1: product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : '',
        imageUrls: product.imageUrls || [],
        images: product.images || [],
        video: product.video || product.videoUrl || '', // 视频URL
        videoUrl: product.videoUrl || product.video || '', // 兼容字段
        features: product.features || [],
        params: product.params || [],
        // 🆕 尺寸字段 - 用于筛选功能 (Feature: category-filter-search)
        size: product.size || '',
        isHot: product.isHot === true ? 'TRUE' : 'FALSE',
        isNew: product.isNew === true ? 'TRUE' : 'FALSE',
        isRecommended: product.isRecommended === true ? 'TRUE' : 'FALSE',
        isVisible: true,
        status: product.status !== undefined ? product.status : 1,
        order: product.order !== undefined ? product.order : 999,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      // 处理额外的图片字段 (imageUrl2-10)
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        for (let i = 1; i < Math.min(product.imageUrls.length, 10); i++) {
          productData[`imageUrl${i + 1}`] = product.imageUrls[i] || '';
        }
      }

      const result = await collection.add({
        data: productData
      });

      if (debugMode) console.log('🔹 addProduct 结果:', result);

      return {
        success: true,
        id: productId // 🆕 返回规范化ID
      };
    }

    // 更新产品 - Requirements 7.4
    if (action === 'updateProduct') {
      const { id, ...productData } = data;
      
      if (debugMode) console.log('🔹 updateProduct 参数:', { id, productData });

      if (!id) {
        return {
          success: false,
          error: '产品ID不能为空'
        };
      }

      // 数据验证
      const validationResult = validateProductData(productData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.errors.join('; ')
        };
      }

      const collection = db.collection('products');

      // 检查产品是否存在
      try {
        const existingProduct = await collection.doc(id).get();
        if (!existingProduct.data) {
          return {
            success: false,
            error: '产品不存在'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: '产品不存在'
        };
      }

      // 构建更新数据
      const updateData = {
        updateTime: db.serverDate()
      };

      if (productData.name !== undefined) {
        updateData.name = productData.name.trim();
        updateData.title = productData.name.trim(); // 兼容旧字段
      }
      if (productData.description !== undefined) {
        updateData.description = productData.description;
      }
      if (productData.price !== undefined) {
        updateData.price = productData.price;
      }
      if (productData.originalPrice !== undefined) {
        updateData.originalPrice = productData.originalPrice;
      }
      if (productData.categoryId !== undefined) {
        updateData.categoryName = productData.categoryId;
      }
      if (productData.imageUrls !== undefined) {
        updateData.imageUrls = productData.imageUrls;
        // 更新 imageUrl1-10 字段
        if (Array.isArray(productData.imageUrls)) {
          updateData.imageUrl1 = productData.imageUrls[0] || '';
          for (let i = 1; i < 10; i++) {
            updateData[`imageUrl${i + 1}`] = productData.imageUrls[i] || '';
          }
        }
      }
      if (productData.images !== undefined) {
        updateData.images = productData.images;
      }
      if (productData.video !== undefined || productData.videoUrl !== undefined) {
        updateData.video = productData.video || productData.videoUrl || '';
        updateData.videoUrl = productData.videoUrl || productData.video || '';
      }
      if (productData.features !== undefined) {
        updateData.features = productData.features;
      }
      if (productData.params !== undefined) {
        updateData.params = productData.params;
      }
      if (productData.isHot !== undefined) {
        updateData.isHot = productData.isHot === true ? 'TRUE' : 'FALSE';
      }
      if (productData.isNew !== undefined) {
        updateData.isNew = productData.isNew === true ? 'TRUE' : 'FALSE';
      }
      if (productData.isRecommended !== undefined) {
        updateData.isRecommended = productData.isRecommended === true ? 'TRUE' : 'FALSE';
      }
      if (productData.status !== undefined) {
        updateData.status = productData.status;
      }
      if (productData.order !== undefined) {
        updateData.order = productData.order;
      }
      // 🆕 尺寸字段 - 用于筛选功能 (Feature: category-filter-search)
      if (productData.size !== undefined) {
        updateData.size = productData.size;
      }

      await collection.doc(id).update({
        data: updateData
      });

      if (debugMode) console.log('🔹 updateProduct 完成');

      return {
        success: true
      };
    }

    // 删除产品 - Requirements 8.2
    if (action === 'deleteProduct') {
      const productId = data.id || event.id;
      
      if (debugMode) console.log('🔹 deleteProduct 参数:', productId);

      if (!productId) {
        return {
          success: false,
          error: '产品ID不能为空'
        };
      }

      const collection = db.collection('products');

      // 检查产品是否存在并获取产品数据
      let productData;
      try {
        const existingProduct = await collection.doc(productId).get();
        if (!existingProduct.data) {
          return {
            success: false,
            error: '产品不存在'
          };
        }
        productData = existingProduct.data;
      } catch (err) {
        return {
          success: false,
          error: '产品不存在'
        };
      }

      // 🆕 收集所有需要删除的云存储图片
      const fileIDsToDelete = [];
      
      // 收集 imageUrls 数组中的图片
      if (productData.imageUrls && Array.isArray(productData.imageUrls)) {
        productData.imageUrls.forEach(url => {
          if (url && url.startsWith('cloud://')) {
            fileIDsToDelete.push(url);
          }
        });
      }
      
      // 收集 images 数组中的图片（详情图）
      if (productData.images && Array.isArray(productData.images)) {
        productData.images.forEach(url => {
          if (url && url.startsWith('cloud://')) {
            fileIDsToDelete.push(url);
          }
        });
      }
      
      // 收集 imageUrl1-10 字段中的图片（旧格式）
      for (let i = 1; i <= 10; i++) {
        const imageField = `imageUrl${i}`;
        if (productData[imageField] && productData[imageField].startsWith('cloud://')) {
          // 避免重复添加
          if (!fileIDsToDelete.includes(productData[imageField])) {
            fileIDsToDelete.push(productData[imageField]);
          }
        }
      }
      
      // 收集视频文件
      const videoUrl = productData.video || productData.videoUrl || productData.vediourl;
      if (videoUrl && videoUrl.startsWith('cloud://')) {
        fileIDsToDelete.push(videoUrl);
      }

      if (debugMode) console.log('🔹 需要删除的云存储文件:', fileIDsToDelete);

      // 🆕 删除云存储中的文件
      let deletedFilesCount = 0;
      let deleteErrors = [];
      
      if (fileIDsToDelete.length > 0) {
        try {
          // 微信云存储批量删除，每次最多50个
          const batchSize = 50;
          for (let i = 0; i < fileIDsToDelete.length; i += batchSize) {
            const batch = fileIDsToDelete.slice(i, i + batchSize);
            const deleteResult = await cloud.deleteFile({
              fileList: batch
            });
            
            if (debugMode) console.log('🔹 删除文件结果:', deleteResult);
            
            // 统计成功删除的文件数
            if (deleteResult.fileList) {
              deleteResult.fileList.forEach(file => {
                if (file.status === 0) {
                  deletedFilesCount++;
                } else {
                  deleteErrors.push(`${file.fileID}: ${file.errMsg}`);
                }
              });
            }
          }
        } catch (deleteErr) {
          console.error('🔹 删除云存储文件失败:', deleteErr);
          // 即使删除文件失败，也继续删除数据库记录
          deleteErrors.push(deleteErr.message);
        }
      }

      // 删除数据库记录
      await collection.doc(productId).remove();

      if (debugMode) {
        console.log('🔹 deleteProduct 完成');
        console.log('🔹 删除文件统计:', {
          totalFiles: fileIDsToDelete.length,
          deletedFiles: deletedFilesCount,
          errors: deleteErrors
        });
      }

      return {
        success: true,
        deletedFiles: deletedFilesCount,
        totalFiles: fileIDsToDelete.length,
        deleteErrors: deleteErrors.length > 0 ? deleteErrors : undefined
      };
    }

    // 更新产品状态（上架/下架）- Requirements 9.1, 9.2
    if (action === 'updateProductStatus') {
      const productId = data.id || event.id;
      const status = data.status;
      
      if (debugMode) console.log('🔹 updateProductStatus 参数:', { productId, status });

      if (!productId) {
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

      const collection = db.collection('products');

      // 检查产品是否存在
      try {
        const existingProduct = await collection.doc(productId).get();
        if (!existingProduct.data) {
          return {
            success: false,
            error: '产品不存在'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: '产品不存在'
        };
      }

      await collection.doc(productId).update({
        data: {
          status: status,
          updateTime: db.serverDate()
        }
      });

      if (debugMode) console.log('🔹 updateProductStatus 完成');

      return {
        success: true
      };
    }

    // 批量更新产品状态
    if (action === 'batchUpdateStatus') {
      const { ids, status } = data;
      
      if (debugMode) console.log('🔹 batchUpdateStatus 参数:', { ids, status });

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

      const collection = db.collection('products');
      const _ = db.command;

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

      if (debugMode) console.log('🔹 batchUpdateStatus 结果:', result);

      return {
        success: true,
        count: result.stats ? result.stats.updated : 0
      };
    }

    // ==================== 分类管理 Actions ====================

    // 获取分类列表
    if (action === 'getCategories') {
      if (debugMode) console.log('🔹 getCategories 参数:', data);

      const { includeDisabled = false } = data;

      const collection = db.collection('categories');

      // 构建查询条件
      const where = {};
      if (!includeDisabled) {
        where.status = 1; // 只获取启用的分类
      }

      try {
        const result = await collection
          .where(where)
          .orderBy('order', 'asc')
          .limit(100)
          .get();

        if (debugMode) console.log('🔹 getCategories 原始数据:', result.data);

        // 格式化分类数据
        const categories = result.data.map(cat => ({
          _id: cat._id,
          id: cat._id,
          name: cat.name || '',
          description: cat.description || '',
          icon: cat.icon || '',
          image: cat.image || '',
          order: cat.order !== undefined ? cat.order : 999,
          status: cat.status !== undefined ? cat.status : 1,
          createTime: cat.createTime || null,
          updateTime: cat.updateTime || null
        }));

        // 二次排序，确保排序正确
        categories.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          return orderA - orderB;
        });

        if (debugMode) {
          console.log('🔹 getCategories 返回分类数:', categories.length);
          console.log('🔹 getCategories 排序:', categories.map(c => `${c.name}(order:${c.order})`).join(' -> '));
        }

        return {
          success: true,
          data: categories,
          total: categories.length
        };
      } catch (err) {
        console.error('🔹 getCategories 失败:', err);
        return {
          success: false,
          error: '获取分类列表失败: ' + err.message,
          data: []
        };
      }
    }

    // 更新分类
    if (action === 'updateCategory') {
      const { id, ...categoryData } = data;
      
      if (debugMode) console.log('🔹 updateCategory 参数:', { id, categoryData });

      if (!id) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      const collection = db.collection('categories');

      // 检查分类是否存在
      try {
        const existingCategory = await collection.doc(id).get();
        if (!existingCategory.data) {
          return {
            success: false,
            error: '分类不存在'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      // 检查分类名称是否与其他分类重复
      if (categoryData.name) {
        const duplicateCheck = await collection
          .where({ name: categoryData.name.trim() })
          .get();
        
        if (duplicateCheck.data && duplicateCheck.data.length > 0) {
          const duplicate = duplicateCheck.data.find(cat => cat._id !== id);
          if (duplicate) {
            return {
              success: false,
              error: '分类名称已存在'
            };
          }
        }
      }

      // 构建更新数据
      const updateData = {
        updateTime: db.serverDate()
      };

      if (categoryData.name !== undefined) {
        updateData.name = categoryData.name.trim();
      }
      if (categoryData.description !== undefined) {
        updateData.description = categoryData.description;
      }
      if (categoryData.icon !== undefined) {
        updateData.icon = categoryData.icon;
      }
      if (categoryData.image !== undefined) {
        updateData.image = categoryData.image;
      }
      if (categoryData.order !== undefined) {
        updateData.order = typeof categoryData.order === 'number' ? categoryData.order : parseInt(categoryData.order) || 999;
      }
      if (categoryData.status !== undefined) {
        updateData.status = categoryData.status;
      }

      if (debugMode) console.log('🔹 updateCategory 更新数据:', updateData);

      const updateResult = await collection.doc(id).update({
        data: updateData
      });

      if (debugMode) console.log('🔹 updateCategory 结果:', updateResult);

      return {
        success: true,
        updated: updateResult.stats ? updateResult.stats.updated : 1
      };
    }

    // 新增分类
    if (action === 'addCategory') {
      const categoryData = data;
      
      if (debugMode) console.log('🔹 addCategory 参数:', categoryData);

      // 验证必填字段
      if (!categoryData.name || !categoryData.name.trim()) {
        return {
          success: false,
          error: '分类名称不能为空'
        };
      }

      const collection = db.collection('categories');

      // 检查分类名称是否重复
      const duplicateCheck = await collection
        .where({ name: categoryData.name.trim() })
        .get();
      
      if (duplicateCheck.data && duplicateCheck.data.length > 0) {
        return {
          success: false,
          error: '分类名称已存在'
        };
      }

      // 如果提供了自定义分类ID，检查是否重复
      const customCategoryCode = categoryData.categoryCode ? categoryData.categoryCode.trim() : '';
      if (customCategoryCode) {
        try {
          const idCheck = await collection.doc(customCategoryCode).get();
          if (idCheck.data) {
            return {
              success: false,
              error: '分类ID已存在，请使用其他ID'
            };
          }
        } catch (err) {
          // 文档不存在，可以继续创建
        }
      }

      // 构建分类数据
      const newCategory = {
        name: categoryData.name.trim(),
        description: categoryData.description || '',
        icon: categoryData.icon || '',
        image: categoryData.image || '',
        order: categoryData.order !== undefined ? (typeof categoryData.order === 'number' ? categoryData.order : parseInt(categoryData.order) || 999) : 999,
        status: categoryData.status !== undefined ? categoryData.status : 1,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      if (debugMode) console.log('🔹 addCategory 新分类数据:', newCategory);

      let result;
      
      // 如果提供了自定义分类ID，使用指定ID创建文档
      if (customCategoryCode) {
        // 使用自定义ID创建文档
        newCategory._id = customCategoryCode;
        result = await collection.add({
          data: newCategory
        });
        if (debugMode) console.log('🔹 addCategory 使用自定义ID:', customCategoryCode);
      } else {
        // 自动生成ID
        result = await collection.add({
          data: newCategory
        });
      }

      if (debugMode) console.log('🔹 addCategory 结果:', result);

      return {
        success: true,
        id: customCategoryCode || result._id
      };
    }

    // 删除分类
    if (action === 'deleteCategory') {
      const categoryId = data.id || event.id;
      
      if (debugMode) console.log('🔹 deleteCategory 参数:', categoryId);

      if (!categoryId) {
        return {
          success: false,
          error: '分类ID不能为空'
        };
      }

      const categoriesCollection = db.collection('categories');
      const productsCollection = db.collection('products');

      // 检查分类是否存在
      try {
        const existingCategory = await categoriesCollection.doc(categoryId).get();
        if (!existingCategory.data) {
          return {
            success: false,
            error: '分类不存在'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: '分类不存在'
        };
      }

      // 检查分类下是否有产品
      const productCount = await productsCollection
        .where({ categoryName: categoryId })
        .count();
      
      if (productCount.total > 0) {
        return {
          success: false,
          error: '该分类下有产品，请先删除或移动产品'
        };
      }

      // 删除分类
      await categoriesCollection.doc(categoryId).remove();

      if (debugMode) console.log('🔹 deleteCategory 完成');

      return {
        success: true
      };
    }

    // ==================== 轮播图管理 Actions ====================

    // 获取轮播图列表
    // Requirements: 5.2, 6.2, 6.4
    if (action === 'getBanners') {
      if (debugMode) console.log('🔹 getBanners 参数:', data);

      const collection = db.collection('banners');
      
      // 构建查询条件
      const where = {};
      
      // 支持 includeDisabled 参数 - Requirements: 5.2
      // 如果 includeDisabled 为 false 或未设置，只返回启用的轮播图
      if (data.includeDisabled !== true) {
        where.status = 1;
      } else if (data.status !== undefined) {
        // 如果明确指定了 status，使用指定的值
        where.status = data.status;
      }

      // 获取数据并排序
      // Requirements: 6.2 - 按 order 升序排序
      // Requirements: 6.4 - 相同 order 时按 createTime 排序
      const queryResult = await collection
        .where(where)
        .orderBy('order', 'asc')      // 首先按 order 升序
        .orderBy('createTime', 'asc') // 相同 order 时按 createTime 升序
        .limit(data.limit || 100)
        .get();

      if (debugMode) console.log('🔹 getBanners 结果:', queryResult.data.length);

      return {
        success: true,
        data: queryResult.data,
        total: queryResult.data.length
      };
    }

    // 新增轮播图
    // Requirements: 2.1, 2.2, 6.3
    if (action === 'addBanner') {
      const bannerData = data;
      
      if (debugMode) console.log('🔹 addBanner 参数:', bannerData);

      // 🆕 使用验证函数验证数据
      const validationResult = validateBannerData(bannerData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.errors.join('; ')
        };
      }

      const collection = db.collection('banners');

      // 🆕 生成规范化的轮播图ID (格式: banner_{number})
      const bannerId = await generateBannerId();
      if (debugMode) console.log('🔹 生成的轮播图ID:', bannerId);

      // 构建轮播图数据 - 包含所有必需字段
      // Requirements: 2.1 - 必需字段: _id, image, title, subtitle, order, status, productId, categoryId, linkType, createTime, updateTime
      const newBanner = {
        _id: bannerId, // 🆕 使用规范化ID (banner_{number})
        image: bannerData.image,
        title: bannerData.title !== undefined ? bannerData.title : '轮播图',
        subtitle: bannerData.subtitle !== undefined ? bannerData.subtitle : '',
        order: bannerData.order !== undefined ? bannerData.order : 999, // Requirements: 6.3 - 默认值999
        status: bannerData.status !== undefined ? bannerData.status : 1, // 默认启用
        linkType: bannerData.linkType !== undefined ? bannerData.linkType : 'none', // 跳转类型：none/product/category
        productId: bannerData.productId !== undefined ? bannerData.productId : '',
        categoryId: bannerData.categoryId !== undefined ? bannerData.categoryId : '', // 关联分类ID
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      if (debugMode) console.log('🔹 addBanner 新轮播图数据:', newBanner);

      const result = await collection.add({
        data: newBanner
      });

      if (debugMode) console.log('🔹 addBanner 结果:', result);

      return {
        success: true,
        id: bannerId // 🆕 返回规范化ID
      };
    }

    // 更新轮播图
    // Requirements: 3.3 - 只更新提供的字段
    // Requirements: 3.4 - 自动更新 updateTime
    // Requirements: 3.5 - 图片替换时删除旧图片
    if (action === 'updateBanner') {
      const { id, ...bannerData } = data;
      
      if (debugMode) console.log('🔹 updateBanner 参数:', { id, bannerData });

      if (!id) {
        return {
          success: false,
          error: '轮播图ID不能为空'
        };
      }

      const collection = db.collection('banners');

      // 检查轮播图是否存在并获取现有数据
      let existingBannerData;
      try {
        const existingBanner = await collection.doc(id).get();
        if (!existingBanner.data) {
          return {
            success: false,
            error: '轮播图不存在'
          };
        }
        existingBannerData = existingBanner.data;
      } catch (err) {
        return {
          success: false,
          error: '轮播图不存在'
        };
      }

      // 构建更新数据 - Requirements: 3.4 自动更新 updateTime
      const updateData = {
        updateTime: db.serverDate()
      };

      // Requirements: 3.3 - 只更新提供的字段
      // 处理图片字段 - Requirements: 3.5 图片替换时删除旧图片
      let deletedOldImage = false;
      if (bannerData.image !== undefined) {
        updateData.image = bannerData.image;
        
        // 如果新图片与旧图片不同，尝试删除旧图片
        const oldImage = existingBannerData.image;
        const newImage = bannerData.image;
        
        if (oldImage && oldImage !== newImage && oldImage.startsWith('cloud://')) {
          try {
            const deleteResult = await cloud.deleteFile({
              fileList: [oldImage]
            });
            if (deleteResult.fileList && deleteResult.fileList[0].status === 0) {
              deletedOldImage = true;
              if (debugMode) console.log('🔹 updateBanner 删除旧图片成功:', oldImage);
            }
          } catch (deleteErr) {
            // 图片删除失败不影响更新操作
            console.error('🔹 updateBanner 删除旧图片失败:', deleteErr);
          }
        }
      }
      if (bannerData.title !== undefined) {
        updateData.title = bannerData.title;
      }
      if (bannerData.subtitle !== undefined) {
        updateData.subtitle = bannerData.subtitle;
      }
      if (bannerData.link !== undefined) {
        updateData.link = bannerData.link;
      }
      if (bannerData.linkType !== undefined) {
        updateData.linkType = bannerData.linkType;
      }
      if (bannerData.productId !== undefined) {
        updateData.productId = bannerData.productId;
      }
      if (bannerData.categoryId !== undefined) {
        updateData.categoryId = bannerData.categoryId;
      }
      if (bannerData.order !== undefined) {
        updateData.order = bannerData.order;
      }
      if (bannerData.status !== undefined) {
        updateData.status = bannerData.status;
      }

      if (debugMode) console.log('🔹 updateBanner 更新数据:', updateData);

      const updateResult = await collection.doc(id).update({
        data: updateData
      });

      if (debugMode) console.log('🔹 updateBanner 结果:', updateResult);

      return {
        success: true,
        updated: updateResult.stats ? updateResult.stats.updated : 1,
        deletedOldImage: deletedOldImage
      };
    }

    // 删除轮播图
    // Requirements: 4.2 - 删除数据库记录
    // Requirements: 4.3 - 删除云存储图片
    // Requirements: 4.4 - 图片删除失败不影响记录删除
    if (action === 'deleteBanner') {
      const bannerId = data.id || event.id;
      
      if (debugMode) console.log('🔹 deleteBanner 参数:', bannerId);

      if (!bannerId) {
        return {
          success: false,
          error: '轮播图ID不能为空'
        };
      }

      const collection = db.collection('banners');

      // 检查轮播图是否存在并获取数据
      let bannerData;
      try {
        const existingBanner = await collection.doc(bannerId).get();
        if (!existingBanner.data) {
          return {
            success: false,
            error: '轮播图不存在'
          };
        }
        bannerData = existingBanner.data;
      } catch (err) {
        return {
          success: false,
          error: '轮播图不存在'
        };
      }

      // Requirements: 4.3 - 尝试删除云存储中的图片
      let deletedFile = false;
      let imageDeleteError = null;
      if (bannerData.image && bannerData.image.startsWith('cloud://')) {
        try {
          const deleteResult = await cloud.deleteFile({
            fileList: [bannerData.image]
          });
          if (deleteResult.fileList && deleteResult.fileList[0].status === 0) {
            deletedFile = true;
          }
        } catch (deleteErr) {
          // Requirements: 4.4 - 图片删除失败不影响记录删除，只记录错误
          console.error('🔹 删除轮播图图片失败:', deleteErr);
          imageDeleteError = deleteErr.message || '图片删除失败';
        }
      }

      // Requirements: 4.2 - 删除数据库记录（无论图片删除是否成功）
      await collection.doc(bannerId).remove();

      if (debugMode) console.log('🔹 deleteBanner 完成, 删除图片:', deletedFile);

      return {
        success: true,
        deletedFile: deletedFile
      };
    }

    // 🆕 迁移产品ID - 将不规范的ID迁移为规范化ID
    if (action === 'migrateProductIds') {
      if (debugMode) console.log('🔹 开始迁移产品ID');

      const collection = db.collection('products');
      
      // 获取所有产品
      const result = await collection.limit(1000).get();
      const products = result.data;
      
      if (debugMode) console.log('🔹 找到产品数量:', products.length);

      const migrationResults = {
        total: products.length,
        migrated: 0,
        skipped: 0,
        errors: []
      };

      // 按前缀统计当前最大序号（预先初始化所有前缀）
      const prefixMaxNumbers = {
        'classic': 0,
        'fun': 0,
        'resin': 0,
        'custom': 0,
        'frame': 0,
        'chair': 0,
        'prod': 0
      };
      
      // 收集所有已存在的ID，用于避免冲突
      const existingIds = new Set(products.map(p => p._id));
      
      // 先统计已有规范ID的最大序号（检查所有前缀）
      for (const product of products) {
        for (const prefix of Object.keys(prefixMaxNumbers)) {
          const match = product._id.match(new RegExp(`^${prefix}(\\d+)$`));
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > prefixMaxNumbers[prefix]) {
              prefixMaxNumbers[prefix] = num;
            }
          }
        }
      }
      
      if (debugMode) console.log('🔹 当前各前缀最大序号:', prefixMaxNumbers);

      // 迁移不规范的ID
      for (const product of products) {
        const categoryId = product.categoryName;
        const prefix = getCategoryPrefix(categoryId);
        const expectedPattern = new RegExp(`^${prefix}\\d+$`);
        
        // 检查ID是否已经规范
        if (expectedPattern.test(product._id)) {
          migrationResults.skipped++;
          continue;
        }

        try {
          // 生成新ID，确保不与现有ID冲突
          let newId;
          do {
            prefixMaxNumbers[prefix] = (prefixMaxNumbers[prefix] || 0) + 1;
            newId = `${prefix}${prefixMaxNumbers[prefix]}`;
          } while (existingIds.has(newId));
          
          // 将新ID加入已存在集合
          existingIds.add(newId);
          
          if (debugMode) console.log(`🔹 迁移: ${product._id} -> ${newId} (分类: ${categoryId})`);

          // 复制产品数据到新ID
          const newProductData = { ...product };
          delete newProductData._id;
          newProductData._id = newId;
          
          // 同时更新分类ID为新格式
          if (oldToNewCategoryMapping[categoryId]) {
            newProductData.categoryName = oldToNewCategoryMapping[categoryId];
          }
          
          // 添加新记录
          await collection.add({ data: newProductData });
          
          // 删除旧记录
          await collection.doc(product._id).remove();
          // 从已存在集合中移除旧ID
          existingIds.delete(product._id);
          
          migrationResults.migrated++;
        } catch (err) {
          console.error(`迁移产品 ${product._id} 失败:`, err);
          migrationResults.errors.push({
            id: product._id,
            error: err.message
          });
        }
      }

      if (debugMode) console.log('🔹 迁移完成:', migrationResults);

      return {
        success: true,
        ...migrationResults
      };
    }

    // 🆕 迁移轮播图ID
    if (action === 'migrateBannerIds') {
      if (debugMode) console.log('🔹 开始迁移轮播图ID');

      const collection = db.collection('banners');
      
      // 获取所有轮播图
      const result = await collection.limit(100).get();
      const banners = result.data;
      
      if (debugMode) console.log('🔹 找到轮播图数量:', banners.length);

      const migrationResults = {
        total: banners.length,
        migrated: 0,
        skipped: 0,
        errors: []
      };

      // 找出当前最大序号
      let maxNumber = 0;
      for (const banner of banners) {
        const match = banner._id.match(/^banner(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      // 迁移不规范的ID
      for (const banner of banners) {
        // 检查ID是否已经规范
        if (/^banner\d+$/.test(banner._id)) {
          migrationResults.skipped++;
          continue;
        }

        try {
          // 生成新ID
          maxNumber++;
          const newId = `banner${maxNumber}`;
          
          if (debugMode) console.log(`🔹 迁移: ${banner._id} -> ${newId}`);

          // 复制轮播图数据到新ID
          const newBannerData = { ...banner };
          delete newBannerData._id;
          newBannerData._id = newId;
          
          // 添加新记录
          await collection.add({ data: newBannerData });
          
          // 删除旧记录
          await collection.doc(banner._id).remove();
          
          migrationResults.migrated++;
        } catch (err) {
          console.error(`迁移轮播图 ${banner._id} 失败:`, err);
          migrationResults.errors.push({
            id: banner._id,
            error: err.message
          });
        }
      }

      if (debugMode) console.log('🔹 迁移完成:', migrationResults);

      return {
        success: true,
        ...migrationResults
      };
    }

    // 🆕 迁移分类ID - 将旧分类ID迁移为规范化ID
    if (action === 'migrateCategoryIds') {
      if (debugMode) console.log('🔹 开始迁移分类ID');

      const categoriesCollection = db.collection('categories');
      const productsCollection = db.collection('products');
      
      // 定义需要迁移的分类
      const categoryMigrations = [
        { oldId: 'cat_wood', newId: 'cat_classic', name: '经典桌面款' },
        { oldId: 'cat_design', newId: 'cat_fun', name: '玩趣设计款' },
        { oldId: '8f6c3a63694e9d8a096b05cc732a6a58', newId: 'cat_chair', name: '椅子专区' }
      ];

      const migrationResults = {
        categories: { migrated: 0, skipped: 0, errors: [] },
        products: { updated: 0, errors: [] }
      };

      for (const migration of categoryMigrations) {
        try {
          // 检查旧分类是否存在
          let oldCategory;
          try {
            const oldResult = await categoriesCollection.doc(migration.oldId).get();
            oldCategory = oldResult.data;
          } catch (e) {
            if (debugMode) console.log(`🔹 旧分类 ${migration.oldId} 不存在，跳过`);
            migrationResults.categories.skipped++;
            continue;
          }

          if (!oldCategory) {
            migrationResults.categories.skipped++;
            continue;
          }

          // 检查新分类是否已存在
          let newCategoryExists = false;
          try {
            const newResult = await categoriesCollection.doc(migration.newId).get();
            newCategoryExists = !!newResult.data;
          } catch (e) {
            newCategoryExists = false;
          }

          if (!newCategoryExists) {
            // 创建新分类
            const newCategoryData = { ...oldCategory };
            delete newCategoryData._id;
            newCategoryData._id = migration.newId;
            newCategoryData.name = migration.name;
            newCategoryData.updateTime = db.serverDate();
            
            await categoriesCollection.add({ data: newCategoryData });
            if (debugMode) console.log(`🔹 创建新分类: ${migration.newId}`);
          }

          // 更新所有使用旧分类ID的产品
          const _ = db.command;
          const updateResult = await productsCollection
            .where({ categoryName: migration.oldId })
            .update({ data: { categoryName: migration.newId, updateTime: db.serverDate() } });
          
          migrationResults.products.updated += updateResult.stats ? updateResult.stats.updated : 0;
          if (debugMode) console.log(`🔹 更新产品分类: ${migration.oldId} -> ${migration.newId}, 数量: ${updateResult.stats?.updated || 0}`);

          // 删除旧分类
          await categoriesCollection.doc(migration.oldId).remove();
          if (debugMode) console.log(`🔹 删除旧分类: ${migration.oldId}`);
          
          migrationResults.categories.migrated++;
        } catch (err) {
          console.error(`迁移分类 ${migration.oldId} 失败:`, err);
          migrationResults.categories.errors.push({
            oldId: migration.oldId,
            newId: migration.newId,
            error: err.message
          });
        }
      }

      if (debugMode) console.log('🔹 分类迁移完成:', migrationResults);

      return {
        success: true,
        ...migrationResults
      };
    }

    // 🆕 迁移云存储文件路径 - 更新数据库中的图片URL
    if (action === 'migrateStoragePaths') {
      if (debugMode) console.log('🔹 开始迁移云存储路径');

      const productsCollection = db.collection('products');
      
      // 定义路径映射
      const pathMappings = [
        { oldPath: '/products/images/wood/', newPath: '/products/images/classic/' },
        { oldPath: '/products/images/design/', newPath: '/products/images/fun/' },
        { oldPath: '/products/images/other/', newPath: '/products/images/chair/' }
      ];

      const migrationResults = {
        total: 0,
        updated: 0,
        errors: []
      };

      // 获取所有产品
      const result = await productsCollection.limit(1000).get();
      const products = result.data;
      migrationResults.total = products.length;

      if (debugMode) console.log('🔹 找到产品数量:', products.length);

      for (const product of products) {
        try {
          let needsUpdate = false;
          const updateData = { updateTime: db.serverDate() };

          // 检查并更新 imageUrls 数组
          if (product.imageUrls && Array.isArray(product.imageUrls)) {
            const newImageUrls = product.imageUrls.map(url => {
              if (!url) return url;
              let newUrl = url;
              for (const mapping of pathMappings) {
                if (url.includes(mapping.oldPath)) {
                  newUrl = url.replace(mapping.oldPath, mapping.newPath);
                  needsUpdate = true;
                  break;
                }
              }
              return newUrl;
            });
            if (needsUpdate) {
              updateData.imageUrls = newImageUrls;
            }
          }

          // 检查并更新 imageUrl1-10 字段
          for (let i = 1; i <= 10; i++) {
            const fieldName = `imageUrl${i}`;
            if (product[fieldName]) {
              for (const mapping of pathMappings) {
                if (product[fieldName].includes(mapping.oldPath)) {
                  updateData[fieldName] = product[fieldName].replace(mapping.oldPath, mapping.newPath);
                  needsUpdate = true;
                  break;
                }
              }
            }
          }

          // 检查并更新 images 数组
          if (product.images && Array.isArray(product.images)) {
            const newImages = product.images.map(url => {
              if (!url) return url;
              let newUrl = url;
              for (const mapping of pathMappings) {
                if (url.includes(mapping.oldPath)) {
                  newUrl = url.replace(mapping.oldPath, mapping.newPath);
                  needsUpdate = true;
                  break;
                }
              }
              return newUrl;
            });
            if (needsUpdate) {
              updateData.images = newImages;
            }
          }

          if (needsUpdate) {
            await productsCollection.doc(product._id).update({ data: updateData });
            migrationResults.updated++;
            if (debugMode) console.log(`🔹 更新产品图片路径: ${product._id}`);
          }
        } catch (err) {
          console.error(`更新产品 ${product._id} 图片路径失败:`, err);
          migrationResults.errors.push({
            id: product._id,
            error: err.message
          });
        }
      }

      if (debugMode) console.log('🔹 云存储路径迁移完成:', migrationResults);

      return {
        success: true,
        ...migrationResults,
        note: '数据库中的图片URL已更新。请在云存储控制台手动重命名文件夹：wood->classic, design->fun, other->chair'
      };
    }
    
    // ==================== 案例管理 Actions ====================
    // Requirements: 3.1, 3.2, 3.4, 3.5, 4.5, 4.7

    // 获取案例列表
    // Requirements: 3.1, 6.1, 6.2, 6.5
    if (action === 'getCases') {
      if (debugMode) console.log('🔹 getCases 参数:', data);

      const { includeDisabled = false } = data;

      const collection = db.collection('cases');

      // 构建查询条件
      const where = {};
      if (!includeDisabled) {
        where.status = 1; // 只获取启用的案例
      }

      try {
        const result = await collection
          .where(where)
          .orderBy('order', 'asc')       // 按 order 升序
          .orderBy('createTime', 'desc') // 相同 order 时按 createTime 降序（最新的在前）
          .limit(data.limit || 100)
          .get();

        if (debugMode) console.log('🔹 getCases 原始数据:', result.data);

        // 格式化案例数据
        const cases = result.data.map(caseItem => ({
          _id: caseItem._id,
          id: caseItem._id,
          title: caseItem.title || '',
          description: caseItem.description || '',
          imageUrl: caseItem.imageUrl || '',
          order: caseItem.order !== undefined ? caseItem.order : 999,
          status: caseItem.status !== undefined ? caseItem.status : 1,
          createTime: caseItem.createTime || null,
          updateTime: caseItem.updateTime || null
        }));

        if (debugMode) {
          console.log('🔹 getCases 返回案例数:', cases.length);
        }

        return {
          success: true,
          data: cases,
          total: cases.length
        };
      } catch (err) {
        console.error('🔹 getCases 失败:', err);
        return {
          success: false,
          error: '获取案例列表失败: ' + err.message,
          data: []
        };
      }
    }

    // 新增案例
    // Requirements: 3.1, 3.2, 3.4, 4.5
    if (action === 'addCase') {
      const caseData = data;
      
      if (debugMode) console.log('🔹 addCase 参数:', caseData);

      // 验证必填字段
      const validationResult = validateCaseData(caseData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.errors.join('; ')
        };
      }

      const collection = db.collection('cases');

      // 生成案例ID
      let caseId;
      if (caseData.customCaseId && caseData.customCaseId.trim()) {
        // 使用自定义ID
        caseId = caseData.customCaseId.trim();
        if (debugMode) console.log('🔹 使用自定义案例ID:', caseId);
        
        // 检查ID是否已存在
        try {
          const existingCase = await collection.doc(caseId).get();
          if (existingCase.data) {
            return {
              success: false,
              error: `案例ID "${caseId}" 已存在`
            };
          }
        } catch (err) {
          // 案例不存在，可以继续创建
        }
      } else {
        // 自动生成案例ID
        caseId = await generateCaseId();
        if (debugMode) console.log('🔹 生成的案例ID:', caseId);
      }

      // 构建案例数据
      const newCase = {
        _id: caseId,
        title: caseData.title ? caseData.title.trim() : '',
        description: caseData.description !== undefined ? caseData.description : '',
        imageUrl: caseData.imageUrl !== undefined ? caseData.imageUrl : '',
        order: caseData.order !== undefined ? caseData.order : 999,
        status: caseData.status !== undefined ? caseData.status : 1,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      if (debugMode) console.log('🔹 addCase 新案例数据:', newCase);

      const result = await collection.add({
        data: newCase
      });

      if (debugMode) console.log('🔹 addCase 结果:', result);

      return {
        success: true,
        id: caseId
      };
    }

    // 更新案例
    // Requirements: 3.5
    if (action === 'updateCase') {
      const { id, ...caseData } = data;
      
      if (debugMode) console.log('🔹 updateCase 参数:', { id, caseData });

      if (!id) {
        return {
          success: false,
          error: '案例ID不能为空'
        };
      }

      const collection = db.collection('cases');

      // 检查案例是否存在并获取现有数据
      let existingCaseData;
      try {
        const existingCase = await collection.doc(id).get();
        if (!existingCase.data) {
          return {
            success: false,
            error: '案例不存在'
          };
        }
        existingCaseData = existingCase.data;
      } catch (err) {
        return {
          success: false,
          error: '案例不存在'
        };
      }

      // 构建更新数据
      const updateData = {
        updateTime: db.serverDate()
      };

      // 只更新提供的字段
      if (caseData.title !== undefined) {
        updateData.title = caseData.title.trim();
      }
      if (caseData.description !== undefined) {
        updateData.description = caseData.description;
      }
      if (caseData.order !== undefined) {
        updateData.order = caseData.order;
      }
      if (caseData.status !== undefined) {
        updateData.status = caseData.status;
      }

      // 处理图片字段 - 如果新图片与旧图片不同，尝试删除旧图片
      let deletedOldImage = false;
      if (caseData.imageUrl !== undefined) {
        updateData.imageUrl = caseData.imageUrl;
        
        const oldImage = existingCaseData.imageUrl;
        const newImage = caseData.imageUrl;
        
        if (oldImage && oldImage !== newImage && oldImage.startsWith('cloud://')) {
          try {
            const deleteResult = await cloud.deleteFile({
              fileList: [oldImage]
            });
            if (deleteResult.fileList && deleteResult.fileList[0].status === 0) {
              deletedOldImage = true;
              if (debugMode) console.log('🔹 updateCase 删除旧图片成功:', oldImage);
            }
          } catch (deleteErr) {
            console.error('🔹 updateCase 删除旧图片失败:', deleteErr);
          }
        }
      }

      if (debugMode) console.log('🔹 updateCase 更新数据:', updateData);

      const updateResult = await collection.doc(id).update({
        data: updateData
      });

      if (debugMode) console.log('🔹 updateCase 结果:', updateResult);

      return {
        success: true,
        updated: updateResult.stats ? updateResult.stats.updated : 1,
        deletedOldImage: deletedOldImage
      };
    }

    // 删除案例
    // Requirements: 4.7, 5.5
    if (action === 'deleteCase') {
      const caseId = data.id || event.id;
      
      if (debugMode) console.log('🔹 deleteCase 参数:', caseId);

      if (!caseId) {
        return {
          success: false,
          error: '案例ID不能为空'
        };
      }

      const collection = db.collection('cases');

      // 检查案例是否存在并获取数据
      let caseData;
      try {
        const existingCase = await collection.doc(caseId).get();
        if (!existingCase.data) {
          return {
            success: false,
            error: '案例不存在'
          };
        }
        caseData = existingCase.data;
      } catch (err) {
        return {
          success: false,
          error: '案例不存在'
        };
      }

      // 尝试删除云存储中的图片
      let deletedFile = false;
      let imageDeleteError = null;
      if (caseData.imageUrl && caseData.imageUrl.startsWith('cloud://')) {
        try {
          const deleteResult = await cloud.deleteFile({
            fileList: [caseData.imageUrl]
          });
          if (deleteResult.fileList && deleteResult.fileList[0].status === 0) {
            deletedFile = true;
          }
        } catch (deleteErr) {
          console.error('🔹 删除案例图片失败:', deleteErr);
          imageDeleteError = deleteErr.message || '图片删除失败';
        }
      }

      // 删除数据库记录（无论图片删除是否成功）
      await collection.doc(caseId).remove();

      if (debugMode) console.log('🔹 deleteCase 完成, 删除图片:', deletedFile);

      return {
        success: true,
        deletedFile: deletedFile,
        imageDeleteError: imageDeleteError
      };
    }

    // 获取下一个案例ID
    // Requirements: 3.2, 5.3
    if (action === 'getNextCaseId') {
      if (debugMode) console.log('🔹 getNextCaseId');

      const caseId = await generateCaseId();

      if (debugMode) console.log('🔹 getNextCaseId 结果:', caseId);

      return {
        success: true,
        nextId: caseId
      };
    }

    return {
      success: false,
      error: '未知 action'
    };
  } catch (error) {
    console.error('❌ 云函数执行异常:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 验证产品数据
 * @param {Object} product - 产品输入数据
 * @returns {{valid: boolean, errors: string[]}} 验证结果
 */
function validateProductData(product) {
  const errors = [];

  // 检查输入是否为对象
  if (!product || typeof product !== 'object') {
    return {
      valid: false,
      errors: ['产品数据必须是一个对象']
    };
  }

  // 验证产品名称（必填）- Requirements 10.2
  if (!product.name) {
    errors.push('产品名称不能为空');
  } else if (typeof product.name !== 'string') {
    errors.push('产品名称必须是字符串');
  } else if (product.name.trim() === '') {
    errors.push('产品名称不能为空白字符');
  } else if (product.name.trim().length > 100) {
    errors.push('产品名称不能超过100个字符');
  }

  // 验证分类ID（必填）- Requirements 10.2
  if (!product.categoryId) {
    errors.push('产品分类不能为空');
  } else if (typeof product.categoryId !== 'string') {
    errors.push('产品分类ID必须是字符串');
  } else if (product.categoryId.trim() === '') {
    errors.push('产品分类不能为空白字符');
  }

  // 验证价格（可选）- Requirements 10.3
  if (product.price !== undefined && product.price !== null && product.price !== '') {
    if (!validatePriceValue(product.price)) {
      errors.push('价格格式无效，请输入有效数字或"联系销售"');
    }
  }

  // 验证状态（可选）
  if (product.status !== undefined && product.status !== null) {
    if (typeof product.status !== 'number' || (product.status !== 0 && product.status !== 1)) {
      errors.push('状态必须是0（下架）或1（上架）');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证价格格式
 * @param {string|number} price - 价格值
 * @returns {boolean} 是否为有效价格
 */
function validatePriceValue(price) {
  // 允许 "consult" 或 "联系销售" 表示需要咨询价格
  if (price === 'consult' || price === '联系销售') {
    return true;
  }

  // 允许空值
  if (price === undefined || price === null || price === '') {
    return true;
  }

  // 如果是字符串，尝试转换为数字
  if (typeof price === 'string') {
    const trimmedPrice = price.trim();
    if (trimmedPrice === 'consult' || trimmedPrice === '联系销售') {
      return true;
    }
    const numPrice = parseFloat(trimmedPrice);
    if (isNaN(numPrice)) {
      return false;
    }
    return numPrice >= 0;
  }

  // 如果是数字
  if (typeof price === 'number') {
    return !isNaN(price) && isFinite(price) && price >= 0;
  }

  return false;
}