// 测试分类页面修复
console.log('🔧 === 分类页面修复验证 ===');

async function testCategoryFixes() {
  try {
    console.log('\n📋 测试1: 验证分类名称显示');
    
    // 测试获取所有产品，检查分类名称
    const allResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 5 }
      }
    });
    
    if (allResult.result.success) {
      console.log('✅ 产品数据结构检查:');
      allResult.result.data.forEach((product, index) => {
        console.log(`🔹 产品 ${index + 1}:`, {
          name: product.name,
          _id: product._id,
          id: product.id,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          hasImageUrls: !!product.imageUrls,
          imageUrlsLength: product.imageUrls ? product.imageUrls.length : 0,
          firstImage: product.imageUrls && product.imageUrls[0] ? product.imageUrls[0].substr(-30) : '无图片'
        });
      });
    }
    
    console.log('\n📋 测试2: 验证特定分类查询');
    
    // 测试特定分类
    const categoryResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_custom', limit: 3 }
      }
    });
    
    if (categoryResult.result.success) {
      console.log('✅ cat_custom 分类产品:');
      categoryResult.result.data.forEach((product, index) => {
        console.log(`🔹 产品 ${index + 1}:`, {
          name: product.name,
          _id: product._id,
          categoryName: product.categoryName,
          imageAvailable: !!product.imageUrls && product.imageUrls.length > 0
        });
      });
    }
    
    console.log('\n📋 测试3: 验证产品详情获取');
    
    // 使用第一个产品的ID测试详情页
    if (allResult.result.success && allResult.result.data.length > 0) {
      const firstProductId = allResult.result.data[0]._id;
      console.log('🔍 测试产品详情，ID:', firstProductId);
      
      const detailResult = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProductById',
          id: firstProductId
        }
      });
      
      console.log('✅ 产品详情结果:', {
        success: detailResult.result.success,
        hasData: !!detailResult.result.data,
        productName: detailResult.result.data ? detailResult.result.data.name : '无',
        hasImages: detailResult.result.data && detailResult.result.data.images ? detailResult.result.data.images.length > 0 : false
      });
    }
    
    console.log('\n🎉 === 修复验证完成 ===');
    console.log('如果所有测试通过，分类页面应该正常工作了！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testCategoryFixes();











