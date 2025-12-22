// utils/data-backup.js - 数据备份工具
class DataBackup {
  constructor() {
    this.backupFormats = ['csv', 'json'];
  }

  // 导出所有产品数据
  async exportAllProducts(format = 'csv') {
    try {
      console.log('开始导出产品数据，格式:', format);
      wx.showLoading({ title: '导出中...' });

      // 从云数据库获取所有产品
      const products = await this.getAllProducts();
      
      if (!products || products.length === 0) {
        throw new Error('没有找到产品数据');
      }

      // 根据格式生成文件
      let fileContent, fileName, filePath;
      
      switch (format) {
        case 'csv':
          fileContent = this.generateCSV(products);
          fileName = `products_backup_${this.getTimestamp()}.csv`;
          break;
        case 'json':
          fileContent = JSON.stringify(products, null, 2);
          fileName = `products_backup_${this.getTimestamp()}.json`;
          break;
        default:
          throw new Error('不支持的导出格式');
      }

      // 保存到本地
      filePath = await this.saveToLocal(fileContent, fileName);
      
      wx.hideLoading();
      
      console.log('导出完成:', fileName, '共', products.length, '条数据');
      
      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        count: products.length,
        format: format
      };

    } catch (error) {
      wx.hideLoading();
      console.error('导出失败:', error);
      throw error;
    }
  }

  // 获取所有产品数据
  async getAllProducts() {
    return new Promise((resolve, reject) => {
      console.log('调用云函数获取产品数据...');
      
      wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'exportAll'
        },
        success: (res) => {
          console.log('云函数调用成功:', res);
          if (res.result && res.result.success) {
            resolve(res.result.data);
          } else {
            reject(new Error(res.result?.error || '获取数据失败'));
          }
        },
        fail: (error) => {
          console.error('云函数调用失败:', error);
          reject(new Error('云函数调用失败: ' + (error.errMsg || error.message)));
        }
      });
    });
  }

  // 生成CSV格式
  generateCSV(products) {
    if (!products || products.length === 0) {
      return '';
    }

    console.log('生成CSV格式，产品数量:', products.length);

    // CSV表头
    const headers = [
      'productId', 'title', 'categoryName', 'isHot', 'isNew', 'description',
      'price', 'imageUrl1', 'imageUrl2', 'imageUrl3', 'imageUrl4', 'imageUrl5',
      'imageUrl6', 'imageUrl7', 'imageUrl8', 'imageUrl9', 'imageUrl10',
      'videoUrl', 'isVisible', 'sortPriority', 'size', 'weight', 'color',
      'applicationScenario'
    ];

    let csvContent = headers.join(',') + '\n';

    // 数据行
    products.forEach((product, index) => {
      const row = headers.map(header => {
        let value = product[header];
        
        // 处理undefined和null
        if (value === undefined || value === null) {
          value = '';
        }
        
        // 处理特殊字符
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        // 布尔值转换
        if (typeof value === 'boolean') {
          value = value ? '是' : '否';
        }
        
        return value;
      });
      
      csvContent += row.join(',') + '\n';
      
      // 每处理100行输出一次进度
      if ((index + 1) % 100 === 0) {
        console.log(`CSV生成进度: ${index + 1}/${products.length}`);
      }
    });

    console.log('CSV生成完成，内容长度:', csvContent.length);
    return csvContent;
  }

  // 保存到本地文件系统
  async saveToLocal(content, fileName) {
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    console.log('保存文件到:', filePath);
    
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      
      fs.writeFile({
        filePath: filePath,
        data: content,
        encoding: 'utf8',
        success: () => {
          console.log('文件保存成功');
          resolve(filePath);
        },
        fail: (error) => {
          console.error('文件保存失败:', error);
          reject(new Error('文件保存失败: ' + error.errMsg));
        }
      });
    });
  }

  // 自动备份功能
  async autoBackup() {
    try {
      const lastBackup = wx.getStorageSync('last_backup_time') || 0;
      const now = Date.now();
      const backupInterval = 7 * 24 * 60 * 60 * 1000; // 7天

      console.log('检查自动备份，上次备份时间:', new Date(lastBackup));

      if (now - lastBackup > backupInterval) {
        console.log('执行自动备份...');
        const result = await this.exportAllProducts('json');
        wx.setStorageSync('last_backup_time', now);
        
        console.log('自动备份完成:', result);
        return result;
      } else {
        console.log('距离上次备份不足7天，跳过自动备份');
        return null;
      }
    } catch (error) {
      console.error('自动备份失败:', error);
      return null;
    }
  }

  // 获取备份历史
  getBackupHistory() {
    try {
      const fs = wx.getFileSystemManager();
      const userDataPath = wx.env.USER_DATA_PATH;
      
      // 获取用户数据目录下的所有文件
      const files = fs.readdirSync(userDataPath);
      
      // 筛选备份文件
      const backupFiles = files.filter(file => 
        file.startsWith('products_backup_') && 
        (file.endsWith('.csv') || file.endsWith('.json'))
      );
      
      // 获取文件详细信息
      const backupHistory = backupFiles.map(file => {
        const filePath = `${userDataPath}/${file}`;
        try {
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            filePath: filePath,
            size: stats.size,
            createTime: stats.lastModifiedTime,
            format: file.endsWith('.csv') ? 'csv' : 'json'
          };
        } catch (error) {
          console.warn('获取文件信息失败:', file, error);
          return null;
        }
      }).filter(item => item !== null);
      
      // 按创建时间倒序排列
      backupHistory.sort((a, b) => b.createTime - a.createTime);
      
      console.log('备份历史:', backupHistory);
      return backupHistory;
    } catch (error) {
      console.error('获取备份历史失败:', error);
      return [];
    }
  }

  // 删除备份文件
  async deleteBackup(filePath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      
      fs.unlink({
        filePath: filePath,
        success: () => {
          console.log('备份文件删除成功:', filePath);
          resolve(true);
        },
        fail: (error) => {
          console.error('备份文件删除失败:', error);
          reject(new Error('删除失败: ' + error.errMsg));
        }
      });
    });
  }

  // 清理旧备份（保留最近5个）
  async cleanOldBackups() {
    try {
      const history = this.getBackupHistory();
      
      if (history.length > 5) {
        const toDelete = history.slice(5); // 保留前5个，删除其余的
        
        for (const backup of toDelete) {
          try {
            await this.deleteBackup(backup.filePath);
            console.log('清理旧备份:', backup.fileName);
          } catch (error) {
            console.warn('清理备份失败:', backup.fileName, error);
          }
        }
        
        return toDelete.length;
      }
      
      return 0;
    } catch (error) {
      console.error('清理旧备份失败:', error);
      return 0;
    }
  }

  // 获取时间戳
  getTimestamp() {
    const now = new Date();
    return now.getFullYear() + 
           String(now.getMonth() + 1).padStart(2, '0') + 
           String(now.getDate()).padStart(2, '0') + '_' +
           String(now.getHours()).padStart(2, '0') + 
           String(now.getMinutes()).padStart(2, '0');
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 验证备份文件完整性
  async validateBackup(filePath) {
    try {
      const fs = wx.getFileSystemManager();
      
      const content = await new Promise((resolve, reject) => {
        fs.readFile({
          filePath: filePath,
          encoding: 'utf8',
          success: (res) => resolve(res.data),
          fail: reject
        });
      });
      
      if (filePath.endsWith('.json')) {
        // 验证JSON格式
        const data = JSON.parse(content);
        return {
          valid: true,
          type: 'json',
          count: Array.isArray(data) ? data.length : 0
        };
      } else if (filePath.endsWith('.csv')) {
        // 验证CSV格式
        const lines = content.split('\n').filter(line => line.trim());
        return {
          valid: true,
          type: 'csv',
          count: Math.max(0, lines.length - 1) // 减去表头
        };
      }
      
      return { valid: false, error: '未知文件格式' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = DataBackup;























