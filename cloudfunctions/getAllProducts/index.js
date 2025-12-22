// cloudfunctions/getAllProducts/index.js
// 批量读取products集合的所有文档，支持分页处理

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('getAllProducts 云函数开始执行', event);
  
  try {
    const { 
      limit = 100, 
      skip = 0, 
      categoryId = null,
      isHot = null,
      isNew = null,
      isVisible = true 
    } = event;

    // 构建查询条件
    let query = db.collection('products');
    
    // 添加筛选条件
    const whereConditions = {};
    
    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }
    
    if (isHot !== null) {
      whereConditions.isHot = isHot;
    }
    
    if (isNew !== null) {
      whereConditions.isNew = isNew;
    }
    
    if (isVisible !== null) {
      whereConditions.isVisible = isVisible;
    }
    
    // 应用查询条件
    if (Object.keys(whereConditions).length > 0) {
      query = query.where(whereConditions);
    }

    // 如果需要获取所有数据（limit为-1）
    if (limit === -1) {
      console.log('获取所有产品数据...');
      return await getAllDocuments(query);
    }

    // 常规分页查询
    const result = await query
      .skip(skip)
      .limit(limit)
      .orderBy('sortPriority', 'asc')
      .orderBy('_id', 'desc')
      .get();

    // 获取总数
    const countResult = await query.count();

    console.log(`获取产品成功: ${result.data.length}条, 总数: ${countResult.total}`);

    return {
      success: true,
      data: result.data,
      total: countResult.total,
      hasMore: skip + result.data.length < countResult.total,
      nextSkip: skip + result.data.length
    };

  } catch (error) {
    console.error('getAllProducts 执行失败:', error);
    return {
      success: false,
      error: error.message,
      errCode: error.errCode || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * 获取所有文档（处理超过单次查询限制的情况）
 */
async function getAllDocuments(query) {
  const allData = [];
  const batchSize = 100; // 每批次获取数量
  let skip = 0;
  let hasMore = true;

  console.log('开始分批获取所有产品数据...');

  while (hasMore) {
    try {
      const batch = await query
        .skip(skip)
        .limit(batchSize)
        .orderBy('sortPriority', 'asc')
        .orderBy('_id', 'desc')
        .get();

      console.log(`批次 ${Math.floor(skip / batchSize) + 1}: 获取到 ${batch.data.length} 条数据`);

      allData.push(...batch.data);
      
      // 如果这批数据少于batchSize，说明已经是最后一批
      if (batch.data.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }

      // 防止无限循环，设置最大循环次数
      if (skip > 10000) {
        console.warn('达到最大查询限制，停止获取');
        break;
      }

    } catch (batchError) {
      console.error(`批次查询失败 (skip: ${skip}):`, batchError);
      throw batchError;
    }
  }

  // 获取总数
  const countResult = await query.count();

  console.log(`所有产品数据获取完成: ${allData.length}条, 数据库总数: ${countResult.total}`);

  return {
    success: true,
    data: allData,
    total: countResult.total,
    hasMore: false,
    batches: Math.ceil(allData.length / batchSize)
  };
}
