// 测试排除 imageUrl1 的效果
console.log('🔧 === 排除 imageUrl1 测试 ===');

async function testExcludeImageUrl1() {
  try {
    console.log('\n📋 测试1: 验证分类页面数据（应该只有imageUrl1作为主图）');
    
    const categoryResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_custom', limit: 2 }
      }
    });
    
    if (categoryResult.result.success) {
      const product = categoryResult.result.data[0];
      console.log('✅ 分类页面产品数据:', {
        name: product.name,
        image: product.image,
        imageUrls: product.imageUrls,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      if (product.imageUrls && product.imageUrls.length > 0) {
        console.log('🔹 分类页面图片:');
        product.imageUrls.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-50)} (应该是 imageUrl1)`);
        });
      }
    }
    
    console.log('\n📋 测试2: 验证产品详情页数据（应该排除imageUrl1）');
    
    const detailResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProductById',
        id: 'custom1'
      }
    });
    
    if (detailResult.result.success) {
      const product = detailResult.result.data;
      console.log('✅ 产品详情数据:', {
        name: product.name,
        image: product.image,
        images: product.images,
        imageUrls: product.imageUrls,
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      if (product.images && product.images.length > 0) {
        console.log('🔹 详情页图片（应该排除imageUrl1）:');
        product.images.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-50)}`);
        });
      } else {
        console.log('❌ 详情页没有图片数据');
      }
      
      // 检查是否包含了 imageUrl1
      const hasImageUrl1 = product.images && product.images.some(img => 
        img.includes('custom1.jpeg') && !img.includes('custom1-1.jpeg')
      );
      
      console.log('🔹 详情页是否包含imageUrl1:', hasImageUrl1 ? '❌ 包含（应该排除）' : '✅ 已排除');
    }
    
    console.log('\n📋 测试3: 验证图片路径格式');
    
    if (detailResult.result.success && detailResult.result.data.images) {
      const images = detailResult.result.data.images;
      console.log('✅ 图片路径分析:');
      images.forEach((img, i) => {
        console.log(`🔹 图片 ${i + 1}:`, {
          path: img.substr(-60),
          isCloudStorage: img.startsWith('cloud://'),
          isImageUrl1: img.includes('custom1.jpeg') && !img.includes('custom1-1.jpeg'),
          isImageUrl2Plus: img.includes('custom1-1.jpeg') || img.includes('custom1-2.jpeg') // 等等
        });
      });
    }
    
    console.log('\n🎉 === 排除 imageUrl1 测试完成 ===');
    console.log('总结：');
    console.log('- 分类页面：显示 imageUrl1 作为主图');
    console.log('- 详情页面：显示 imageUrl2-10，排除 imageUrl1');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testExcludeImageUrl1();











