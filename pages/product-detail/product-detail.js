// product-detail.js
const productData = require('../../utils/productData.js');
import cloudProductData from '../../utils/cloudProductData.js';
const { CONTACT_INFO, PAGINATION_CONFIG } = require('../../config/app-config.js');

Page({
  data: {
    id: null,
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    showQRCode: false, // 控制二维码弹窗显示
    product: {
      id: '',
      name: '',
      brief: '',
      images: [],
      params: [],
      features: [], // Requirements 3.5: 产品特点
      // 🆕 产品参数字段
      size: '',
      weight: '',
      color: '',
      applicationScenario: '',
      price: '',
      originalPrice: '' // Requirements 3.6: 原价
    },
    similarProducts: [], // 初始化为空数组，将在加载产品数据后填充
    contactPhone: CONTACT_INFO.phone,
    // 自定义轮播相关
    currentImageIndex: 0, // 当前显示的图片索引
    swiperItemWidth: 375, // 轮播项宽度，默认屏幕宽度
    // 产品视频相关
    productVideos: [] // 产品视频数组
  },
  
  onLoad: function(options) {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    
    // 设置状态栏高度和内容区域顶部内边距
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44; // 固定导航栏高度
    const contentPaddingTop = statusBarHeight + navBarHeight;
    
    // 计算内容区域高度
    const windowHeight = windowInfo.windowHeight;
    const contentHeight = windowHeight - contentPaddingTop;
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      contentPaddingTop: contentPaddingTop,
      contentHeight: contentHeight,
      swiperItemWidth: windowInfo.windowWidth // 设置轮播项宽度为屏幕宽度
    });
    
    console.log('详情页 onLoad, options:', options);
    
    if (options && options.id) {
      console.log('详情页接收到的ID:', options.id);
      this.setData({
        id: options.id
      });
      
      // 加载产品数据
      this.loadProductData(options.id);
    } else {
      console.error('详情页没有接收到ID参数');
      wx.showToast({
        title: '未指定产品',
        icon: 'none'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);
    }
  },
  
  // 处理导航栏返回事件
  onBack: function(e) {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 🆕 使用云数据库加载产品数据
  async loadProductData(id) {
    try {
      console.log('正在从云数据库加载产品数据，ID:', id);
      
      // 显示加载提示
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      
      // 🆕 从云数据库获取产品详情（已包含临时URL处理）
      const result = await productData.getProductById(id);
      
      if (result) {
        console.log('云数据库产品数据:', result);
        
        // 🆕 数据已经在productData中处理完成，直接使用
        const product = {
          id: result._id,
          _id: result._id,
          name: result.name || '',
          brief: result.brief || result.description || '',
          // 🔧 修复：使用正确的图片数组
          images: result.images || [],
          imageUrls: result.imageUrls || [], // 🔧 修复：使用正确的 imageUrls 字段
          detailImages: [],
          params: result.params || [],
          features: result.features || [],
          price: result.price,
          originalPrice: result.originalPrice, // Requirements 3.6: 原价
          categoryId: result.categoryId,
          // 🆕 使用已处理的视频数据
          videos: result.videos || [],
          // 🆕 产品参数字段
          size: result.size || '',
          weight: result.weight || '',
          color: result.color || '',
          applicationScenario: result.applicationScenario || ''
        };
        
        console.log('转换后的产品数据:', product);
        console.log('产品ID:', product.id);
        console.log('产品名称:', product.name);
        console.log('product.images:', product.images);
        console.log('product.videos:', product.videos);
        console.log('🔧 产品参数信息:', {
          size: product.size,
          weight: product.weight,
          color: product.color,
          applicationScenario: product.applicationScenario
        });
        
        // 🆕 提取产品视频（视频URL已经是临时URL）
        const productVideos = this.extractProductVideos(product);
        
        this.setData({
          product: product,
          productVideos: productVideos
        });
        
        console.log('云数据库产品数据设置完成');
        console.log('产品视频数量:', productVideos.length);
        console.log('页面数据设置完成，当前this.data.product.images:', this.data.product.images);
        
        // 🆕 加载相似推荐产品
        this.loadSimilarProducts(id, product.categoryId);
      } else {
        throw new Error('产品数据为空');
      }
    } catch (error) {
      console.error('加载产品数据失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 2000);
    } finally {
      wx.hideLoading();
    }
  },
  
  // 🆕 加载相似推荐产品（使用云数据库）
  async loadSimilarProducts(currentProductId, categoryId) {
    try {
      console.log('加载相似产品，分类:', categoryId);
      
      // 🆕 从productData获取同类别产品
      const result = await productData.getProductsByCategory(categoryId, {
        limit: PAGINATION_CONFIG.similarProductsLimit + 1
      });
      
      if (result && result.products && result.products.length > 0) {
        // 过滤掉当前产品，最多取5个
        const similarProducts = result.products
          .filter(item => item._id !== currentProductId)
          .slice(0, PAGINATION_CONFIG.similarProductsLimit)
          .map(item => ({
            id: item._id,
            name: item.name,
            imageUrl: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : 
                     (item.images && item.images.length > 0) ? item.images[0] : 
                     'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/default-product.jpeg'
          }));
        
        console.log('云数据库相似推荐产品:', similarProducts);
        
        this.setData({
          similarProducts: similarProducts
        });
      }
    } catch (error) {
      console.error('加载相似推荐产品失败:', error);
      // 🆕 使用云端URL的默认推荐产品
      this.setData({
        similarProducts: [
          {
            id: 'custom1',
            name: '海浪亮光款',
            imageUrl: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/custom/custom1.jpeg'
          },
          {
            id: 'custom2',
            name: '南美胡桃木海浪款',
            imageUrl: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/custom/custom2.jpeg'
          },
          {
            id: 'custom3',
            name: '南美胡桃木海洋款河流桌自然边',
            imageUrl: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/custom/custom3.jpeg'
          }
        ]
      });
    }
  },
  
  // 预览图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.product.images || []
    });
  },

  // 图片加载成功事件
  onImageLoad: function(e) {
    console.log('图片加载成功:', e.target.src);
  },

  // 图片加载失败事件
  onImageError: function(e) {
    const imageSrc = e.target.src;
    const imageIndex = e.currentTarget.dataset.index;
    
    console.error('🖼️ 图片加载失败:', imageSrc);
    console.error('🖼️ 错误详情:', e.detail);
    
    // 如果是临时URL加载失败（403错误），尝试重新获取
    if (imageSrc && imageSrc.includes('tcb.qcloud.la') && imageSrc.includes('sign=')) {
      console.log('🔄 检测到临时URL失败，可能已过期');
      this.refreshImageUrl(imageIndex, imageSrc);
    }
  },

  // 🆕 刷新图片URL
  async refreshImageUrl(imageIndex, failedUrl) {
    try {
      console.log('🔄 尝试刷新图片URL:', failedUrl);
      
      // 从失败的临时URL中提取原始文件ID
      // 临时URL格式：https://xxx.tcb.qcloud.la/xxx?sign=xxx&t=xxx
      const urlObj = new URL(failedUrl);
      const pathname = urlObj.pathname;
      
      // 重构原始文件ID
      const envId = 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
      const originalFileId = `cloud://${envId}${pathname}`;
      
      console.log('🔍 重构的文件ID:', originalFileId);
      
      // 重新获取临时URL
      const result = await wx.cloud.getTempFileURL({
        fileList: [originalFileId]
      });
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0];
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          console.log('✅ 成功获取新的临时URL:', fileInfo.tempFileURL);
          
          // 更新图片数组
          const product = this.data.product;
          if (product.images && imageIndex !== undefined && imageIndex < product.images.length) {
            product.images[imageIndex] = fileInfo.tempFileURL;
            this.setData({
              product: product
            });
            
            wx.showToast({
              title: '图片已刷新',
              icon: 'success',
              duration: 1500
            });
          }
        } else {
          console.error('❌ 获取临时URL失败:', fileInfo.errMsg);
        }
      }
    } catch (error) {
      console.error('❌ 刷新图片URL失败:', error);
    }
  },
  
  // 拨打电话
  makePhoneCall: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.contactPhone,
      success: function() {
        console.log('拨打电话成功');
      },
      fail: function() {
        console.log('拨打电话失败');
      }
    });
  },
  
  // 跳转到其他产品详情
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    // 如果是当前产品，不跳转
    if (id === this.data.id) return;
    
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=' + id
    });
  },
  
  // 收藏/取消收藏
  toggleFavorite: function() {
    const product = this.data.product;
    // 使用 product.id 或 this.data.id 作为产品ID
    const id = product.id || this.data.id;
    
    if (!id) {
      console.error('无法收藏：产品ID不存在');
      return;
    }
    
    console.log('收藏产品，ID:', id);
    
    // 使用公共产品数据模块处理收藏逻辑
    const isFavorite = productData.toggleProductFavorite(id, product);
    
    // 更新页面状态
    product.isFavorite = isFavorite;
    this.setData({
      product: product
    });
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: this.data.product.name,
      path: '/pages/product-detail/product-detail?id=' + this.data.id,
      imageUrl: this.data.product.images[0]
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

  // 自定义轮播控制方法
  
  // 切换到指定图片
  switchToImage: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentImageIndex: index
    });
  },

  // 上一张图片
  prevImage: function() {
    const currentIndex = this.data.currentImageIndex;
    if (currentIndex > 0) {
      this.setData({
        currentImageIndex: currentIndex - 1
      });
    }
  },

  // 下一张图片
  nextImage: function() {
    const currentIndex = this.data.currentImageIndex;
    const maxIndex = this.data.product.images.length - 1;
    if (currentIndex < maxIndex) {
      this.setData({
        currentImageIndex: currentIndex + 1
      });
    }
  },

  // 监听滚动事件（可选，用于自动更新指示器）
  onSwiperScroll: function(e) {
    const scrollLeft = e.detail.scrollLeft;
    const itemWidth = this.data.swiperItemWidth;
    const currentIndex = Math.round(scrollLeft / itemWidth);
    
    if (currentIndex !== this.data.currentImageIndex) {
      this.setData({
        currentImageIndex: currentIndex
      });
    }
  },

  // 产品详情图相关方法

  // 预览详情图片
  previewDetailImage: function(e) {
    const url = e.currentTarget.dataset.url;
    const index = parseInt(e.currentTarget.dataset.index);
    
    wx.previewImage({
      current: url,
      urls: this.data.product.images,
      success: () => {
        console.log('预览详情图片成功:', url);
      },
      fail: (err) => {
        console.error('预览详情图片失败:', err);
        wx.showToast({
          title: '图片预览失败',
          icon: 'none'
        });
      }
    });
  },

  // 详情图加载成功
  onDetailImageLoad: function(e) {
    console.log('详情图加载成功');
  },

  // 详情图加载失败
  onDetailImageError: function(e) {
    console.error('详情图加载失败:', e);
    // 可以在这里设置默认图片或显示错误提示
  },

  // 🆕 提取产品视频（视频URL已经是临时URL）
  extractProductVideos: function(product) {
    const videos = [];
    const seenUrls = new Set(); // 🆕 在提取过程中就进行去重
    
    // 🆕 辅助函数：添加视频（自动去重）
    const addVideo = (videoData) => {
      const videoUrl = videoData.originalVideo || videoData.video;
      if (videoUrl && !seenUrls.has(videoUrl)) {
        seenUrls.add(videoUrl);
        videos.push(videoData);
        return true;
      }
      return false;
    };
    
    // 🔧 修复：首先尝试从features中提取视频
    if (product.features && Array.isArray(product.features)) {
      product.features.forEach((feature, index) => {
        if (feature.type === 'video' && feature.video) {
          addVideo({
            title: feature.title || '产品展示',
            video: feature.video, // 直接使用临时URL
            originalVideo: feature.video,
            description: feature.description || '',
            hasError: false,
            errorMsg: '',
            poster: feature.poster || '',
            originalIndex: index,
            retryCount: 0,
            maxRetries: 3,
            isCloudVideo: feature.video.startsWith('cloud://'), // 判断是否为云存储URL
            source: 'features' // 🆕 标记来源
          });
        }
      });
    }
    
    // 🔧 修复：处理直接的videos字段
    if (product.videos && Array.isArray(product.videos)) {
      product.videos.forEach((video, index) => {
        if (video.url) {
          addVideo({
            title: video.title || '产品展示',
            video: video.url, // 直接使用临时URL
            originalVideo: video.url,
            description: video.description || '',
            hasError: false,
            errorMsg: '',
            poster: video.poster || '',
            originalIndex: index,
            retryCount: 0,
            maxRetries: 3,
            isCloudVideo: video.url.startsWith('cloud://'), // 判断是否为云存储URL
            source: 'videos' // 🆕 标记来源
          });
        }
      });
    }
    
    // 🔧 修复：如果上面都没找到视频，尝试从产品的直接视频字段中提取
    if (videos.length === 0) {
      const videoUrl = product.videoUrlTemp || product.videoUrl || product.video;
      if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '') {
        addVideo({
          title: '产品展示视频',
          video: videoUrl,
          originalVideo: videoUrl,
          description: '产品视频展示',
          hasError: false,
          errorMsg: '',
          poster: '',
          originalIndex: 0,
          retryCount: 0,
          maxRetries: 3,
          isCloudVideo: videoUrl.startsWith('cloud://'), // 判断是否为云存储URL
          source: 'direct' // 🆕 标记来源
        });
      }
    }
    
    console.log('🎬 提取到的产品视频（已自动去重）:', videos);
    console.log('🎬 视频来源统计:', videos.map(v => v.source));
    
    return videos;
  },

  // 🆕 检查是否为云存储URL
  isCloudStorageUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // 检查是否为云存储URL格式
    return url.startsWith('cloud://') || 
           url.includes('tcb-api.tencentcloudapi.com') ||
           url.includes('cloud1-7gm53wok768268c9') ||
           url.includes('636c-cloud1-7gm53wok768268c9');
  },

  // 🆕 处理云存储视频URL（简化版本，直接使用CSV中的URL）
  processCloudVideoUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return url;
    }
    
    console.log('处理视频URL:', url);
    
    // 🆕 如果已经是云存储URL，直接使用或修正格式
    if (this.isCloudStorageUrl(url)) {
      return this.correctCloudVideoUrl(url);
    }
    
    // 🆕 对于其他格式的URL，直接返回（CSV中应该已经是正确的云端URL）
    console.log('保持原有视频URL:', url);
    return url;
  },

  // 🆕 修正云存储视频URL格式
  correctCloudVideoUrl: function(url) {
    if (!url || !url.startsWith('cloud://')) {
      return url;
    }
    
    // 🆕 实际的完整环境ID（这是正确的！）
    const correctEnvId = 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
    
    console.log('🔍 开始检查URL格式:', url);
    
    // 🆕 检查环境ID是否正确，但不直接返回，还需要检查路径
    const hasCorrectEnvId = url.startsWith(`cloud://${correctEnvId}/`);
    if (hasCorrectEnvId) {
      console.log('✅ 环境ID格式已正确');
      // 不直接返回，继续检查路径是否需要修正
    }
    
    let correctedUrl = url;
    let wasModified = false;
    
    // 🆕 只有在环境ID不正确时才修正环境ID
    if (!hasCorrectEnvId) {
      // 只修正明显错误的格式，保留正确的环境ID
      const wrongEnvPatterns = [
        // 只修正明显的错误格式
        /cloud:\/\/636c-cloud1-7gm53wok768268c9-1369425968/g,
        /cloud:\/\/636c-cloud1-7gm53wok768268c9\.636c-636c-cloud1-7gm53wok768268c9-1369425968-1330048780/g,
        /cloud:\/\/636c-cloud1-7gm53wok768268c9(?!\.636c)/g  // 避免匹配正确格式
      ];
      
      // 只修正明显错误的格式
      wrongEnvPatterns.forEach(pattern => {
        if (pattern.test(correctedUrl)) {
          const pathMatch = correctedUrl.match(/cloud:\/\/[^\/]+(.+)$/);
          if (pathMatch) {
            const filePath = pathMatch[1];
            correctedUrl = `cloud://${correctEnvId}${filePath}`;
            wasModified = true;
            console.log('🔧 修正错误格式的URL');
          }
        }
      });
      
      // 🆕 特殊处理：如果是简化的环境ID格式，需要扩展到完整格式
      if (!wasModified && url.startsWith('cloud://cloud1-7gm53wok768268c9/')) {
        const pathMatch = url.match(/cloud:\/\/cloud1-7gm53wok768268c9(.+)$/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          correctedUrl = `cloud://${correctEnvId}${filePath}`;
          wasModified = true;
          console.log('🔧 扩展简化的环境ID为完整格式');
        }
      }
    }
    
    // 🆕 修复视频路径中缺失的 custom/ 目录（不管环境ID是否正确，都要检查路径）
    if (correctedUrl.includes('/products/videos/') && 
        !correctedUrl.includes('/products/videos/custom/') &&
        /custom\d+-v\d+\.mp4$/i.test(correctedUrl)) {
      // 检测类似 custom1-v1.mp4 的文件名，但路径中没有 custom/ 目录
      correctedUrl = correctedUrl.replace(
        '/products/videos/', 
        '/products/videos/custom/'
      );
      wasModified = true;
      console.log('🔧 修复视频路径，添加 custom/ 目录');
    }
    
    if (wasModified) {
      console.log('🔄 URL修正结果:', url, '->', correctedUrl);
    } else {
      console.log('⚠️ URL未被修正，可能需要检查格式:', url);
    }
    
    return correctedUrl;
  },

  // 视频播放事件
  onVideoPlay: function(e) {
    const index = e.currentTarget.dataset.index;
    const videoUrl = e.currentTarget.dataset.videoUrl;
    console.log('视频开始播放:', index, videoUrl);
    
    // 清除该视频的错误状态
    const productVideos = this.data.productVideos;
    if (productVideos[index] && productVideos[index].hasError) {
      productVideos[index].hasError = false;
      productVideos[index].errorMsg = '';
      this.setData({
        productVideos: productVideos
      });
    }
  },

  // 视频暂停事件
  onVideoPause: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('视频暂停播放:', index);
  },

  // 视频等待事件
  onVideoWaiting: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('视频缓冲中:', index);
  },

  // 视频加载完成事件
  onVideoLoaded: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('视频元数据加载完成:', index, e.detail);
  },

  // 🆕 优化的视频错误处理
  onVideoError: function(e) {
    const index = e.currentTarget.dataset.index;
    const videoUrl = e.currentTarget.dataset.videoUrl;
    const errorDetail = e.detail;
    
    console.error('视频播放错误:', {
      index: index,
      videoUrl: videoUrl,
      error: errorDetail
    });

    const productVideos = this.data.productVideos;
    if (!productVideos[index]) {
      return;
    }

    const currentVideo = productVideos[index];
    
    // 🆕 如果是云存储视频错误，尝试获取临时URL
    if (currentVideo.isCloudVideo && videoUrl && videoUrl.startsWith('cloud://')) {
      console.log('云存储视频加载失败，尝试获取临时URL...');
      this.tryGetTempVideoUrl(index, videoUrl);
      return;
    }
    
    // 解析错误信息
    let errorMsg = '视频加载失败';
    let canRetry = true;
    
    // 🆕 移除本地备用视频相关逻辑
    // 直接处理云存储视频错误
    
    if (errorDetail && errorDetail.errMsg) {
      const errMsg = errorDetail.errMsg;
      if (errMsg.includes('MEDIA_ERR_SRC_NOT_SUPPORTED')) {
        errorMsg = '视频格式不支持或文件不存在';
        canRetry = false;
      } else if (errMsg.includes('MEDIA_ERR_NETWORK') || errMsg.includes('ERR_TIMED_OUT')) {
        errorMsg = '网络连接超时，请检查网络后重试';
        canRetry = true;
      } else if (errMsg.includes('MEDIA_ERR_DECODE')) {
        errorMsg = '视频解码失败，文件可能已损坏';
        canRetry = false;
      } else if (errMsg.includes('MEDIA_ERR_ABORTED')) {
        errorMsg = '视频加载被中断';
        canRetry = true;
      }
    }

    // 检查是否可以自动重试
    if (canRetry && currentVideo.retryCount < currentVideo.maxRetries) {
      console.log(`视频自动重试 ${currentVideo.retryCount + 1}/${currentVideo.maxRetries}`);
      
      // 增加重试次数
      currentVideo.retryCount++;
      
      // 延迟重试
      setTimeout(() => {
        this.retryVideoInternal(index);
      }, 2000);
      
      // 显示重试提示
      wx.showToast({
        title: `正在重试 (${currentVideo.retryCount}/${currentVideo.maxRetries})`,
        icon: 'loading',
        duration: 1500
      });
    } else {
      // 更新视频错误状态
      currentVideo.hasError = true;
      currentVideo.errorMsg = errorMsg;
      currentVideo.canRetry = canRetry;
      
      this.setData({
        productVideos: productVideos
      });

      // 显示错误提示
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 🆕 尝试获取云存储视频的临时URL
  async tryGetTempVideoUrl(index, cloudFileId) {
    try {
      console.log('🎬 开始获取云存储视频临时URL:', cloudFileId);
      
      // 🆕 修正云文件ID格式
      const correctedFileId = this.correctCloudVideoUrl(cloudFileId);
      console.log('🔧 修正后的云文件ID:', correctedFileId);
      
      // 🆕 验证云文件ID格式（使用完整的环境ID）
      if (!correctedFileId.startsWith('cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/')) {
        console.error('❌ 云文件ID格式仍然不正确:', correctedFileId);
        console.error('❌ 期望格式: cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/...');
        this.handleVideoLoadFailure(index, '视频文件ID格式错误');
        return;
      }
      
      console.log('📡 开始调用 wx.cloud.getTempFileURL...');
      const result = await wx.cloud.getTempFileURL({
        fileList: [correctedFileId]
      });
      
      console.log('📥 getTempFileURL 响应:', result);
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0];
        console.log('📄 文件信息:', fileInfo);
        
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          console.log('✅ 获取临时URL成功:', fileInfo.tempFileURL);
          
          // 更新视频URL
          const productVideos = this.data.productVideos;
          if (productVideos[index]) {
            productVideos[index].video = fileInfo.tempFileURL;
            productVideos[index].hasError = false;
            productVideos[index].errorMsg = '';
            productVideos[index].retryCount = 0;
            
            this.setData({
              productVideos: productVideos
            });
            
            wx.showToast({
              title: '视频地址已更新',
              icon: 'success',
              duration: 2000
            });
          }
        } else {
          // 🆕 处理文件不存在的情况
          console.error('❌ 获取临时URL失败 - 状态:', fileInfo.status, '错误信息:', fileInfo.errMsg);
          if (fileInfo.errMsg && fileInfo.errMsg.includes('STORAGE_FILE_NONEXIST')) {
            console.log('📂 云存储文件不存在');
            this.handleVideoLoadFailure(index, '视频文件不存在');
          } else {
            throw new Error('获取临时URL失败: ' + (fileInfo.errMsg || '未知错误'));
          }
        }
      } else {
        throw new Error('未返回文件信息');
      }
    } catch (error) {
      console.error('❌ 获取临时URL异常:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack,
        cloudFileId: cloudFileId,
        correctedFileId: this.correctCloudVideoUrl(cloudFileId)
      });
      
      // 🆕 统一的错误处理
      let errorMsg = '云存储视频访问失败';
      if (error.message) {
        if (error.message.includes('STORAGE_FILE_NONEXIST')) {
          errorMsg = '视频文件不存在';
        } else if (error.message.includes('not initialized')) {
          errorMsg = '云开发环境未初始化';
        } else if (error.message.includes('network')) {
          errorMsg = '网络连接失败';
        } else {
          errorMsg += ': ' + error.message;
        }
      }
      
      this.handleVideoLoadFailure(index, errorMsg);
    }
  },

  // 🆕 视频加载失败的最终处理（移除本地备用视频逻辑）
  handleVideoLoadFailure: function(index, errorMsg = '视频加载失败') {
    console.log('视频最终加载失败:', index, errorMsg);
    
    const productVideos = this.data.productVideos;
    if (productVideos[index]) {
      productVideos[index].hasError = true;
      productVideos[index].errorMsg = errorMsg;
      productVideos[index].canRetry = true; // 允许用户重试
      
      this.setData({
        productVideos: productVideos
      });
    }
    
    wx.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000
    });
  },

  // 重试视频加载（用户手动触发）
  retryVideo: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('用户手动重试加载视频:', index);
    
    const productVideos = this.data.productVideos;
    if (productVideos[index]) {
      // 重置重试计数
      productVideos[index].retryCount = 0;
      
      // 如果是云存储视频，尝试重新获取临时URL
      if (productVideos[index].isCloudVideo && productVideos[index].originalVideo) {
        // 使用修正后的云文件ID
        const correctedFileId = this.correctCloudVideoUrl(productVideos[index].originalVideo);
        this.tryGetTempVideoUrl(index, correctedFileId);
      } else {
        this.retryVideoInternal(index);
      }
    }
  },

  // 内部重试方法
  retryVideoInternal: function(index) {
    const productVideos = this.data.productVideos;
    if (!productVideos[index]) {
      return;
    }

    console.log('内部重试视频加载:', index);
    
    // 重置错误状态
    productVideos[index].hasError = false;
    productVideos[index].errorMsg = '';
    
    this.setData({
      productVideos: productVideos
    });
    
    wx.showToast({
      title: '正在重新加载...',
      icon: 'loading',
      duration: 2000
    });
  }
});