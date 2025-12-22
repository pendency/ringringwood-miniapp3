// pages/cloud-video-test/cloud-video-test.js
// 云存储视频功能测试页面

Page({
  data: {
    testVideos: [
      {
        title: '示例URL转云存储测试',
        originalUrl: 'https://example.com/videos/custom1-v1.mp4#devtools_no_referrer',
        expectedCloudUrl: 'cloud://636c-cloud1-7gm53wok768268c9/products/videos/custom1-v1.mp4',
        processedUrl: '',
        tempUrl: '',
        status: 'pending'
      },
      {
        title: '本地路径转云存储测试',
        originalUrl: '/images/products/custom1-v1.mp4',
        expectedCloudUrl: 'cloud://636c-cloud1-7gm53wok768268c9/products/videos/custom1-v1.mp4',
        processedUrl: '',
        tempUrl: '',
        status: 'pending'
      },
      {
        title: '云存储URL保持不变测试',
        originalUrl: 'cloud://636c-cloud1-7gm53wok768268c9/products/videos/custom2-v1.mp4',
        expectedCloudUrl: 'cloud://636c-cloud1-7gm53wok768268c9/products/videos/custom2-v1.mp4',
        processedUrl: '',
        tempUrl: '',
        status: 'pending'
      }
    ],
    testResults: [],
    currentTestVideo: null,
    isPlaying: false
  },

  onLoad: function() {
    console.log('云存储视频测试页面加载')
    this.runTests()
  },

  // 运行测试
  async runTests() {
    console.log('开始运行云存储视频测试...')
    
    const testVideos = this.data.testVideos
    const testResults = []
    
    for (let i = 0; i < testVideos.length; i++) {
      const test = testVideos[i]
      const result = await this.testCloudVideoProcessing(test)
      testResults.push(result)
    }
    
    this.setData({
      testResults: testResults
    })
    
    console.log('测试结果:', testResults)
  },

  // 测试云存储视频处理
  async testCloudVideoProcessing(test) {
    try {
      console.log('测试:', test.title)
      
      // 1. 测试URL处理
      const processedUrl = this.processCloudVideoUrl(test.originalUrl)
      const isCorrect = processedUrl === test.expectedCloudUrl
      
      let tempUrl = ''
      let canGetTempUrl = false
      
      // 2. 如果是云存储URL，尝试获取临时URL
      if (processedUrl.startsWith('cloud://')) {
        try {
          const tempResult = await this.getTempFileURL(processedUrl)
          if (tempResult.success) {
            tempUrl = tempResult.tempFileURL
            canGetTempUrl = true
          }
        } catch (error) {
          console.warn('获取临时URL失败:', error)
        }
      }
      
      return {
        ...test,
        processedUrl: processedUrl,
        tempUrl: tempUrl,
        isCorrect: isCorrect,
        canGetTempUrl: canGetTempUrl,
        status: isCorrect ? 'success' : 'failed',
        message: isCorrect ? '处理正确' : '处理错误'
      }
    } catch (error) {
      return {
        ...test,
        processedUrl: test.originalUrl,
        tempUrl: '',
        isCorrect: false,
        canGetTempUrl: false,
        status: 'error',
        message: '测试失败: ' + error.message
      }
    }
  },

  // 处理云存储视频URL（复制自产品详情页）
  processCloudVideoUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return url;
    }
    
    console.log('处理视频URL:', url);
    
    // 如果是示例URL，尝试转换为云存储路径
    if (url.includes('example.com/videos/')) {
      const fileName = url.split('/').pop().split('#')[0];
      const cloudPath = `cloud://636c-cloud1-7gm53wok768268c9/products/videos/${fileName}`;
      console.log('转换示例URL为云存储路径:', url, '->', cloudPath);
      return cloudPath;
    }
    
    // 如果是本地路径，尝试转换为云存储路径
    if (url.startsWith('/images/products/') && url.endsWith('.mp4')) {
      const fileName = url.split('/').pop();
      const cloudPath = `cloud://636c-cloud1-7gm53wok768268c9/products/videos/${fileName}`;
      console.log('转换本地路径为云存储路径:', url, '->', cloudPath);
      return cloudPath;
    }
    
    // 如果已经是云存储URL，直接返回
    if (this.isCloudStorageUrl(url)) {
      return url;
    }
    
    // 其他情况返回原URL
    return url;
  },

  // 检查是否为云存储URL
  isCloudStorageUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    return url.startsWith('cloud://') || 
           url.includes('tcb-api.tencentcloudapi.com') ||
           url.includes('636c-cloud1-7gm53wok768268c9');
  },

  // 获取临时文件URL
  async getTempFileURL(cloudFileId) {
    try {
      console.log('获取临时URL:', cloudFileId)
      
      const result = await wx.cloud.getTempFileURL({
        fileList: [cloudFileId]
      })
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0]
        if (fileInfo.status === 0) {
          return {
            success: true,
            tempFileURL: fileInfo.tempFileURL
          }
        } else {
          throw new Error(fileInfo.errMsg || '获取临时URL失败')
        }
      } else {
        throw new Error('未返回文件信息')
      }
    } catch (error) {
      console.error('获取临时URL失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // 测试视频播放
  testVideoPlay: function(e) {
    const index = e.currentTarget.dataset.index
    const testResult = this.data.testResults[index]
    
    if (!testResult || !testResult.tempUrl) {
      wx.showToast({
        title: '无可播放的视频URL',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      currentTestVideo: {
        ...testResult,
        index: index
      }
    })
    
    console.log('开始测试视频播放:', testResult.tempUrl)
  },

  // 视频播放事件
  onVideoPlay: function(e) {
    console.log('测试视频开始播放')
    this.setData({
      isPlaying: true
    })
    
    wx.showToast({
      title: '视频播放成功',
      icon: 'success'
    })
  },

  // 视频错误事件
  onVideoError: function(e) {
    console.error('测试视频播放错误:', e.detail)
    this.setData({
      isPlaying: false
    })
    
    wx.showToast({
      title: '视频播放失败',
      icon: 'none'
    })
  },

  // 关闭视频测试
  closeVideoTest: function() {
    this.setData({
      currentTestVideo: null,
      isPlaying: false
    })
  },

  // 重新运行测试
  retryTest: function() {
    this.setData({
      testResults: [],
      currentTestVideo: null,
      isPlaying: false
    })
    this.runTests()
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  }
})
