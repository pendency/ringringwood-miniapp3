// 测试最终修复
console.log('🔧 === 最终修复验证测试 ===');

async function testFinalFixes() {
  try {
    console.log('\n📋 测试1: 验证分类页产品数据');
    
    // 获取分类产品
    const categoryResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_custom', limit: 3 }
      }
    });
    
    if (categoryResult.result.success) {
      console.log('✅ 分类页产品数据:');
      categoryResult.result.data.forEach((product, index) => {
        console.log(`🔹 产品 ${index + 1}:`, {
          name: product.name,
          price: product.price,
          priceType: typeof product.price,
          imageUrls: product.imageUrls,
          imageCount: product.imageUrls ? product.imageUrls.length : 0,
          firstImage: product.imageUrls && product.imageUrls[0] ? product.imageUrls[0].substr(-30) : '无图片'
        });
      });
    }
    
    console.log('\n📋 测试2: 验证产品详情数据');
    
    // 获取产品详情
    const detailResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProductById',
        id: 'custom1'
      }
    });
    
    if (detailResult.result.success) {
      const product = detailResult.result.data;
      console.log('✅ 产品详情数据:');
      console.log('🔹 基本信息:', {
        name: product.name,
        price: product.price,
        priceType: typeof product.price
      });
      
      console.log('🔹 图片信息:', {
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0,
        images: product.images,
        imageUrls: product.imageUrls
      });
      
      if (product.images && product.images.length > 0) {
        console.log('🔹 详情页图片列表:');
        product.images.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-40)}`);
        });
      }
    }
    
    console.log('\n📋 测试3: 验证图片URL格式');
    
    // 测试图片是否为云存储格式
    if (categoryResult.result.success && categoryResult.result.data.length > 0) {
      const firstProduct = categoryResult.result.data[0];
      if (firstProduct.imageUrls && firstProduct.imageUrls.length > 0) {
        const firstImage = firstProduct.imageUrls[0];
        console.log('✅ 图片URL格式检查:');
        console.log('🔹 图片URL:', firstImage);
        console.log('🔹 是否云存储:', firstImage.startsWith('cloud://'));
        console.log('🔹 URL长度:', firstImage.length);
        
        // 尝试加载图片验证
        try {
          const imageInfo = await new Promise((resolve, reject) => {
            wx.getImageInfo({
              src: firstImage,
              success: resolve,
              fail: reject
            });
          });
          console.log('✅ 图片加载成功:', {
            width: imageInfo.width,
            height: imageInfo.height
          });
        } catch (error) {
          console.log('❌ 图片加载失败:', error.errMsg);
        }
      }
    }
    
    console.log('\n🎉 === 最终修复验证完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFinalFixes();











