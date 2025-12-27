/**
 * 产品表单页面
 * Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3
 */

const productAdminManager = require('../../utils/productAdminManager.js');
const categoryAdminManager = require('../../utils/categoryAdminManager.js');
const { validateProduct } = require('../../utils/dataValidator.js');
const AdminAuth = require('../../utils/admin-auth.js');

Page({
  data: {
    contentPaddingTop: 64,
    mode: 'add', // 'add' 或 'edit'
    productId: '',
    loading: false,
    submitting: false,
    isAuthorized: false,
    categories: [],
    selectedCategoryIndex: 0,
    formData: {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      categoryId: '',
      imageUrls: [],
      images: [],
      features: [],
      params: [],
      isHot: false,
      isNew: false,
      isRecommended: false,
      status: 1,
      order: 999
    },
    errors: {},
    // 新增特点/参数的临时数据
    newFeature: { title: '', content: '' },
    newParam: { name: '', value: '' }
  },

  onLoad: function(options) {
    try {
      const windowInfo = wx.getWindowInfo();
      const statusBarHeight = windowInfo.statusBarHeight || 20;
      const navBarHeight = 44;
      const contentPaddingTop = statusBarHeight + navBarHeight;
      this.setData({ contentPaddingTop });
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }

    const mode = options.mode || 'add';
    const productId = options.id || '';

    this.setData({ mode, productId });

    // 验证管理员权限
    this.verifyAdminAccess(mode, productId);
  },

  /**
   * 验证管理员访问权限
   * Requirements: 管理员权限
   */
  verifyAdminAccess: async function(mode, productId) {
    try {
      const token = wx.getStorageSync('admin_access_token');
      
      if (!token) {
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          // 加载分类列表 - Requirements 6.2
          this.loadCategories().then(() => {
            // 如果是编辑模式，加载产品数据
            if (mode === 'edit' && productId) {
              this.loadProductData(productId);
            }
          });
        } else {
          this.handleUnauthorized(authResult.error);
        }
      } else if (AdminAuth.validateAccessToken(token)) {
        this.setData({ isAuthorized: true });
        this.loadCategories().then(() => {
          if (mode === 'edit' && productId) {
            this.loadProductData(productId);
          }
        });
      } else {
        wx.removeStorageSync('admin_access_token');
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          this.setData({ isAuthorized: true });
          this.loadCategories().then(() => {
            if (mode === 'edit' && productId) {
              this.loadProductData(productId);
            }
          });
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
   * 加载分类列表
   * Requirements: 6.2
   */
  loadCategories: async function() {
    try {
      const categories = await categoryAdminManager.getCategories();
      this.setData({ categories });
      return categories;
    } catch (error) {
      console.error('加载分类失败:', error);
      wx.showToast({ title: '加载分类失败', icon: 'none' });
      return [];
    }
  },

  /**
   * 分类ID到名称的映射（用于匹配分类）
   */
  _categoryIdToNameMapping: {
    'cat_wood': '原木经典',
    'cat_resin': '树脂美学',
    'cat_design': '玩趣设计',
    'cat_custom': '高定专属',
    'cat_frame': '桌架专区'
  },

  /**
   * 加载产品数据（编辑模式）
   * Requirements: 7.1
   */
  loadProductData: async function(id) {
    this.setData({ loading: true });

    try {
      const product = await productAdminManager.getProductById(id);
      
      if (product) {
        // 找到分类索引 - 支持多种匹配方式
        let categoryIndex = -1;
        const productCategoryId = product.categoryId || '';
        
        // 方式1: 直接通过 _id 匹配
        categoryIndex = this.data.categories.findIndex(c => c._id === productCategoryId);
        
        // 方式2: 如果 _id 匹配失败，尝试通过分类名称匹配
        if (categoryIndex < 0 && productCategoryId) {
          const categoryName = this._categoryIdToNameMapping[productCategoryId];
          if (categoryName) {
            categoryIndex = this.data.categories.findIndex(c => c.name === categoryName);
          }
        }
        
        // 获取正确的 categoryId（使用数据库中分类的 _id）
        let formCategoryId = productCategoryId;
        if (categoryIndex >= 0) {
          formCategoryId = this.data.categories[categoryIndex]._id;
        }
        
        this.setData({
          formData: {
            name: product.name || '',
            description: product.description || '',
            price: product.price !== undefined ? String(product.price) : '',
            originalPrice: product.originalPrice !== undefined ? String(product.originalPrice) : '',
            categoryId: formCategoryId,
            imageUrls: product.imageUrls || [],
            images: product.images || [],
            features: product.features || [],
            params: product.params || [],
            isHot: product.isHot || false,
            isNew: product.isNew || false,
            isRecommended: product.isRecommended || false,
            status: product.status !== undefined ? product.status : 1,
            order: product.order !== undefined ? product.order : 999
          },
          selectedCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
          loading: false
        });
        
        console.log('[ProductForm] 加载产品数据:', {
          productCategoryId: productCategoryId,
          formCategoryId: formCategoryId,
          categoryIndex: categoryIndex,
          categoriesCount: this.data.categories.length
        });

        // 尝试从已有图片URL中提取产品编号（用于编辑模式下添加新图片）
        if (product.categoryId && product.imageUrls && product.imageUrls.length > 0) {
          const folder = this._getCategoryFolder(product.categoryId);
          const pattern = new RegExp(`${folder}/${folder}(\\d+)`);
          const match = product.imageUrls[0].match(pattern);
          if (match) {
            this._currentProductNumber = parseInt(match[1], 10);
            this._currentCategoryFolder = folder;
          }
        }
      } else {
        wx.showModal({
          title: '错误',
          content: '产品不存在',
          showCancel: false,
          success: () => wx.navigateBack()
        });
      }
    } catch (error) {
      console.error('加载产品数据失败:', error);
      this.setData({ loading: false });
      wx.showModal({
        title: '加载失败',
        content: error.message || '加载产品数据失败',
        showCancel: false,
        success: () => wx.navigateBack()
      });
    }
  },

  /**
   * 输入框变化处理
   */
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;

    if (field === 'order') {
      value = parseInt(value) || 999;
    }

    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },

  /**
   * 分类选择变化
   * Requirements: 6.2
   */
  onCategoryChange: function(e) {
    const index = parseInt(e.detail.value);
    const category = this.data.categories[index];
    
    this.setData({
      selectedCategoryIndex: index,
      'formData.categoryId': category ? category._id : '',
      'errors.categoryId': ''
    });
  },

  /**
   * 开关变化处理
   */
  onSwitchChange: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  /**
   * 状态开关变化
   */
  onStatusChange: function(e) {
    this.setData({
      'formData.status': e.detail.value ? 1 : 0
    });
  },

  /**
   * 分类ID到文件夹名称的映射
   */
  _categoryFolderMapping: {
    'cat_wood': 'wood',
    'cat_resin': 'resin',
    'cat_design': 'design',
    'cat_custom': 'custom',
    'cat_frame': 'frame'
  },

  /**
   * 分类名称到文件夹名称的映射
   */
  _categoryNameToFolderMapping: {
    '原木经典': 'wood',
    '树脂美学': 'resin',
    '玩趣设计': 'design',
    '高定专属': 'custom',
    '桌架专区': 'frame'
  },

  /**
   * 获取分类对应的文件夹名称
   * @param {string} categoryId - 分类ID（可能是 cat_wood 格式或数据库 _id）
   * @returns {string} 文件夹名称
   */
  _getCategoryFolder: function(categoryId) {
    // 方式1: 直接通过 cat_xxx 格式匹配
    if (this._categoryFolderMapping[categoryId]) {
      return this._categoryFolderMapping[categoryId];
    }
    
    // 方式2: 通过分类名称匹配（当 categoryId 是数据库 _id 时）
    const category = this.data.categories.find(c => c._id === categoryId);
    if (category && category.name) {
      const folder = this._categoryNameToFolderMapping[category.name];
      if (folder) {
        return folder;
      }
    }
    
    return 'other';
  },

  /**
   * 获取分类下一个可用的产品编号
   * @param {string} categoryId - 分类ID（可能是 cat_wood 格式或数据库 _id）
   * @returns {Promise<number>} 下一个可用编号
   */
  _getNextProductNumber: async function(categoryId) {
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 获取用于数据库查询的分类标识符
      // 数据库中 categoryName 字段存储的是 cat_wood 格式
      let dbCategoryId = categoryId;
      
      // 如果 categoryId 是数据库 _id，需要转换为 cat_xxx 格式
      if (!this._categoryFolderMapping[categoryId]) {
        const category = this.data.categories.find(c => c._id === categoryId);
        if (category && category.name) {
          // 通过分类名称反向查找 cat_xxx 格式的 ID
          const nameToIdMapping = {
            '原木经典': 'cat_wood',
            '树脂美学': 'cat_resin',
            '玩趣设计': 'cat_design',
            '高定专属': 'cat_custom',
            '桌架专区': 'cat_frame'
          };
          dbCategoryId = nameToIdMapping[category.name] || categoryId;
        }
      }
      
      // 查询该分类下所有产品的图片URL，找出最大编号
      const result = await db.collection('products')
        .where({
          categoryName: dbCategoryId
        })
        .field({
          imageUrls: true,
          imageUrl1: true
        })
        .limit(1000)
        .get();

      const folder = this._getCategoryFolder(categoryId);
      const pattern = new RegExp(`${folder}/${folder}(\\d+)\\.jpeg`, 'i');
      
      let maxNumber = 0;
      
      result.data.forEach(product => {
        // 检查 imageUrls 数组
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach(url => {
            if (url) {
              const match = url.match(pattern);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) maxNumber = num;
              }
            }
          });
        }
        // 检查 imageUrl1 字段
        if (product.imageUrl1) {
          const match = product.imageUrl1.match(pattern);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
          }
        }
      });

      return maxNumber + 1;
    } catch (error) {
      console.error('获取产品编号失败:', error);
      // 出错时使用时间戳作为编号
      return Date.now();
    }
  },

  /**
   * 选择主图
   * Requirements: 6.3, 7.3
   */
  chooseMainImages: function() {
    const currentCount = this.data.formData.imageUrls.length;
    const maxCount = 5;
    const remainCount = maxCount - currentCount;

    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传5张主图', icon: 'none' });
      return;
    }

    // 检查是否已选择分类
    const categoryId = this.data.formData.categoryId;
    if (!categoryId) {
      wx.showToast({ title: '请先选择产品分类', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...', mask: true });

        try {
          const folder = this._getCategoryFolder(categoryId);
          const nextNumber = await this._getNextProductNumber(categoryId);
          
          // 存储当前产品编号供详情图使用
          this._currentProductNumber = nextNumber;
          this._currentCategoryFolder = folder;

          const uploadPromises = res.tempFiles.map(async (file, index) => {
            // 主图命名格式: products/images/{category}/{category}{number}.jpeg
            // 如果有多张主图，第二张开始加后缀 -m2, -m3 等
            let cloudPath;
            if (index === 0) {
              cloudPath = `products/images/${folder}/${folder}${nextNumber}.jpeg`;
            } else {
              cloudPath = `products/images/${folder}/${folder}${nextNumber}-m${index + 1}.jpeg`;
            }
            
            const uploadResult = await wx.cloud.uploadFile({
              cloudPath,
              filePath: file.tempFilePath
            });
            return uploadResult.fileID;
          });

          const newUrls = await Promise.all(uploadPromises);
          const imageUrls = [...this.data.formData.imageUrls, ...newUrls];

          this.setData({ 'formData.imageUrls': imageUrls });
          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        } catch (error) {
          wx.hideLoading();
          console.error('上传图片失败:', error);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 移除主图
   */
  removeMainImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const imageUrls = [...this.data.formData.imageUrls];
    imageUrls.splice(index, 1);
    this.setData({ 'formData.imageUrls': imageUrls });
  },

  /**
   * 选择详情图
   * Requirements: 6.3, 7.3
   */
  chooseDetailImages: function() {
    const currentCount = this.data.formData.images.length;
    const maxCount = 10;
    const remainCount = maxCount - currentCount;

    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传10张详情图', icon: 'none' });
      return;
    }

    // 检查是否已选择分类
    const categoryId = this.data.formData.categoryId;
    if (!categoryId) {
      wx.showToast({ title: '请先选择产品分类', icon: 'none' });
      return;
    }

    // 检查是否已上传主图（需要获取产品编号）
    if (!this._currentProductNumber || !this._currentCategoryFolder) {
      // 如果没有上传主图，需要先获取编号
      if (this.data.formData.imageUrls.length === 0) {
        wx.showToast({ title: '请先上传主图', icon: 'none' });
        return;
      }
      // 尝试从已有主图URL中提取编号
      const existingUrl = this.data.formData.imageUrls[0];
      const folder = this._getCategoryFolder(categoryId);
      const pattern = new RegExp(`${folder}/${folder}(\\d+)`);
      const match = existingUrl.match(pattern);
      if (match) {
        this._currentProductNumber = parseInt(match[1], 10);
        this._currentCategoryFolder = folder;
      } else {
        wx.showToast({ title: '请先上传主图', icon: 'none' });
        return;
      }
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...', mask: true });

        try {
          const folder = this._currentCategoryFolder;
          const productNumber = this._currentProductNumber;
          const existingDetailCount = this.data.formData.images.length;

          const uploadPromises = res.tempFiles.map(async (file, index) => {
            // 详情图命名格式: products/images/{category}/{category}{number}-{detailIndex}.jpeg
            const detailIndex = existingDetailCount + index + 1;
            const cloudPath = `products/images/${folder}/${folder}${productNumber}-${detailIndex}.jpeg`;
            
            const uploadResult = await wx.cloud.uploadFile({
              cloudPath,
              filePath: file.tempFilePath
            });
            return uploadResult.fileID;
          });

          const newUrls = await Promise.all(uploadPromises);
          const images = [...this.data.formData.images, ...newUrls];

          this.setData({ 'formData.images': images });
          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        } catch (error) {
          wx.hideLoading();
          console.error('上传图片失败:', error);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 移除详情图
   */
  removeDetailImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.formData.images];
    images.splice(index, 1);
    this.setData({ 'formData.images': images });
  },

  /**
   * 新增特点输入变化
   */
  onNewFeatureInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newFeature.${field}`]: e.detail.value });
  },

  /**
   * 添加特点
   */
  addFeature: function() {
    const { title, content } = this.data.newFeature;
    if (!title.trim() || !content.trim()) {
      wx.showToast({ title: '请填写完整特点信息', icon: 'none' });
      return;
    }

    const features = [...this.data.formData.features, { title: title.trim(), content: content.trim() }];
    this.setData({
      'formData.features': features,
      newFeature: { title: '', content: '' }
    });
  },

  /**
   * 移除特点
   */
  removeFeature: function(e) {
    const index = e.currentTarget.dataset.index;
    const features = [...this.data.formData.features];
    features.splice(index, 1);
    this.setData({ 'formData.features': features });
  },

  /**
   * 新增参数输入变化
   */
  onNewParamInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newParam.${field}`]: e.detail.value });
  },

  /**
   * 添加参数
   */
  addParam: function() {
    const { name, value } = this.data.newParam;
    if (!name.trim() || !value.trim()) {
      wx.showToast({ title: '请填写完整参数信息', icon: 'none' });
      return;
    }

    const params = [...this.data.formData.params, { name: name.trim(), value: value.trim() }];
    this.setData({
      'formData.params': params,
      newParam: { name: '', value: '' }
    });
  },

  /**
   * 移除参数
   */
  removeParam: function(e) {
    const index = e.currentTarget.dataset.index;
    const params = [...this.data.formData.params];
    params.splice(index, 1);
    this.setData({ 'formData.params': params });
  },

  /**
   * 验证表单
   */
  validateForm: function() {
    const { formData } = this.data;
    
    console.log('[ProductForm] validateForm 开始验证');
    console.log('[ProductForm] formData:', JSON.stringify(formData, null, 2));
    
    // 处理价格
    let priceValue = formData.price;
    if (priceValue && priceValue !== 'consult' && priceValue !== '联系销售') {
      priceValue = parseFloat(priceValue);
      if (isNaN(priceValue)) {
        priceValue = 0;
      }
    }

    const productData = {
      ...formData,
      price: priceValue
    };

    console.log('[ProductForm] 验证数据:', JSON.stringify(productData, null, 2));

    const validation = validateProduct(productData);
    
    console.log('[ProductForm] 验证结果:', JSON.stringify(validation, null, 2));
    
    if (!validation.valid) {
      const errors = {};
      validation.errors.forEach(error => {
        console.log('[ProductForm] 验证错误:', error);
        if (error.includes('名称')) errors.name = error;
        if (error.includes('分类')) errors.categoryId = error;
        if (error.includes('价格')) errors.price = error;
      });
      
      this.setData({ errors });
      return false;
    }

    this.setData({ errors: {} });
    return true;
  },

  /**
   * 将数据库分类 _id 转换为 cat_xxx 格式
   * @param {string} categoryId - 分类ID（可能是数据库 _id 或 cat_xxx 格式）
   * @returns {string} cat_xxx 格式的分类ID
   */
  _convertToCategoryCode: function(categoryId) {
    // 如果已经是 cat_xxx 格式，直接返回
    if (this._categoryFolderMapping[categoryId]) {
      return categoryId;
    }
    
    // 通过分类名称转换
    const category = this.data.categories.find(c => c._id === categoryId);
    if (category && category.name) {
      const nameToIdMapping = {
        '原木经典': 'cat_wood',
        '树脂美学': 'cat_resin',
        '玩趣设计': 'cat_design',
        '高定专属': 'cat_custom',
        '桌架专区': 'cat_frame'
      };
      return nameToIdMapping[category.name] || categoryId;
    }
    
    return categoryId;
  },

  /**
   * 提交表单
   * Requirements: 6.4, 7.4
   */
  submitForm: async function() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请检查表单', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const { mode, productId, formData } = this.data;
      
      // 处理价格
      let priceValue = formData.price;
      if (priceValue && priceValue !== 'consult' && priceValue !== '联系销售') {
        priceValue = parseFloat(priceValue);
        if (isNaN(priceValue)) priceValue = 0;
      }

      let originalPriceValue = formData.originalPrice;
      if (originalPriceValue) {
        originalPriceValue = parseFloat(originalPriceValue);
        if (isNaN(originalPriceValue)) originalPriceValue = 0;
      } else {
        originalPriceValue = 0;
      }

      // 转换分类ID为 cat_xxx 格式（数据库中 categoryName 字段需要这种格式）
      const categoryCode = this._convertToCategoryCode(formData.categoryId);
      
      console.log('[ProductForm] 提交表单:', {
        originalCategoryId: formData.categoryId,
        convertedCategoryCode: categoryCode
      });

      const productData = {
        ...formData,
        categoryId: categoryCode,  // 使用转换后的分类代码
        price: priceValue,
        originalPrice: originalPriceValue
      };

      let result;
      if (mode === 'add') {
        result = await productAdminManager.addProduct(productData);
      } else {
        result = await productAdminManager.updateProduct(productId, productData);
      }

      this.setData({ submitting: false });

      if (result.success) {
        wx.showToast({
          title: mode === 'add' ? '新增成功' : '保存成功',
          icon: 'success'
        });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
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
      fail: () => wx.navigateTo({ url: '/pages/admin-product/admin-product' })
    });
  }
});
