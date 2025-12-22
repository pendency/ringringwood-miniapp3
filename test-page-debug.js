// 页面调试测试
console.log('🔧 === 页面状态调试 ===');

function testPageDebug() {
  try {
    console.log('\n📋 检查当前页面状态');
    
    // 获取当前页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    console.log('✅ 当前页面信息:', {
      route: currentPage.route,
      hasData: !!currentPage.data,
      dataKeys: Object.keys(currentPage.data || {})
    });
    
    // 如果是分类页面
    if (currentPage.route === 'pages/category/category') {
      const pageData = currentPage.data;
      console.log('🔹 分类页面数据状态:', {
        categories: pageData.categories ? pageData.categories.length : 0,
        products: pageData.products ? pageData.products.length : 0,
        activeTab: pageData.activeTab,
        loading: pageData.loading
      });
      
      if (pageData.products && pageData.products.length > 0) {
        console.log('🔹 第一个产品数据:', {
          name: pageData.products[0].name,
          _id: pageData.products[0]._id,
          price: pageData.products[0].price,
          imageUrls: pageData.products[0].imageUrls,
          hasImageUrls: !!(pageData.products[0].imageUrls && pageData.products[0].imageUrls.length > 0)
        });
      } else {
        console.log('❌ 分类页面没有产品数据');
      }
      
      if (pageData.categories && pageData.categories.length > 0) {
        console.log('🔹 分类数据:', pageData.categories.map(cat => ({
          name: cat.name,
          _id: cat._id
        })));
      }
    }
    
    // 如果是产品详情页
    if (currentPage.route === 'pages/product-detail/product-detail') {
      const pageData = currentPage.data;
      console.log('🔹 产品详情页数据状态:', {
        hasProduct: !!pageData.product,
        productName: pageData.product ? pageData.product.name : '无',
        images: pageData.product ? pageData.product.images : [],
        imageCount: pageData.product && pageData.product.images ? pageData.product.images.length : 0
      });
    }
    
    console.log('\n📋 建议的解决步骤:');
    console.log('1. 重新进入分类页面');
    console.log('2. 清除小程序缓存 (开发者工具 -> 清缓存)');
    console.log('3. 检查网络连接');
    console.log('4. 查看控制台是否有其他错误信息');
    
  } catch (error) {
    console.error('❌ 页面调试失败:', error);
  }
}

testPageDebug();











