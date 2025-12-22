// 最终修复测试
console.log('🔧 === 最终修复测试 ===');

async function testFinalFix() {
  try {
    console.log('\n📋 测试完整的数据流');
    
    // 1. 测试云函数直接调用
    const cloudResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProductById',
        id: 'wood2'
      }
    });
    
    if (cloudResult.result.success) {
      const cloudProduct = cloudResult.result.data;
      console.log('✅ 云函数返回:', {
        name: cloudProduct.name,
        imagesCount: cloudProduct.images ? cloudProduct.images.length : 0,
        imageUrlsCount: cloudProduct.imageUrls ? cloudProduct.imageUrls.length : 0
      });
    }
    
    // 2. 模拟 cloudProductData 处理
    console.log('\n📋 模拟 cloudProductData 处理');
    if (cloudResult.result.success) {
      const rawProduct = cloudResult.result.data;
      
      // 模拟临时URL处理后的结果
      const processedProduct = {
        ...rawProduct,
        // cloudProductData 会保持 images 数组不变，只转换URL
        images: rawProduct.images // 这里应该保持排除imageUrl1的状态
      };
      
      console.log('✅ cloudProductData 处理后:', {
        name: processedProduct.name,
        imagesCount: processedProduct.images ? processedProduct.images.length : 0,
        imageUrlsCount: processedProduct.imageUrls ? processedProduct.imageUrls.length : 0
      });
    }
    
    // 3. 模拟 productData.js 转换
    console.log('\n📋 模拟 productData.js 转换');
    if (cloudResult.result.success) {
      const product = cloudResult.result.data;
      
      // 使用修复后的逻辑
      const transformedProduct = {
        name: product.name,
        images: product.images || product.imageUrls || [], // 优先使用 images
        imageUrls: product.imageUrls || []
      };
      
      console.log('✅ productData.js 转换后:', {
        name: transformedProduct.name,
        imagesCount: transformedProduct.images.length,
        imageUrlsCount: transformedProduct.imageUrls.length
      });
      
      // 检查第一张图片
      if (transformedProduct.images.length > 0) {
        const firstImage = transformedProduct.images[0];
        const fileName = firstImage.split('/').pop();
        const isImageUrl1 = fileName.includes('wood2.jpeg') && !fileName.includes('wood2-');
        
        console.log('🔹 第一张图片:', {
          fileName: fileName,
          isImageUrl1: isImageUrl1 ? '❌ 是imageUrl1（问题）' : '✅ 不是imageUrl1'
        });
      }
    }
    
    console.log('\n🎉 === 测试完成 ===');
    console.log('请清除缓存并重新进入详情页！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFinalFix();











