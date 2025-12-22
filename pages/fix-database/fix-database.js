// pages/fix-database/fix-database.js
Page({
  data: {
    isFixing: false,
    fixResult: null,
    logs: []
  },

  onLoad() {
    console.log('数据库修复页面加载')
  },

  /**
   * 开始修复数据库URL
   */
  async startFix() {
    if (this.data.isFixing) {
      return
    }

    this.setData({
      isFixing: true,
      fixResult: null,
      logs: ['开始修复数据库URL格式...']
    })

    try {
      console.log('调用数据库修复云函数...')
      
      const result = await wx.cloud.callFunction({
        name: 'fixDatabaseUrls',
        data: {}
      })

      console.log('修复结果:', result.result)

      if (result.result.success) {
        this.setData({
          fixResult: result.result,
          logs: [
            ...this.data.logs,
            `修复完成！`,
            `总产品数: ${result.result.totalProducts}`,
            `修复产品数: ${result.result.fixedProducts}`,
            `修复详情: ${JSON.stringify(result.result.fixResults, null, 2)}`
          ]
        })

        wx.showToast({
          title: '修复成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.result.error || '修复失败')
      }
    } catch (error) {
      console.error('修复失败:', error)
      
      this.setData({
        logs: [
          ...this.data.logs,
          `修复失败: ${error.message}`
        ]
      })

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
   * 清空日志
   */
  clearLogs() {
    this.setData({
      logs: [],
      fixResult: null
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  }
})