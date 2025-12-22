// cloudfunctions/fixDatabaseUrls/index.js
// 修复数据库中的云存储URL格式

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 云函数入口函数
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  console.log('开始修复数据库URL格式...', {
    openid: wxContext.OPENID,
    appid: wxContext.APPID
  })
  
  try {
    return await fixDatabaseUrls()
  } catch (error) {
    console.error('修复数据库URL失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

/**
 * 修复数据库中的云存储URL格式
 */
async function fixDatabaseUrls() {
  try {
    console.log('开始检查和修复数据库中的URL格式...')
    
    // 获取所有产品
    const { data: products } = await db.collection('products').get()
    console.log(`找到 ${products.length} 个产品`)
    
    let fixedCount = 0
    const fixResults = []
    
    for (const product of products) {
      let needUpdate = false
      const updates = {}
      const productFixes = []
      
      // 检查并修复 features 中的视频URL
      if (product.features && product.features.length > 0) {
        const fixedFeatures = product.features.map(feature => {
          if (feature.type === 'video' && feature.video) {
            const oldUrl = feature.video
            const newUrl = fixCloudUrl(oldUrl)
            if (oldUrl !== newUrl) {
              console.log(`修复视频URL: ${oldUrl} -> ${newUrl}`)
              productFixes.push(`视频URL: ${oldUrl} -> ${newUrl}`)
              needUpdate = true
              return { ...feature, video: newUrl }
            }
          }
          return feature
        })
        
        if (needUpdate) {
          updates.features = fixedFeatures
        }
      }
      
      // 检查并修复 videos 字段
      if (product.videos && product.videos.length > 0) {
        const fixedVideos = product.videos.map(video => {
          if (video.url) {
            const oldUrl = video.url
            const newUrl = fixCloudUrl(oldUrl)
            if (oldUrl !== newUrl) {
              console.log(`修复视频URL: ${oldUrl} -> ${newUrl}`)
              productFixes.push(`视频URL: ${oldUrl} -> ${newUrl}`)
              needUpdate = true
              return { ...video, url: newUrl }
            }
          }
          return video
        })
        
        if (needUpdate) {
          updates.videos = fixedVideos
        }
      }
      
      // 检查并修复图片URL
      if (product.imageUrls && product.imageUrls.length > 0) {
        const fixedImageUrls = product.imageUrls.map(url => fixCloudUrl(url))
        if (JSON.stringify(product.imageUrls) !== JSON.stringify(fixedImageUrls)) {
          console.log(`修复图片URL: ${product.imageUrls.length} 个`)
          productFixes.push(`图片URL: ${product.imageUrls.length} 个`)
          needUpdate = true
          updates.imageUrls = fixedImageUrls
        }
      }
      
      if (product.images && product.images.length > 0) {
        const fixedImages = product.images.map(url => fixCloudUrl(url))
        if (JSON.stringify(product.images) !== JSON.stringify(fixedImages)) {
          console.log(`修复详情图URL: ${product.images.length} 个`)
          productFixes.push(`详情图URL: ${product.images.length} 个`)
          needUpdate = true
          updates.images = fixedImages
        }
      }
      
      // 更新数据库
      if (needUpdate) {
        await db.collection('products').doc(product._id).update({
          data: updates
        })
        fixedCount++
        fixResults.push({
          productId: product._id,
          productName: product.name,
          fixes: productFixes
        })
        console.log(`已修复产品: ${product.name} (${product._id})`)
      }
    }
    
    console.log(`修复完成！共修复了 ${fixedCount} 个产品`)
    
    return {
      success: true,
      totalProducts: products.length,
      fixedProducts: fixedCount,
      fixResults: fixResults,
      message: `成功修复了 ${fixedCount} 个产品的URL格式`
    }
    
  } catch (error) {
    console.error('修复数据库URL失败:', error)
    throw error
  }
}

/**
 * 修复云存储URL格式
 * @param {string} url 原始URL
 * @returns {string} 修复后的URL
 */
function fixCloudUrl(url) {
  if (!url || typeof url !== 'string') {
    return url
  }
  
  // 如果不是云存储URL，直接返回
  if (!url.startsWith('cloud://')) {
    return url
  }
  
  // 修复长环境ID格式
  const oldPattern = /cloud:\/\/636c-cloud1-7gm53wok768268c9-1369425968\.636c-636c-cloud1-7gm53wok768268c9-1369425968-1330048780\//g
  const newPrefix = 'cloud://636c-cloud1-7gm53wok768268c9/'
  
  if (oldPattern.test(url)) {
    return url.replace(oldPattern, newPrefix)
  }
  
  // 修复其他可能的错误格式（只有环境ID过长的情况）
  const oldPattern2 = /cloud:\/\/636c-cloud1-7gm53wok768268c9-1369425968\//g
  if (oldPattern2.test(url)) {
    return url.replace(oldPattern2, newPrefix)
  }
  
  return url
}
