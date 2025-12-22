// 在微信开发者工具控制台中运行的TabBar图标下载脚本
// 复制以下代码到控制台并按回车执行

(async function downloadTabBarIcons() {
  console.log('🚀 开始下载TabBar图标...');
  
  // 需要下载的图标列表
  const icons = [
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpg',
      name: 'home.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpg',
      name: 'home-active.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpg',
      name: 'category.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpg',
      name: 'category-active.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpg',
      name: 'favorite.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpg',
      name: 'favorite-active.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpg',
      name: 'contact.jpg'
    },
    {
      fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpg',
      name: 'contact-active.jpg'
    }
  ];

  let successCount = 0;
  let failCount = 0;
  const downloadedFiles = [];

  // 逐个下载文件
  for (const icon of icons) {
    try {
      console.log(`📥 正在下载: ${icon.name}`);
      
      const result = await wx.cloud.downloadFile({
        fileID: icon.fileID
      });
      
      if (result.statusCode === 200) {
        console.log(`✅ 下载成功: ${icon.name}`);
        console.log(`   临时路径: ${result.tempFilePath}`);
        
        successCount++;
        downloadedFiles.push({
          name: icon.name,
          tempPath: result.tempFilePath,
          status: 'success'
        });
      } else {
        console.error(`❌ 下载失败: ${icon.name}, 状态码: ${result.statusCode}`);
        failCount++;
        downloadedFiles.push({
          name: icon.name,
          error: `状态码: ${result.statusCode}`,
          status: 'failed'
        });
      }
    } catch (error) {
      console.error(`❌ 下载出错: ${icon.name}`, error);
      failCount++;
      downloadedFiles.push({
        name: icon.name,
        error: error.message || '下载出错',
        status: 'failed'
      });
    }
    
    // 添加小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 输出下载结果
  console.log('\n📊 下载完成统计:');
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个`);
  
  if (successCount > 0) {
    console.log('\n📁 成功下载的文件:');
    downloadedFiles.filter(f => f.status === 'success').forEach(file => {
      console.log(`${file.name}: ${file.tempPath}`);
    });
    
    console.log('\n📋 下一步操作:');
    console.log('1. 在项目根目录创建 images 文件夹（如果不存在）');
    console.log('2. 将上述临时文件复制到 images/ 目录中');
    console.log('3. 确保文件名正确（去掉路径，只保留文件名）');
    console.log('4. 重新编译小程序');
  }
  
  if (failCount > 0) {
    console.log('\n❌ 下载失败的文件:');
    downloadedFiles.filter(f => f.status === 'failed').forEach(file => {
      console.log(`${file.name}: ${file.error}`);
    });
  }
  
  console.log('\n🎉 脚本执行完成！');
  
  // 返回结果供进一步处理
  return downloadedFiles;
})();
