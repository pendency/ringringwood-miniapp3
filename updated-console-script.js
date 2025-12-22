// 更新版控制台下载脚本 - 使用正确的.jpeg扩展名
// 复制到微信开发者工具控制台运行

(async function downloadTabBarIcons() {
  console.log('🚀 开始下载TabBar图标...');
  
  const icons = [
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpeg', name: 'home.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpeg', name: 'home-active.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpeg', name: 'category.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpeg', name: 'category-active.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpeg', name: 'favorite.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpeg', name: 'favorite-active.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpeg', name: 'contact.jpg'},
    {fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpeg', name: 'contact-active.jpg'}
  ];

  let successCount = 0;
  const downloadedFiles = [];

  for (const icon of icons) {
    try {
      console.log(`📥 正在下载: ${icon.name}`);
      const result = await wx.cloud.downloadFile({fileID: icon.fileID});
      
      if (result.statusCode === 200) {
        console.log(`✅ ${icon.name}: ${result.tempFilePath}`);
        successCount++;
        downloadedFiles.push({name: icon.name, path: result.tempFilePath});
      } else {
        console.error(`❌ ${icon.name} 下载失败, 状态码: ${result.statusCode}`);
      }
    } catch (error) {
      console.error(`❌ ${icon.name} 下载出错:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 下载完成! 成功: ${successCount}/8`);
  console.log('\n📋 请将上述临时文件复制到项目的 images/ 目录中');
  console.log('⚠️  注意: 保存时文件名使用 .jpg 扩展名（与app.json配置匹配）');
  return downloadedFiles;
})();
