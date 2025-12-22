// 测试图片修复效果
console.log('🔧 === 图片修复效果测试 ===');

async function testImageFixFinal() {
  try {
    console.log('\n📋 测试1: 验证 cloudProductData 临时URL处理');
    
    // 直接测试 cloudProductData 的处理
    const result = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_custom', limit: 2 }
      }
    });
    
    if (result.result.success) {
      console.log('✅ 云函数返回数据:');
      const product = result.result.data[0];
      console.log('🔹 原始产品数据:', {
        name: product.name,
        imageUrls: product.imageUrls,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      // 检查图片URL格式
      if (product.imageUrls && product.imageUrls.length > 0) {
        console.log('🔹 图片URL分析:');
        product.imageUrls.forEach((url, i) => {
          console.log(`  图片 ${i + 1}: ${url}`);
          console.log(`    - 是云存储: ${url.startsWith('cloud://')}`);
          console.log(`    - URL长度: ${url.length}`);
        });
      }
    }
    
    console.log('\n📋 测试2: 模拟前端数据处理流程');
    
    // 模拟 cloudProductData.normalizeProducts 的处理
    if (result.result.success) {
      const rawProducts = result.result.data;
      
      // 模拟规范化处理
      const normalizedProducts = rawProducts.map(product => {
        const normalized = { ...product };
        
        // 处理图片URL - 使用修复后的逻辑
        let imageUrls = [];
        
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          imageUrls = product.imageUrls.filter(url => url && url.trim());
        }
        
        normalized.imageUrls = imageUrls;
        return normalized;
      });
      
      console.log('✅ 规范化后的产品数据:');
      const normalizedFirst = normalizedProducts[0];
      console.log('🔹 规范化产品:', {
        name: normalizedFirst.name,
        imageUrls: normalizedFirst.imageUrls,
        imageUrlsCount: normalizedFirst.imageUrls ? normalizedFirst.imageUrls.length : 0
      });
      
      // 检查是否需要获取临时URL
      const allFileIds = new Set();
      normalizedProducts.forEach(product => {
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach(url => {
            if (url && url.startsWith('cloud://')) {
              allFileIds.add(url);
            }
          });
        }
      });
      
      console.log('🔹 需要临时URL的文件数量:', allFileIds.size);
      console.log('🔹 文件ID列表:', Array.from(allFileIds));
    }
    
    console.log('\n📋 测试3: 验证产品详情数据');
    
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
        images: product.images,
        imageUrls: product.imageUrls,
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
    }
    
    console.log('\n🎉 === 图片修复测试完成 ===');
    console.log('请重新进入分类页面查看效果！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testImageFixFinal();











