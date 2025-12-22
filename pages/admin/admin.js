// admin.js
const { uploadProductImages, uploadBannerImage, uploadCategoryImage } = require('../../utils/cloudUploader.js');
const ProductModel = require('../../models/product.js');
const CategoryModel = require('../../models/category.js');
const { migrateDataInMiniProgram } = require('../../scripts/migrate-to-cloud.js');
const { testCloudFunctionInMiniProgram } = require('../../scripts/test-cloud-function.js');
const AdminAuth = require('../../utils/admin-auth.js');
const csvProcessor = require('../../utils/csv-processor.js');
const DataBackup = require('../../utils/data-backup.js');
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
    migrationSuccess: false // 迁移是否成功
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
        // 更新产品数据
        const db = wx.cloud.database();
        await db.collection('products').doc(this.data.currentProduct._id).update({
          data: {
            images: fileIDs,
            updateTime: db.serverDate()
          }
        });
        
        wx.hideLoading();
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
        // 更新分类数据
        const db = wx.cloud.database();
        const updateData = {};
        updateData[type] = fileID;
        updateData.updateTime = db.serverDate();
        
        await db.collection('categories').doc(this.data.currentCategory._id).update({
          data: updateData
        });
        
        wx.hideLoading();
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
        // 创建轮播图数据
        const db = wx.cloud.database();
        await db.collection('banners').add({
          data: {
            image: fileID,
            title: '轮播图',
            link: '',
            order: 1,
            status: 1,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
        
        // 清空临时数据
        this.setData({
          tempImages: []
        });
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
module.exports = {
  // CSV 源文件路径
  inputFilePath: '${wx.env.USER_DATA_PATH}/产品信息管理模板.csv',

  // 生成的中间 JSON 文件
  outputJsonPath: '${wx.env.USER_DATA_PATH}/generated-products.json',

  // 是否自动写入 utils/mock-data.js -> mockProducts
  autoInjectToMockData: true,

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
      '原木经典': 'cat_wood',
      '树脂美学': 'cat_resin',
      '玩趣设计': 'cat_design',
      '高定专属': 'cat_custom',
      '桌架专区': 'cat_frame'
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
  }
}); 