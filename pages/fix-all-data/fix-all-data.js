// pages/fix-all-data/fix-all-data.js
Page({
  data: {
    isFixing: false,
    fixResult: null,
    logs: [],
    progress: 0,
    currentStep: '',
    totalCollections: 0,
    fixedCollections: 0,
    allResults: []
  },

  onLoad() {
    console.log('全面数据修复页面加载')
  },

  /**
   * 开始全面修复数据库URL
   */
  async startFix() {
    if (this.data.isFixing) {
      return
    }

    this.setData({
      isFixing: true,
      fixResult: null,
      logs: ['开始全面修复数据库URL格式...'],
      progress: 0,
      currentStep: '初始化',
      totalCollections: 0,
      fixedCollections: 0,
      allResults: []
    })

    try {
      console.log('开始全面修复数据库URL...')
      
      // 初始化云开发
      if (!wx.cloud) {
        throw new Error('云开发未初始化')
      }

      const db = wx.cloud.database()
      
      // 定义需要检查的集合和字段
      const collectionsToFix = [
        {
          name: 'products',
          fields: [
            'features[].video',
            'videos[].url', 
            'imageUrls[]',
            'images[]',
            'video', // 可能的直接视频字段
            'videoUrl' // 可能的视频URL字段
          ]
        },
        {
          name: 'categories',
          fields: [
            'imageUrl',
            'images[]',
            'videos[]'
          ]
        },
        {
          name: 'banners',
          fields: [
            'imageUrl',
            'videoUrl',
            'images[]'
          ]
        },
        {
          name: 'settings',
          fields: [
            'logoUrl',
            'backgroundImage',
            'videos[]'
          ]
        }
      ]

      this.setData({
        totalCollections: collectionsToFix.length
      })

      let totalFixed = 0
      const allResults = []

      // 逐个处理集合
      for (let i = 0; i < collectionsToFix.length; i++) {
        const collection = collectionsToFix[i]
        const progress = Math.round(((i + 1) / collectionsToFix.length) * 100)
        
        this.setData({
          progress: progress,
          currentStep: `修复 ${collection.name} 集合`,
          fixedCollections: i
        })

        this.addLog(`正在处理 ${collection.name} 集合...`)

        try {
          // 获取集合中的所有数据
          const { data: documents } = await db.collection(collection.name).get()
          this.addLog(`${collection.name}: 找到 ${documents.length} 条记录`)

          let collectionFixed = 0
          const collectionResults = []

          // 逐个处理文档
          for (const doc of documents) {
            const { fixed, updates, fixes } = this.processDocument(doc, collection.fields)
            
            if (fixed) {
              try {
                await db.collection(collection.name).doc(doc._id).update({
                  data: updates
                })
                collectionFixed++
                totalFixed++
                collectionResults.push({
                  docId: doc._id,
                  fixes: fixes
                })
                this.addLog(`${collection.name}: 已修复文档 ${doc._id}`)
              } catch (error) {
                console.error(`修复文档失败:`, error)
                this.addLog(`${collection.name}: 修复文档 ${doc._id} 失败: ${error.message}`)
              }
            }
          }

          allResults.push({
            collection: collection.name,
            totalDocs: documents.length,
            fixedDocs: collectionFixed,
            results: collectionResults
          })

          this.addLog(`${collection.name}: 完成，修复了 ${collectionFixed} 条记录`)

        } catch (error) {
          console.error(`处理集合 ${collection.name} 失败:`, error)
          this.addLog(`处理集合 ${collection.name} 失败: ${error.message}`)
        }
      }

      this.setData({
        fixedCollections: collectionsToFix.length,
        allResults: allResults
      })

      this.addLog(`全面修复完成！共修复了 ${totalFixed} 条记录`)

      // 清理缓存
      this.addLog('正在清理缓存...')
      try {
        wx.clearStorageSync()
        this.addLog('缓存清理完成')
      } catch (error) {
        this.addLog('缓存清理失败: ' + error.message)
      }

      this.setData({
        fixResult: {
          success: true,
          totalFixed: totalFixed,
          collections: allResults,
          message: `成功修复了 ${totalFixed} 条记录，涉及 ${collectionsToFix.length} 个集合`
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
        isFixing: false,
        currentStep: '完成'
      })
    }
  },

  /**
   * 处理单个文档
   * @param {Object} doc 文档数据
   * @param {Array} fields 需要检查的字段
   * @returns {Object} 处理结果
   */
  processDocument(doc, fields) {
    let needUpdate = false
    const updates = {}
    const fixes = []

    // 检查 features 中的视频URL
    if (doc.features && Array.isArray(doc.features)) {
      const fixedFeatures = doc.features.map(feature => {
        if (feature.type === 'video' && feature.video) {
          const oldUrl = feature.video
          const newUrl = this.fixCloudUrl(oldUrl)
          if (oldUrl !== newUrl) {
            fixes.push(`features.video: ${oldUrl} -> ${newUrl}`)
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

    // 检查 videos 字段
    if (doc.videos && Array.isArray(doc.videos)) {
      const fixedVideos = doc.videos.map(video => {
        if (typeof video === 'string') {
          const newUrl = this.fixCloudUrl(video)
          if (video !== newUrl) {
            fixes.push(`videos[]: ${video} -> ${newUrl}`)
            needUpdate = true
            return newUrl
          }
          return video
        } else if (video && video.url) {
          const oldUrl = video.url
          const newUrl = this.fixCloudUrl(oldUrl)
          if (oldUrl !== newUrl) {
            fixes.push(`videos[].url: ${oldUrl} -> ${newUrl}`)
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

    // 检查图片URL数组
    if (doc.imageUrls && Array.isArray(doc.imageUrls)) {
      const fixedImageUrls = doc.imageUrls.map(url => this.fixCloudUrl(url))
      if (JSON.stringify(doc.imageUrls) !== JSON.stringify(fixedImageUrls)) {
        fixes.push(`imageUrls: ${doc.imageUrls.length} 个URL`)
        needUpdate = true
        updates.imageUrls = fixedImageUrls
      }
    }

    if (doc.images && Array.isArray(doc.images)) {
      const fixedImages = doc.images.map(url => this.fixCloudUrl(url))
      if (JSON.stringify(doc.images) !== JSON.stringify(fixedImages)) {
        fixes.push(`images: ${doc.images.length} 个URL`)
        needUpdate = true
        updates.images = fixedImages
      }
    }

    // 检查单个URL字段
    const singleUrlFields = ['video', 'videoUrl', 'imageUrl', 'logoUrl', 'backgroundImage']
    singleUrlFields.forEach(field => {
      if (doc[field] && typeof doc[field] === 'string') {
        const newUrl = this.fixCloudUrl(doc[field])
        if (doc[field] !== newUrl) {
          fixes.push(`${field}: ${doc[field]} -> ${newUrl}`)
          needUpdate = true
          updates[field] = newUrl
        }
      }
    })

    return {
      fixed: needUpdate,
      updates: updates,
      fixes: fixes
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
      currentStep: '',
      totalCollections: 0,
      fixedCollections: 0,
      allResults: []
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  }
})





































