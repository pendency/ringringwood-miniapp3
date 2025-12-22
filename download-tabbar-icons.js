// 从云存储下载TabBar图标的脚本
// 需要在微信开发者工具的控制台中运行

const downloadTabBarIcons = async () => {
  console.log('开始下载TabBar图标...');
  
  // 需要下载的图标列表
  const icons = [
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpg',
      localPath: 'images/home.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpg',
      localPath: 'images/home-active.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpg',
      localPath: 'images/category.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpg',
      localPath: 'images/category-active.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpg',
      localPath: 'images/favorite.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpg',
      localPath: 'images/favorite-active.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpg',
      localPath: 'images/contact.jpg'
    },
    {
      cloudPath: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpg',
      localPath: 'images/contact-active.jpg'
    }
  ];

  // 确保images目录存在
  const fs = wx.getFileSystemManager();
  
  try {
    fs.accessSync(`${wx.env.USER_DATA_PATH}/images`);
  } catch (e) {
    fs.mkdirSync(`${wx.env.USER_DATA_PATH}/images`);
  }

  // 下载每个图标
  for (const icon of icons) {
    try {
      console.log(`正在下载: ${icon.cloudPath}`);
      
      // 从云存储下载文件
      const result = await wx.cloud.downloadFile({
        fileID: icon.cloudPath
      });
      
      if (result.statusCode === 200) {
        // 将文件复制到项目目录
        const tempFilePath = result.tempFilePath;
        const targetPath = `${wx.env.USER_DATA_PATH}/${icon.localPath}`;
        
        fs.copyFileSync(tempFilePath, targetPath);
        console.log(`✅ 下载成功: ${icon.localPath}`);
      } else {
        console.error(`❌ 下载失败: ${icon.cloudPath}, 状态码: ${result.statusCode}`);
      }
    } catch (error) {
      console.error(`❌ 下载出错: ${icon.cloudPath}`, error);
    }
  }
  
  console.log('TabBar图标下载完成！');
};

// 导出函数
module.exports = {
  downloadTabBarIcons
};
