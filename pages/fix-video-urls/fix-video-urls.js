// pages/fix-video-urls/fix-video-urls.js
Page({
  data: {
    isFixing: false,
    fixResults: null,
    previewResults: null,
    showPreview: false,
    logs: []
  },

  onLoad: function (options) {
    console.log('视频URL修复页面加载');
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

  // 预览修复效果
  previewFix: function() {
    this.addLog('开始预览修复效果...');
    
    wx.showLoading({
      title: '预览中...',
      mask: true
    });

    wx.cloud.callFunction({
      name: 'fixVideoUrls',
      data: {
        action: 'previewFix',
        data: {
          limit: 20
        }
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.success) {
        this.setData({
          previewResults: res.result,
          showPreview: true
        });
        
        this.addLog(`预览完成: 检查了 ${res.result.totalChecked} 个产品，${res.result.needsFixCount} 个需要修复`);
        
        wx.showToast({
          title: '预览完成',
          icon: 'success'
        });
      } else {
        this.addLog('预览失败: ' + res.result.error);
        wx.showToast({
          title: '预览失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('预览修复失败:', err);
      this.addLog('预览修复失败: ' + err.message);
      
      wx.showToast({
        title: '预览失败',
        icon: 'none'
      });
    });
  },

  // 执行修复
  startFix: function() {
    wx.showModal({
      title: '确认修复',
      content: '确定要修复所有产品的视频URL吗？此操作将修改数据库数据。',
      success: (res) => {
        if (res.confirm) {
          this.performFix();
        }
      }
    });
  },

  // 执行修复操作
  performFix: function() {
    this.setData({
      isFixing: true,
      fixResults: null
    });

    this.addLog('开始修复所有产品的视频URL...');

    wx.showLoading({
      title: '修复中...',
      mask: true
    });

    wx.cloud.callFunction({
      name: 'fixVideoUrls',
      data: {
        action: 'fixAllVideoUrls'
      }
    }).then(res => {
      wx.hideLoading();
      
      this.setData({
        isFixing: false
      });

      if (res.result.success) {
        this.setData({
          fixResults: res.result
        });

        this.addLog(`修复完成: 处理了 ${res.result.totalProcessed} 个产品，修复了 ${res.result.totalFixed} 个产品`);

        wx.showModal({
          title: '修复完成',
          content: `成功处理 ${res.result.totalProcessed} 个产品，修复了 ${res.result.totalFixed} 个产品的视频URL格式。`,
          showCancel: false
        });
      } else {
        this.addLog('修复失败: ' + res.result.error);
        
        wx.showModal({
          title: '修复失败',
          content: res.result.error,
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      
      this.setData({
        isFixing: false
      });

      console.error('修复失败:', err);
      this.addLog('修复失败: ' + err.message);

      wx.showModal({
        title: '修复失败',
        content: '修复过程中发生错误: ' + err.message,
        showCancel: false
      });
    });
  },

  // 清空日志
  clearLogs: function() {
    this.setData({
      logs: []
    });
  },

  // 隐藏预览
  hidePreview: function() {
    this.setData({
      showPreview: false
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});




































