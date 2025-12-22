// 测试产品详情页图片数据
console.log('🔧 === 产品详情页图片测试 ===');

async function testDetailImages() {
  try {
    console.log('\n📋 测试1: 验证云函数返回的产品详情数据');
    
    const detailResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProductById',
        id: 'custom1'
      }
    });
    
    if (detailResult.result.success) {
      const product = detailResult.result.data;
      console.log('✅ 云函数返回的产品数据:', {
        name: product.name,
        image: product.image,
        images: product.images,
        imageUrls: product.imageUrls,
        imagesCount: product.images ? product.images.length : 0,
        imageUrlsCount: product.imageUrls ? product.imageUrls.length : 0
      });
      
      if (product.images && product.images.length > 0) {
        console.log('🔹 云函数返回的所有图片:');
        product.images.forEach((img, i) => {
          console.log(`  图片 ${i + 1}: ${img.substr(-50)}`);
        });
      }
      
      if (product.imageUrls && product.imageUrls.length > 0) {
        console.log('🔹 云函数返回的 imageUrls:');
        product.imageUrls.forEach((img, i) => {
          console.log(`  imageUrl ${i + 1}: ${img.substr(-50)}`);
        });
      }
    }
    
    console.log('\n📋 测试2: 模拟 productData.getProductById 处理');
    
    // 模拟 productData.getProductById 的数据转换
    if (detailResult.result.success) {
      const rawProduct = detailResult.result.data;
      
      // 模拟转换逻辑
      const transformedProduct = {
        id: rawProduct._id,
        _id: rawProduct._id,
        name: rawProduct.name,
        brief: rawProduct.description,
        images: rawProduct.imageUrls || (rawProduct.image ? [rawProduct.image] : []),
        imageUrls: rawProduct.imageUrls || (rawProduct.image ? [rawProduct.image] : []),
        price: rawProduct.price,
        categoryId: rawProduct.categoryId
      };
      
      console.log('✅ productData 转换后的数据:', {
        name: transformedProduct.name,
        imagesCount: transformedProduct.images.length,
        imageUrlsCount: transformedProduct.imageUrls.length,
        images: transformedProduct.images,
        imageUrls: transformedProduct.imageUrls
      });
    }
    
    console.log('\n📋 测试3: 模拟产品详情页数据设置');
    
    // 模拟产品详情页的数据处理
    if (detailResult.result.success) {
      const result = detailResult.result.data;
      
      // 模拟 productData 处理后的数据
      const processedResult = {
        _id: result._id,
        name: result.name,
        description: result.description,
        images: result.imageUrls || (result.image ? [result.image] : []),
        imageUrls: result.imageUrls || (result.image ? [result.image] : []),
        price: result.price
      };
      
      // 模拟详情页的数据设置
      const product = {
        id: processedResult._id,
        _id: processedResult._id,
        name: processedResult.name || '',
        brief: processedResult.description || '',
        images: processedResult.images || [],
        imageUrls: processedResult.imageUrls || [],
        price: processedResult.price
      };
      
      console.log('✅ 详情页最终设置的数据:', {
        name: product.name,
        imagesCount: product.images.length,
        imageUrlsCount: product.imageUrls.length,
        finalImages: product.images,
        finalImageUrls: product.imageUrls
      });
      
      console.log('🔹 详情页应该显示的所有图片:');
      if (product.images && product.images.length > 0) {
        product.images.forEach((img, i) => {
          console.log(`  详情图 ${i + 1}: ${img.substr(-50)}`);
        });
      } else {
        console.log('  ❌ 没有图片数据');
      }
    }
    
    console.log('\n🎉 === 产品详情页图片测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testDetailImages();











