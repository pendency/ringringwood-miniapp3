// scripts/migrate-to-cloud-videos.js
// 将产品数据中的视频URL迁移到云存储

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云存储环境ID
const CLOUD_ENV_ID = '636c-cloud1-7gm53wok768268c9'

/**
 * 迁移视频URL到云存储
 */
async function migrateToCloudVideos() {
  console.log('开始迁移视频URL到云存储...')
  
  try {
    // 获取所有产品数据
    const result = await db.collection('products').get()
    const products = result.data
    
    console.log(`找到 ${products.length} 个产品，开始检查视频URL...`)
    
    let migratedCount = 0
    let errorCount = 0
    const migrationResults = []
    
    for (const product of products) {
      try {
        let needUpdate = false
        const originalProduct = JSON.parse(JSON.stringify(product))
        
        // 处理features中的视频URL
        if (product.features && Array.isArray(product.features)) {
          product.features.forEach((feature, index) => {
            if (feature.type === 'video' && feature.video) {
              const originalUrl = feature.video
              const migratedUrl = migrateVideoUrl(originalUrl)
              
              if (migratedUrl !== originalUrl) {
                console.log(`迁移产品 ${product.name} features[${index}] 视频URL:`)
                console.log(`  原始: ${originalUrl}`)
                console.log(`  迁移: ${migratedUrl}`)
                
                feature.video = migratedUrl
                needUpdate = true
                
                migrationResults.push({
                  productId: product._id,
                  productName: product.name,
                  type: 'feature',
                  index: index,
                  originalUrl: originalUrl,
                  migratedUrl: migratedUrl
                })
              }
            }
          })
        }
        
        // 处理videos字段
        if (product.videos && Array.isArray(product.videos)) {
          product.videos.forEach((video, index) => {
            if (video.url) {
              const originalUrl = video.url
              const migratedUrl = migrateVideoUrl(originalUrl)
              
              if (migratedUrl !== originalUrl) {
                console.log(`迁移产品 ${product.name} videos[${index}] URL:`)
                console.log(`  原始: ${originalUrl}`)
                console.log(`  迁移: ${migratedUrl}`)
                
                video.url = migratedUrl
                needUpdate = true
                
                migrationResults.push({
                  productId: product._id,
                  productName: product.name,
                  type: 'video',
                  index: index,
                  originalUrl: originalUrl,
                  migratedUrl: migratedUrl
                })
              }
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
              lastVideoMigration: db.serverDate()
            }
          })
          
          migratedCount++
          console.log(`✅ 产品 ${product.name} 的视频URL已迁移`)
        }
        
      } catch (error) {
        console.error(`❌ 迁移产品 ${product.name} 时出错:`, error)
        errorCount++
      }
    }
    
    console.log('\n=== 迁移完成 ===')
    console.log(`总产品数: ${products.length}`)
    console.log(`迁移成功: ${migratedCount}`)
    console.log(`迁移失败: ${errorCount}`)
    console.log(`迁移详情: ${migrationResults.length} 个URL被迁移`)
    
    if (migrationResults.length > 0) {
      console.log('\n迁移详情:')
      migrationResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.productName} (${result.type}[${result.index}])`)
        console.log(`   ${result.originalUrl}`)
        console.log(`   -> ${result.migratedUrl}`)
      })
    }
    
    return {
      success: true,
      totalProducts: products.length,
      migratedCount: migratedCount,
      errorCount: errorCount,
      migrationResults: migrationResults
    }
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 迁移单个视频URL
 */
function migrateVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return url
  }
  
  // 如果已经是云存储URL，不需要迁移
  if (url.startsWith('cloud://') || url.includes('tcb-api.tencentcloudapi.com')) {
    return url
  }
  
  // 示例URL迁移
  if (url.includes('example.com/videos/')) {
    const fileName = url.split('/').pop().split('#')[0]
    return `cloud://${CLOUD_ENV_ID}/products/videos/${fileName}`
  }
  
  // 本地路径迁移
  if (url.startsWith('/images/products/') && url.endsWith('.mp4')) {
    const fileName = url.split('/').pop()
    return `cloud://${CLOUD_ENV_ID}/products/videos/${fileName}`
  }
  
  // HTTP/HTTPS URL（如果指向本地文件）
  if (url.includes('/images/products/') && url.endsWith('.mp4')) {
    const fileName = url.split('/').pop()
    return `cloud://${CLOUD_ENV_ID}/products/videos/${fileName}`
  }
  
  // 其他情况不迁移
  return url
}

/**
 * 验证云存储中的视频文件
 */
async function validateCloudVideos() {
  console.log('开始验证云存储中的视频文件...')
  
  try {
    // 获取所有产品数据
    const result = await db.collection('products').get()
    const products = result.data
    
    const cloudVideoUrls = new Set()
    
    // 收集所有云存储视频URL
    products.forEach(product => {
      if (product.features && Array.isArray(product.features)) {
        product.features.forEach(feature => {
          if (feature.type === 'video' && feature.video && feature.video.startsWith('cloud://')) {
            cloudVideoUrls.add(feature.video)
          }
        })
      }
      
      if (product.videos && Array.isArray(product.videos)) {
        product.videos.forEach(video => {
          if (video.url && video.url.startsWith('cloud://')) {
            cloudVideoUrls.add(video.url)
          }
        })
      }
    })
    
    console.log(`找到 ${cloudVideoUrls.size} 个云存储视频URL`)
    
    // 验证文件是否存在
    const validationResults = []
    const fileList = Array.from(cloudVideoUrls)
    
    if (fileList.length > 0) {
      try {
        const tempUrlResult = await cloud.getTempFileURL({
          fileList: fileList
        })
        
        tempUrlResult.fileList.forEach(file => {
          validationResults.push({
            fileID: file.fileID,
            exists: file.status === 0,
            tempFileURL: file.tempFileURL,
            errMsg: file.errMsg
          })
        })
      } catch (error) {
        console.error('验证云存储文件时出错:', error)
      }
    }
    
    const existsCount = validationResults.filter(r => r.exists).length
    const missingCount = validationResults.filter(r => !r.exists).length
    
    console.log(`验证结果: ${existsCount} 个存在, ${missingCount} 个缺失`)
    
    if (missingCount > 0) {
      console.log('\n缺失的文件:')
      validationResults.filter(r => !r.exists).forEach(file => {
        console.log(`❌ ${file.fileID}: ${file.errMsg}`)
      })
    }
    
    return {
      success: true,
      totalFiles: cloudVideoUrls.size,
      existsCount: existsCount,
      missingCount: missingCount,
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
  migrateToCloudVideos,
  validateCloudVideos,
  migrateVideoUrl
}

// 如果直接运行此脚本
if (require.main === module) {
  (async () => {
    console.log('🚀 云存储视频迁移工具')
    console.log('========================')
    
    // 先迁移
    const migrationResult = await migrateToCloudVideos()
    console.log('迁移结果:', migrationResult)
    
    // 再验证
    if (migrationResult.success) {
      console.log('\n开始验证...')
      const validationResult = await validateCloudVideos()
      console.log('验证结果:', validationResult)
    }
  })()
}
