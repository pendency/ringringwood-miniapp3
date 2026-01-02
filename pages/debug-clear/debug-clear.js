// debug-clear.js - 图片加载调试工具
const productData = require('../../utils/productData.js');
// 注意：已移除 mock-data.js 依赖，数据库是唯一数据源

Page({
  data: {
    logs: [],
    selectedLogs: {}, // 选中的日志
    testResults: {
      imagePathsFixed: false,
      cloudPathsValid: false,
      categoryDataLoaded: false,
      productDataLoaded: false
    },
    exportStatus: {
      show: false,
      message: ''
    }
  },

  onLoad: function() {
    this.addLog('🔍 开始图片加载诊断...');
    this.runDiagnostics();
  },

  addLog: function(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.setData({
      logs: [`[${timestamp}] ${message}`, ...this.data.logs]
    });
  },

  // 显示状态消息
  showStatus: function(message, duration = 2000) {
    this.setData({
      'exportStatus.message': message,
      'exportStatus.show': true
    });
    
    setTimeout(() => {
      this.setData({
        'exportStatus.show': false
      });
    }, duration);
  },

  // 导出日志功能
  exportLogs: function() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `诊断日志_${timestamp}.txt`;
      
      // 准备导出内容
      let exportContent = `图片加载诊断报告\n`;
      exportContent += `生成时间: ${new Date().toLocaleString()}\n`;
      exportContent += `=`.repeat(50) + '\n\n';
      
      // 添加测试结果概览
      exportContent += `测试结果概览:\n`;
      exportContent += `- 分类数据加载: ${this.data.testResults.categoryDataLoaded ? '✅ 成功' : '❌ 失败'}\n`;
      exportContent += `- 产品数据加载: ${this.data.testResults.productDataLoaded ? '✅ 成功' : '❌ 失败'}\n`;
      exportContent += `- 云存储路径: ${this.data.testResults.cloudPathsValid ? '✅ 正确' : '❌ 错误'}\n`;
      exportContent += `- 图片路径修复: ${this.data.testResults.imagePathsFixed ? '✅ 已修复' : '❌ 未修复'}\n\n`;
      
      // 添加详细日志
      exportContent += `详细诊断日志:\n`;
      exportContent += `-`.repeat(30) + '\n';
      
      // 反转日志顺序，让最早的在前面
      const reversedLogs = [...this.data.logs].reverse();
      reversedLogs.forEach((log, index) => {
        exportContent += `${log}\n`;
      });
      
      exportContent += `\n${`=`.repeat(50)}\n`;
      exportContent += `报告结束 - 共 ${this.data.logs.length} 条日志\n`;
      
      // 使用微信小程序的文件系统API保存文件
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      fs.writeFile({
        filePath: filePath,
        data: exportContent,
        encoding: 'utf8',
        success: (res) => {
          this.showStatus('✅ 日志已保存到本地', 3000);
          this.addLog(`📁 日志已导出: ${fileName}`);
          
          // 提示用户如何查看文件
          setTimeout(() => {
            wx.showModal({
              title: '导出成功',
              content: `日志已保存为: ${fileName}\n\n可以通过微信开发者工具的"文件"菜单查看用户目录中的文件`,
              showCancel: false,
              confirmText: '知道了'
            });
          }, 1000);
        },
        fail: (err) => {
          console.error('文件保存失败:', err);
          this.showStatus('❌ 文件保存失败', 3000);
          // 备用方案：复制到剪贴板
          this.copyToClipboard(exportContent);
        }
      });
      
    } catch (error) {
      console.error('导出失败:', error);
      this.showStatus('❌ 导出失败', 3000);
    }
  },

  // 复制所有日志到剪贴板
  copyAllLogs: function() {
    try {
      let content = `图片加载诊断日志 (${new Date().toLocaleString()})\n`;
      content += `测试结果: 分类${this.data.testResults.categoryDataLoaded ? '✅' : '❌'} 产品${this.data.testResults.productDataLoaded ? '✅' : '❌'} 路径${this.data.testResults.cloudPathsValid ? '✅' : '❌'}\n\n`;
      
      // 反转日志顺序
      const reversedLogs = [...this.data.logs].reverse();
      reversedLogs.forEach(log => {
        content += `${log}\n`;
      });
      
      this.copyToClipboard(content);
    } catch (error) {
      this.showStatus('❌ 复制失败', 2000);
    }
  },

  // 复制到剪贴板的通用方法
  copyToClipboard: function(content) {
    wx.setClipboardData({
      data: content,
      success: () => {
        this.showStatus('📋 已复制到剪贴板', 2000);
        this.addLog('📋 日志已复制到剪贴板');
      },
      fail: (err) => {
        console.error('复制失败:', err);
        this.showStatus('❌ 复制失败', 2000);
      }
    });
  },

  // 显示导出说明
  showExportHelp: function() {
    wx.showModal({
      title: '📖 日志导出说明',
      content: `1. 📤 导出日志: 保存完整报告到本地文件\n2. 📋 复制日志: 复制所有日志到剪贴板\n3. 点击单条日志: 选中/取消选中\n4. 全选: 选中所有日志\n\n导出后可以直接发送给开发者进行问题分析`,
      showCancel: false,
      confirmText: '明白了'
    });
  },

  // 选择/取消选择日志
  toggleLogSelection: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedLogs = this.data.selectedLogs;
    selectedLogs[index] = !selectedLogs[index];
    
    this.setData({
      selectedLogs: selectedLogs
    });
  },

  // 全选日志
  selectAllLogs: function() {
    const selectedLogs = {};
    this.data.logs.forEach((log, index) => {
      selectedLogs[index] = true;
    });
    
    this.setData({
      selectedLogs: selectedLogs
    });
    
    this.showStatus('✅ 已全选所有日志', 1500);
  },

  // 清空日志
  clearLogs: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有诊断日志吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            logs: [],
            selectedLogs: {}
          });
          this.showStatus('🗑️ 日志已清空', 1500);
        }
      }
    });
  },

  async runDiagnostics() {
    // 1. 检查产品数据加载
    try {
      this.addLog('📋 检查分类数据加载...');
      
      // 从云数据库获取分类（数据库是唯一数据源）
      let categories = null;
      try {
        categories = await productData.getCategories();
        this.addLog('✅ 使用 productData.getCategories() 成功');
      } catch (error) {
        this.addLog(`❌ productData.getCategories() 失败: ${error.message}`);
        this.addLog('💡 请检查云函数是否已部署，网络是否正常');
      }
      
      if (categories && categories.length > 0) {
        this.addLog(`✅ 分类数据加载成功，共 ${categories.length} 个分类`);
        this.setData({
          'testResults.categoryDataLoaded': true
        });

        // 显示分类信息
        categories.forEach((cat, index) => {
          this.addLog(`  分类${index + 1}: ${cat.name} (ID: ${cat._id})`);
        });

        // 检查第一个分类的产品
        const firstCategory = categories[0];
        this.addLog(`🔍 检查分类 "${firstCategory.name}" 的产品...`);
        
        let products = null;
        try {
          products = await productData.getProductsByCategory(firstCategory._id);
          if (products && products.products) {
            products = products.products; // 解构返回的对象
          }
        } catch (error) {
          this.addLog(`❌ 云数据获取失败: ${error.message}`);
          this.addLog('💡 请检查云函数是否已部署，网络是否正常');
          products = [];
        }
        
        if (products && products.length > 0) {
          this.addLog(`✅ 产品数据加载成功，${firstCategory.name} 分类下有 ${products.length} 个产品`);
          this.setData({
            'testResults.productDataLoaded': true
          });

          // 检查第一个产品的图片路径
          const firstProduct = products[0];
          this.addLog(`📷 检查第一个产品: ${firstProduct.name}`);
          
          if (firstProduct.imageUrls && firstProduct.imageUrls.length > 0) {
            const mainImageUrl = firstProduct.imageUrls[0];
            this.addLog(`主图路径: ${mainImageUrl}`);
            
            // 检查路径格式
            if (mainImageUrl.includes('/images/products/')) {
              this.addLog('❌ 发现旧路径格式，需要修复');
            } else if (mainImageUrl.includes('cloud://')) {
              this.addLog('✅ 云存储路径格式正确');
              this.setData({
                'testResults.cloudPathsValid': true,
                'testResults.imagePathsFixed': true
              });
              
              // 测试这个实际的图片路径
              this.testSpecificImage(mainImageUrl);
            } else {
              this.addLog('⚠️ 未知路径格式');
            }
          } else {
            this.addLog('⚠️ 产品没有主图');
          }

          // 检查详情图
          if (firstProduct.images && firstProduct.images.length > 0) {
            this.addLog(`详情图数量: ${firstProduct.images.length}`);
            firstProduct.images.slice(0, 3).forEach((imageUrl, index) => {
              if (imageUrl.includes('/images/products/')) {
                this.addLog(`❌ 详情图 ${index + 1} 使用旧路径格式`);
              } else if (imageUrl.includes('cloud://')) {
                this.addLog(`✅ 详情图 ${index + 1} 路径正确`);
              }
            });
          } else {
            this.addLog('⚠️ 产品没有详情图');
          }
        } else {
          this.addLog('❌ 产品数据加载失败或为空');
        }
      } else {
        this.addLog('❌ 分类数据加载失败或为空');
      }
    } catch (error) {
      this.addLog(`❌ 数据加载错误: ${error.message}`);
      console.error('诊断错误:', error);
    }

    // 2. 测试多种可能的图片路径
    this.testMultipleImagePaths();
  },

  testSpecificImage(imageUrl) {
    this.addLog(`🧪 测试实际产品图片: ${imageUrl.substr(-30)}...`);
    
    wx.getImageInfo({
      src: imageUrl,
      success: (res) => {
        this.addLog(`✅ 实际图片加载成功: ${res.width}x${res.height}`);
      },
      fail: (err) => {
        this.addLog(`❌ 实际图片加载失败: ${err.errMsg}`);
      }
    });
  },

  testMultipleImagePaths() {
    this.addLog('🖼️ 测试多种可能的图片路径格式...');
    
    // 根据配置文件，测试不同的路径格式
    const baseUrl = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
    const testPaths = [
      // 当前代码使用的路径格式（按分类分目录）
      `${baseUrl}/products/images/wood/wood1.jpeg`,
      `${baseUrl}/products/images/resin/resin1.jpeg`,
      
      // 可能的备用格式1（直接在products目录下）
      `${baseUrl}/products/wood1.jpeg`,
      `${baseUrl}/products/resin1.jpeg`,
      
      // 可能的备用格式2（按产品类型分目录）
      `${baseUrl}/products/wood/wood1.jpeg`,
      `${baseUrl}/products/resin/resin1.jpeg`,
      
      // 可能的备用格式3（与配置文件匹配）
      `${baseUrl}/products/custom/custom1.jpeg`,
      
      // UI资源测试
      `${baseUrl}/ui/banners/banner1.jpeg`,
    ];
    
    this.addLog(`🔍 准备测试 ${testPaths.length} 种路径格式...`);
    
    testPaths.forEach((testPath, index) => {
      setTimeout(() => {
        const fileName = testPath.split('/').pop();
        const pathType = this.getPathType(testPath);
        this.addLog(`🧪 测试路径 ${index + 1} [${pathType}]: ${fileName}`);
        
        wx.getImageInfo({
          src: testPath,
          success: (res) => {
            this.addLog(`✅ 路径 ${index + 1} 加载成功! [${pathType}] ${res.width}x${res.height}`);
            this.addLog(`💡 正确路径格式: ${testPath}`);
          },
          fail: (err) => {
            this.addLog(`❌ 路径 ${index + 1} 失败 [${pathType}]: ${this.getErrorMessage(err.errMsg)}`);
          }
        });
      }, index * 800); // 延迟测试避免并发，增加延迟让用户看清楚
    });

    // 最后测试本地图片是否存在
    setTimeout(() => {
      this.testLocalImages();
    }, testPaths.length * 800 + 1000);
  },

  getPathType(path) {
    if (path.includes('/products/images/wood/') || path.includes('/products/images/resin/')) {
      return '按分类分目录';
    } else if (path.includes('/products/wood/') || path.includes('/products/resin/')) {
      return '按类型分目录';
    } else if (path.includes('/products/') && !path.includes('/products/images/')) {
      return '直接在products下';
    } else if (path.includes('/ui/')) {
      return 'UI资源';
    }
    return '其他格式';
  },

  getErrorMessage(errMsg) {
    if (errMsg.includes('ENOENT') || errMsg.includes('no such file')) {
      return '文件不存在';
    } else if (errMsg.includes('download')) {
      return '下载失败';
    } else if (errMsg.includes('network')) {
      return '网络错误';
    }
    return '未知错误';
  },

  testLocalImages() {
    this.addLog('📁 检查本地images目录中的图片...');
    
    // 测试tabBar图标（这些应该存在）
    const localImages = [
      '/images/home.jpeg',
      '/images/category.jpeg',
      '/images/banner1.jpeg'
    ];
    
    localImages.forEach((localPath, index) => {
      setTimeout(() => {
        this.addLog(`🧪 测试本地图片 ${index + 1}: ${localPath}`);
        
        wx.getImageInfo({
          src: localPath,
          success: (res) => {
            this.addLog(`✅ 本地图片 ${index + 1} 存在: ${res.width}x${res.height}`);
          },
          fail: (err) => {
            this.addLog(`❌ 本地图片 ${index + 1} 不存在: ${err.errMsg}`);
          }
        });
      }, index * 300);
    });
  },

  // 生成修复建议
  generateFixSuggestions() {
    setTimeout(() => {
      this.addLog('💡 === 修复建议 ===');
      this.addLog('1. 检查云存储中是否已上传图片文件');
      this.addLog('2. 确认图片路径格式与实际存储结构匹配');
      this.addLog('3. 可能需要重新上传图片到正确的云存储路径');
      this.addLog('4. 或者修改代码中的路径格式以匹配实际存储');
      this.addLog('5. 使用"导出日志"功能将完整报告发送给开发者');
    }, 15000);
  },

  // 清除所有缓存
  clearAllCache: function() {
    try {
      // 清除存储
      wx.clearStorageSync();
      this.addLog('✅ 本地存储已清除');
      
      // 清除图片缓存（如果可能）
      if (wx.clearImageCache) {
        wx.clearImageCache();
        this.addLog('✅ 图片缓存已清除');
      }
      
      this.addLog('💡 建议: 重启开发者工具以完全清除缓存');
      
      // 延迟跳转让用户看到消息
      setTimeout(() => {
        wx.showModal({
          title: '缓存已清除',
          content: '是否跳转到分类页面测试？',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({
                url: '/pages/category/category'
              });
            }
          }
        });
      }, 1000);
    } catch (error) {
      this.addLog(`❌ 清除缓存失败: ${error.message}`);
    }
  },

  // 重新运行诊断
  rerunDiagnostics: function() {
    this.setData({
      logs: [],
      selectedLogs: {},
      testResults: {
        imagePathsFixed: false,
        cloudPathsValid: false,
        categoryDataLoaded: false,
        productDataLoaded: false
      }
    });
    setTimeout(() => {
      this.runDiagnostics();
    }, 300);
  },

  // 导航到分类页面
  goToCategory: function() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 导航到管理后台
  goToAdmin: function() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    });
  },

  onReady: function() {
    // 页面加载完成后自动生成修复建议
    this.generateFixSuggestions();
  }
});