/**
 * 分类管理页面
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

const categoryAdminManager = require('../../utils/categoryAdminManager.js');
const AdminAuth = require('../../utils/admin-auth.js');
const productData = require('../../utils/productData.js');

Page({
  data: {
    contentPaddingTop: 64,
    loading: false,
    loadError: '',
    categories: [],
    filteredCategories: [],
    searchKeyword: '',
    isAuthorized: false
  },

  onLoad: function() {
    // 获取系统信息设置内容区域顶部内边距
    try {
      const windowInfo = wx.getWindowInfo();
      const statusBarHeight = windowInfo.statusBarHeight || 20;
      const navBarHeight = 44;
      const contentPaddingTop = statusBarHeight + navBarHeight;
      
      this.setData({ contentPaddingTop });
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }

    // 验证管理员权限
    this.verifyAdminAccess();
  },

  onShow: function() {
    // 每次显示页面时检查权限并刷新数据
    if (this.data.isAuthorized) {
      this.loadCategories();
    }
  },

  /**
   * 验证管理员访问权限
   * Requirements: 管理员权限
   */
  verifyAdminAccess: async function() {
    try {
      const token = wx.getStorageSync('admin_access_token');
      
      if (!token) {
        // 未登录，尝试获取管理员权限
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          this.loadCategories();
        } else {
          // 权限验证失败，显示提示并跳转
          this.handleUnauthorized(authResult.error);
        }
      } else if (AdminAuth.validateAccessToken(token)) {
        // 令牌有效
        this.setData({ isAuthorized: true });
        this.loadCategories();
      } else {
        // 令牌无效或过期，尝试重新验证
        wx.removeStorageSync('admin_access_token');
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          this.loadCategories();
        } else {
          this.handleUnauthorized(authResult.error);
        }
      }
    } catch (error) {
      console.error('权限验证失败:', error);
      this.handleUnauthorized(error.message);
    }
  },

  /**
   * 处理未授权情况
   * Requirements: 管理员权限 - 未授权时跳转到首页
   */
  handleUnauthorized: function(errorMessage) {
    wx.showModal({
      title: '权限验证失败',
      content: errorMessage || '您没有管理员权限，无法访问此页面',
      showCancel: false,
      confirmText: '返回首页',
      success: () => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  /**
   * 加载分类列表
   * Requirements: 1.1, 1.2, 1.3
   */
  loadCategories: async function() {
    this.setData({ 
      loading: true, 
      loadError: '' 
    });

    try {
      const categories = await categoryAdminManager.getCategories();
      
      this.setData({
        categories: categories,
        filteredCategories: this.filterCategories(categories, this.data.searchKeyword),
        loading: false
      });
    } catch (error) {
      console.error('加载分类失败:', error);
      // Requirements: 1.3 - 显示错误提示并提供重试选项
      let errorMessage = '加载分类数据失败，请重试';
      
      // 网络错误处理 - Requirements: 10.4
      if (error.message && error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message && error.message.includes('云数据库不可用')) {
        errorMessage = '云服务暂时不可用，请稍后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.setData({
        loading: false,
        loadError: errorMessage
      });
    }
  },

  /**
   * 搜索输入处理
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      filteredCategories: this.filterCategories(this.data.categories, keyword)
    });
  },

  /**
   * 执行搜索
   */
  onSearch: function() {
    const keyword = this.data.searchKeyword;
    this.setData({
      filteredCategories: this.filterCategories(this.data.categories, keyword)
    });
  },

  /**
   * 过滤分类列表
   * @param {Array} categories - 分类列表
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 过滤后的分类列表
   */
  filterCategories: function(categories, keyword) {
    if (!keyword || !keyword.trim()) {
      return categories;
    }
    
    const lowerKeyword = keyword.toLowerCase().trim();
    return categories.filter(category => {
      const name = (category.name || '').toLowerCase();
      const description = (category.description || '').toLowerCase();
      return name.includes(lowerKeyword) || description.includes(lowerKeyword);
    });
  },

  /**
   * 跳转到新增分类页面
   * Requirements: 2.1
   */
  goToAddCategory: function() {
    wx.navigateTo({
      url: '/pages/category-form/category-form?mode=add'
    });
  },

  /**
   * 跳转到编辑分类页面
   * Requirements: 3.1
   */
  goToEditCategory: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/category-form/category-form?mode=edit&id=${id}`
    });
  },

  /**
   * 确认删除分类
   * Requirements: 4.1
   */
  confirmDeleteCategory: function(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${name}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.deleteCategory(id);
        }
      }
    });
  },

  /**
   * 删除分类
   * Requirements: 4.2, 4.3, 4.4, 4.5
   */
  deleteCategory: async function(id) {
    wx.showLoading({ title: '删除中...', mask: true });

    try {
      const result = await categoryAdminManager.deleteCategory(id);

      wx.hideLoading();

      if (result.success) {
        // 清除分类缓存，确保前台页面能获取最新数据
        productData.clearCache();
        
        // Requirements: 4.5 - 刷新分类列表并显示成功提示
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.loadCategories();
      } else {
        // Requirements: 4.3 - 显示警告（如分类下有产品）
        wx.showModal({
          title: '删除失败',
          content: result.error || '删除分类失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('删除分类失败:', error);
      
      // 网络错误处理 - Requirements: 10.4
      let errorMessage = '删除分类失败，请重试';
      if (error.message && error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.showModal({
        title: '删除失败',
        content: errorMessage,
        showCancel: false
      });
    }
  },

  /**
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});