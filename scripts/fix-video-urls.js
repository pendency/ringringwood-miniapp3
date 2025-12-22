// scripts/fix-video-urls.js
// 修复云数据库中的视频URL问题

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 修复视频URL的主函数
 */
async function fixVideoUrls() {
  console.log('开始检查和修复视频URL...')
  
  try {
    // 获取所有产品数据
    const result = await db.collection('products').get()
    const products = result.data
    
    console.log(`找到 ${products.length} 个产品，开始检查视频URL...`)
    
    let fixedCount = 0
    let errorCount = 0
    const fixResults = []
    
    for (const product of products) {
      try {
        let needUpdate = false
        const originalProduct = JSON.parse(JSON.stringify(product))
        
        // 检查features中的视频URL
        if (product.features && Array.isArray(product.features)) {
          product.features.forEach((feature, index) => {
            if (feature.type === 'video' && feature.video) {
              const originalUrl = feature.video
              
              // 检查是否是示例URL
              if (originalUrl.includes('example.com/videos/')) {
                const fileName = originalUrl.split('/').pop().split('#')[0]
                const fixedUrl = `/images/products/${fileName}`
                
                console.log(`修复产品 ${product.name} 的视频URL:`)
                console.log(`  原始: ${originalUrl}`)
                console.log(`  修复: ${fixedUrl}`)
                
                feature.video = fixedUrl
                needUpdate = true
                
                fixResults.push({
                  productId: product._id,
                  productName: product.name,
                  featureIndex: index,
                  originalUrl: originalUrl,
                  fixedUrl: fixedUrl
                })
              }
            }
          })
        }
        
        // 检查videos字段（如果存在）
        if (product.videos && Array.isArray(product.videos)) {
          product.videos.forEach((video, index) => {
            if (video.url && video.url.includes('example.com/videos/')) {
              const originalUrl = video.url
              const fileName = originalUrl.split('/').pop().split('#')[0]
              const fixedUrl = `/images/products/${fileName}`
              
              console.log(`修复产品 ${product.name} 的videos字段URL:`)
              console.log(`  原始: ${originalUrl}`)
              console.log(`  修复: ${fixedUrl}`)
              
              video.url = fixedUrl
              needUpdate = true
              
              fixResults.push({
                productId: product._id,
                productName: product.name,
                videoIndex: index,
                originalUrl: originalUrl,
                fixedUrl: fixedUrl
              })
            }
          })
        }
        
        // 如果需要更新，则更新数据库
        if (needUpdate) {
          const { _id, ...updateData } = product
          
          await db.collection('products').doc(_id).update({
            data: {
              ...updateData,
              updateTime: db.serverDate(),
              lastVideoUrlFix: db.serverDate()
            }
          })
          
          fixedCount++
          console.log(`✅ 产品 ${product.name} 的视频URL已修复`)
        }
        
      } catch (error) {
        console.error(`❌ 修复产品 ${product.name} 时出错:`, error)
        errorCount++
      }
    }
    
    console.log('\n=== 修复完成 ===')
    console.log(`总产品数: ${products.length}`)
    console.log(`修复成功: ${fixedCount}`)
    console.log(`修复失败: ${errorCount}`)
    console.log(`修复详情: ${fixResults.length} 个URL被修复`)
    
    if (fixResults.length > 0) {
      console.log('\n修复详情:')
      fixResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.productName}`)
        console.log(`   ${result.originalUrl} -> ${result.fixedUrl}`)
      })
    }
    
    return {
      success: true,
      totalProducts: products.length,
      fixedCount: fixedCount,
      errorCount: errorCount,
      fixResults: fixResults
    }
    
  } catch (error) {
    console.error('修复过程中发生错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 验证视频文件是否存在（可选功能）
 */
async function validateVideoFiles() {
  console.log('开始验证视频文件...')
  
  try {
    // 获取所有产品数据
    const result = await db.collection('products').get()
    const products = result.data
    
    const videoUrls = new Set()
    
    // 收集所有视频URL
    products.forEach(product => {
      if (product.features && Array.isArray(product.features)) {
        product.features.forEach(feature => {
          if (feature.type === 'video' && feature.video) {
            videoUrls.add(feature.video)
          }
        })
      }
      
      if (product.videos && Array.isArray(product.videos)) {
        product.videos.forEach(video => {
          if (video.url) {
            videoUrls.add(video.url)
          }
        })
      }
    })
    
    console.log(`找到 ${videoUrls.size} 个唯一的视频URL`)
    
    const validationResults = []
    
    for (const url of videoUrls) {
      const result = {
        url: url,
        isLocal: url.startsWith('/images/products/'),
        isExample: url.includes('example.com'),
        isValid: false,
        error: null
      }
      
      if (result.isExample) {
        result.error = '示例URL，需要修复'
      } else if (result.isLocal) {
        result.isValid = true
      } else {
        result.error = '未知URL格式'
      }
      
      validationResults.push(result)
    }
    
    const validCount = validationResults.filter(r => r.isValid).length
    const exampleCount = validationResults.filter(r => r.isExample).length
    
    console.log(`验证结果: ${validCount} 个有效, ${exampleCount} 个示例URL需要修复`)
    
    return {
      success: true,
      totalUrls: videoUrls.size,
      validCount: validCount,
      exampleCount: exampleCount,
      results: validationResults
    }
    
  } catch (error) {
    console.error('验证过程中发生错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 导出函数
module.exports = {
  fixVideoUrls,
  validateVideoFiles
}

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    console.log('🔧 视频URL修复工具')
    console.log('==================')
    
    // 先验证
    const validationResult = await validateVideoFiles()
    console.log('验证结果:', validationResult)
    
    // 再修复
    if (validationResult.success && validationResult.exampleCount > 0) {
      console.log('\n开始修复...')
      const fixResult = await fixVideoUrls()
      console.log('修复结果:', fixResult)
    } else {
      console.log('没有需要修复的视频URL')
    }
  })()
}
