/**
 * 分类表单页面
 * Requirements: 2.1, 2.2, 3.1, 3.2
 */

const categoryAdminManager = require('../../utils/categoryAdminManager.js');
const { validateCategory } = require('../../utils/dataValidator.js');
const AdminAuth = require('../../utils/admin-auth.js');
const productData = require('../../utils/productData.js');

Page({
  data: {
    contentPaddingTop: 64,
    mode: 'add', // 'add' 或 'edit'
    categoryId: '',
    loading: false,
    submitting: false,
    isAuthorized: false,
    formData: {
      name: '',
      description: '',
      icon: '',
      image: '',
      order: 999,
      status: 1
    },
    errors: {}
  },

  onLoad: function(options) {
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

    // 获取页面参数
    const mode = options.mode || 'add';
    const categoryId = options.id || '';

    this.setData({ mode, categoryId });

    // 验证管理员权限
    this.verifyAdminAccess(mode, categoryId);
  },

  /**
   * 验证管理员访问权限
   * Requirements: 管理员权限
   */
  verifyAdminAccess: async function(mode, categoryId) {
    try {
      const token = wx.getStorageSync('admin_access_token');
      
      if (!token) {
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          // 如果是编辑模式，加载分类数据
          if (mode === 'edit' && categoryId) {
            this.loadCategoryData(categoryId);
          }
        } else {
          this.handleUnauthorized(authResult.error);
        }
      } else if (AdminAuth.validateAccessToken(token)) {
        this.setData({ isAuthorized: true });
        if (mode === 'edit' && categoryId) {
          this.loadCategoryData(categoryId);
        }
      } else {
        wx.removeStorageSync('admin_access_token');
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          if (mode === 'edit' && categoryId) {
            this.loadCategoryData(categoryId);
          }
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
   */
  handleUnauthorized: function(errorMessage) {
    wx.showModal({
      title: '权限验证失败',
      content: errorMessage || '您没有管理员权限，无法访问此页面',
      showCancel: false,
      confirmText: '返回',
      success: () => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/index/index' });
          }
        });
      }
    });
  },

  /**
   * 加载分类数据（编辑模式）
   * Requirements: 3.1
   */
  loadCategoryData: async function(id) {
    this.setData({ loading: true });

    try {
      const category = await categoryAdminManager.getCategoryById(id);
      
      if (category) {
        this.setData({
          formData: {
            name: category.name || '',
            description: category.description || '',
            icon: category.icon || '',
            image: category.image || '',
            order: category.order !== undefined ? category.order : 999,
            status: category.status !== undefined ? category.status : 1
          },
          loading: false
        });
      } else {
        wx.showModal({
          title: '错误',
          content: '分类不存在',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    } catch (error) {
      console.error('加载分类数据失败:', error);
      this.setData({ loading: false });
      wx.showModal({
        title: '加载失败',
        content: error.message || '加载分类数据失败',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  /**
   * 输入框变化处理
   */
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;

    // 处理排序权重为数字
    if (field === 'order') {
      value = parseInt(value) || 999;
    }

    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除该字段的错误
    });
  },

  /**
   * 状态开关变化处理
   */
  onStatusChange: function(e) {
    this.setData({
      'formData.status': e.detail.value ? 1 : 0
    });
  },

  /**
   * 选择图标
   */
  chooseIcon: function() {
    this.chooseAndUploadImage('icon');
  },

  /**
   * 选择图片
   */
  chooseImage: function() {
    this.chooseAndUploadImage('image');
  },

  /**
   * 选择并上传图片
   */
  chooseAndUploadImage: function(type) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        wx.showLoading({ title: '上传中...', mask: true });

        try {
          // 上传到云存储
          const cloudPath = `categories/${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath
          });

          wx.hideLoading();

          if (uploadResult.fileID) {
            this.setData({
              [`formData.${type}`]: uploadResult.fileID
            });
            wx.showToast({ title: '上传成功', icon: 'success' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('上传图片失败:', error);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 移除图标
   */
  removeIcon: function() {
    this.setData({ 'formData.icon': '' });
  },

  /**
   * 移除图片
   */
  removeImage: function() {
    this.setData({ 'formData.image': '' });
  },

  /**
   * 验证表单
   * Requirements: 2.2, 3.2
   */
  validateForm: function() {
    const { formData } = this.data;
    const validation = validateCategory(formData);
    
    if (!validation.valid) {
      // 将错误信息映射到对应字段
      const errors = {};
      validation.errors.forEach(error => {
        if (error.includes('名称')) {
          errors.name = error;
        }
      });
      
      this.setData({ errors });
      return false;
    }

    this.setData({ errors: {} });
    return true;
  },

  /**
   * 提交表单
   * Requirements: 2.3, 2.4, 3.3, 3.4
   */
  submitForm: async function() {
    // 表单验证
    if (!this.validateForm()) {
      wx.showToast({ title: '请检查表单', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const { mode, categoryId, formData } = this.data;
      
      console.log('[CategoryForm] 提交表单，模式:', mode);
      console.log('[CategoryForm] 分类ID:', categoryId);
      console.log('[CategoryForm] 表单数据:', JSON.stringify(formData));
      console.log('[CategoryForm] order 字段类型:', typeof formData.order, '值:', formData.order);
      
      let result;

      if (mode === 'add') {
        // 新增分类
        result = await categoryAdminManager.addCategory(formData);
      } else {
        // 更新分类
        result = await categoryAdminManager.updateCategory(categoryId, formData);
      }

      console.log('[CategoryForm] 操作结果:', JSON.stringify(result));

      this.setData({ submitting: false });

      if (result.success) {
        // 清除分类缓存，确保前台页面能获取最新数据
        console.log('[CategoryForm] 清除分类缓存');
        productData.clearCache();
        
        // Requirements: 2.4, 3.4 - 显示成功提示
        wx.showToast({
          title: mode === 'add' ? '新增成功' : '保存成功',
          icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // Requirements: 2.5 - 显示重复提示或其他错误
        wx.showModal({
          title: mode === 'add' ? '新增失败' : '保存失败',
          content: result.error || '操作失败，请重试',
          showCancel: false
        });
      }
    } catch (error) {
      this.setData({ submitting: false });
      console.error('提交表单失败:', error);
      wx.showModal({
        title: '操作失败',
        content: error.message || '操作失败，请重试',
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
        wx.navigateTo({ url: '/pages/admin-category/admin-category' });
      }
    });
  }
});