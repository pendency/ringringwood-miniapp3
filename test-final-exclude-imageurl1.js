// 最终测试排除 imageUrl1
console.log('🔧 === 最终排除 imageUrl1 测试 ===');

async function testFinalExcludeImageUrl1() {
  try {
    console.log('\n📋 测试1: 验证 wood2 产品详情');
    
    const detailResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProductById',
        id: 'wood2'
      }
    });
    
    if (detailResult.result.success) {
      const product = detailResult.result.data;
      console.log('✅ 云函数返回的 wood2 数据:', {
        name: product.name,
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      if (product.images && product.images.length > 0) {
        console.log('🔹 云函数返回的图片（应该排除imageUrl1）:');
        product.images.forEach((img, i) => {
          const isImageUrl1 = img.includes('wood2.jpeg') && !img.includes('wood2-');
          console.log(`  图片 ${i + 1}: ${img.substr(-50)}`);
          console.log(`    - 是否是imageUrl1: ${isImageUrl1 ? '❌ 是（应该排除）' : '✅ 不是'}`);
        });
      }
    }
    
    console.log('\n📋 测试2: 测试不同产品');
    
    const products = ['wood1', 'wood2', 'custom1'];
    
    for (const productId of products) {
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProductById',
          id: productId
        }
      });
      
      if (result.result.success) {
        const product = result.result.data;
        const hasImageUrl1 = product.images && product.images.some(img => {
          const fileName = img.split('/').pop();
          return fileName === `${productId}.jpeg`;
        });
        
        console.log(`✅ ${productId}:`, {
          imagesCount: product.images ? product.images.length : 0,
          hasImageUrl1: hasImageUrl1 ? '❌ 包含' : '✅ 已排除'
        });
      }
    }
    
    console.log('\n🎉 === 测试完成 ===');
    console.log('请清除缓存并重新进入详情页查看效果！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFinalExcludeImageUrl1();











