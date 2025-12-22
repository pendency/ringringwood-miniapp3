// pages/video-debug-test/video-debug-test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    testUrl: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom1-v1.mp4',
    testResult: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('video-debug-test 页面加载');
  },

  /**
   * URL输入事件
   */
  onUrlInput: function(e) {
    this.setData({
      testUrl: e.detail.value
    });
  },

  /**
   * 测试URL修正功能
   */
  testUrlCorrection: function() {
    const originalUrl = this.data.testUrl;
    if (!originalUrl.trim()) {
      wx.showToast({
        title: '请输入URL',
        icon: 'none'
      });
      return;
    }

    const correctedUrl = this.correctCloudVideoUrl(originalUrl);
    const wasModified = originalUrl !== correctedUrl;

    this.setData({
      testResult: {
        original: originalUrl,
        corrected: correctedUrl,
        wasModified: wasModified
      }
    });

    wx.showToast({
      title: wasModified ? 'URL已修正' : 'URL无需修正',
      icon: wasModified ? 'success' : 'none'
    });
  },

  /**
   * 修正云存储视频URL格式 - 复制自product-detail.js
   */
  correctCloudVideoUrl: function(url) {
    if (!url || !url.startsWith('cloud://')) {
      return url;
    }
    
    // 实际的完整环境ID（不要修改这个！）
    const correctEnvId = 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
    
    console.log('🔍 开始检查URL格式:', url);
    
    // 检查环境ID是否正确，但不直接返回，还需要检查路径
    const hasCorrectEnvId = url.startsWith(`cloud://${correctEnvId}/`);
    if (hasCorrectEnvId) {
      console.log('✅ 环境ID格式已正确');
      // 不直接返回，继续检查路径是否需要修正
    }
    
    let correctedUrl = url;
    let wasModified = false;
    
    // 只有在环境ID不正确时才修正环境ID
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
      
      // 特殊处理：如果是简化的环境ID格式，需要扩展到完整格式
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
    
    // 修复视频路径中缺失的 custom/ 目录（不管环境ID是否正确，都要检查路径）
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

  /**
   * 返回按钮点击事件
   */
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
