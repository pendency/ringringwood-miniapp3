// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 分类ID到中文名称的映射
const categoryMapping = {
  'cat_wood': '原木经典',
  'cat_resin': '树脂美学', 
  'cat_design': '玩趣设计',
  'cat_custom': '高定专属',
  'cat_frame': '桌架专区'
};

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
        limit = 10,
        page = 1,
    categoryId, 
    isHot, 
    includeHidden = false
      } = data;

      // 构建查询条件
      const where = {};

      if (categoryId) where.categoryName = categoryId;
      // 修复：处理 isHot 字段，支持布尔值和字符串类型
      if (isHot !== undefined) {
        if (typeof isHot === 'boolean') {
          // 如果传入的是布尔值，需要转换为字符串查询数据库中的 "TRUE"/"FALSE"
          where.isHot = isHot ? "TRUE" : "FALSE";
        } else if (typeof isHot === 'string') {
          // 如果传入的是字符串，直接使用
          where.isHot = isHot;
        }
      }
  if (!includeHidden) {
        // 调试模式下暂时不筛选 isVisible
        if (!debugMode) {
          where.isVisible = true;
        }
      }

      if (debugMode) console.log('🔹 查询条件:', where);

      // 处理 limit=-1 获取全部数据
      const queryLimit = limit === -1 ? 1000 : limit;
      const skipCount = limit === -1 ? 0 : (page - 1) * limit;

      const collection = db.collection('products');
      const queryResult = await collection
        .where(where)
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
          image: item.imageUrl1 || item.image || item.mainImage || item.imageUrl || '',
          imageUrls: [item.imageUrl1 || item.image || item.mainImage || item.imageUrl || ''].filter(Boolean),
          categoryId: categoryId,
          categoryName: categoryName,
          isHot: !!item.isHot,
          isVisible: !!item.isVisible,
          includeHidden: !!item.includeHidden,
          // 🆕 产品参数字段
          size: item.size || '',
          weight: item.weight || '',
          color: item.color || '',
          applicationScenario: item.applicationScenario || '',
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

      // 构建图片数组(排除imageUrl1，只包含imageUrl2-10)
      const images = [];
      for (let i = 2; i <= 10; i++) {
        const imageField = `imageUrl${i}`;
        if (item[imageField]) {
          images.push(item[imageField]);
        }
      }

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
        images: images, // 排除了imageUrl1的图片数组
        video: convertedVideoUrl || '',
        videoUrl: convertedVideoUrl || '',
        isHot: !!item.isHot,
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