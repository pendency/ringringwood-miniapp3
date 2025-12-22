// pages/admin-simple/admin-simple.js
Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    contentPaddingTop: 64,
    activeTab: 'tools'
  },

  onLoad() {
    console.log('简化管理后台页面加载')
    
    // 获取系统信息
    try {
      const windowInfo = wx.getWindowInfo();
      const statusBarHeight = windowInfo.statusBarHeight;
      const navBarHeight = 44;
      const contentPaddingTop = statusBarHeight + navBarHeight;
      
      this.setData({
        statusBarHeight: statusBarHeight,
        navBarHeight: navBarHeight,
        contentPaddingTop: contentPaddingTop
      });
      
      console.log('系统信息设置完成', {
        statusBarHeight,
        navBarHeight,
        contentPaddingTop
      });
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换到标签页:', tab);
    this.setData({
      activeTab: tab
    });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  },

  // 跳转到数据库修复页面
  goToFixDatabase() {
    console.log('跳转到数据库修复页面');
    wx.navigateTo({
      url: '/pages/fix-database/fix-database',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到本地数据库修复页面
  goToFixDatabaseLocal() {
    console.log('跳转到本地数据库修复页面');
    wx.navigateTo({
      url: '/pages/fix-database-local/fix-database-local',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到全面数据库修复页面
  goToFixAllData() {
    console.log('跳转到全面数据库修复页面');
    wx.navigateTo({
      url: '/pages/fix-all-data/fix-all-data',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到视频迁移页面
  goToVideoMigration() {
    console.log('跳转到视频迁移页面');
    wx.navigateTo({
      url: '/pages/video-migration/video-migration',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到云存储测试页面
  goToCloudVideoTest() {
    console.log('跳转到云存储测试页面');
    wx.navigateTo({
      url: '/pages/cloud-video-test/cloud-video-test',
      success: function() {
        console.log('跳转成功');
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
