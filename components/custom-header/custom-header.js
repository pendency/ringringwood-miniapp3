// components/custom-header/custom-header.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: '年轮环环'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showMenu: false,
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44 // 默认导航栏高度
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached: function() {
      // 获取系统信息
      const windowInfo = wx.getWindowInfo();
      // 设置状态栏高度
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleMenu: function() {
      this.setData({
        showMenu: !this.data.showMenu
      });
    },
    
    navigateToHome: function() {
      this.setData({
        showMenu: false
      });
      wx.switchTab({
        url: '/pages/index/index'
      });
    },
    
    navigateToCategory: function(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({
        showMenu: false
      });
      wx.switchTab({
        url: '/pages/category/category',
        success: function() {
          // 传递参数到分类页
          const eventChannel = getApp().globalData.eventChannel = getApp().globalData.eventChannel || {};
          eventChannel.categoryType = type;
        }
      });
    },
    
    navigateToBrand: function() {
      this.setData({
        showMenu: false
      });
      wx.switchTab({
        url: '/pages/brand/brand'
      });
    }
  }
}); 