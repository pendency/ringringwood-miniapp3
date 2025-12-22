// 简化版控制台下载脚本 - 使用正确的.jpeg扩展名
// 逐行复制到微信开发者工具控制台执行

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpeg'}).then(res => console.log('home.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpeg'}).then(res => console.log('home-active.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpeg'}).then(res => console.log('category.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpeg'}).then(res => console.log('category-active.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpeg'}).then(res => console.log('favorite.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpeg'}).then(res => console.log('favorite-active.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpeg'}).then(res => console.log('contact.jpg:', res.tempFilePath));

wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpeg'}).then(res => console.log('contact-active.jpg:', res.tempFilePath));
