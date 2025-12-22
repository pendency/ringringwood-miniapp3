// pages/fix-database-local/fix-database-local.js
Page({
  data: {
    isFixing: false,
    fixResult: null,
    logs: [],
    progress: 0,
    totalProducts: 0,
    fixedProducts: 0
  },

  onLoad() {
    console.log('本地数据库修复页面加载')
  },

  /**
   * 开始修复数据库URL（本地版本）
   */
  async startFix() {
    if (this.data.isFixing) {
      return
    }

    this.setData({
      isFixing: true,
      fixResult: null,
      logs: ['开始修复数据库URL格式...'],
      progress: 0,
      totalProducts: 0,
      fixedProducts: 0
    })

    try {
      console.log('开始本地修复数据库URL...')
      
      // 初始化云开发
      if (!wx.cloud) {
        throw new Error('云开发未初始化')
      }

      const db = wx.cloud.database()
      
      // 获取所有产品
      this.addLog('正在获取产品数据...')
      const { data: products } = await db.collection('products').get()
      
      this.setData({
        totalProducts: products.length
      })
      
      this.addLog(`找到 ${products.length} 个产品`)

      let fixedCount = 0
      const fixResults = []

      // 逐个处理产品
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const progress = Math.round(((i + 1) / products.length) * 100)
        
        this.setData({
          progress: progress
        })

        let needUpdate = false
        const updates = {}
        const productFixes = []

        // 检查并修复 features 中的视频URL
        if (product.features && product.features.length > 0) {
          const fixedFeatures = product.features.map(feature => {
            if (feature.type === 'video' && feature.video) {
              const oldUrl = feature.video
              const newUrl = this.fixCloudUrl(oldUrl)
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
              const newUrl = this.fixCloudUrl(oldUrl)
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
          const fixedImageUrls = product.imageUrls.map(url => this.fixCloudUrl(url))
          if (JSON.stringify(product.imageUrls) !== JSON.stringify(fixedImageUrls)) {
            console.log(`修复图片URL: ${product.imageUrls.length} 个`)
            productFixes.push(`图片URL: ${product.imageUrls.length} 个`)
            needUpdate = true
            updates.imageUrls = fixedImageUrls
          }
        }

        if (product.images && product.images.length > 0) {
          const fixedImages = product.images.map(url => this.fixCloudUrl(url))
          if (JSON.stringify(product.images) !== JSON.stringify(fixedImages)) {
            console.log(`修复详情图URL: ${product.images.length} 个`)
            productFixes.push(`详情图URL: ${product.images.length} 个`)
            needUpdate = true
            updates.images = fixedImages
          }
        }

        // 更新数据库
        if (needUpdate) {
          try {
            await db.collection('products').doc(product._id).update({
              data: updates
            })
            fixedCount++
            fixResults.push({
              productId: product._id,
              productName: product.name,
              fixes: productFixes
            })
            this.addLog(`已修复产品: ${product.name}`)
            
            this.setData({
              fixedProducts: fixedCount
            })
          } catch (error) {
            console.error(`修复产品 ${product.name} 失败:`, error)
            this.addLog(`修复产品 ${product.name} 失败: ${error.message}`)
          }
        }
      }

      this.addLog(`修复完成！共修复了 ${fixedCount} 个产品`)

      this.setData({
        fixResult: {
          success: true,
          totalProducts: products.length,
          fixedProducts: fixedCount,
          fixResults: fixResults,
          message: `成功修复了 ${fixedCount} 个产品的URL格式`
        }
      })

      wx.showToast({
        title: '修复成功',
        icon: 'success'
      })

    } catch (error) {
      console.error('修复失败:', error)
      
      this.addLog(`修复失败: ${error.message}`)

      wx.showToast({
        title: '修复失败',
        icon: 'error'
      })
    } finally {
      this.setData({
        isFixing: false
      })
    }
  },

  /**
   * 修复云存储URL格式
   * @param {string} url 原始URL
   * @returns {string} 修复后的URL
   */
  fixCloudUrl(url) {
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
  },

  /**
   * 添加日志
   */
  addLog(message) {
    const logs = this.data.logs
    logs.push(message)
    this.setData({
      logs: logs
    })
  },

  /**
   * 清空日志
   */
  clearLogs() {
    this.setData({
      logs: [],
      fixResult: null,
      progress: 0,
      totalProducts: 0,
      fixedProducts: 0
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  }
})





































