// pages/video-migration/video-migration.js
// 视频迁移管理页面

Page({
  data: {
    isLoading: false,
    previewResult: null,
    migrationResult: null,
    validationResult: null,
    currentStep: 'preview' // preview, migrate, validate
  },

  onLoad: function() {
    console.log('视频迁移管理页面加载')
  },

  // 步骤1：预览迁移
  async previewMigration() {
    if (this.data.isLoading) return
    
    this.setData({
      isLoading: true,
      currentStep: 'preview'
    })
    
    wx.showLoading({
      title: '预览中...',
      mask: true
    })
    
    try {
      console.log('开始预览迁移...')
      
      const result = await wx.cloud.callFunction({
        name: 'videoMigration',
        data: {
          action: 'preview'
        }
      })
      
      console.log('预览结果:', result.result)
      
      if (result.result.success) {
        this.setData({
          previewResult: result.result
        })
        
        wx.showToast({
          title: `找到${result.result.willMigrateCount}个需要迁移的视频`,
          icon: 'success',
          duration: 3000
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('预览迁移失败:', error)
      wx.showToast({
        title: '预览失败: ' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({
        isLoading: false
      })
      wx.hideLoading()
    }
  },

  // 步骤2：执行迁移
  async executeMigration() {
    if (this.data.isLoading) return
    
    // 确认对话框
    const confirmResult = await this.showConfirmDialog(
      '确认迁移',
      `即将迁移${this.data.previewResult?.willMigrateCount || 0}个视频URL，此操作会修改数据库，是否继续？`
    )
    
    if (!confirmResult) {
      return
    }
    
    this.setData({
      isLoading: true,
      currentStep: 'migrate'
    })
    
    wx.showLoading({
      title: '迁移中...',
      mask: true
    })
    
    try {
      console.log('开始执行迁移...')
      
      const result = await wx.cloud.callFunction({
        name: 'videoMigration',
        data: {
          action: 'migrate'
        }
      })
      
      console.log('迁移结果:', result.result)
      
      if (result.result.success) {
        this.setData({
          migrationResult: result.result
        })
        
        wx.showToast({
          title: `迁移完成！成功${result.result.migratedCount}个`,
          icon: 'success',
          duration: 3000
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('执行迁移失败:', error)
      wx.showToast({
        title: '迁移失败: ' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({
        isLoading: false
      })
      wx.hideLoading()
    }
  },

  // 步骤3：验证结果
  async validateVideos() {
    if (this.data.isLoading) return
    
    this.setData({
      isLoading: true,
      currentStep: 'validate'
    })
    
    wx.showLoading({
      title: '验证中...',
      mask: true
    })
    
    try {
      console.log('开始验证视频...')
      
      const result = await wx.cloud.callFunction({
        name: 'videoMigration',
        data: {
          action: 'validate'
        }
      })
      
      console.log('验证结果:', result.result)
      
      if (result.result.success) {
        this.setData({
          validationResult: result.result
        })
        
        const { existsCount, missingCount } = result.result
        wx.showToast({
          title: `验证完成！存在${existsCount}个，缺失${missingCount}个`,
          icon: existsCount > 0 ? 'success' : 'none',
          duration: 3000
        })
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('验证视频失败:', error)
      wx.showToast({
        title: '验证失败: ' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({
        isLoading: false
      })
      wx.hideLoading()
    }
  },

  // 显示确认对话框
  showConfirmDialog(title, content) {
    return new Promise((resolve) => {
      wx.showModal({
        title: title,
        content: content,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  // 查看详细结果
  viewDetails(e) {
    const type = e.currentTarget.dataset.type
    let details = []
    let title = ''
    
    switch (type) {
      case 'preview':
        details = this.data.previewResult?.previewResults || []
        title = '预览详情'
        break
      case 'migration':
        details = this.data.migrationResult?.migrationResults || []
        title = '迁移详情'
        break
      case 'validation':
        details = this.data.validationResult?.results || []
        title = '验证详情'
        break
    }
    
    // 这里可以跳转到详情页面或显示详细信息
    console.log(title, details)
    
    wx.showToast({
      title: `${title}：${details.length}条记录`,
      icon: 'none'
    })
  },

  // 重置所有结果
  resetAll() {
    this.setData({
      previewResult: null,
      migrationResult: null,
      validationResult: null,
      currentStep: 'preview'
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 跳转到管理工具
  goToAdminTools() {
    wx.navigateTo({
      url: '/pages/admin-simple/admin-simple',
      success: function() {
        console.log('跳转到管理工具成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
})
