// favorite.js
const productData = require('../../utils/productData.js');

Page({
  data: {
    showMenu: false, // 控制侧边菜单显示
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    favorites: [], // 收藏的产品列表
    categories: [], // 🆕 分类列表（用于侧边栏）
    loading: false,
    showQRCode: false // 控制二维码弹窗显示
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
  },
  
  onShow: function() {
    // 每次显示页面时，重新加载收藏数据
    this.loadFavorites();
    // 🆕 刷新分类数据（用于侧边栏）
    this.loadCategories();
  },

  // 🆕 加载分类数据
  async loadCategories() {
    try {
      const categories = await productData.refreshCategories();
      console.log('[Favorite] 分类数据加载完成，共', categories.length, '个分类');
      this.setData({ categories });
    } catch (error) {
      console.error('[Favorite] 加载分类数据失败:', error);
    }
  },
  
  // 加载收藏数据
  loadFavorites: async function() {
    this.setData({ loading: true });
    
    // 从本地存储获取收藏列表
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      console.log('获取收藏列表:', favorites);
      
      // 处理收藏列表中的图片URL，获取临时URL
      const favoritesWithTempUrls = await this.processFavoriteImages(favorites);
      console.log('收藏页面图片处理完成，最终数据:', favoritesWithTempUrls.length);
      
      this.setData({
        favorites: favoritesWithTempUrls,
        loading: false
      });
    } catch (error) {
      console.error('获取收藏列表失败', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 处理收藏列表中的图片URL
  processFavoriteImages: async function(favorites) {
    if (!favorites || favorites.length === 0) {
      console.log('收藏列表为空，跳过图片处理');
      return favorites;
    }

    console.log('开始处理收藏列表图片，收藏数量:', favorites.length);
    
    // 打印收藏数据结构用于调试
    favorites.forEach((item, index) => {
      console.log(`收藏项 ${index + 1}:`, {
        name: item.name,
        imageUrls: item.imageUrls,
        imageUrlsType: Array.isArray(item.imageUrls) ? 'array' : typeof item.imageUrls,
        imageUrlsLength: item.imageUrls ? item.imageUrls.length : 0
      });
    });

    try {
      // 收集所有需要获取临时URL的云存储文件ID
      const cloudFileIds = [];
      const cloudFileIdSet = new Set(); // 去重
      
      favorites.forEach((item, itemIndex) => {
        if (item.imageUrls && Array.isArray(item.imageUrls)) {
          item.imageUrls.forEach((url, urlIndex) => {
            if (url && typeof url === 'string' && url.startsWith('cloud://')) {
              if (!cloudFileIdSet.has(url)) {
                cloudFileIds.push(url);
                cloudFileIdSet.add(url);
                console.log(`发现云存储文件ID [${itemIndex}-${urlIndex}]:`, url);
              }
            } else {
              console.log(`非云存储URL [${itemIndex}-${urlIndex}]:`, url);
            }
          });
        } else {
          console.log(`收藏项 ${itemIndex} 没有有效的imageUrls数组:`, item.imageUrls);
        }
      });

      if (cloudFileIds.length === 0) {
        console.log('没有需要转换的云存储文件ID，直接返回原数据');
        return favorites;
      }

      console.log('获取临时URL的文件数量:', cloudFileIds.length);
      console.log('文件ID列表:', cloudFileIds);

      // 获取临时URL
      let result;
      try {
        result = await wx.cloud.getTempFileURL({
          fileList: cloudFileIds
        });
        console.log('云存储临时URL获取结果:', result);
      } catch (getTempUrlError) {
        console.error('获取临时URL请求失败:', getTempUrlError);
        // 如果获取临时URL失败，显示提示但不阻止页面显示
        wx.showToast({
          title: '部分图片加载失败',
          icon: 'none',
          duration: 3000
        });
        return favorites; // 返回原始数据
      }

      // 创建文件ID到临时URL的映射
      const tempUrlMap = {};
      if (result.fileList) {
        result.fileList.forEach(file => {
          if (file.status === 0 && file.tempFileURL) {
            tempUrlMap[file.fileID] = file.tempFileURL;
            console.log('成功获取临时URL:', file.fileID, '->', file.tempFileURL);
          } else {
            console.error('获取临时URL失败:', file.fileID, file.errMsg);
            
            // 如果是文件不存在的错误，记录详细信息
            if (file.errMsg && file.errMsg.includes('STORAGE_FILE_NONEXIST')) {
              console.warn('⚠️ 云存储文件不存在:', file.fileID);
              console.warn('建议检查文件是否已被删除或路径是否正确');
              
              // 添加默认图片作为后备
              const defaultImage = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg';
              tempUrlMap[file.fileID] = defaultImage;
            }
          }
        });
      }

      // 更新收藏列表中的图片URL
      const updatedFavorites = favorites.map((item, itemIndex) => {
        const updatedItem = { ...item };
        if (item.imageUrls && Array.isArray(item.imageUrls)) {
          updatedItem.imageUrls = item.imageUrls.map((url, urlIndex) => {
            if (url && url.startsWith('cloud://')) {
              const tempUrl = tempUrlMap[url];
              if (tempUrl) {
                console.log(`图片URL转换成功 [${itemIndex}-${urlIndex}]:`, url, '->', tempUrl);
                return tempUrl;
              } else {
                console.warn(`图片URL转换失败 [${itemIndex}-${urlIndex}]:`, url);
                // 如果转换失败，尝试使用默认图片
                const defaultImage = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg';
                console.log(`使用默认图片替代 [${itemIndex}-${urlIndex}]:`, defaultImage);
                return defaultImage;
              }
            }
            return url;
          });
        }
        return updatedItem;
      });

      console.log('收藏图片处理完成，返回更新后的数据');
      return updatedFavorites;
    } catch (error) {
      console.error('处理收藏图片URL失败:', error);
      return favorites; // 返回原始数据
    }
  },
  
  // 跳转到产品详情页
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=' + id
    });
  },
  
  // 移除收藏
  removeFavorite: function(e) {
    // 安全地获取数据
    const id = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : null;
    console.log('收藏页面取消收藏点击，产品ID:', id);
    
    // 安全地阻止事件冒泡，防止触发navigateToDetail
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
    if (!id) {
      console.error('产品ID为空，无法取消收藏');
      wx.showToast({
        title: '产品ID不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏该产品吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            console.log('用户确认取消收藏，开始处理...');
            
            // 获取当前收藏列表
            let favorites = wx.getStorageSync('favorites') || [];
            console.log('当前收藏列表长度:', favorites.length);
            console.log('要删除的产品ID:', id);
            
            // 过滤掉要移除的产品
            const originalLength = favorites.length;
            favorites = favorites.filter(item => item._id !== id);
            const newLength = favorites.length;
            
            console.log('过滤后收藏列表长度:', newLength);
            console.log('是否成功删除:', originalLength > newLength);
            
            if (originalLength === newLength) {
              console.warn('没有找到要删除的产品，可能ID不匹配');
              wx.showToast({
                title: '产品未找到',
                icon: 'none'
              });
              return;
            }
            
            // 更新本地存储
            wx.setStorageSync('favorites', favorites);
            console.log('本地存储已更新');
            
            // 更新页面数据
            this.setData({
              favorites: favorites
            });
            console.log('页面数据已更新');
            
            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            });
            
          } catch (error) {
            console.error('取消收藏失败:', error);
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        } else {
          console.log('用户取消了取消收藏操作');
        }
      }
    });
  },

  // 图片加载错误处理
  onImageError: function(e) {
    const itemId = e.currentTarget.dataset.itemId;
    console.error('收藏页面图片加载失败:', itemId, e.detail);
    
    // 可以在这里添加重试逻辑或显示默认图片
    wx.showToast({
      title: '图片加载失败',
      icon: 'none',
      duration: 2000
    });
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: '年轮环环 - 我的收藏',
      path: '/pages/favorite/favorite'
    };
  },

  // 显示客服微信二维码
  showContactQRCode: function(e) {
    // 安全地阻止事件冒泡
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
    console.log('显示客服微信二维码');
    this.setData({
      showQRCode: true
    });
  },

  // 隐藏客服微信二维码
  hideContactQRCode: function() {
    console.log('隐藏客服微信二维码');
    this.setData({
      showQRCode: false
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
    
    console.log('从收藏页跳转到分类页，分类类型:', type);
    
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
    // 已经在收藏页，不需要跳转
  },
  
  // 跳转到选购页
  navigateToContact: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/contact/contact'
    });
  },

  // Logo点击处理
  onLogoTap: function() {
    console.log('Logo被点击');
  }
});