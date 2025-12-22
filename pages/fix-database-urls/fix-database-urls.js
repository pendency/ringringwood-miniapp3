// pages/fix-database-urls/fix-database-urls.js
Page({
  data: {
    isFixing: false,
    fixResults: null,
    logs: []
  },

  onLoad: function (options) {
    console.log('数据库URL修复页面加载');
    this.addLog('页面加载完成');
  },

  // 添加日志
  addLog: function(message) {
    const logs = this.data.logs;
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift(`[${timestamp}] ${message}`);
    
    // 限制日志数量
    if (logs.length > 50) {
      logs.splice(50);
    }
    
    this.setData({
      logs: logs
    });
  },

  // 开始修复数据库URL
  startFix: function() {
    wx.showModal({
      title: '确认修复',
      content: '确定要修复数据库中所有产品的URL格式吗？此操作将直接修改数据库数据。',
      success: (res) => {
        if (res.confirm) {
          this.performDatabaseFix();
        }
      }
    });
  },

  // 执行数据库修复
  async performDatabaseFix() {
    this.setData({
      isFixing: true,
      fixResults: null
    });

    this.addLog('开始修复数据库中的URL格式...');

    wx.showLoading({
      title: '修复中...',
      mask: true
    });

    try {
      // 调用云函数修复数据库URL
      const result = await wx.cloud.callFunction({
        name: 'fixVideoUrls',
        data: {
          action: 'fixDatabaseUrls'
        }
      });

      wx.hideLoading();
      
      this.setData({
        isFixing: false
      });

      if (result.result.success) {
        this.setData({
          fixResults: result.result
        });

        this.addLog(`修复完成: 处理了 ${result.result.totalProcessed} 个产品，修复了 ${result.result.totalFixed} 个产品`);

        wx.showModal({
          title: '修复完成',
          content: `成功处理 ${result.result.totalProcessed} 个产品，修复了 ${result.result.totalFixed} 个产品的URL格式。`,
          showCancel: false
        });
      } else {
        this.addLog('修复失败: ' + result.result.error);
        
        wx.showModal({
          title: '修复失败',
          content: result.result.error,
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      
      this.setData({
        isFixing: false
      });

      console.error('修复失败:', error);
      this.addLog('修复失败: ' + error.message);

      wx.showModal({
        title: '修复失败',
        content: '修复过程中发生错误: ' + error.message,
        showCancel: false
      });
    }
  },

  // 清空日志
  clearLogs: function() {
    this.setData({
      logs: []
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});




































