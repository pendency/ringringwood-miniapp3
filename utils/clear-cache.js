// 清除缓存工具
// 在小程序中调用这个函数来清除所有本地缓存

function clearAllCache() {
  try {
    // 清除本地存储中的产品数据
    wx.removeStorageSync('products');
    wx.removeStorageSync('categories');
    wx.removeStorageSync('banners');
    wx.removeStorageSync('hotProducts');
    wx.removeStorageSync('newProducts');
    
    // 清除可能的缓存键
    const cacheKeys = [
      'productCache',
      'categoryCache', 
      'productData',
      'categoryData',
      'mockProducts',
      'mockCategories'
    ];
    
    cacheKeys.forEach(key => {
      try {
        wx.removeStorageSync(key);
      } catch (e) {
        console.log('清除缓存失败:', key, e);
      }
    });
    
    console.log('缓存清除完成');
    
    // 显示成功提示
    wx.showToast({
      title: '缓存已清除',
      icon: 'success'
    });
    
    return true;
  } catch (error) {
    console.error('清除缓存失败:', error);
    wx.showToast({
      title: '清除失败',
      icon: 'none'
    });
    return false;
  }
}

module.exports = {
  clearAllCache
};
