// 模拟前端实际调用方式的测试
console.log('🔧 === 前端实际调用方式测试 ===');

async function testFrontendSimulation() {
  try {
    console.log('\n📋 测试1: 模拟分类页面数据获取');
    
    // 模拟 productData.getProductsByCategory 的调用
    // 这会经过 cloudProductData.getProducts 和临时URL处理
    const productData = require('../../utils/productData.js');
    const categoryResult = await productData.getProductsByCategory('cat_custom', { limit: 3 });
    
    console.log('✅ 分类页面数据获取结果:', {
      success: !!categoryResult.products,
      productCount: categoryResult.products ? categoryResult.products.length : 0,
      total: categoryResult.total
    });
    
    if (categoryResult.products && categoryResult.products.length > 0) {
      console.log('🔹 第一个产品数据结构:');
      const firstProduct = categoryResult.products[0];
      console.log({
        name: firstProduct.name,
        price: firstProduct.price,
        _id: firstProduct._id,
        hasImageUrls: !!firstProduct.imageUrls,
        imageUrlsCount: firstProduct.imageUrls ? firstProduct.imageUrls.length : 0,
        hasImages: !!firstProduct.images,
        imagesCount: firstProduct.images ? firstProduct.images.length : 0,
        firstImageUrl: firstProduct.imageUrls && firstProduct.imageUrls[0] ? firstProduct.imageUrls[0].substr(-40) : '无',
        firstImage: firstProduct.images && firstProduct.images[0] ? firstProduct.images[0].substr(-40) : '无'
      });
      
      // 测试图片加载
      if (firstProduct.images && firstProduct.images[0]) {
        console.log('\n📋 测试图片加载 (使用临时URL):');
        try {
          const imageInfo = await new Promise((resolve, reject) => {
            wx.getImageInfo({
              src: firstProduct.images[0],
              success: resolve,
              fail: reject
            });
          });
          console.log('✅ 临时URL图片加载成功:', {
            width: imageInfo.width,
            height: imageInfo.height
          });
        } catch (error) {
          console.log('❌ 临时URL图片加载失败:', error.errMsg);
        }
      }
    }
    
    console.log('\n📋 测试2: 模拟产品详情页数据获取');
    
    // 模拟 productData.getProductById 的调用
    const detailResult = await productData.getProductById('custom1');
    
    if (detailResult) {
      console.log('✅ 产品详情获取成功:', {
        name: detailResult.name,
        price: detailResult.price,
        imagesCount: detailResult.images ? detailResult.images.length : 0,
        imageUrlsCount: detailResult.imageUrls ? detailResult.imageUrls.length : 0
      });
      
      if (detailResult.images && detailResult.images.length > 0) {
        console.log('🔹 详情页所有图片:');
        detailResult.images.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-50)}`);
        });
      }
    } else {
      console.log('❌ 产品详情获取失败');
    }
    
    console.log('\n🎉 === 前端调用方式测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFrontendSimulation();











