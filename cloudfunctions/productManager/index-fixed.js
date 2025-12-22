// cloudfunctions/productManager/index-fixed.js
// 修复版本的 productManager 云函数
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 产品管理云函数 - 修复版本
 * 提供产品的增删改查功能
 */
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  console.log('云函数被调用:', { action, data, openid: wxContext.OPENID })
  
  try {
    switch (action) {
      case 'getProducts':
        return await getProducts(data)
      case 'getProductById':
        return await getProductById(data)
      case 'getCategories':
        return await getCategories(data)
      case 'addProduct':
        return await addProduct(data, wxContext)
      case 'updateProduct':
        return await updateProduct(data, wxContext)
      case 'deleteProduct':
        return await deleteProduct(data, wxContext)
      case 'debugQuery':
        return await debugQuery(data)
      default:
        throw new Error(`未知操作: ${action}`)
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    }
  }
}

/**
 * 获取产品列表 - 修复版本
 * 主要修复：
 * 1. 移除了有问题的 status: 1 查询条件
 * 2. 改用 isVisible 字段过滤
 * 3. 添加更多调试信息
 */
async function getProducts(params = {}) {
  const { 
    categoryId, 
    page = 1, 
    limit = 20, 
    isHot, 
    isNew, 
    isRecommended,
    keyword,
    includeHidden = false // 新增参数：是否包含隐藏产品
  } = params
  
  console.log('获取产品列表参数:', params)
  
  // 修复：不再使用 status 字段，改用 isVisible 字段
  let queryConditions = {}
  
  // 默认只显示可见产品，除非明确要求包含隐藏产品
  if (!includeHidden) {
    queryConditions.isVisible = db.command.neq(false) // 不等于 false（包括 true、undefined、null）
  }
  
  console.log('基础查询条件:', queryConditions)
  
  let query = db.collection('products')
  
  // 如果有查询条件，则应用
  if (Object.keys(queryConditions).length > 0) {
    query = query.where(queryConditions)
  }
  
  // 分类筛选
  if (categoryId) {
    query = query.where({ categoryId })
    console.log('添加分类筛选:', categoryId)
  }
  
  // 特殊标签筛选
  if (isHot !== undefined) {
    // 处理字符串类型的布尔值
    const hotValue = isHot === true || isHot === 'true' || isHot === '是'
    query = query.where({ isHot: hotValue })
    console.log('添加热门筛选:', hotValue)
  }
  
  if (isNew !== undefined) {
    // 处理字符串类型的布尔值
    const newValue = isNew === true || isNew === 'true' || isNew === '是'
    query = query.where({ isNew: newValue })
    console.log('添加新品筛选:', newValue)
  }
  
  if (isRecommended !== undefined) {
    const recommendedValue = isRecommended === true || isRecommended === 'true' || isRecommended === '是'
    query = query.where({ isRecommended: recommendedValue })
    console.log('添加推荐筛选:', recommendedValue)
  }
  
  // 关键词搜索
  if (keyword) {
    query = query.where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    })
    console.log('添加关键词搜索:', keyword)
  }
  
  try {
    // 先获取总数
    const countResult = await query.count()
    console.log('符合条件的总数:', countResult.total)
    
    // 再获取分页数据
    const result = await query
      .orderBy('sortPriority', 'desc') // 优先按排序优先级
      .orderBy('createTime', 'desc')   // 再按创建时间
      .skip((page - 1) * limit)
      .limit(limit)
      .get()
      
    console.log(`实际获取到 ${result.data.length} 个产品`)
    
    // 输出前几个产品的关键信息用于调试
    if (result.data.length > 0) {
      console.log('前3个产品的关键字段:')
      result.data.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name || product.title}`)
        console.log(`     - _id: ${product._id}`)
        console.log(`     - isVisible: ${product.isVisible} (${typeof product.isVisible})`)
        console.log(`     - isHot: ${product.isHot} (${typeof product.isHot})`)
        console.log(`     - isNew: ${product.isNew} (${typeof product.isNew})`)
        console.log(`     - categoryId: ${product.categoryId}`)
        console.log(`     - categoryName: ${product.categoryName}`)
      })
    }
    
    return { 
      success: true, 
      data: result.data,
      total: countResult.total,
      page,
      limit,
      queryConditions // 返回查询条件用于调试
    }
    
  } catch (queryError) {
    console.error('数据库查询失败:', queryError)
    throw new Error(`数据库查询失败: ${queryError.message}`)
  }
}

/**
 * 调试查询 - 新增函数用于诊断数据库状态
 */
async function debugQuery(params = {}) {
  console.log('开始调试查询，参数:', params)
  
  try {
    const collection = db.collection('products')
    
    // 1. 获取总数
    const totalCount = await collection.count()
    console.log('数据库总记录数:', totalCount.total)
    
    // 2. 获取前5条记录分析数据结构
    const sampleResult = await collection.limit(5).get()
    console.log('样本数据数量:', sampleResult.data.length)
    
    const analysis = {
      totalCount: totalCount.total,
      sampleCount: sampleResult.data.length,
      fieldAnalysis: {},
      statusAnalysis: {},
      visibilityAnalysis: {},
      sampleData: []
    }
    
    // 3. 分析字段
    if (sampleResult.data.length > 0) {
      const firstRecord = sampleResult.data[0]
      analysis.fieldAnalysis = {
        allFields: Object.keys(firstRecord),
        hasStatus: 'status' in firstRecord,
        hasIsVisible: 'isVisible' in firstRecord,
        hasIsHot: 'isHot' in firstRecord,
        hasIsNew: 'isNew' in firstRecord
      }
      
      // 分析每条样本数据
      sampleResult.data.forEach((record, index) => {
        analysis.sampleData.push({
          index: index + 1,
          _id: record._id,
          name: record.name || record.title,
          status: record.status,
          statusType: typeof record.status,
          isVisible: record.isVisible,
          isVisibleType: typeof record.isVisible,
          isHot: record.isHot,
          isHotType: typeof record.isHot,
          isNew: record.isNew,
          isNewType: typeof record.isNew
        })
      })
    }
    
    // 4. 如果有数据，分析所有记录的 status 和 isVisible 分布
    if (totalCount.total > 0 && totalCount.total <= 100) { // 只在数据量不大时进行全量分析
      const allData = await collection.get()
      
      // 统计 status 值分布
      allData.data.forEach(record => {
        const statusKey = `${record.status} (${typeof record.status})`
        analysis.statusAnalysis[statusKey] = (analysis.statusAnalysis[statusKey] || 0) + 1
        
        const visibilityKey = `${record.isVisible} (${typeof record.isVisible})`
        analysis.visibilityAnalysis[visibilityKey] = (analysis.visibilityAnalysis[visibilityKey] || 0) + 1
      })
    }
    
    console.log('调试分析结果:', analysis)
    
    return {
      success: true,
      data: analysis
    }
    
  } catch (error) {
    console.error('调试查询失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

/**
 * 根据ID获取单个产品
 */
async function getProductById(params) {
  const { id } = params
  console.log('获取产品详情:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  const result = await db.collection('products').doc(id).get()
  
  if (!result.data) {
    throw new Error('产品不存在')
  }
  
  console.log('获取产品详情成功:', result.data.name || result.data.title)
  
  return { 
    success: true, 
    data: result.data 
  }
}

/**
 * 获取分类列表
 */
async function getCategories(params = {}) {
  console.log('获取分类列表')
  
  // 从产品中提取分类信息
  const result = await db.collection('products')
    .field({ categoryId: true, categoryName: true })
    .get()
  
  // 去重并统计
  const categoryMap = new Map()
  result.data.forEach(product => {
    if (product.categoryId && product.categoryName) {
      if (!categoryMap.has(product.categoryId)) {
        categoryMap.set(product.categoryId, {
          id: product.categoryId,
          name: product.categoryName,
          count: 0
        })
      }
      categoryMap.get(product.categoryId).count++
    }
  })
  
  const categories = Array.from(categoryMap.values())
  console.log(`获取到 ${categories.length} 个分类`)
  
  return { 
    success: true, 
    data: categories 
  }
}

/**
 * 添加产品（管理员功能）
 */
async function addProduct(productData, wxContext) {
  console.log('添加产品:', productData.name)
  
  const result = await db.collection('products').add({
    data: {
      ...productData,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      creator: wxContext.OPENID,
      isVisible: productData.isVisible !== false // 默认可见
    }
  })
  
  console.log('产品添加成功:', result._id)
  
  return { 
    success: true, 
    id: result._id 
  }
}

/**
 * 更新产品（管理员功能）
 */
async function updateProduct(params, wxContext) {
  const { id, ...updateData } = params
  console.log('更新产品:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  const result = await db.collection('products').doc(id).update({
    data: {
      ...updateData,
      updateTime: db.serverDate(),
      updater: wxContext.OPENID
    }
  })
  
  console.log('产品更新成功')
  
  return { 
    success: true,
    updated: result.stats.updated
  }
}

/**
 * 删除产品（管理员功能）
 */
async function deleteProduct(params, wxContext) {
  const { id } = params
  console.log('删除产品:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  // 软删除：设置为不可见
  const result = await db.collection('products').doc(id).update({
    data: {
      isVisible: false,
      deleteTime: db.serverDate(),
      deleter: wxContext.OPENID
    }
  })
  
  console.log('产品删除成功（软删除）')
  
  return { 
    success: true,
    updated: result.stats.updated
  }
}
