// 简单的详情页调试
console.log('🔍 === 简单调试 ===');

try {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage.route === 'pages/product-detail/product-detail') {
    const product = currentPage.data.product;
    
    if (product) {
      console.log('✅ 产品名称:', product.name);
      console.log('✅ 图片数组长度:', product.images ? product.images.length : 0);
      console.log('✅ 图片数组内容:', product.images);
      
      if (product.images && product.images.length > 0) {
        product.images.forEach((img, i) => {
          console.log(`图片 ${i + 1}: ${img.substr(-50)}`);
        });
      }
    } else {
      console.log('❌ 没有产品数据');
    }
  } else {
    console.log('❌ 不在详情页，当前页面:', currentPage.route);
  }
} catch (error) {
  console.error('❌ 调试失败:', error);
}











