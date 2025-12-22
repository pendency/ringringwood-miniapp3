// pages/temp-fix/temp-fix.js
Page({
  data: {
    isFixing: false,
    result: null
  },

  onLoad: function (options) {
    console.log('临时修复页面加载');
  },

  // 执行数据库URL修复
  fixDatabaseUrls: function() {
    this.setData({
      isFixing: true,
      result: null
    });

    console.log('开始修复数据库URL...');

    wx.showLoading({
      title: '修复中...',
      mask: true
    });

    wx.cloud.callFunction({
      name: 'fixVideoUrls',
      data: {
        action: 'fixDatabaseUrls'
      }
    }).then(res => {
      wx.hideLoading();
      
      this.setData({
        isFixing: false,
        result: res.result
      });

      console.log('修复完成，结果:', res.result);

      if (res.result.success) {
        wx.showModal({
          title: '修复完成',
          content: `成功处理 ${res.result.totalProcessed} 个产品，修复了 ${res.result.totalFixed} 个产品`,
          showCancel: false,
          success: () => {
            // 修复完成后可以跳转到产品详情页测试
            wx.showModal({
              title: '测试视频',
              content: '是否要跳转到产品详情页测试视频播放？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.navigateTo({
                    url: '/pages/product-detail/product-detail?id=custom_1' // 替换为实际的产品ID
                  });
                }
              }
            });
          }
        });
      } else {
        wx.showModal({
          title: '修复失败',
          content: res.result.error || '未知错误',
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      
      this.setData({
        isFixing: false
      });

      console.error('调用云函数失败:', err);

      wx.showModal({
        title: '调用失败',
        content: '云函数调用失败: ' + err.message,
        showCancel: false
      });
    });
  },

  // 测试单个产品修复
  fixSingleProduct: function() {
    const productId = 'custom_1'; // 替换为实际的产品ID

    wx.cloud.callFunction({
      name: 'fixVideoUrls',
      data: {
        action: 'fixProductVideoUrls',
        data: { productId: productId }
      }
    }).then(res => {
      console.log('单个产品修复结果:', res.result);
      wx.showToast({
        title: res.result.success ? '修复成功' : '修复失败',
        icon: res.result.success ? 'success' : 'none'
      });
    }).catch(err => {
      console.error('修复单个产品失败:', err);
      wx.showToast({
        title: '修复失败',
        icon: 'none'
      });
    });
  },

  // 预览修复效果
  previewFix: function() {
    wx.cloud.callFunction({
      name: 'fixVideoUrls',
      data: {
        action: 'previewFix',
        data: { limit: 5 }
      }
    }).then(res => {
      console.log('预览修复效果:', res.result);
      
      if (res.result.success) {
        const preview = res.result;
        wx.showModal({
          title: '预览结果',
          content: `检查了 ${preview.totalChecked} 个产品，${preview.needsFixCount} 个需要修复`,
          showCancel: false
        });
      }
    }).catch(err => {
      console.error('预览失败:', err);
    });
  }
});




































