// pages/video-test/video-test.js
// 视频修复功能测试页面

Page({
  data: {
    testVideos: [
      {
        title: '示例URL测试',
        originalUrl: 'https://example.com/videos/custom1-v1.mp4#devtools_no_referrer',
        fixedUrl: '',
        status: 'pending'
      },
      {
        title: '本地路径测试',
        originalUrl: '/images/products/custom1-v1.mp4',
        fixedUrl: '',
        status: 'pending'
      }
    ],
    testResults: []
  },

  onLoad: function() {
    console.log('视频测试页面加载')
    this.runTests()
  },

  // 运行测试
  runTests: function() {
    console.log('开始运行视频URL修复测试...')
    
    const testVideos = this.data.testVideos
    const testResults = []
    
    testVideos.forEach((test, index) => {
      const result = this.testVideoUrlFix(test.originalUrl)
      
      testResults.push({
        ...test,
        fixedUrl: result.fixedUrl,
        isValid: result.isValid,
        status: result.isValid ? 'success' : 'failed',
        message: result.message
      })
    })
    
    this.setData({
      testResults: testResults
    })
    
    console.log('测试结果:', testResults)
  },

  // 测试视频URL修复功能
  testVideoUrlFix: function(url) {
    try {
      // 使用产品详情页的修复逻辑
      const fixedUrl = this.fixVideoUrl(url)
      const isValid = this.validateVideoUrl(fixedUrl || url)
      
      return {
        fixedUrl: fixedUrl || url,
        isValid: isValid,
        message: fixedUrl ? '已修复' : '无需修复'
      }
    } catch (error) {
      return {
        fixedUrl: url,
        isValid: false,
        message: '修复失败: ' + error.message
      }
    }
  },

  // 修复视频URL（复制自产品详情页）
  fixVideoUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    // 如果是示例URL，尝试提取文件名并转换为本地路径
    if (url.includes('example.com/videos/')) {
      const fileName = url.split('/').pop().split('#')[0]; // 移除fragment
      const localPath = `/images/products/${fileName}`;
      console.log('修复视频URL:', url, '->', localPath);
      return localPath;
    }
    
    // 如果已经是本地路径，直接返回
    if (url.startsWith('/images/products/')) {
      return url;
    }
    
    // 其他情况返回原URL
    return url;
  },

  // 验证视频URL（复制自产品详情页）
  validateVideoUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // 检查是否为空或只包含空白字符
    if (url.trim() === '') {
      return false;
    }
    
    // 检查是否为示例URL
    if (url.includes('example.com')) {
      console.warn('检测到示例URL，视频可能无法加载:', url);
      return false;
    }
    
    // 检查文件扩展名
    const supportedFormats = ['.mp4', '.mov', '.avi', '.webm'];
    const hasValidExtension = supportedFormats.some(format => 
      url.toLowerCase().includes(format)
    );
    
    if (!hasValidExtension) {
      console.warn('视频格式可能不受支持:', url);
    }
    
    return true;
  },

  // 重新运行测试
  retryTest: function() {
    this.runTests()
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  }
})
