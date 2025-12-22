// 视频修复测试页面
Page({
  data: {
    testResults: []
  },

  onLoad: function() {
    this.testVideoPathConversion();
  },

  // 测试视频路径转换
  testVideoPathConversion: function() {
    const testCases = [
      {
        name: '测试1: Windows反斜杠路径',
        input: 'images\\products\\custom1-v1.mp4',
        expected: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom1-v1.mp4'
      },
      {
        name: '测试2: Unix正斜杠路径',
        input: 'images/products/custom2-v1.mp4',
        expected: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom2-v1.mp4'
      },
      {
        name: '测试3: 纯文件名',
        input: 'custom3-v1.mp4',
        expected: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom3-v1.mp4'
      },
      {
        name: '测试4: 已经是云存储路径',
        input: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom4-v1.mp4',
        expected: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom4-v1.mp4'
      }
    ];

    console.log('开始测试视频路径转换...');
    
    // 调用云函数测试
    this.testWithCloudFunction(testCases);
  },

  // 使用云函数测试路径转换
  async testWithCloudFunction(testCases) {
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`执行${testCase.name}:`, testCase.input);
        
        // 通过获取产品详情来测试路径转换
        const result = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'getProductById',
            id: 'custom1' // 使用一个已知的产品ID
          }
        });
        
        if (result.result && result.result.success) {
          const product = result.result.data;
          console.log('云函数返回的视频URL:', product.videoUrl);
          
          results.push({
            name: testCase.name,
            input: testCase.input,
            output: product.videoUrl || '无视频URL',
            expected: testCase.expected,
            success: true
          });
        } else {
          results.push({
            name: testCase.name,
            input: testCase.input,
            output: '云函数调用失败',
            expected: testCase.expected,
            success: false,
            error: result.result?.error || '未知错误'
          });
        }
      } catch (error) {
        console.error(`${testCase.name} 执行失败:`, error);
        results.push({
          name: testCase.name,
          input: testCase.input,
          output: '执行异常',
          expected: testCase.expected,
          success: false,
          error: error.message
        });
      }
    }
    
    this.setData({
      testResults: results
    });
    
    console.log('测试结果:', results);
  },

  // 测试获取临时URL
  testGetTempUrl: function() {
    const videoUrl = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom1-v1.mp4';
    
    wx.cloud.getTempFileURL({
      fileList: [videoUrl]
    }).then(result => {
      console.log('临时URL获取结果:', result);
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0];
        if (fileInfo.status === 0) {
          wx.showToast({
            title: '临时URL获取成功',
            icon: 'success'
          });
          console.log('临时URL:', fileInfo.tempFileURL);
        } else {
          wx.showToast({
            title: '文件不存在或无权限',
            icon: 'none'
          });
          console.error('获取临时URL失败:', fileInfo.errMsg);
        }
      }
    }).catch(error => {
      console.error('获取临时URL异常:', error);
      wx.showToast({
        title: '获取临时URL失败',
        icon: 'none'
      });
    });
  },

  // 直接测试产品详情页
  testProductDetail: function() {
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=custom1'
    });
  }
});

