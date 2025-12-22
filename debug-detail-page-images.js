// 调试产品详情页图片显示
console.log('🔍 === 详情页图片显示调试 ===');

(function debugDetailPageImages() {
  try {
    console.log('\n📋 检查当前页面状态');
    
    // 获取当前页面
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    console.log('✅ 当前页面信息:', {
      route: currentPage.route,
      hasData: !!currentPage.data
    });
    
    // 如果是产品详情页
    if (currentPage.route === 'pages/product-detail/product-detail') {
      const pageData = currentPage.data;
      
      console.log('🔹 详情页数据状态:', {
        hasProduct: !!pageData.product,
        productName: pageData.product ? pageData.product.name : '无'
      });
      
      if (pageData.product) {
        const product = pageData.product;
        
        console.log('🔹 产品图片数据详情:', {
          name: product.name,
          images: product.images,
          imageUrls: product.imageUrls,
          imagesCount: product.images ? product.images.length : 0,
          imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
        });
        
        // 详细分析每张图片
        if (product.images && product.images.length > 0) {
          console.log('🔹 详情页实际显示的图片:');
          product.images.forEach((img, i) => {
            const isImageUrl1 = img.includes('custom1.jpeg') && !img.includes('custom1-1.jpeg');
            console.log(`  图片 ${i + 1}: ${img.substr(-60)}`);
            console.log(`    - 是否是imageUrl1: ${isImageUrl1 ? '❌ 是（应该排除）' : '✅ 不是'}`);
            console.log(`    - 完整路径: ${img}`);
          });
        }
        
        // 检查其他可能的图片字段
        console.log('🔹 其他图片相关字段:', {
          image: product.image,
          detailImages: product.detailImages,
          currentImageIndex: pageData.currentImageIndex
        });
        
        // 检查轮播相关数据
        console.log('🔹 轮播相关数据:', {
          currentImageIndex: pageData.currentImageIndex,
          swiperItemWidth: pageData.swiperItemWidth
        });
      }
      
      console.log('\n📋 建议检查项目:');
      console.log('1. 确认页面显示的是 product.images 数组');
      console.log('2. 检查是否有缓存问题');
      console.log('3. 检查模板是否使用了其他图片字段');
      console.log('4. 尝试清除缓存并重新进入页面');
      
    } else {
      console.log('❌ 当前不在产品详情页，请先进入产品详情页');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

})();
