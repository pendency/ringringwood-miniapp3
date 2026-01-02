// admin.js
const { uploadProductImages, uploadBannerImage, uploadCategoryImage, uploadCaseImage } = require('../../utils/cloudUploader.js');
const ProductModel = require('../../models/product.js');
const CategoryModel = require('../../models/category.js');
const { migrateDataInMiniProgram } = require('../../scripts/migrate-to-cloud.js');
const { testCloudFunctionInMiniProgram } = require('../../scripts/test-cloud-function.js');
const AdminAuth = require('../../utils/admin-auth.js');
const csvProcessor = require('../../utils/csv-processor.js');
const DataBackup = require('../../utils/data-backup.js');
const { sortBanners, validateBannerData } = require('../../utils/bannerManager.js');
const caseAdminManager = require('../../utils/caseAdminManager.js');
const { validateCaseData, validateImageFile, sortCases } = require('../../utils/caseManager.js');
const fs = wx.getFileSystemManager();

Page({
  data: {
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    activeTab: '', // 当前激活的标签页，默认为空
    products: [], // 产品列表
    categories: [], // 分类列表
    loading: false, // 加载状态
    showDebug: false, // 是否显示调试信息（默认关闭）
    uploadType: '', // 上传类型：product, banner, category
    tempImages: [], // 临时图片路径
    currentProduct: null, // 当前选中的产品
    currentCategory: null, // 当前选中的分类
    importStatus: '', // 导入状态信息
    importSuccess: false, // 导入是否成功
    importLogExists: false, // 导入日志是否存在
    importErrorsExist: false, // 导入错误是否存在
    importRunning: false, // 导入是否正在运行
    csvUploaded: false, // 是否已上传CSV文件
    csvFilePath: '', // CSV文件路径
    csvFileName: '', // CSV文件名
    migrationRunning: false, // 数据迁移是否正在运行
    
    // 新增的管理员功能相关
    adminAccessToken: null, // 管理员访问令牌
    csvPreviewData: null, // CSV预览数据
    showPreview: false, // 是否显示预览
    importProgress: 0, // 导入进度
    backupHistory: [], // 备份历史
    migrationStatus: '', // 迁移状态信息
    migrationSuccess: false, // 迁移是否成功
    
    // 轮播图管理相关
    banners: [], // 轮播图列表
    bannersLoading: false, // 轮播图加载状态
    showBannerForm: false, // 是否显示轮播图表单
    editingBannerId: '', // 正在编辑的轮播图ID
    bannerFormData: { // 轮播图表单数据
      image: '',
      imageTemp: '', // 用于预览的临时URL
      title: '',
      subtitle: '',
      order: 999,
      status: 1,
      linkType: 'none', // 跳转类型：none-无跳转, product-产品详情, category-分类页面
      productId: '',
      categoryId: ''
    },
    bannerLinkTypes: [ // 跳转类型选项
      { value: 'none', label: '无跳转' },
      { value: 'product', label: '跳转产品详情' },
      { value: 'category', label: '跳转分类页面' }
    ],
    bannerSaving: false, // 轮播图保存状态
    
    // 分类图片上传相关
    selectedCategoryForUpload: null,  // 选中用于上传的分类对象
    categoryUploadType: '',           // 上传类型: 'icon' 或 'image'
    categoryTempImage: '',            // 临时图片路径（用于预览）
    categoryUploading: false,         // 上传中状态
    
    // 案例管理相关
    cases: [],                        // 案例列表
    casesLoading: false,              // 案例加载状态
    showCaseForm: false,              // 是否显示案例表单
    editingCaseId: '',                // 正在编辑的案例ID
    caseFormData: {                   // 案例表单数据
      imageUrl: '',
      imageTemp: '',                  // 用于预览的临时URL
      title: '',
      description: '',
      order: 999,
      status: 1
    },
    caseSaving: false                 // 案例保存状态
  },
  
  onLoad: async function() {
    try {
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

      // 验证管理员权限
      await this.verifyAdminAccess();
      
      // 检查CSV文件是否已上传
      this.checkCSVFileExists();
      
      // 检查导入日志是否存在
      this.checkImportLogExists();
      
      // 加载备份历史
      this.loadBackupHistory();
      
      // 加载数据
      await this.loadData();
      
      // 显示调试信息
      wx.showToast({
        title: '管理后台已加载',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('管理后台加载失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },
  
  // 页面显示时触发 - 确保从其他页面返回时状态正确
  onShow: function() {
    console.log('管理后台页面显示');
    
    // 🔧 修复：只重置 loading 相关状态，不重置弹窗状态
    // 因为从相册选择图片返回时也会触发 onShow，不能关闭弹窗
    if (this.data.loading) {
      this.setData({ loading: false });
    }
    if (this.data.importRunning) {
      this.setData({ importRunning: false });
    }
    if (this.data.migrationRunning) {
      this.setData({ migrationRunning: false });
    }
    
    // 只在分类管理标签页激活时才刷新分类数据，避免不必要的网络请求
    // 这样可以提高页面响应速度
    if (this.data.activeTab === 'categories') {
      this.refreshCategoriesData();
    }
  },
  
  // 🆕 刷新分类数据（用于快速预览同步）
  async refreshCategoriesData() {
    try {
      console.log('[Admin] 刷新分类数据...');
      const categoryModel = new CategoryModel();
      const categories = await categoryModel.getAll({ limit: 50 });
      console.log('[Admin] 分类数据刷新完成，数量:', categories.length);
      
      this.setData({ categories });
    } catch (error) {
      console.error('[Admin] 刷新分类数据失败:', error);
      // 刷新失败不影响页面显示，只记录日志
    }
  },
  
  // 测试页面功能
  testPageFunction: function() {
    console.log('测试页面功能...');
    
    // 测试数据设置
    setTimeout(() => {
      this.setData({
        activeTab: 'products',
        products: [
          { _id: 'test1', name: '测试产品1', description: '这是一个测试产品' },
          { _id: 'test2', name: '测试产品2', description: '这是另一个测试产品' }
        ],
        categories: [
          { _id: 'cat1', name: '测试分类1', description: '这是一个测试分类' },
          { _id: 'cat2', name: '测试分类2', description: '这是另一个测试分类' }
        ]
      });
      
      console.log('测试数据已设置');
      wx.showToast({
        title: '测试数据已加载',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
  },
  
  // 测试文件选择功能
  testFileSelection: function() {
    console.log('测试文件选择功能...');
    
    // 模拟文件选择成功
    const mockRes = {
      tempFiles: [
        {
          path: '/mock/path/test.csv',
          name: 'test.csv',
          size: 1024
        }
      ]
    };
    
    console.log('模拟文件选择结果:', mockRes);
    
    // 测试文件路径提取
    if (mockRes.tempFiles && mockRes.tempFiles.length > 0) {
      const tempFile = mockRes.tempFiles[0];
      console.log('提取的文件信息:', tempFile);
      
      if (tempFile && tempFile.path) {
        console.log('文件路径有效:', tempFile.path);
      } else {
        console.error('文件路径无效');
      }
    } else {
      console.error('未找到临时文件');
    }
  },
  
  // 检查CSV文件是否已上传
  checkCSVFileExists() {
    try {
      const csvPath = `${wx.env.USER_DATA_PATH}/产品信息管理模板.csv`;
      const exists = this.checkFileExists(csvPath);
      
      if (exists) {
        this.setData({
          csvUploaded: true,
          csvFilePath: csvPath,
          csvFileName: '产品信息管理模板.csv'
        });
      }
    } catch (error) {
      console.error('检查CSV文件失败', error);
    }
  },
  
  // 检查导入日志是否存在
  checkImportLogExists() {
    try {
      const logPath = `${wx.env.USER_DATA_PATH}/import-log.txt`;
      const errorPath = `${wx.env.USER_DATA_PATH}/import-errors.json`;
      
      const logExists = this.checkFileExists(logPath);
      const errorExists = this.checkFileExists(errorPath);
      
      this.setData({
        importLogExists: logExists,
        importErrorsExist: errorExists
      });
    } catch (error) {
      console.error('检查导入日志失败', error);
    }
  },
  
  // 加载数据
  async loadData() {
    try {
      console.log('开始加载数据...');
      this.setData({ loading: true });
      
      // 并行加载数据
      console.log('正在加载产品数据...');
      const productModel = new ProductModel();
      const products = await productModel.getAll({ limit: 50 });
      console.log('产品数据加载完成，数量:', products.length);
      
      console.log('正在加载分类数据...');
      const categoryModel = new CategoryModel();
      const categories = await categoryModel.getAll({ limit: 50 });
      console.log('分类数据加载完成，数量:', categories.length);
      
      this.setData({
        products,
        categories,
        loading: false
      });
      
      console.log('数据加载完成');
    } catch (error) {
      console.error('加载数据失败', error);
      this.setData({ 
        loading: false,
        products: [],
        categories: []
      });
      
      // 显示详细的错误信息
      wx.showModal({
        title: '数据加载失败',
        content: `错误信息: ${error.message}\n\n请检查云开发环境配置和网络连接。`,
        showCancel: false
      });
    }
  },
  
  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    // 切换到轮播图管理时加载轮播图数据
    if (tab === 'banners') {
      this.loadBanners();
    }
    
    // 切换到案例管理时加载案例数据
    if (tab === 'cases') {
      this.loadCases();
    }
  },
  
  // 选择产品
  selectProduct(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(item => item._id === id);
    
    if (product) {
      this.setData({ currentProduct: product });
    }
  },
  
  // 选择分类
  selectCategory(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item._id === id);
    
    if (category) {
      this.setData({ currentCategory: category });
    }
  },
  
  // 分类选择器变更处理（用于分类图片上传）
  onCategorySelectChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      selectedCategoryForUpload: category || null,
      categoryTempImage: ''  // 清除之前的临时图片
    });
  },
  
  // 重置分类上传状态
  resetCategoryUploadState() {
    this.setData({
      selectedCategoryForUpload: null,
      categoryUploadType: '',
      categoryTempImage: '',
      categoryUploading: false
    });
  },
  
  // 选择分类图标上传（新版分类图片上传功能）
  chooseCategoryIconForUpload() {
    // 检查是否已选择分类
    if (!this.data.selectedCategoryForUpload) {
      wx.showToast({
        title: '请先选择分类',
        icon: 'none'
      });
      return;
    }
    
    // 调用 wx.chooseMedia 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFiles = res.tempFiles;
        if (tempFiles && tempFiles.length > 0) {
          // 设置上传类型为 'icon'，设置临时图片路径
          this.setData({
            categoryUploadType: 'icon',
            categoryTempImage: tempFiles[0].tempFilePath
          });
        }
      },
      fail: err => {
        // 用户取消选择，静默处理
        console.log('用户取消选择图片:', err);
      }
    });
  },
  
  // 选择分类图片上传（新版分类图片上传功能）
  chooseCategoryImageForUpload() {
    // 检查是否已选择分类
    if (!this.data.selectedCategoryForUpload) {
      wx.showToast({
        title: '请先选择分类',
        icon: 'none'
      });
      return;
    }
    
    // 调用 wx.chooseMedia 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFiles = res.tempFiles;
        if (tempFiles && tempFiles.length > 0) {
          // 设置上传类型为 'image'，设置临时图片路径
          this.setData({
            categoryUploadType: 'image',
            categoryTempImage: tempFiles[0].tempFilePath
          });
        }
      },
      fail: err => {
        // 用户取消选择，静默处理
        console.log('用户取消选择图片:', err);
      }
    });
  },
  
  // 确认上传分类图片（新版分类图片上传功能）
  async confirmCategoryImageUpload() {
    // 检查必要条件
    if (!this.data.selectedCategoryForUpload || !this.data.categoryTempImage || !this.data.categoryUploadType) {
      wx.showToast({
        title: '请先选择分类和图片',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 设置上传中状态
      this.setData({ categoryUploading: true });
      
      // 上传图片到云存储
      const fileID = await uploadCategoryImage(
        this.data.categoryTempImage,
        this.data.selectedCategoryForUpload.name,
        this.data.categoryUploadType
      );
      
      if (!fileID) {
        throw new Error('上传失败，请重试');
      }
      
      // 构建更新数据，只更新对应的字段（icon 或 image）
      const updateData = {
        id: this.data.selectedCategoryForUpload._id
      };
      updateData[this.data.categoryUploadType] = fileID;
      
      // 调用云函数更新分类数据
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'updateCategory',
          data: updateData
        }
      });
      
      if (!result.result || !result.result.success) {
        throw new Error(result.result?.error || '更新失败，请重试');
      }
      
      // 成功处理
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      
      // 刷新分类列表
      await this.refreshCategoriesData();
      
      // 重置上传状态
      this.resetCategoryUploadState();
      
    } catch (error) {
      console.error('分类图片上传失败:', error);
      
      // 错误处理
      let errorMessage = error.message || '操作失败，请重试';
      if (error.message && error.message.includes('network')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      }
      
      wx.showModal({
        title: '上传失败',
        content: errorMessage,
        showCancel: false
      });
    } finally {
      // 重置上传中状态
      this.setData({ categoryUploading: false });
    }
  },
  
  // 取消上传分类图片（新版分类图片上传功能）
  cancelCategoryImageUpload() {
    // 清除临时图片和上传类型
    this.setData({
      categoryTempImage: '',
      categoryUploadType: ''
    });
  },
  
  // 选择图片
  chooseImage(e) {
    const type = e.currentTarget.dataset.type;
    const count = type === 'product' ? 9 : 1;
    
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFiles = res.tempFiles;
        const tempImages = tempFiles.map(file => file.tempFilePath);
        
        this.setData({
          uploadType: type,
          tempImages
        });
      }
    });
  },
  
  // 上传产品图片
  async uploadProductImage() {
    if (!this.data.currentProduct || this.data.tempImages.length === 0) {
      wx.showToast({
        title: '请先选择产品和图片',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '上传中...' });
      
      // 上传图片到云存储
      const fileIDs = await uploadProductImages(
        this.data.tempImages,
        this.data.currentProduct.name
      );
      
      if (fileIDs.length > 0) {
        // 通过云函数更新产品数据（绕过客户端权限限制）
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'updateProduct',
            data: {
              id: this.data.currentProduct._id,
              images: fileIDs
            }
          }
        });
        
        wx.hideLoading();
        
        if (result.result && result.result.success) {
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadData();
          
          // 清空临时数据
          this.setData({
            tempImages: [],
            currentProduct: null
          });
        } else {
          wx.showToast({
            title: result.result?.error || '更新失败',
            icon: 'none'
          });
        }
      }
    } catch (error) {
      console.error('上传图片失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },
  
  // 上传分类图片
  async uploadCategoryImage() {
    if (!this.data.currentCategory || this.data.tempImages.length === 0) {
      wx.showToast({
        title: '请先选择分类和图片',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '上传中...' });
      
      // 上传图片到云存储
      const type = this.data.uploadType === 'category-icon' ? 'icon' : 'image';
      const fileID = await uploadCategoryImage(
        this.data.tempImages[0],
        this.data.currentCategory.name,
        type
      );
      
      if (fileID) {
        // 通过云函数更新分类数据（绕过客户端权限限制）
        const updateData = {};
        updateData[type] = fileID;
        
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'updateCategory',
            data: {
              id: this.data.currentCategory._id,
              ...updateData
            }
          }
        });
        
        wx.hideLoading();
        
        if (result.result && result.result.success) {
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadData();
          
          // 清空临时数据
          this.setData({
            tempImages: [],
            currentCategory: null
          });
        } else {
          wx.showToast({
            title: result.result?.error || '更新失败',
            icon: 'none'
          });
        }
      }
    } catch (error) {
      console.error('上传图片失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },
  
  // 上传轮播图
  async uploadBannerImage() {
    if (this.data.tempImages.length === 0) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '上传中...' });
      
      // 上传图片到云存储
      const fileID = await uploadBannerImage(
        this.data.tempImages[0],
        `banner_${new Date().getTime()}`
      );
      
      if (fileID) {
        // 通过云函数创建轮播图数据（绕过客户端权限限制）
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'addBanner',
            data: {
              image: fileID,
              title: '轮播图',
              link: '',
              order: 1,
              status: 1
            }
          }
        });
        
        wx.hideLoading();
        
        if (result.result && result.result.success) {
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
          
          // 清空临时数据
          this.setData({
            tempImages: []
          });
        } else {
          wx.showToast({
            title: result.result?.error || '创建轮播图失败',
            icon: 'none'
          });
        }
      }
    } catch (error) {
      console.error('上传图片失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },
  
  // 确认上传
  confirmUpload() {
    const type = this.data.uploadType;
    
    if (type === 'product') {
      this.uploadProductImage();
    } else if (type === 'banner') {
      this.uploadBannerImage();
    } else if (type.includes('category')) {
      this.uploadCategoryImage();
    }
  },
  
  // 取消上传
  cancelUpload() {
    this.setData({
      tempImages: [],
      uploadType: ''
    });
  },
  
  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  },
  

  
  // 保存CSV文件到本地
  saveCSVFile(tempFile) {
    try {
      // 创建目标路径
      const targetPath = `${wx.env.USER_DATA_PATH}/产品信息管理模板.csv`;
      
      // 读取临时文件内容
      const fileContent = fs.readFileSync(tempFile.path, 'utf8');
      
      // 写入到目标路径
      fs.writeFileSync(targetPath, fileContent, 'utf8');
      
      console.log('CSV文件已保存到:', targetPath);
      
      this.setData({
        csvUploaded: true,
        csvFilePath: targetPath,
        csvFileName: tempFile.name,
        importStatus: '文件已上传，可以开始导入',
        importSuccess: true
      });
      
      wx.showToast({
        title: '文件上传成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存CSV文件失败:', error);
      wx.showToast({
        title: '保存文件失败',
        icon: 'none'
      });
    }
  },
  
  // 导入产品数据
  importProducts() {
    if (this.data.importRunning) {
      wx.showToast({
        title: '导入正在进行中',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.csvUploaded) {
      wx.showToast({
        title: '请先上传CSV文件',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      importRunning: true,
      importStatus: '正在导入产品数据...',
      importSuccess: false
    });
    
    // 检查配置文件
    try {
      const configPath = `${wx.env.USER_DATA_PATH}/import.config.js`;
      const configExists = this.checkFileExists(configPath);
      
      if (!configExists) {
        // 创建默认配置文件
        this.createDefaultConfig();
      }
      
      // 执行导入
      this.runImportProcess();
    } catch (error) {
      console.error('导入准备失败', error);
      this.setData({
        importStatus: `导入准备失败: ${error.message}`,
        importSuccess: false,
        importRunning: false
      });
    }
  },
  
  // 检查文件是否存在
  checkFileExists(filePath) {
    try {
      fs.accessSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // 创建默认配置文件
  createDefaultConfig() {
    const configContent = `// import.config.js
// 产品数据导入配置文件
// 注意：数据库是唯一数据源
module.exports = {
  // CSV 源文件路径
  inputFilePath: '${wx.env.USER_DATA_PATH}/产品信息管理模板.csv',

  // 生成的中间 JSON 文件
  outputJsonPath: '${wx.env.USER_DATA_PATH}/generated-products.json',

  // 导入日志
  logFilePath: '${wx.env.USER_DATA_PATH}/import-log.txt',

  // 错误输出（仅当存在严重错误时生成）
  errorJsonPath: '${wx.env.USER_DATA_PATH}/import-errors.json'
};`;
    
    try {
      fs.writeFileSync(
        `${wx.env.USER_DATA_PATH}/import.config.js`,
        configContent,
        'utf8'
      );
      console.log('已创建默认配置文件');
    } catch (error) {
      console.error('创建配置文件失败', error);
      throw new Error('创建配置文件失败');
    }
  },
  
  // 运行导入处理
  async runImportProcess() {
    try {
      // 使用CSV处理器进行解析和验证
      const csvFilePath = `${wx.env.USER_DATA_PATH}/产品信息管理模板.csv`;
      console.log('开始使用CSV处理器解析文件:', csvFilePath);
      
      // 使用CSV处理器解析
      const parseResult = await csvProcessor.parseCSV(csvFilePath);
      
      if (!parseResult.success) {
        throw new Error(`CSV解析失败: ${parseResult.error}`);
      }
      
      console.log('CSV处理器解析成功，产品数量:', parseResult.data.length);
      console.log('警告数量:', parseResult.warnings.length);
      
      // 使用解析后的数据
      const transformedProducts = parseResult.data;
      
      // 保存为JSON
      fs.writeFileSync(
        `${wx.env.USER_DATA_PATH}/generated-products.json`,
        JSON.stringify(transformedProducts, null, 2),
        'utf8'
      );
      
      // 生成日志
      const logContent = [
        `[${new Date().toLocaleString()}] 产品数据导入完成`,
        `- 解析产品数: ${parseResult.data.length}`,
        `- 有效产品数: ${transformedProducts.length}`,
        `- 警告数量: ${parseResult.warnings.length}`,
        `- JSON文件已保存至: ${wx.env.USER_DATA_PATH}/generated-products.json`
      ].join('\n');
      
      // 安全地保存日志文件
      try {
        const logPath = `${wx.env.USER_DATA_PATH}/import-log.txt`;
        fs.writeFileSync(logPath, logContent, 'utf8');
        console.log('导入日志保存成功');
      } catch (logError) {
        console.error('导入日志保存失败:', logError);
        // 即使日志保存失败，也不影响主要流程
      }
      
      // 检查是否有错误文件
      const errorPath = `${wx.env.USER_DATA_PATH}/import-errors.json`;
      const errorExists = this.checkFileExists(errorPath);
      
      // 保存警告信息（如果有）
      if (parseResult.warnings && parseResult.warnings.length > 0) {
        try {
          fs.writeFileSync(
            `${wx.env.USER_DATA_PATH}/import-warnings.json`,
            JSON.stringify(parseResult.warnings, null, 2),
            'utf8'
          );
          console.log('警告信息保存成功');
        } catch (warningError) {
          console.error('保存警告信息失败:', warningError);
        }
      }
      
      // 更新状态
      this.setData({
        importStatus: `导入成功! 共处理 ${parseResult.data.length} 个产品，有效数据 ${transformedProducts.length} 个${parseResult.warnings.length > 0 ? `，${parseResult.warnings.length} 个警告` : ''}`,
        importSuccess: true,
        importRunning: false,
        importLogExists: true,
        importErrorsExist: errorExists
      });
      
      // 如果有错误，提示用户
      if (errorExists) {
        wx.showModal({
          title: '导入提示',
          content: '导入过程中发现一些问题，可以点击"查看错误"按钮查看详情。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
      
      // 重新加载产品数据
      this.loadData();
    } catch (error) {
      console.error('导入处理失败', error);
      this.setData({
        importStatus: `导入失败: ${error.message}`,
        importSuccess: false,
        importRunning: false
      });
      
      // 保存错误日志
      try {
        fs.writeFileSync(
          `${wx.env.USER_DATA_PATH}/import-errors.json`,
          JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }, null, 2),
          'utf8'
        );
        
        this.setData({
          importErrorsExist: true
        });
      } catch (e) {
        console.error('保存错误日志失败', e);
      }
    }
  },
  
  // 解析CSV文件
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCSVLine(line);
      
      if (values.length < 3) continue; // 跳过无效行
      
      const product = {};
      for (let j = 0; j < headers.length; j++) {
        if (j < values.length) {
          product[headers[j]] = values[j];
        }
      }
      
      products.push(product);
    }
    
    return products;
  },
  
  // 解析CSV行，处理引号和逗号
  parseCSVLine(line) {
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    values.push(currentValue);
    
    return values;
  },
  
  // 转换产品数据
  transformProducts(rawProducts) {
    if (!rawProducts || !Array.isArray(rawProducts)) {
      throw new Error('没有有效的产品数据可转换');
    }
    
    // 分类ID映射
    const categoryMap = {
      '经典桌面款': 'cat_classic',
      '玩趣设计款': 'cat_fun',
      '树脂设计款': 'cat_resin',
      '树脂定制款': 'cat_custom',
      '桌架专区': 'cat_frame',
      '椅子专区': 'cat_chair',
      // 兼容旧的分类名称
      '原木经典': 'cat_classic',
      '树脂美学': 'cat_resin',
      '玩趣设计': 'cat_fun',
      '高定专属': 'cat_custom'
    };
    
    // 产品ID集合，用于检查重复
    const productIds = new Set();
    
    // 转换后的产品
    const transformedProducts = [];
    const errors = [];
    
    for (const rawProduct of rawProducts) {
      try {
        // 检查必填字段（支持中英文字段名）
        const productId = rawProduct['产品ID'] || rawProduct['productId'] || '';
        const title = rawProduct['产品名称'] || rawProduct['title'] || '';
        const categoryName = rawProduct['分类名称'] || rawProduct['categoryName'] || '';
        
        if (!productId || !title || !categoryName) {
          errors.push(`产品缺少必填字段: ${JSON.stringify(rawProduct)}`);
          continue;
        }
        
        // 检查产品ID是否重复
        if (productIds.has(productId)) {
          errors.push(`产品ID重复: ${productId}`);
          continue;
        }
        productIds.add(productId);
        
        // 检查分类是否有效
        let categoryId = categoryMap[categoryName];
        
        // 如果是英文分类ID，直接使用
        if (!categoryId && categoryName.startsWith('cat_')) {
          categoryId = categoryName;
        }
        
        if (!categoryId) {
          errors.push(`未识别的分类: ${categoryName}, 产品ID: ${productId}`);
          continue;
        }
        
        // 处理图片路径（支持中英文字段名）
        const imageUrls = [];
        for (let i = 1; i <= 10; i++) {
          const imageFieldCN = `图片URL${i}`;
          const imageFieldEN = `imageUrl${i}`;
          const imagePath = rawProduct[imageFieldCN] || rawProduct[imageFieldEN] || '';
          
          if (imagePath && imagePath.trim()) {
            const imagePathTrimmed = imagePath.trim();
            
            // 保持原有路径
            imageUrls.push(imagePathTrimmed);
          }
        }
        
        // 处理视频（支持中英文字段名）
        let videoUrl = null;
        const videoField = rawProduct['视频URL'] || rawProduct['videoUrl'] || '';
        if (videoField && videoField.trim()) {
          const videoPath = videoField.trim();
          
          // 保持原有路径
          videoUrl = videoPath;
        }
        
        // 转换布尔值（支持中英文字段名）
        const isHot = this.convertToBoolean(rawProduct['是否热门（是/否）'] || rawProduct['isHot']);
        const isNew = this.convertToBoolean(rawProduct['是否灵感上新（是/否）'] || rawProduct['isNew']);
        const isActive = this.convertToBoolean(rawProduct['是否显示（是/否）'] || rawProduct['isVisible']);
        
        // 处理价格（支持中英文字段名）
        let price = 'consult';
        const priceField = rawProduct['价格（元）'] || rawProduct['price'] || '';
        if (priceField && priceField !== '联系销售') {
          const parsedPrice = parseFloat(priceField);
          price = isNaN(parsedPrice) ? 'consult' : parsedPrice;
        }
        
        // 创建参数数组（支持中英文字段名）
        const params = [];
        
        const sizeField = rawProduct['尺寸'] || rawProduct['size'] || '';
        if (sizeField) {
          params.push({ name: '尺寸', value: sizeField });
        }
        
        const weightField = rawProduct['重量(约xxkg)'] || rawProduct['weight'] || '';
        if (weightField) {
          params.push({ name: '重量', value: weightField });
        }
        
        const colorField = rawProduct['颜色'] || rawProduct['color'] || '';
        if (colorField) {
          params.push({ name: '颜色', value: colorField });
        }
        
        const scenarioField = rawProduct['适用场景'] || rawProduct['applicationScenario'] || '';
        if (scenarioField) {
          params.push({ name: '适用场景', value: scenarioField });
        }
        
        // 构建转换后的产品对象（支持中英文字段名）
        const transformedProduct = {
          _id: productId,
          name: title,
          description: rawProduct['产品简介'] || rawProduct['description'] || '',
          price: price,
          originalPrice: price,
          categoryId: categoryId,
          imageUrls: imageUrls.length > 0 ? [imageUrls[0]] : [],
          images: imageUrls.slice(1), // 第一张图作为主图，其余作为详情图
          features: [],
          params: params,
          isHot: isHot,
          isNew: isNew,
          isRecommended: false,
          stock: 10,
          sales: 0,
          status: isActive ? 1 : 0,
          order: parseInt(rawProduct['排序优先级（数字，越小越靠前）'] || rawProduct['sortPriority']) || 999
        };
        
        // 如果有视频，添加到特性中
        if (videoUrl) {
          transformedProduct.features.push({
            title: '产品展示',
            video: videoUrl,
            description: '产品视频展示'
          });
        }
        
        transformedProducts.push(transformedProduct);
      } catch (error) {
        errors.push(`处理产品 ${rawProduct['产品ID'] || '未知ID'} 时出错: ${error.message}`);
      }
    }
    
    // 保存错误信息
    if (errors.length > 0) {
      try {
        fs.writeFileSync(
          `${wx.env.USER_DATA_PATH}/import-errors.json`,
          JSON.stringify(errors, null, 2),
          'utf8'
        );
        this.setData({
          importErrorsExist: true
        });
        console.log('错误信息保存成功');
      } catch (errorSaveError) {
        console.error('保存错误信息失败:', errorSaveError);
        // 即使错误信息保存失败，也不影响主要流程
      }
    }
    
    return transformedProducts;
  },
  
  // 查看导入日志
  viewImportLog() {
    try {
      const logPath = `${wx.env.USER_DATA_PATH}/import-log.txt`;
      if (this.checkFileExists(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        wx.showModal({
          title: '导入日志',
          content: logContent.length > 1000 ? logContent.substring(0, 1000) + '...(日志过长)' : logContent,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '日志文件不存在',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('读取日志失败', error);
      wx.showToast({
        title: '读取日志失败',
        icon: 'none'
      });
    }
  },
  
  // 查看导入错误
  viewImportErrors() {
    try {
      const errorPath = `${wx.env.USER_DATA_PATH}/import-errors.json`;
      if (this.checkFileExists(errorPath)) {
        const errorContent = fs.readFileSync(errorPath, 'utf8');
        const errors = JSON.parse(errorContent);
        
        // 格式化错误信息
        let formattedErrors = '';
        if (Array.isArray(errors)) {
          formattedErrors = errors.slice(0, 5).map((err, index) => `${index + 1}. ${err}`).join('\n\n');
          
          if (errors.length > 5) {
            formattedErrors += `\n\n...共有 ${errors.length} 个错误`;
          }
        } else {
          formattedErrors = JSON.stringify(errors, null, 2);
        }
        
        wx.showModal({
          title: '导入错误',
          content: formattedErrors.length > 1000 ? formattedErrors.substring(0, 1000) + '...(错误信息过长)' : formattedErrors,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: '错误文件不存在',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('读取错误信息失败', error);
      wx.showToast({
        title: '读取错误信息失败',
        icon: 'none'
      });
    }
  },

  // 执行数据迁移
  async executeMigration() {
    try {
      this.setData({
        migrationRunning: true,
        migrationStatus: '正在迁移数据到云开发...',
        migrationSuccess: false
      });

      wx.showLoading({
        title: '迁移中...',
        mask: true
      });

      // 执行数据迁移
      const success = await migrateDataInMiniProgram();

      if (success) {
        this.setData({
          migrationStatus: '数据迁移成功！',
          migrationSuccess: true
        });

        wx.showToast({
          title: '迁移成功',
          icon: 'success'
        });
      } else {
        this.setData({
          migrationStatus: '数据迁移失败，请查看控制台日志'
        });

        wx.showToast({
          title: '迁移失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('数据迁移失败:', error);
      this.setData({
        migrationStatus: `迁移失败: ${error.message}`
      });

      wx.showToast({
        title: '迁移失败',
        icon: 'error'
      });
    } finally {
      this.setData({
        migrationRunning: false
      });
      wx.hideLoading();
    }
  },

  // 测试云函数连接
  async testCloudFunction() {
    try {
      wx.showLoading({
        title: '测试中...',
        mask: true
      });

      const summary = await testCloudFunctionInMiniProgram();

      if (summary && summary.passed > 0) {
        wx.showModal({
          title: '云函数测试结果',
          content: `测试完成！\n通过: ${summary.passed}/${summary.total}\n成功率: ${summary.successRate.toFixed(1)}%`,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '云函数测试失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('测试云函数失败:', error);
      wx.showToast({
        title: '云函数连接失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转到视频迁移管理页面
  goToVideoMigration: function() {
    wx.navigateTo({
      url: '/pages/video-migration/video-migration',
      success: function() {
        console.log('跳转到视频迁移管理页面成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到数据库修复页面
  goToFixDatabase: function() {
    wx.navigateTo({
      url: '/pages/fix-database/fix-database',
      success: function() {
        console.log('跳转到数据库修复页面成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到云存储测试页面
  goToCloudVideoTest: function() {
    wx.navigateTo({
      url: '/pages/cloud-video-test/cloud-video-test',
      success: function() {
        console.log('跳转到云存储测试页面成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到分类管理页面
  goToCategoryAdmin: function() {
    wx.navigateTo({
      url: '/pages/admin-category/admin-category',
      success: function() {
        console.log('跳转到分类管理页面成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到产品管理页面 - Requirements: 5.1
  goToProductAdmin: function() {
    wx.navigateTo({
      url: '/pages/admin-product/admin-product',
      success: function() {
        console.log('跳转到产品管理页面成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // ==================== 新增的管理员功能方法 ====================
  
  // 验证管理员访问权限
  verifyAdminAccess: async function() {
    try {
      console.log('开始验证管理员访问权限...');
      
      const token = wx.getStorageSync('admin_access_token');
      console.log('当前访问令牌:', token ? '存在' : '不存在');
      
      if (!token) {
        console.log('未找到访问令牌，尝试获取管理员权限...');
        
        // 尝试获取管理员权限
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          console.log('管理员权限验证成功');
          this.setData({ adminAccessToken: authResult.token });
          return;
        } else {
          console.log('管理员权限验证失败:', authResult.error);
          
          // 显示错误信息而不是直接重定向
          wx.showModal({
            title: '权限验证失败',
            content: `验证失败: ${authResult.error}\n\n是否继续进入管理后台？`,
            success: (res) => {
              if (res.confirm) {
                console.log('用户选择继续进入管理后台');
                // 设置一个临时令牌
                const tempToken = 'temp_admin_token_' + Date.now();
                wx.setStorageSync('admin_access_token', tempToken);
                this.setData({ adminAccessToken: tempToken });
              } else {
                this.redirectToHome();
              }
            }
          });
          return;
        }
      }

      if (!AdminAuth.validateAccessToken(token)) {
        console.log('访问令牌已过期，尝试重新验证');
        // 清除过期的令牌
        wx.removeStorageSync('admin_access_token');
        // 重新验证
        const authResult = await AdminAuth.checkAdminAccess();
        
        if (authResult.success) {
          console.log('重新验证成功');
          this.setData({ adminAccessToken: authResult.token });
          return;
        } else {
          console.log('重新验证失败:', authResult.error);
          wx.showModal({
            title: '验证失败',
            content: `重新验证失败: ${authResult.error}\n\n是否继续进入管理后台？`,
            success: (res) => {
              if (res.confirm) {
                console.log('用户选择继续进入管理后台');
                // 设置一个临时令牌
                const tempToken = 'temp_admin_token_' + Date.now();
                wx.setStorageSync('admin_access_token', tempToken);
                this.setData({ adminAccessToken: tempToken });
              } else {
                this.redirectToHome();
              }
            }
          });
          return;
        }
      }

      console.log('管理员权限验证通过');
      this.setData({ adminAccessToken: token });
    } catch (error) {
      console.error('权限验证过程中发生错误:', error);
      
      // 显示错误信息而不是直接重定向
      wx.showModal({
        title: '验证错误',
        content: `验证过程中发生错误: ${error.message}\n\n是否继续进入管理后台？`,
        success: (res) => {
          if (res.confirm) {
            console.log('用户选择继续进入管理后台');
            // 设置一个临时令牌
            const tempToken = 'temp_admin_token_' + Date.now();
            wx.setStorageSync('admin_access_token', tempToken);
            this.setData({ adminAccessToken: tempToken });
          } else {
            this.redirectToHome();
          }
        }
      });
    }
  },

  // 重定向到首页
  redirectToHome: function() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },


  // 优化的CSV选择和预览
  chooseCSVFile: async function() {
    try {
      console.log('开始选择CSV文件');
      const res = await this.selectFile();
      
      // 检查返回结果
      if (!res || !res.tempFiles || res.tempFiles.length === 0) {
        throw new Error('未选择有效文件');
      }
      
      const tempFile = res.tempFiles[0];
      console.log('选择的文件:', tempFile);
      
      if (!tempFile || !tempFile.path) {
        throw new Error('文件路径无效');
      }
      
      // 先保存文件到本地
      this.saveCSVFile(tempFile);
      
      // 然后预览数据
      await this.previewCSVData(tempFile.path);
    } catch (error) {
      console.error('选择文件失败:', error);
      wx.showToast({
        title: '选择文件失败',
        icon: 'error'
      });
    }
  },

  // 选择文件
  selectFile: function() {
    return new Promise((resolve, reject) => {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['csv'],
        success: (res) => {
          console.log('文件选择成功:', res);
          resolve(res);
        },
        fail: (error) => {
          console.error('文件选择失败:', error);
          reject(error);
        }
      });
    });
  },

  // 预览CSV数据
  previewCSVData: async function(filePath) {
    wx.showLoading({ title: '解析中...' });
    
    try {
      console.log('开始预览CSV数据:', filePath);
      
      // 检查csvProcessor是否存在
      if (typeof csvProcessor === 'undefined') {
        throw new Error('csvProcessor未定义，请检查导入');
      }
      const result = await csvProcessor.parseCSV(filePath);
      
      if (result.success) {
        this.setData({
          csvPreviewData: result,
          showPreview: true,
          csvFilePath: filePath,
          csvUploaded: true,
          csvFileName: filePath.split('/').pop()
        });
        
        wx.hideLoading();
        
        const warningMsg = result.warnings && result.warnings.length > 0 
          ? `\n警告: ${result.warnings.length}个` 
          : '';
        
        wx.showModal({
          title: '解析成功',
          content: `共解析 ${result.data.length} 条数据${warningMsg}\n\n是否查看预览？`,
          success: (res) => {
            if (res.confirm) {
              this.showCSVPreview();
            }
          }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      wx.hideLoading();
      console.error('CSV预览失败:', error);
      wx.showModal({
        title: '解析失败',
        content: `解析失败: ${error.message}\n\n请检查文件格式是否正确。`,
        showCancel: false
      });
    }
  },

  // 显示CSV预览
  showCSVPreview: function() {
    if (!this.data.csvPreviewData) return;
    
    const data = this.data.csvPreviewData;
    let content = `数据预览 (前5条):\n\n`;
    
    data.data.slice(0, 5).forEach((item, index) => {
      content += `${index + 1}. ${item.title || item.productId}\n`;
      content += `   分类: ${item.categoryName}\n`;
      content += `   价格: ${item.price}\n\n`;
    });
    
    if (data.warnings && data.warnings.length > 0) {
      content += `\n警告信息:\n${data.warnings.slice(0, 3).join('\n')}`;
      if (data.warnings.length > 3) {
        content += `\n... 还有 ${data.warnings.length - 3} 个警告`;
      }
    }
    
    wx.showModal({
      title: '数据预览',
      content: content,
      showCancel: true,
      confirmText: '开始导入',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmImport();
        }
      }
    });
  },

  // 确认导入
  confirmImport: async function() {
    if (!this.data.csvPreviewData) return;

    wx.showModal({
      title: '确认导入',
      content: `即将导入 ${this.data.csvPreviewData.data.length} 条产品数据，此操作将覆盖同ID的现有产品。\n\n是否继续？`,
      success: async (res) => {
        if (res.confirm) {
          await this.executeImport();
        }
      }
    });
  },

  // 执行导入
  executeImport: async function() {
    
    this.setData({
      importRunning: true,
      importProgress: 0,
      importStatus: '开始导入...'
    });

    try {
      console.log('开始执行批量导入');
      const result = await csvProcessor.batchImport(
        this.data.csvPreviewData.data,
        (progress) => {
          this.setData({
            importProgress: progress.percentage,
            importStatus: `导入中... ${progress.current}/${progress.total} (批次${progress.batch})`
          });
        }
      );

      this.setData({
        importRunning: false,
        importStatus: `导入完成！成功：${result.success}，失败：${result.failed}`,
        importSuccess: result.failed === 0
      });

      // 保存导入日志
      this.saveImportLog(result);
      
      // 刷新产品列表
      this.loadData();

    } catch (error) {
      console.error('导入失败:', error);
      this.setData({
        importRunning: false,
        importStatus: `导入失败：${error.message}`,
        importSuccess: false
      });
    }
  },

  // 保存导入日志
  saveImportLog: function(result) {
    try {
      const logContent = `导入时间: ${new Date().toLocaleString()}\n` +
                        `成功: ${result.success} 条\n` +
                        `失败: ${result.failed} 条\n` +
                        `错误信息:\n${result.errors.join('\n')}\n\n`;
      
      const logPath = `${wx.env.USER_DATA_PATH}/import-log.txt`;
      
      // 先检查文件是否存在
      const fileExists = this.checkFileExists(logPath);
      
      if (fileExists) {
        // 文件存在，追加内容
        fs.appendFile({
          filePath: logPath,
          data: logContent,
          encoding: 'utf8',
          success: () => {
            console.log('导入日志追加成功');
            this.setData({ importLogExists: true });
          },
          fail: (error) => {
            console.error('导入日志追加失败:', error);
            // 如果追加失败，尝试重新创建文件
            this.createLogFile(logPath, logContent);
          }
        });
      } else {
        // 文件不存在，创建新文件
        this.createLogFile(logPath, logContent);
      }
    } catch (error) {
      console.error('保存导入日志失败:', error);
    }
  },

  // 创建日志文件
  createLogFile: function(logPath, logContent) {
    fs.writeFile({
      filePath: logPath,
      data: logContent,
      encoding: 'utf8',
      success: () => {
        console.log('导入日志文件创建成功');
        this.setData({ importLogExists: true });
      },
      fail: (error) => {
        console.error('导入日志文件创建失败:', error);
        // 如果还是失败，尝试使用同步方法
        try {
          fs.writeFileSync(logPath, logContent, 'utf8');
          console.log('导入日志文件同步创建成功');
          this.setData({ importLogExists: true });
        } catch (syncError) {
          console.error('导入日志文件同步创建也失败:', syncError);
          wx.showToast({
            title: '日志保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 数据导出功能
  exportData: async function() {
    try {
      wx.showLoading({ title: '导出中...' });
      
      const dataBackup = new DataBackup();
      const result = await dataBackup.exportAllProducts('csv');
      
      wx.hideLoading();
      
      wx.showModal({
        title: '导出成功',
        content: `已导出 ${result.count} 条数据到：\n${result.fileName}\n\n文件保存在小程序的用户数据目录中。`,
        showCancel: false
      });
      
      // 刷新备份历史
      this.loadBackupHistory();
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: '导出失败',
        content: error.message,
        showCancel: false
      });
    }
  },

  // 加载备份历史
  loadBackupHistory: function() {
    try {
      const dataBackup = new DataBackup();
      const history = dataBackup.getBackupHistory();
      this.setData({ backupHistory: history });
      console.log('备份历史加载完成:', history.length, '个文件');
    } catch (error) {
      console.error('加载备份历史失败:', error);
    }
  },

  // 查看备份历史
  viewBackupHistory: function() {
    const history = this.data.backupHistory;
    
    if (history.length === 0) {
      wx.showToast({
        title: '暂无备份文件',
        icon: 'none'
      });
      return;
    }
    
    const dataBackup = new DataBackup();
    let content = '备份文件列表:\n\n';
    
    history.slice(0, 5).forEach((backup, index) => {
      const date = new Date(backup.createTime).toLocaleString();
      const size = dataBackup.formatFileSize(backup.size);
      content += `${index + 1}. ${backup.fileName}\n`;
      content += `   时间: ${date}\n`;
      content += `   大小: ${size}\n\n`;
    });
    
    if (history.length > 5) {
      content += `... 还有 ${history.length - 5} 个备份文件`;
    }
    
    wx.showModal({
      title: '备份历史',
      content: content,
      showCancel: false
    });
  },

  // 清理旧备份
  cleanOldBackups: async function() {
    try {
      wx.showLoading({ title: '清理中...' });
      
      const dataBackup = new DataBackup();
      const deletedCount = await dataBackup.cleanOldBackups();
      
      wx.hideLoading();
      
      if (deletedCount > 0) {
        wx.showToast({
          title: `已清理 ${deletedCount} 个旧备份`,
          icon: 'success'
        });
        this.loadBackupHistory();
      } else {
        wx.showToast({
          title: '无需清理',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '清理失败',
        icon: 'error'
      });
    }
  },

  // 重新上传CSV文件
  resetCSVUpload: function() {
    wx.showModal({
      title: '重新上传',
      content: '确定要重新选择CSV文件吗？当前文件将被替换。',
      success: (res) => {
        if (res.confirm) {
          // 重置上传状态
          this.setData({
            csvUploaded: false,
            csvFilePath: '',
            csvFileName: '',
            csvPreviewData: null,
            showPreview: false,
            importStatus: '',
            importSuccess: false
          });
          
          // 立即打开文件选择
          this.chooseCSVFile();
        }
      }
    });
  },

  // 清除CSV文件
  clearCSVFile: function() {
    wx.showModal({
      title: '清除文件',
      content: '确定要清除已上传的CSV文件吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 删除本地保存的CSV文件
            const csvPath = `${wx.env.USER_DATA_PATH}/产品信息管理模板.csv`;
            if (this.checkFileExists(csvPath)) {
              fs.unlinkSync(csvPath);
              console.log('CSV文件已删除:', csvPath);
            }
            
            // 重置所有相关状态
            this.setData({
              csvUploaded: false,
              csvFilePath: '',
              csvFileName: '',
              csvPreviewData: null,
              showPreview: false,
              importStatus: '',
              importSuccess: false,
              importLogExists: false,
              importErrorsExist: false
            });
            
            wx.showToast({
              title: '文件已清除',
              icon: 'success'
            });
          } catch (error) {
            console.error('清除文件失败:', error);
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // ==================== 轮播图管理方法 ====================

  /**
   * 加载轮播图列表
   */
  async loadBanners() {
    this.setData({ bannersLoading: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getBanners',
          data: { includeDisabled: true }
        }
      });
      
      console.log('[Admin] 加载轮播图结果:', result);
      
      if (result.result && result.result.success) {
        const rawBanners = result.result.data || [];
        
        // 使用 bannerManager 的 sortBanners 函数进行排序
        // Requirements: 5.2 - 按 order 升序排序，相同 order 时按 createTime 排序
        const sortedBanners = sortBanners(rawBanners);
        
        // 处理空列表情况
        // Requirements: 5.5 - 空列表时显示提示信息
        if (sortedBanners.length === 0) {
          console.log('[Admin] 轮播图列表为空');
        }
        
        this.setData({
          banners: sortedBanners,
          bannersLoading: false
        });
      } else {
        this.setData({ 
          banners: [],
          bannersLoading: false 
        });
        wx.showToast({
          title: result.result?.error || '加载轮播图失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[Admin] 加载轮播图失败:', error);
      this.setData({ 
        banners: [],
        bannersLoading: false 
      });
      wx.showToast({
        title: '加载轮播图失败',
        icon: 'none'
      });
    }
  },

  /**
   * 刷新轮播图列表
   */
  refreshBanners() {
    this.loadBanners();
  },

  /**
   * 显示新增轮播图表单
   */
  showAddBannerForm() {
    this.setData({
      showBannerForm: true,
      editingBannerId: '',
      bannerFormData: {
        image: '',
        imageTemp: '', // 用于预览的临时URL
        title: '',
        subtitle: '',
        order: 999,
        status: 1,
        linkType: 'none',
        productId: '',
        categoryId: ''
      }
    });
  },

  /**
   * 编辑轮播图
   */
  async editBanner(e) {
    const id = e.currentTarget.dataset.id;
    const banner = this.data.banners.find(b => b._id === id);
    
    if (banner) {
      // 获取图片的临时URL用于预览
      let imageTemp = banner.image || '';
      if (banner.image && banner.image.startsWith('cloud://')) {
        try {
          const result = await wx.cloud.getTempFileURL({
            fileList: [banner.image]
          });
          if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
            imageTemp = result.fileList[0].tempFileURL;
          }
        } catch (error) {
          console.error('获取临时URL失败:', error);
        }
      }
      
      // 根据已有数据判断跳转类型
      let linkType = 'none';
      if (banner.categoryId) {
        linkType = 'category';
      } else if (banner.productId) {
        linkType = 'product';
      }
      
      this.setData({
        showBannerForm: true,
        editingBannerId: id,
        bannerFormData: {
          image: banner.image || '',
          imageTemp: imageTemp,
          title: banner.title || '',
          subtitle: banner.subtitle || '',
          order: banner.order !== undefined ? banner.order : 999,
          status: banner.status !== undefined ? banner.status : 1,
          linkType: linkType,
          productId: banner.productId || '',
          categoryId: banner.categoryId || ''
        }
      });
    }
  },

  /**
   * 关闭轮播图表单
   */
  closeBannerForm() {
    this.setData({
      showBannerForm: false,
      editingBannerId: '',
      bannerFormData: {
        image: '',
        imageTemp: '', // 重置临时预览URL
        title: '',
        subtitle: '',
        order: 999,
        status: 1,
        linkType: 'none',
        productId: '',
        categoryId: ''
      }
    });
  },

  /**
   * 阻止事件冒泡（用于弹窗内容区域）
   */
  preventBubble() {
    // 空函数，仅用于阻止事件冒泡
  },

  /**
   * 选择轮播图图片
   */
  chooseBannerImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        wx.showLoading({ title: '上传中...', mask: true });
        
        try {
          // 获取文件扩展名
          const extension = tempFilePath.split('.').pop().toLowerCase() || 'jpeg';
          // 上传图片到云存储 - 使用规范化路径 banners/banner_{timestamp}.{extension}
          const cloudPath = `banners/banner_${Date.now()}.${extension}`;
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath
          });
          
          wx.hideLoading();
          
          if (uploadResult.fileID) {
            // 🔧 修复：获取临时URL用于预览显示
            const tempUrlResult = await wx.cloud.getTempFileURL({
              fileList: [uploadResult.fileID]
            });
            
            let displayUrl = uploadResult.fileID;
            if (tempUrlResult.fileList && tempUrlResult.fileList[0] && tempUrlResult.fileList[0].tempFileURL) {
              displayUrl = tempUrlResult.fileList[0].tempFileURL;
            }
            
            this.setData({
              'bannerFormData.image': uploadResult.fileID,
              'bannerFormData.imageTemp': displayUrl // 用于预览的临时URL
            });
            wx.showToast({ title: '上传成功', icon: 'success' });
          } else {
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('[Admin] 上传轮播图图片失败:', error);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: (error) => {
        // 用户取消选择或选择失败，不做任何处理
        console.log('[Admin] 用户取消选择图片或选择失败:', error);
      }
    });
  },

  /**
   * 轮播图标题输入
   */
  onBannerTitleInput(e) {
    this.setData({
      'bannerFormData.title': e.detail.value
    });
  },

  /**
   * 轮播图副标题输入
   */
  onBannerSubtitleInput(e) {
    this.setData({
      'bannerFormData.subtitle': e.detail.value
    });
  },

  /**
   * 轮播图排序输入
   */
  onBannerOrderInput(e) {
    this.setData({
      'bannerFormData.order': parseInt(e.detail.value) || 999
    });
  },

  /**
   * 轮播图状态切换
   */
  onBannerStatusChange(e) {
    this.setData({
      'bannerFormData.status': e.detail.value ? 1 : 0
    });
  },

  /**
   * 轮播图跳转类型切换
   */
  onBannerLinkTypeChange(e) {
    const linkType = this.data.bannerLinkTypes[e.detail.value].value;
    this.setData({
      'bannerFormData.linkType': linkType,
      // 切换类型时清空对应的ID
      'bannerFormData.productId': linkType === 'product' ? this.data.bannerFormData.productId : '',
      'bannerFormData.categoryId': linkType === 'category' ? this.data.bannerFormData.categoryId : ''
    });
  },

  /**
   * 轮播图关联产品ID输入
   */
  onBannerProductIdInput(e) {
    this.setData({
      'bannerFormData.productId': e.detail.value
    });
  },

  /**
   * 轮播图关联分类选择
   */
  onBannerCategoryChange(e) {
    const categoryIndex = e.detail.value;
    const category = this.data.categories[categoryIndex];
    if (category) {
      this.setData({
        'bannerFormData.categoryId': category._id
      });
    }
  },

  /**
   * 保存轮播图
   */
  async saveBanner() {
    const { bannerFormData, editingBannerId } = this.data;
    
    // 使用 bannerManager 的 validateBannerData 函数进行数据验证
    // Requirements: 2.1, 7.3
    const validation = validateBannerData(bannerFormData);
    
    if (!validation.valid) {
      // 显示第一个验证错误
      wx.showToast({ 
        title: validation.errors[0] || '数据验证失败', 
        icon: 'none' 
      });
      console.warn('[Admin] 轮播图数据验证失败:', validation.errors);
      return;
    }
    
    this.setData({ bannerSaving: true });
    
    // 根据跳转类型设置对应的ID
    const productId = bannerFormData.linkType === 'product' ? bannerFormData.productId : '';
    const categoryId = bannerFormData.linkType === 'category' ? bannerFormData.categoryId : '';
    
    try {
      let result;
      
      if (editingBannerId) {
        // 更新轮播图
        result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'updateBanner',
            data: {
              id: editingBannerId,
              image: bannerFormData.image,
              title: bannerFormData.title,
              subtitle: bannerFormData.subtitle,
              order: bannerFormData.order,
              status: bannerFormData.status,
              linkType: bannerFormData.linkType,
              productId: productId,
              categoryId: categoryId
            }
          }
        });
      } else {
        // 新增轮播图
        result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'addBanner',
            data: {
              image: bannerFormData.image,
              title: bannerFormData.title,
              subtitle: bannerFormData.subtitle,
              order: bannerFormData.order,
              status: bannerFormData.status,
              linkType: bannerFormData.linkType,
              productId: productId,
              categoryId: categoryId
            }
          }
        });
      }
      
      console.log('[Admin] 保存轮播图结果:', result);
      
      this.setData({ bannerSaving: false });
      
      if (result.result && result.result.success) {
        wx.showToast({
          title: editingBannerId ? '更新成功' : '新增成功',
          icon: 'success'
        });
        this.closeBannerForm();
        this.loadBanners();
      } else {
        wx.showToast({
          title: result.result?.error || '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[Admin] 保存轮播图失败:', error);
      this.setData({ bannerSaving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  /**
   * 删除轮播图
   */
  deleteBanner(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个轮播图吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'productManager',
              data: {
                action: 'deleteBanner',
                data: { id }
              }
            });
            
            wx.hideLoading();
            
            if (result.result && result.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadBanners();
            } else {
              wx.showToast({
                title: result.result?.error || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('[Admin] 删除轮播图失败:', error);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ==================== 案例管理方法 ====================

  /**
   * 加载案例列表
   * Requirements: 4.2
   */
  async loadCases() {
    this.setData({ casesLoading: true });
    
    try {
      const cases = await caseAdminManager.getAllCases();
      
      console.log('[Admin] 加载案例结果:', cases);
      
      // 使用 caseManager 的 sortCases 函数进行排序
      const sortedCases = sortCases(cases);
      
      // 处理空列表情况
      if (sortedCases.length === 0) {
        console.log('[Admin] 案例列表为空');
      }
      
      this.setData({
        cases: sortedCases,
        casesLoading: false
      });
    } catch (error) {
      console.error('[Admin] 加载案例失败:', error);
      this.setData({ 
        cases: [],
        casesLoading: false 
      });
      wx.showToast({
        title: '加载案例失败',
        icon: 'none'
      });
    }
  },

  /**
   * 刷新案例列表
   */
  refreshCases() {
    this.loadCases();
  },

  /**
   * 显示新增案例表单
   * Requirements: 4.3
   */
  showAddCaseForm() {
    this.setData({
      showCaseForm: true,
      editingCaseId: '',
      caseFormData: {
        imageUrl: '',
        imageTemp: '',
        title: '',
        description: '',
        order: 999,
        status: 1
      }
    });
  },

  /**
   * 编辑案例
   * Requirements: 4.6
   */
  async editCase(e) {
    const id = e.currentTarget.dataset.id;
    const caseItem = this.data.cases.find(c => c._id === id);
    
    if (caseItem) {
      // 获取图片的临时URL用于预览
      let imageTemp = caseItem.imageUrl || '';
      if (caseItem.imageUrl && caseItem.imageUrl.startsWith('cloud://')) {
        try {
          const result = await wx.cloud.getTempFileURL({
            fileList: [caseItem.imageUrl]
          });
          if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
            imageTemp = result.fileList[0].tempFileURL;
          }
        } catch (error) {
          console.error('获取临时URL失败:', error);
        }
      }
      
      // 预填充表单数据
      // Requirements: 4.6 - 编辑时预填充所有现有字段值
      this.setData({
        showCaseForm: true,
        editingCaseId: id,
        caseFormData: {
          imageUrl: caseItem.imageUrl || '',
          imageTemp: imageTemp,
          title: caseItem.title || '',
          description: caseItem.description || '',
          order: caseItem.order !== undefined ? caseItem.order : 999,
          status: caseItem.status !== undefined ? caseItem.status : 1
        }
      });
    }
  },

  /**
   * 关闭案例表单
   */
  closeCaseForm() {
    this.setData({
      showCaseForm: false,
      editingCaseId: '',
      caseFormData: {
        imageUrl: '',
        imageTemp: '',
        title: '',
        description: '',
        order: 999,
        status: 1
      }
    });
  },

  /**
   * 选择案例图片
   * Requirements: 4.4
   */
  chooseCaseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const fileSize = res.tempFiles[0].size;
        
        // 验证图片格式和大小
        // Requirements: 4.4 - 验证图片格式(jpg, jpeg, png)和大小(max 2MB)
        const validation = validateImageFile(tempFilePath, fileSize);
        if (!validation.valid) {
          wx.showToast({
            title: validation.error,
            icon: 'none'
          });
          return;
        }
        
        // 如果是编辑模式，立即上传图片
        if (this.data.editingCaseId) {
          wx.showLoading({ title: '上传中...', mask: true });
          
          try {
            // 上传图片到云存储
            const fileID = await uploadCaseImage(tempFilePath, this.data.editingCaseId);
            
            wx.hideLoading();
            
            if (fileID) {
              // 获取临时URL用于预览显示
              const tempUrlResult = await wx.cloud.getTempFileURL({
                fileList: [fileID]
              });
              
              let displayUrl = fileID;
              if (tempUrlResult.fileList && tempUrlResult.fileList[0] && tempUrlResult.fileList[0].tempFileURL) {
                displayUrl = tempUrlResult.fileList[0].tempFileURL;
              }
              
              this.setData({
                'caseFormData.imageUrl': fileID,
                'caseFormData.imageTemp': displayUrl
              });
              wx.showToast({ title: '上传成功', icon: 'success' });
            } else {
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('[Admin] 上传案例图片失败:', error);
            wx.showToast({ title: error.message || '上传失败', icon: 'none' });
          }
        } else {
          // 新增模式：只保存临时图片路径，在保存案例时再上传
          this.setData({
            'caseFormData.imageTemp': tempFilePath,
            'caseFormData.imageUrl': '' // 清空，表示需要上传
          });
          console.log('[Admin] 新增案例：已选择图片，保存临时路径:', tempFilePath);
        }
      },
      fail: (error) => {
        // 用户取消选择或选择失败，不做任何处理
        console.log('[Admin] 用户取消选择图片或选择失败:', error);
      }
    });
  },

  /**
   * 案例标题输入
   */
  onCaseTitleInput(e) {
    this.setData({
      'caseFormData.title': e.detail.value
    });
  },

  /**
   * 案例描述输入
   */
  onCaseDescriptionInput(e) {
    this.setData({
      'caseFormData.description': e.detail.value
    });
  },

  /**
   * 案例排序输入
   */
  onCaseOrderInput(e) {
    this.setData({
      'caseFormData.order': parseInt(e.detail.value) || 999
    });
  },

  /**
   * 案例状态切换
   */
  onCaseStatusChange(e) {
    this.setData({
      'caseFormData.status': e.detail.value ? 1 : 0
    });
  },

  /**
   * 保存案例
   * Requirements: 4.5
   */
  async saveCase() {
    const { caseFormData, editingCaseId } = this.data;
    
    // 使用 caseManager 的 validateCaseData 函数进行数据验证
    const validation = validateCaseData(caseFormData);
    
    if (!validation.valid) {
      // 显示第一个验证错误
      wx.showToast({ 
        title: validation.errors[0] || '数据验证失败', 
        icon: 'none' 
      });
      console.warn('[Admin] 案例数据验证失败:', validation.errors);
      return;
    }
    
    this.setData({ caseSaving: true });
    
    try {
      let result;
      
      if (editingCaseId) {
        // 更新案例
        result = await caseAdminManager.updateCase(editingCaseId, {
          title: caseFormData.title,
          description: caseFormData.description,
          imageUrl: caseFormData.imageUrl,
          order: caseFormData.order,
          status: caseFormData.status
        });
      } else {
        // 新增案例
        // 1. 先创建案例记录（不带图片或带临时图片路径）
        const createResult = await caseAdminManager.createCase({
          title: caseFormData.title,
          description: caseFormData.description,
          imageUrl: '', // 先不设置图片
          order: caseFormData.order,
          status: caseFormData.status
        });
        
        if (!createResult.success) {
          throw new Error(createResult.error || '创建案例失败');
        }
        
        const newCaseId = createResult.id;
        console.log('[Admin] 新案例创建成功，ID:', newCaseId);
        
        // 2. 如果有临时图片，上传图片并更新记录
        if (caseFormData.imageTemp && !caseFormData.imageUrl) {
          wx.showLoading({ title: '上传图片中...', mask: true });
          
          try {
            const fileID = await uploadCaseImage(caseFormData.imageTemp, newCaseId);
            
            if (fileID) {
              // 更新案例的图片URL
              await caseAdminManager.updateCase(newCaseId, {
                title: caseFormData.title,
                description: caseFormData.description,
                imageUrl: fileID,
                order: caseFormData.order,
                status: caseFormData.status
              });
              console.log('[Admin] 案例图片上传成功:', fileID);
            }
          } catch (uploadError) {
            console.error('[Admin] 上传案例图片失败:', uploadError);
            // 图片上传失败不影响案例创建，只是没有图片
            wx.showToast({ 
              title: '案例已创建，但图片上传失败', 
              icon: 'none',
              duration: 2000
            });
          } finally {
            wx.hideLoading();
          }
        }
        
        result = { success: true };
      }
      
      console.log('[Admin] 保存案例结果:', result);
      
      this.setData({ caseSaving: false });
      
      if (result.success) {
        wx.showToast({
          title: editingCaseId ? '更新成功' : '新增成功',
          icon: 'success'
        });
        this.closeCaseForm();
        this.loadCases();
      } else {
        wx.showToast({
          title: result.error || '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[Admin] 保存案例失败:', error);
      this.setData({ caseSaving: false });
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  },

  /**
   * 删除案例
   * Requirements: 4.7
   */
  deleteCase(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个案例吗？删除后将同时删除云存储中的图片。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });
          
          try {
            // Requirements: 4.7 - 删除数据库记录和云存储图片
            const result = await caseAdminManager.deleteCase(id);
            
            wx.hideLoading();
            
            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadCases();
            } else {
              wx.showToast({
                title: result.error || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('[Admin] 删除案例失败:', error);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
}); 