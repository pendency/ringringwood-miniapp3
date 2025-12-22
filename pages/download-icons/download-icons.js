// pages/download-icons/download-icons.js
Page({
  data: {
    downloadStatus: '准备下载',
    downloadedIcons: [],
    totalIcons: 8
  },

  onLoad: function() {
    console.log('图标下载页面加载');
  },

  // 开始下载TabBar图标
  startDownload: function() {
    this.setData({
      downloadStatus: '正在下载...',
      downloadedIcons: []
    });

    this.downloadTabBarIcons();
  },

  // 下载TabBar图标
  downloadTabBarIcons: async function() {
    const icons = [
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpg',
        localName: 'home.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpg',
        localName: 'home-active.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpg',
        localName: 'category.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpg',
        localName: 'category-active.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpg',
        localName: 'favorite.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpg',
        localName: 'favorite-active.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpg',
        localName: 'contact.jpg'
      },
      {
        cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpg',
        localName: 'contact-active.jpg'
      }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const icon of icons) {
      try {
        console.log(`正在下载: ${icon.cloudPath}`);
        
        // 从云存储下载文件
        const result = await wx.cloud.downloadFile({
          fileID: icon.cloudPath
        });
        
        if (result.statusCode === 200) {
          console.log(`✅ 下载成功: ${icon.localName}`);
          successCount++;
          
          // 更新下载状态
          this.setData({
            downloadedIcons: [...this.data.downloadedIcons, {
              name: icon.localName,
              status: 'success',
              tempPath: result.tempFilePath
            }]
          });
        } else {
          console.error(`❌ 下载失败: ${icon.cloudPath}, 状态码: ${result.statusCode}`);
          failCount++;
          
          this.setData({
            downloadedIcons: [...this.data.downloadedIcons, {
              name: icon.localName,
              status: 'failed',
              error: `状态码: ${result.statusCode}`
            }]
          });
        }
      } catch (error) {
        console.error(`❌ 下载出错: ${icon.cloudPath}`, error);
        failCount++;
        
        this.setData({
          downloadedIcons: [...this.data.downloadedIcons, {
            name: icon.localName,
            status: 'failed',
            error: error.message || '下载出错'
          }]
        });
      }
    }
    
    // 更新最终状态
    this.setData({
      downloadStatus: `下载完成！成功: ${successCount}, 失败: ${failCount}`
    });

    if (successCount > 0) {
      wx.showToast({
        title: `成功下载${successCount}个图标`,
        icon: 'success'
      });
      
      // 提示用户手动复制文件
      wx.showModal({
        title: '下载完成',
        content: `已成功下载${successCount}个图标到临时目录。请手动将这些文件复制到项目的images目录中。`,
        showCancel: false
      });
    }
  },

  // 显示文件路径
  showFilePath: function(e) {
    const tempPath = e.currentTarget.dataset.path;
    if (tempPath) {
      wx.showModal({
        title: '临时文件路径',
        content: tempPath,
        showCancel: false
      });
    }
  }
});
