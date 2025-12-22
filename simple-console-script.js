// 简化版控制台下载脚本 - 复制到微信开发者工具控制台运行

// 方法1: 一次性下载所有图标
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpg'}).then(res => console.log('home.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpg'}).then(res => console.log('home-active.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpg'}).then(res => console.log('category.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpg'}).then(res => console.log('category-active.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpg'}).then(res => console.log('favorite.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpg'}).then(res => console.log('favorite-active.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpg'}).then(res => console.log('contact.jpg:', res.tempFilePath));
wx.cloud.downloadFile({fileID: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpg'}).then(res => console.log('contact-active.jpg:', res.tempFilePath));
