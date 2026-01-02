/**
 * 产品管理页面
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const productAdminManager = require('../../utils/productAdminManager.js');
const categoryAdminManager = require('../../utils/categoryAdminManager.js');
const AdminAuth = require('../../utils/admin-auth.js');

Page({
  data: {
    contentPaddingTop: 64,
    loading: false,
    loadError: '',
    products: [],
    categories: [],
    // 筛选条件
    searchKeyword: '',
    selectedCategoryId: '',
    selectedCategoryName: '全部分类',
    selectedStatus: '', // '', 0, 1
    // 分页 - Requirements 5.3
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    loadingMore: false,
    // 状态选项
    statusOptions: [
      { value: '', label: '全部状态' },
      { value: 1, label: '已上架' },
      { value: 0, label: '已下架' }
    ],
    // 权限状态
    isAuthorized: false
  },

  onLoad: function() {
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
    // 🔧 修复：确保 loading 状态被重置，防止页面卡住
    if (this.data.loading) {
      this.setData({ loading: false });
    }
    if (this.data.loadingMore) {
      this.setData({ loadingMore: false });
    }
    
    if (this.data.isAuthorized) {
      this.refreshProducts();
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
          this.loadProducts();
        } else {
          // 权限验证失败，显示提示并跳转
          this.handleUnauthorized(authResult.error);
        }
      } else if (AdminAuth.validateAccessToken(token)) {
        // 令牌有效
        this.setData({ isAuthorized: true });
        this.loadCategories();
        this.loadProducts();
      } else {
        // 令牌无效或过期，尝试重新验证
        wx.removeStorageSync('admin_access_token');
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          this.loadCategories();
          this.loadProducts();
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
   * 加载分类列表（用于筛选）
   * Requirements: 5.4
   */
  loadCategories: async function() {
    try {
      const categories = await categoryAdminManager.getCategories();
      this.setData({
        categories: [{ _id: '', name: '全部分类' }, ...categories]
      });
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  /**
   * 加载产品列表
   * Requirements: 5.1, 5.2, 5.3
   */
  loadProducts: async function(append = false) {
    if (!append) {
      this.setData({ loading: true, loadError: '' });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const { searchKeyword, selectedCategoryId, selectedStatus, page, pageSize } = this.data;
      
      const options = {
        page: append ? page : 1,
        pageSize
      };

      // 分类筛选 - Requirements 5.4
      if (selectedCategoryId) {
        options.categoryId = selectedCategoryId;
      }

      // 关键词搜索 - Requirements 5.5
      if (searchKeyword && searchKeyword.trim()) {
        options.keyword = searchKeyword.trim();
      }

      // 状态筛选
      if (selectedStatus !== '' && selectedStatus !== undefined) {
        options.status = selectedStatus;
      }

      const result = await productAdminManager.getProducts(options);
      
      // 为产品添加分类名称显示
      let productsWithCategoryName = result.products.map(product => {
        const category = this.data.categories.find(c => c._id === product.categoryId);
        return {
          ...product,
          categoryName: category ? category.name : (product.categoryId || '未分类')
        };
      });
      
      // 获取云存储图片的临时URL
      productsWithCategoryName = await this.getTempImageUrls(productsWithCategoryName);
      
      const newProducts = append ? [...this.data.products, ...productsWithCategoryName] : productsWithCategoryName;
      const hasMore = newProducts.length < result.total;

      this.setData({
        products: newProducts,
        total: result.total,
        hasMore,
        page: append ? page : 1,
        loading: false,
        loadingMore: false
      });
    } catch (error) {
      console.error('加载产品失败:', error);
      
      // 网络错误处理 - Requirements: 10.4
      let errorMessage = '加载产品数据失败，请重试';
      if (error.message && error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message && error.message.includes('云数据库不可用')) {
        errorMessage = '云服务暂时不可用，请稍后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.setData({
        loading: false,
        loadingMore: false,
        loadError: errorMessage
      });
    }
  },

  /**
   * 刷新产品列表
   */
  refreshProducts: function() {
    this.setData({ page: 1 });
    this.loadProducts(false);
  },

  /**
   * 加载更多 - Requirements 5.3
   */
  loadMore: function() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    
    this.setData({ page: this.data.page + 1 });
    this.loadProducts(true);
  },

  /**
   * 搜索输入处理 - Requirements 5.5
   */
  onSearchInput: function(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  /**
   * 执行搜索
   */
  onSearch: function() {
    this.refreshProducts();
  },

  /**
   * 分类筛选变化 - Requirements 5.4
   */
  onCategoryChange: function(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({ 
      selectedCategoryId: category ? category._id : '',
      selectedCategoryName: category ? category.name : '全部分类'
    });
    this.refreshProducts();
  },

  /**
   * 状态筛选变化
   */
  onStatusChange: function(e) {
    const index = e.detail.value;
    const status = this.data.statusOptions[index];
    this.setData({ selectedStatus: status ? status.value : '' });
    this.refreshProducts();
  },

  /**
   * 跳转到新增产品页面
   * Requirements: 6.1
   */
  goToAddProduct: function() {
    wx.navigateTo({
      url: '/pages/product-form/product-form?mode=add'
    });
  },

  /**
   * 跳转到编辑产品页面
   * Requirements: 7.1
   */
  goToEditProduct: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product-form/product-form?mode=edit&id=${id}`
    });
  },

  /**
   * 确认删除产品
   * Requirements: 8.1
   */
  confirmDeleteProduct: function(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除产品"${name}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.deleteProduct(id);
        }
      }
    });
  },

  /**
   * 删除产品
   * Requirements: 8.2, 8.3
   */
  deleteProduct: async function(id) {
    wx.showLoading({ title: '删除中...', mask: true });

    try {
      const result = await productAdminManager.deleteProduct(id);

      wx.hideLoading();

      if (result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.refreshProducts();
      } else {
        wx.showModal({
          title: '删除失败',
          content: result.error || '删除产品失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('删除产品失败:', error);
      
      // 网络错误处理 - Requirements: 10.4
      let errorMessage = '删除产品失败，请重试';
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
   * 切换产品状态（上架/下架）
   * Requirements: 9.1, 9.2, 9.3
   */
  toggleProductStatus: async function(e) {
    const id = e.currentTarget.dataset.id;
    // 将 data-status 转换为数字，因为 WXML 传递的值可能是字符串
    const currentStatus = Number(e.currentTarget.dataset.status);
    const newStatus = currentStatus === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? '上架' : '下架';

    wx.showLoading({ title: `${statusText}中...`, mask: true });

    try {
      const result = await productAdminManager.updateProductStatus(id, newStatus);

      wx.hideLoading();

      if (result.success) {
        wx.showToast({ title: `${statusText}成功`, icon: 'success' });
        // Requirements: 9.3 - 更新列表中的状态显示
        const products = this.data.products.map(p => {
          if (p._id === id) {
            return { ...p, status: newStatus };
          }
          return p;
        });
        this.setData({ products });
      } else {
        wx.showModal({
          title: `${statusText}失败`,
          content: result.error || `${statusText}失败，请重试`,
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新产品状态失败:', error);
      
      // 网络错误处理 - Requirements: 10.4
      let errorMessage = `${statusText}失败，请重试`;
      if (error.message && error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.showModal({
        title: `${statusText}失败`,
        content: errorMessage,
        showCancel: false
      });
    }
  },

  /**
   * 格式化价格显示
   */
  formatPrice: function(price) {
    if (price === 'consult' || price === '联系销售') {
      return '联系销售';
    }
    if (typeof price === 'number') {
      return `¥${price.toFixed(2)}`;
    }
    return price || '¥0.00';
  },

  /**
   * 获取分类名称
   */
  getCategoryName: function(categoryId) {
    const category = this.data.categories.find(c => c._id === categoryId);
    return category ? category.name : categoryId || '未分类';
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
  },

  /**
   * 页面滚动到底部
   */
  onReachBottom: function() {
    this.loadMore();
  },

  /**
   * 获取云存储图片的临时URL
   * @param {Array} products - 产品列表
   * @returns {Promise<Array>} 带有临时URL的产品列表
   */
  getTempImageUrls: async function(products) {
    try {
      // 收集所有需要转换的云存储文件ID
      const fileIds = [];
      const fileIdToProductIndex = new Map();
      
      products.forEach((product, index) => {
        // 检查 imageUrls 数组
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach((url, urlIndex) => {
            if (url && typeof url === 'string' && url.startsWith('cloud://')) {
              fileIds.push(url);
              if (!fileIdToProductIndex.has(url)) {
                fileIdToProductIndex.set(url, []);
              }
              fileIdToProductIndex.get(url).push({ productIndex: index, field: 'imageUrls', urlIndex });
            }
          });
        }
        
        // 检查 imageUrl 单字段
        if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('cloud://')) {
          fileIds.push(product.imageUrl);
          if (!fileIdToProductIndex.has(product.imageUrl)) {
            fileIdToProductIndex.set(product.imageUrl, []);
          }
          fileIdToProductIndex.get(product.imageUrl).push({ productIndex: index, field: 'imageUrl' });
        }
      });
      
      if (fileIds.length === 0) {
        return products;
      }
      
      // 去重
      const uniqueFileIds = [...new Set(fileIds)];
      
      // 分批获取临时URL（每批最多50个）
      const batchSize = 50;
      const tempUrlMap = new Map();
      
      for (let i = 0; i < uniqueFileIds.length; i += batchSize) {
        const batch = uniqueFileIds.slice(i, i + batchSize);
        try {
          const result = await wx.cloud.getTempFileURL({
            fileList: batch
          });
          
          if (result.fileList) {
            result.fileList.forEach(file => {
              if (file.status === 0 && file.tempFileURL) {
                tempUrlMap.set(file.fileID, file.tempFileURL);
              }
            });
          }
        } catch (batchError) {
          console.error('获取临时URL批次失败:', batchError);
        }
      }
      
      // 将临时URL应用到产品数据
      const updatedProducts = products.map((product, index) => {
        const updatedProduct = { ...product };
        
        // 更新 imageUrls 数组
        if (updatedProduct.imageUrls && Array.isArray(updatedProduct.imageUrls)) {
          updatedProduct.imageUrls = updatedProduct.imageUrls.map(url => {
            if (url && url.startsWith('cloud://') && tempUrlMap.has(url)) {
              return tempUrlMap.get(url);
            }
            return url;
          });
        }
        
        // 更新 imageUrl 单字段
        if (updatedProduct.imageUrl && updatedProduct.imageUrl.startsWith('cloud://') && tempUrlMap.has(updatedProduct.imageUrl)) {
          updatedProduct.imageUrl = tempUrlMap.get(updatedProduct.imageUrl);
        }
        
        return updatedProduct;
      });
      
      return updatedProducts;
    } catch (error) {
      console.error('获取临时图片URL失败:', error);
      return products;
    }
  }
});
