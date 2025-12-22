// cloudfunctions/productManager/index.js - 完整修复版本
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
  // 🔧 修复点1: 确保 data 不为 undefined
  const { action, data = {} } = event
  const wxContext = cloud.getWXContext()
  
  console.log('🔍 [productManager] 云函数被调用:', { action, data, openid: wxContext.OPENID })
  
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
      case 'migrateData':
        return await migrateData(data, wxContext)
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
 */
async function getProducts(params = {}) {
  console.log('🔍 [getProducts] 接收参数:', params)
  
  // 🔧 修复点2: 安全处理所有参数，提供默认值
  const { 
    categoryId, 
    page = 1, 
    limit = -1,  // 保持 -1 作为获取全部数据的标识
    isHot, 
    isNew, 
    isRecommended,
    keyword,
    includeHidden = false
  } = params
  
  // 🔧 修复点3: 处理 limit 参数，避免数据库错误
  let dbLimit
  let skipCount = 0
  
  if (limit === -1) {
    // 获取全部数据时，使用足够大的数字而不是 -1
    dbLimit = 10000
    skipCount = 0
  } else if (limit && limit > 0) {
    dbLimit = Math.min(limit, 1000) // 限制最大查询数量
    skipCount = (page - 1) * dbLimit
  } else {
    dbLimit = 100 // 默认分页大小
    skipCount = (page - 1) * dbLimit
  }
  
  console.log('📋 [getProducts] 处理后的分页参数:', { dbLimit, skipCount, originalLimit: limit })
  
  try {
    // 🔧 修复点4: 构建查询条件，确保类型匹配
    let query = db.collection('products')
    
    // 可见性筛选 - 简化逻辑
    if (!includeHidden) {
      query = query.where({
        isVisible: true
      })
    }
    
    // 分类筛选
    if (categoryId) {
      query = query.where({ categoryId: categoryId })
    }
    
    // 布尔值筛选 - 只处理明确为 true 的情况
    if (isHot === true) {
      query = query.where({ isHot: true })
    }
    if (isNew === true) {
      query = query.where({ isNew: true })
    }
    if (isRecommended === true) {
      query = query.where({ isRecommended: true })
    }
    
    // 关键词搜索
    if (keyword && typeof keyword === 'string') {
      query = query.where({
        name: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
    }
    
    // 获取总数
    const countResult = await query.count()
    console.log(`📊 [getProducts] 符合条件的产品总数: ${countResult.total}`)
    
    // 获取数据
    let result
    if (limit === -1) {
      // 🔧 修复点5: 获取全部数据时的安全处理
      result = await query
        .orderBy('_id', 'asc') // 使用简单的排序避免字段不存在问题
        .limit(dbLimit)
        .get()
    } else {
      // 正常分页
      result = await query
        .orderBy('_id', 'asc')
        .skip(skipCount)
        .limit(dbLimit)
        .get()
    }
    
    console.log(`✅ [getProducts] 成功获取 ${result.data.length} 个产品`)
    
    return { 
      success: true, 
      data: result.data,
      total: countResult.total,
      page: page,
      limit: limit,
      returned: result.data.length
    }
    
  } catch (error) {
    console.error('❌ [getProducts] 查询失败:', error)
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    }
  }
}

/**
 * 获取单个产品详情
 */
async function getProductById(params) {
  const { id } = params
  
  console.log('🔍 [getProductById] 查询产品:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  try {
    const result = await db.collection('products').doc(id).get()
    
    if (!result.data) {
      throw new Error('产品不存在')
    }
    
    console.log('✅ [getProductById] 产品详情获取成功:', result.data.name)
    
    return { 
      success: true, 
      data: result.data 
    }
  } catch (error) {
    console.error('❌ [getProductById] 查询失败:', error)
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

/**
 * 获取分类列表
 */
async function getCategories(params = {}) {
  console.log('🔍 [getCategories] 获取分类列表')
  
  try {
    const result = await db.collection('categories').get()
    
    console.log(`✅ [getCategories] 成功获取 ${result.data.length} 个分类`)
    
    return { 
      success: true, 
      data: result.data 
    }
  } catch (error) {
    console.error('❌ [getCategories] 查询失败:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * 添加产品（管理员功能）
 */
async function addProduct(productData, wxContext) {
  console.log('🔍 [addProduct] 添加产品:', productData.name)
  
  try {
    const result = await db.collection('products').add({
      data: {
        ...productData,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        creator: wxContext.OPENID
      }
    })
    
    console.log('✅ [addProduct] 产品添加成功:', result._id)
    
    return { 
      success: true, 
      id: result._id 
    }
  } catch (error) {
    console.error('❌ [addProduct] 添加失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 更新产品（管理员功能）
 */
async function updateProduct(params, wxContext) {
  const { id, ...updateData } = params
  
  console.log('🔍 [updateProduct] 更新产品:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  try {
    const result = await db.collection('products').doc(id).update({
      data: {
        ...updateData,
        updateTime: db.serverDate(),
        updater: wxContext.OPENID
      }
    })
    
    console.log('✅ [updateProduct] 产品更新成功:', result.stats.updated)
    
    return { 
      success: true, 
      updated: result.stats.updated 
    }
  } catch (error) {
    console.error('❌ [updateProduct] 更新失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 删除产品（管理员功能）
 */
async function deleteProduct(params, wxContext) {
  const { id } = params
  
  console.log('🔍 [deleteProduct] 删除产品:', id)
  
  if (!id) {
    throw new Error('产品ID不能为空')
  }
  
  try {
    const result = await db.collection('products').doc(id).remove()
    
    console.log('✅ [deleteProduct] 产品删除成功:', result.stats.removed)
    
    return { 
      success: true, 
      deleted: result.stats.removed 
    }
  } catch (error) {
    console.error('❌ [deleteProduct] 删除失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 数据迁移功能
 */
async function migrateData(params, wxContext) {
  const { products, categories } = params
  
  console.log('🔍 [migrateData] 开始数据迁移...', { 
    categoriesCount: categories?.length || 0, 
    productsCount: products?.length || 0 
  })
  
  const results = {
    products: { success: 0, failed: 0, errors: [] },
    categories: { success: 0, failed: 0, errors: [] }
  }
  
  try {
    // 迁移分类数据
    if (categories && categories.length > 0) {
      for (const category of categories) {
        try {
          const { _id, ...categoryData } = category
          
          await db.collection('categories').doc(category._id).set({
            data: {
              ...categoryData,
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          })
          
          results.categories.success++
          
        } catch (error) {
          console.error(`分类迁移失败: ${category.name}`, error)
          results.categories.failed++
          results.categories.errors.push({
            id: category._id,
            name: category.name,
            error: error.message
          })
        }
      }
    }
    
    // 迁移产品数据
    if (products && products.length > 0) {
      for (const product of products) {
        try {
          const { _id, ...productData } = product
          
          await db.collection('products').doc(product._id).set({
            data: {
              ...productData,
              createTime: db.serverDate(),
              updateTime: db.serverDate(),
              migrator: wxContext.OPENID
            }
          })
          
          results.products.success++
          
        } catch (error) {
          console.error(`产品迁移失败: ${product.name}`, error)
          results.products.failed++
          results.products.errors.push({
            id: product._id,
            name: product.name,
            error: error.message
          })
        }
      }
    }
    
    console.log('✅ [migrateData] 数据迁移完成:', results)
    
    return {
      success: true,
      results
    }
  } catch (error) {
    console.error('❌ [migrateData] 迁移失败:', error)
    return {
      success: false,
      error: error.message,
      results
    }
  }
}













