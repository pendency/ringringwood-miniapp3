// pages/migration-test/migration-test.js
const { migrateDataInMiniProgram } = require('../../scripts/migrate-to-cloud.js');
const { testCloudFunctionInMiniProgram } = require('../../scripts/test-cloud-function.js');
const { testDataPreparationInMiniProgram } = require('../../scripts/test-data-preparation.js');

Page({
  data: {
    migrationRunning: false,
    migrationStatus: '',
    migrationSuccess: false,
    testResults: null,
    dataTestResults: null
  },

  onLoad: function() {
    console.log('数据迁移测试页面加载');
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
        this.setData({
          testResults: summary
        });
        
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

  // 测试数据准备
  async testDataPreparation() {
    try {
      wx.showLoading({
        title: '测试数据准备...',
        mask: true
      });

      const result = await testDataPreparationInMiniProgram();

      if (result && result.success) {
        this.setData({
          dataTestResults: result
        });
        
        wx.showModal({
          title: '数据准备测试结果',
          content: `测试完成！\n分类: ${result.categories.length}个\n产品: ${result.products.length}个`,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '数据准备测试失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('测试数据准备失败:', error);
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 返回首页
  navigateBack() {
    wx.navigateBack();
  }
});
