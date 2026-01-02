// customer-cases.js
// 客户案例展示页面
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7

const caseManager = require('../../utils/caseManager.js');

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    contentPaddingTop: 64,
    cases: [],
    loading: true,
    totalCases: 0
  },

  onLoad: function() {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44;
    const contentPaddingTop = statusBarHeight + navBarHeight;

    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      contentPaddingTop: contentPaddingTop
    });

    // 加载案例数据
    this.loadCases();
  },

  // 下拉刷新 - Requirements: 2.7
  onPullDownRefresh: function() {
    this.loadCases();
  },

  // 加载案例数据 - Requirements: 2.3, 2.6
  async loadCases() {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      // 调用云函数获取案例列表
      const res = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getCases',
          activeOnly: true
        }
      });

      if (res.result && res.result.success) {
        // 使用 caseManager 排序案例
        const sortedCases = caseManager.sortCases(res.result.data || []);
        
        this.setData({
          cases: sortedCases,
          totalCases: sortedCases.length,
          loading: false
        });
      } else {
        this.setData({
          cases: [],
          totalCases: 0,
          loading: false
        });
      }

      wx.hideLoading();
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载案例失败', error);
      this.setData({
        cases: [],
        totalCases: 0,
        loading: false
      });
      wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 预览案例图片 - Requirements: 2.5
  previewImage: function(e) {
    const imageUrl = e.currentTarget.dataset.url;
    if (imageUrl) {
      // 收集所有案例图片URL用于预览
      const urls = this.data.cases
        .filter(c => c.imageUrl)
        .map(c => c.imageUrl);
      
      wx.previewImage({
        current: imageUrl,
        urls: urls.length > 0 ? urls : [imageUrl]
      });
    }
  },

  // 处理导航栏返回事件
  onBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '年轮环环 - 定制案例',
      path: '/pages/customer-cases/customer-cases'
    };
  }
});
