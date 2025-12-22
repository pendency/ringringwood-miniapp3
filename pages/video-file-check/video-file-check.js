// pages/video-file-check/video-file-check.js
Page({
  data: {
    isChecking: false,
    checkResults: null,
    logs: [],
    missingFiles: [],
    availableFiles: []
  },

  onLoad: function (options) {
    console.log('视频文件检查页面加载');
    this.addLog('页面加载完成');
  },

  // 添加日志
  addLog: function(message) {
    const logs = this.data.logs;
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift(`[${timestamp}] ${message}`);
    
    // 限制日志数量
    if (logs.length > 50) {
      logs.splice(50);
    }
    
    this.setData({
      logs: logs
    });
  },

  // 检查视频文件状态
  checkVideoFiles: function() {
    this.setData({
      isChecking: true,
      checkResults: null,
      missingFiles: [],
      availableFiles: []
    });

    this.addLog('开始检查视频文件状态...');

    wx.showLoading({
      title: '检查中...',
      mask: true
    });

    // 获取产品数据并检查视频文件
    this.checkAllProductVideos();
  },

  // 检查所有产品的视频文件
  async checkAllProductVideos() {
    try {
      // 调用云函数获取所有产品
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProducts',
          data: { limit: 1000 }
        }
      });

      if (result.result.success) {
        const products = result.result.data;
        this.addLog(`获取到 ${products.length} 个产品，开始检查视频文件...`);

        const videoFiles = [];
        const missingFiles = [];
        const availableFiles = [];

        // 收集所有视频文件ID
        products.forEach(product => {
          // 检查features中的视频
          if (product.features && Array.isArray(product.features)) {
            product.features.forEach(feature => {
              if (feature.type === 'video' && feature.video && feature.video.startsWith('cloud://')) {
                videoFiles.push({
                  productId: product._id,
                  productName: product.name,
                  fileId: feature.video,
                  title: feature.title || '产品展示'
                });
              }
            });
          }

          // 检查直接的videos字段
          if (product.videos && Array.isArray(product.videos)) {
            product.videos.forEach(video => {
              if (video.url && video.url.startsWith('cloud://')) {
                videoFiles.push({
                  productId: product._id,
                  productName: product.name,
                  fileId: video.url,
                  title: video.title || '产品展示'
                });
              }
            });
          }
        });

        this.addLog(`找到 ${videoFiles.length} 个云存储视频文件，开始检查可用性...`);

        // 批量检查文件可用性
        const batchSize = 10;
        for (let i = 0; i < videoFiles.length; i += batchSize) {
          const batch = videoFiles.slice(i, i + batchSize);
          const fileIds = batch.map(item => item.fileId);

          try {
            const tempResult = await wx.cloud.getTempFileURL({
              fileList: fileIds
            });

            tempResult.fileList.forEach((fileInfo, index) => {
              const videoFile = batch[index];
              if (fileInfo.status === 0) {
                availableFiles.push({
                  ...videoFile,
                  tempUrl: fileInfo.tempFileURL
                });
              } else {
                missingFiles.push({
                  ...videoFile,
                  error: fileInfo.errMsg
                });
              }
            });

            this.addLog(`已检查 ${Math.min(i + batchSize, videoFiles.length)}/${videoFiles.length} 个文件`);
          } catch (error) {
            console.error('批量检查文件失败:', error);
            batch.forEach(videoFile => {
              missingFiles.push({
                ...videoFile,
                error: error.message
              });
            });
          }
        }

        wx.hideLoading();

        this.setData({
          isChecking: false,
          checkResults: {
            totalFiles: videoFiles.length,
            availableCount: availableFiles.length,
            missingCount: missingFiles.length
          },
          missingFiles: missingFiles,
          availableFiles: availableFiles
        });

        this.addLog(`检查完成: 总计 ${videoFiles.length} 个文件，可用 ${availableFiles.length} 个，缺失 ${missingFiles.length} 个`);

        wx.showModal({
          title: '检查完成',
          content: `总计 ${videoFiles.length} 个视频文件\n可用: ${availableFiles.length} 个\n缺失: ${missingFiles.length} 个`,
          showCancel: false
        });

      } else {
        throw new Error(result.result.error);
      }
    } catch (error) {
      wx.hideLoading();
      this.setData({
        isChecking: false
      });

      console.error('检查视频文件失败:', error);
      this.addLog('检查失败: ' + error.message);

      wx.showModal({
        title: '检查失败',
        content: error.message,
        showCancel: false
      });
    }
  },

  // 修复缺失的视频文件（将云存储路径改为本地路径）
  fixMissingVideos: function() {
    if (!this.data.missingFiles || this.data.missingFiles.length === 0) {
      wx.showToast({
        title: '没有需要修复的文件',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认修复',
      content: `确定要修复 ${this.data.missingFiles.length} 个缺失的视频文件吗？将尝试使用本地视频文件替代。`,
      success: (res) => {
        if (res.confirm) {
          this.performVideoFix();
        }
      }
    });
  },

  // 执行视频修复
  async performVideoFix() {
    this.addLog('开始修复缺失的视频文件...');

    wx.showLoading({
      title: '修复中...',
      mask: true
    });

    try {
      // 调用云函数修复视频文件
      const result = await wx.cloud.callFunction({
        name: 'fixVideoUrls',
        data: {
          action: 'fixMissingVideos',
          data: {
            missingFiles: this.data.missingFiles
          }
        }
      });

      wx.hideLoading();

      if (result.result.success) {
        this.addLog(`修复完成: 处理了 ${result.result.totalProcessed} 个文件，修复了 ${result.result.totalFixed} 个文件`);

        wx.showModal({
          title: '修复完成',
          content: `成功修复 ${result.result.totalFixed} 个视频文件`,
          showCancel: false,
          success: () => {
            // 重新检查文件状态
            this.checkVideoFiles();
          }
        });
      } else {
        throw new Error(result.result.error);
      }
    } catch (error) {
      wx.hideLoading();
      console.error('修复视频文件失败:', error);
      this.addLog('修复失败: ' + error.message);

      wx.showModal({
        title: '修复失败',
        content: error.message,
        showCancel: false
      });
    }
  },

  // 清空日志
  clearLogs: function() {
    this.setData({
      logs: []
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});




































