// new-products.js
const productData = require('../../utils/productData.js');

Page({
  data: {
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    products: [], // 产品列表
    loading: true,
    totalProducts: 0 // 总产品数
  },
  
  onLoad: function() {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    // 设置状态栏高度和内容区域顶部内边距
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44; // 固定导航栏高度
    const contentPaddingTop = statusBarHeight + navBarHeight;
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      contentPaddingTop: contentPaddingTop
    });
    
    // 加载新品数据
    this.loadNewProducts();
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadNewProducts();
  },
  
  // 加载新品数据
  async loadNewProducts() {
    try {
      wx.showLoading({
        title: '加载中...'
      });
      
      const result = await productData.getNewProducts();
      
      this.setData({
        products: result.products,
        totalProducts: result.total,
        loading: false
      });
      
      wx.hideLoading();
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载新品失败', error);
      this.setData({ loading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },
  
  // 跳转到产品详情页
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=' + id
    });
  },
  
  // 收藏/取消收藏
  toggleFavorite: function(e) {
    // 安全地阻止事件冒泡
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
    // 安全地获取数据
    const id = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : null;
    const item = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.item : null;
    
    // 使用公共产品数据模块处理收藏逻辑
    const isFavorite = productData.toggleProductFavorite(id, item);
    
    // 当前产品列表
    const products = this.data.products;
    const productIndex = products.findIndex(p => p._id === id);
    
    // 更新产品状态
    if (productIndex !== -1) {
      products[productIndex].isFavorite = isFavorite;
      
      this.setData({
        products: products
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
      title: '年轮环环 - 灵感上新',
      path: '/pages/new-products/new-products'
    };
  }
});