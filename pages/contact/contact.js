// contact.js
const productData = require('../../utils/productData.js');

Page({
  data: {
    showMenu: false, // 控制侧边菜单显示
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    categories: [], // 🆕 分类列表（用于侧边栏）
    contactPhone: '15794781359', // 在这里修改电话号码
    contactWechat: '15794781359', // 在这里修改微信号
    contactAddress: '江西省赣州市南康区', // 在这里修改实体店地址
    contactEmail: '18370889142@163.com', // 在这里修改电子邮箱
    businessHours: '周一至周日 9:00-18:00' // 营业时间
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
    
    // 🆕 加载分类数据
    this.loadCategories();
  },

  // 🆕 页面显示时刷新分类数据
  onShow: function() {
    this.loadCategories();
  },

  // 🆕 加载分类数据
  async loadCategories() {
    try {
      const categories = await productData.refreshCategories();
      console.log('[Contact] 分类数据加载完成，共', categories.length, '个分类');
      this.setData({ categories });
    } catch (error) {
      console.error('[Contact] 加载分类数据失败:', error);
    }
  },
  
  // 拨打电话
  makePhoneCall: function() {
    const phone = this.data.contactPhone;
    wx.makePhoneCall({
      phoneNumber: phone,
      success: function() {
        console.log('拨打电话成功');
      },
      fail: function(err) {
        console.log('拨打电话失败', err);
        // 用户取消拨号不显示错误提示
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({
            title: '拨号失败',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  
  // 复制微信号
  copyWechat: function() {
    const wechat = this.data.contactWechat;
    wx.setClipboardData({
      data: wechat,
      success: function() {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: function(err) {
        console.log('复制微信号失败', err);
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  
  // 复制地址
  copyAddress: function() {
    wx.setClipboardData({
      data: this.data.contactAddress,
      success: function() {
        wx.showToast({
          title: '地址已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },
  
  // 复制邮箱
  copyEmail: function() {
    wx.setClipboardData({
      data: this.data.contactEmail,
      success: function() {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },
  
  
  // 切换菜单显示
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
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  
  // 跳转到分类页
  navigateToCategory: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      showMenu: false
    });
    
    console.log('从选购页跳转到分类页，分类类型:', type);
    
    // 确保全局数据对象存在
    if (!getApp().globalData) {
      getApp().globalData = {};
    }
    
    // 设置要跳转的分类类型
    getApp().globalData.targetCategoryType = type;
    
    wx.switchTab({
      url: '/pages/category/category'
    });
  },
  
  // 跳转到收藏页
  navigateToFavorite: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/favorite/favorite'
    });
  },
  
  // 跳转到选购页
  navigateToContact: function() {
    this.setData({
      showMenu: false
    });
    // 已经在选购页，不需要跳转
  },

  // Logo点击处理
  onLogoTap: function() {
    console.log('Logo被点击');
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '年轮环环 - 选购',
      path: '/pages/contact/contact'
    };
  }
}); 