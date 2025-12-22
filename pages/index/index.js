// index.js
const productData = require('../../utils/productData.js');
const AdminAuth = require('../../utils/admin-auth.js');

Page({
  data: {
    showMenu: false, // 控制侧边菜单显示
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    banners: [], // 轮播图数据
    hotProducts: [], // 热门产品
    newProducts: [], // 新品
    categories: [], // 分类数据
    loading: true, // 加载状态
    
    // 管理员入口相关
    logoClickCount: 0,
    logoClickTimer: null,
    showGestureInput: false,
    adminGestureSequence: [],
    gestureConfig: null
  },
  
  onLoad: function() {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    // 设置状态栏高度
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44; // 固定导航栏高度
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight
    });
    
    // 设置CSS变量，用于轮播图顶部间距计算
    wx.nextTick(() => {
      const root = wx.createSelectorQuery().selectViewport();
      root.fields({ node: true, size: true }, res => {
        if (res && res.node) {
          res.node.style.setProperty('--status-bar-height', statusBarHeight + 'px');
        }
      }).exec();
    });
    
    // 加载数据
    this.loadData();
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadData();
  },
  
  // 加载数据
  async loadData() {
    try {
      wx.showLoading({
        title: '加载中...',
      });
      
      // 并行加载数据
      const [hotProductsResult, newProductsResult, categoriesResult, bannersResult] = await Promise.all([
        this.loadHotProducts(),
        this.loadNewProducts(),
        this.loadCategories(),
        this.loadBanners()
      ]);
      
      this.setData({
        hotProducts: hotProductsResult,
        newProducts: newProductsResult,
        categories: categoriesResult,
        banners: bannersResult,
        loading: false
      });
      
      wx.hideLoading();
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载首页数据失败', error);
      wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },
  
  // 加载热门产品
  async loadHotProducts() {
    // 修改：明确传递 isHot: true 参数，确保获取数据库中 isHot: "TRUE" 的产品
    return await productData.getHotProducts({ limit: 4, isHot: true });
  },
  
  // 加载新品
  async loadNewProducts() {
    const result = await productData.getNewProducts({ limit: 4 });
    // getNewProducts 返回 { products: [...], total: ... }，我们只需要 products 数组
    return result.products || [];
  },
  
  // 加载分类
  async loadCategories() {
    return await productData.getCategories();
  },
  
  // 加载轮播图
  async loadBanners() {
    return await productData.getBanners();
  },
  
  // 切换侧边菜单
  toggleMenu: function() {
    this.setData({
      showMenu: !this.data.showMenu
    });
  },
  
  // 导航到首页
  navigateToHome: function() {
    this.setData({
      showMenu: false
    });
    // 已经在首页，不需要跳转
  },
  
  // 跳转到分类页
  navigateToCategory: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      showMenu: false
    });
    
    console.log('首页跳转到分类页，分类类型:', type);
    
    // 确保全局数据对象存在
    const app = getApp();
    if (!app.globalData) {
      app.globalData = {};
    }
    if (!app.globalData.eventChannel) {
      app.globalData.eventChannel = {};
    }
    
    // 设置分类类型到全局数据
    app.globalData.eventChannel.categoryType = type;
    
    // 使用switchTab跳转到分类页
    wx.switchTab({
      url: '/pages/category/category',
      success: function() {
        console.log('成功跳转到分类页，分类类型:', type);
      },
      fail: function(error) {
        console.error('跳转到分类页失败:', error);
      }
    });
  },
  
  // 跳转到产品详情页
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('首页点击产品，ID:', id);
    
    if (!id) {
      console.error('首页点击产品，但ID为空');
      wx.showToast({
        title: '产品ID不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=' + id,
      success: function() {
        console.log('成功跳转到详情页，ID:', id);
      },
      fail: function(error) {
        console.error('跳转到详情页失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 轮播图点击跳转到对应分类页面
  navigateToBannerCategory: function(e) {
    const categoryName = e.currentTarget.dataset.category;
    console.log('轮播图点击，分类名称:', categoryName);
    
    if (!categoryName) {
      console.error('轮播图点击，但分类名称为空');
      return;
    }

    // 去掉分类名称前面的符号（✧ 或 ✦）
    const cleanCategoryName = categoryName.replace(/^[✧✦]\s*/, '');
    console.log('清理后的分类名称:', cleanCategoryName);
    
    // 确保全局数据对象存在
    const app = getApp();
    if (!app.globalData) {
      app.globalData = {};
    }
    if (!app.globalData.eventChannel) {
      app.globalData.eventChannel = {};
    }
    
    // 设置分类类型到全局数据
    app.globalData.eventChannel.categoryType = cleanCategoryName;
    
    // 跳转到分类页
    wx.switchTab({
      url: '/pages/category/category',
      success: function() {
        console.log('轮播图成功跳转到分类页，分类:', cleanCategoryName);
      },
      fail: function(error) {
        console.error('轮播图跳转到分类页失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 跳转到新品列表页
  navigateToNewProducts: function() {
    wx.navigateTo({
      url: '/pages/new-products/new-products',
      success: function() {
        console.log('成功跳转到新品列表页');
      },
      fail: function(error) {
        console.error('跳转到新品列表页失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 跳转到品牌页
  navigateToBrand: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/brand/brand'
    });
  },
  
  // 跳转到选购页面
  navigateToContact: function() {
    wx.switchTab({
      url: '/pages/contact/contact'
    });
  },

  // 跳转到收藏页面
  navigateToFavorite: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/favorite/favorite'
    });
  },


  // ==================== 管理员入口相关方法 ====================
  
  // Logo点击事件（需要在WXML中绑定到Logo）
  onLogoTap: function() {
    this.data.logoClickCount++;
    console.log('Logo点击次数:', this.data.logoClickCount);
    
    if (this.data.logoClickTimer) {
      clearTimeout(this.data.logoClickTimer);
    }
    
    // 3秒内连续点击5次
    this.data.logoClickTimer = setTimeout(() => {
      this.setData({ logoClickCount: 0 });
    }, 3000);
    
    if (this.data.logoClickCount >= 5) {
      this.showAdminGestureInput();
      this.setData({ logoClickCount: 0 });
    }
  },

  // 显示管理员手势输入
  showAdminGestureInput: function() {
    const adminAuth = new AdminAuth();
    const gestureConfig = adminAuth.getGestureConfig();
    
    this.setData({ 
      showGestureInput: true,
      adminGestureSequence: [],
      gestureConfig: gestureConfig
    });
    
    wx.showToast({
      title: '请输入手势密码',
      icon: 'none',
      duration: 2000
    });
  },

  // 手势输入处理
  onGestureInput: function(e) {
    if (!this.data.showGestureInput) return;
    
    const gesture = e.currentTarget.dataset.gesture;
    const sequence = [...this.data.adminGestureSequence, gesture];
    
    console.log('手势输入:', gesture, '当前序列:', sequence);
    
    this.setData({ adminGestureSequence: sequence });
    
    // 检查手势序列
    if (sequence.length === this.data.gestureConfig.requiredSequence.length) {
      const adminAuth = new AdminAuth();
      if (adminAuth.validateGestureSequence(sequence)) {
        console.log('手势验证成功');
        this.checkAdminAccess();
      } else {
        console.log('手势验证失败');
        wx.showToast({
          title: '手势错误',
          icon: 'error'
        });
        this.resetGestureInput();
      }
    }
  },

  // 重置手势输入
  resetGestureInput: function() {
    setTimeout(() => {
      this.setData({ 
        showGestureInput: false,
        adminGestureSequence: [],
        gestureConfig: null
      });
    }, 1500);
  },

  // 取消手势输入
  cancelGestureInput: function() {
    this.setData({ 
      showGestureInput: false,
      adminGestureSequence: [],
      gestureConfig: null
    });
  },

  // 检查管理员访问权限
  checkAdminAccess: async function() {
    wx.showLoading({ title: '验证中...' });
    
    try {
      const adminAuth = new AdminAuth();
      const result = await adminAuth.checkAdminAccess();
      
      wx.hideLoading();
      
      if (result.success) {
        wx.showToast({
          title: '验证成功',
          icon: 'success'
        });
        
        // 跳转到管理后台
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/admin/admin'
          });
        }, 1500);
      } else {
        wx.showModal({
          title: '访问被拒绝',
          content: result.error,
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: '验证失败',
        content: error.message,
        showCancel: false
      });
    }
    
    this.resetGestureInput();
  }
});
