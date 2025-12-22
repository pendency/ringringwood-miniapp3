// 小程序环境下的测试
console.log('🔧 === 小程序环境测试 ===');

async function testMiniprogramWay() {
  try {
    console.log('\n📋 测试1: 通过 cloudProductData 获取分类产品');
    
    // 直接使用全局的 cloudProductData 实例
    const app = getApp();
    if (!app.cloudProductData) {
      // 如果没有全局实例，创建一个
      console.log('创建 cloudProductData 实例...');
      // 这里我们直接调用云函数，但会检查返回的数据结构
    }
    
    // 测试通过云函数获取数据，然后检查前端处理逻辑
    const cloudResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_custom', limit: 3 }
      }
    });
    
    console.log('✅ 云函数原始数据:', {
      success: cloudResult.result.success,
      count: cloudResult.result.data ? cloudResult.result.data.length : 0
    });
    
    if (cloudResult.result.success && cloudResult.result.data.length > 0) {
      const products = cloudResult.result.data;
      
      console.log('🔹 原始产品数据结构:');
      const firstProduct = products[0];
      console.log({
        name: firstProduct.name,
        price: firstProduct.price,
        _id: firstProduct._id,
        imageUrls: firstProduct.imageUrls,
        images: firstProduct.images
      });
      
      // 模拟前端的 addFavoriteStatus 处理
      const processedProducts = products.map(product => ({
        ...product,
        isFavorite: false, // 简化处理
        // 🔧 确保图片数据格式兼容性：将 image 字段转换为 imageUrls 数组
        imageUrls: product.imageUrls || (product.image ? [product.image] : [])
      }));
      
      console.log('🔹 处理后的产品数据:');
      const processedFirst = processedProducts[0];
      console.log({
        name: processedFirst.name,
        price: processedFirst.price,
        _id: processedFirst._id,
        imageUrls: processedFirst.imageUrls,
        imageUrlsCount: processedFirst.imageUrls ? processedFirst.imageUrls.length : 0,
        firstImageUrl: processedFirst.imageUrls && processedFirst.imageUrls[0] ? processedFirst.imageUrls[0].substr(-40) : '无'
      });
    }
    
    console.log('\n📋 测试2: 测试产品详情获取');
    
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
        price: product.price,
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      if (product.images && product.images.length > 0) {
        console.log('🔹 详情页图片列表:');
        product.images.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-50)}`);
        });
      }
      
      // 模拟前端数据转换
      const transformedProduct = {
        ...product,
        images: product.image ? [product.image] : (product.images || []),
        imageUrls: product.image ? [product.image] : (product.imageUrls || [])
      };
      
      console.log('🔹 转换后的详情数据:', {
        imagesCount: transformedProduct.images.length,
        imageUrlsCount: transformedProduct.imageUrls.length
      });
    }
    
    console.log('\n📋 测试3: 验证分类页面实际使用的字段');
    
    // 模拟分类页面模板使用的数据结构
    if (cloudResult.result.success && cloudResult.result.data.length > 0) {
      const product = cloudResult.result.data[0];
      
      console.log('🔹 分类页面模板字段检查:');
      console.log('- item._id:', product._id);
      console.log('- item.name:', product.name);  
      console.log('- item.price:', product.price);
      console.log('- item.imageUrls:', product.imageUrls);
      console.log('- item.imageUrls[0]:', product.imageUrls ? product.imageUrls[0] : '无');
      console.log('- item.categoryName:', product.categoryName);
      
      // 检查模板绑定是否有数据
      const templateData = {
        hasId: !!product._id,
        hasName: !!product.name,
        hasPrice: !!product.price,
        hasImageUrls: !!(product.imageUrls && product.imageUrls.length > 0),
        hasFirstImage: !!(product.imageUrls && product.imageUrls[0]),
        priceDisplay: product.price === '联系销售' ? '联系销售' : '¥' + product.price + '起'
      };
      
      console.log('✅ 模板绑定数据检查:', templateData);
    }
    
    console.log('\n🎉 === 小程序环境测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testMiniprogramWay();











