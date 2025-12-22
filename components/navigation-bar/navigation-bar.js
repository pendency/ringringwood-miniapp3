// components/navigation-bar/navigation-bar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: '年轮环环'
    },
    showBack: {
      type: Boolean,
      value: false
    },
    showMenu: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
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
    onBackTap: function() {
      // 触发父页面的返回事件
      this.triggerEvent('back');
      
      // 默认返回上一页
      wx.navigateBack({
        delta: 1
      });
    },
    
    onMenuTap: function() {
      // 触发父页面的菜单切换事件
      this.triggerEvent('toggle');
    }
  }
});