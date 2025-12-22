// test-fixed-productManager.js - 测试修复后的 productManager 云函数
// 在小程序开发者工具控制台中运行此代码

async function testFixedProductManager() {
  console.log('=== 测试修复后的 productManager 云函数 ===');
  
  const testCases = [
    {
      name: '获取所有产品（默认）',
      params: {}
    },
    {
      name: '获取所有产品（包含隐藏）',
      params: { includeHidden: true }
    },
    {
      name: '获取热门产品',
      params: { isHot: true }
    },
    {
      name: '获取新产品',
      params: { isNew: true }
    },
    {
      name: '分页测试（第1页，每页5条）',
      params: { page: 1, limit: 5 }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    console.log(`📋 参数:`, testCase.params);
    
    try {
      const startTime = Date.now();
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProducts',
          data: testCase.params
        }
      });
      const endTime = Date.now();
      
      console.log(`⏱️ 耗时: ${endTime - startTime}ms`);
      
      if (result.result && result.result.success) {
        const data = result.result;
        console.log(`✅ 成功！`);
        console.log(`📊 统计信息:`);
        console.log(`   - 符合条件总数: ${data.total}`);
        console.log(`   - 本次返回数量: ${data.returned || data.data.length}`);
        console.log(`   - 当前页码: ${data.page}`);
        console.log(`   - 每页限制: ${data.limit}`);
        
        if (data.data && data.data.length > 0) {
          console.log(`\n📋 前3个产品预览:`);
          data.data.slice(0, 3).forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name || product.title} (${product._id})`);
            console.log(`      - 分类: ${product.categoryName}`);
            console.log(`      - 可见: ${product.isVisible}`);
            console.log(`      - 热门: ${product.isHot}`);
            console.log(`      - 新品: ${product.isNew}`);
            console.log(`      - 价格: ${product.price}`);
            
            // 统计图片数量
            let imageCount = 0;
            for (let i = 1; i <= 10; i++) {
              if (product[`imageUrl${i}`]) imageCount++;
            }
            console.log(`      - 图片数: ${imageCount}`);
            console.log(`      - 视频: ${product.videoUrl ? '有' : '无'}`);
          });
          
          // 数据质量检查
          console.log(`\n🔍 数据质量检查:`);
          const qualityCheck = analyzeDataQuality(data.data);
          console.log(`   - 有图片的产品: ${qualityCheck.withImages}/${data.data.length}`);
          console.log(`   - 有视频的产品: ${qualityCheck.withVideos}/${data.data.length}`);
          console.log(`   - 有价格的产品: ${qualityCheck.withPrice}/${data.data.length}`);
          console.log(`   - 有描述的产品: ${qualityCheck.withDescription}/${data.data.length}`);
          
          if (qualityCheck.categories.size > 0) {
            console.log(`   - 涉及分类数: ${qualityCheck.categories.size}`);
            console.log(`   - 分类列表: ${Array.from(qualityCheck.categories).join(', ')}`);
          }
        } else {
          console.log(`⚠️ 无产品数据返回`);
        }
        
      } else {
        console.log(`❌ 失败: ${result.result?.error || '未知错误'}`);
        console.log(`详细错误:`, result.result);
      }
      
    } catch (error) {
      console.error(`❌ 异常: ${error.errMsg || error.message}`);
      console.error('完整错误:', error);
    }
    
    console.log('─'.repeat(50));
  }
  
  console.log('\n=== 测试完成 ===');
  
  // 最后测试一下获取单个产品
  console.log('\n🧪 额外测试: 获取单个产品详情');
  try {
    const allProductsResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: { action: 'getProducts', data: { limit: 1 } }
    });
    
    if (allProductsResult.result?.success && allProductsResult.result.data.length > 0) {
      const firstProductId = allProductsResult.result.data[0]._id;
      console.log(`测试获取产品: ${firstProductId}`);
      
      const productResult = await wx.cloud.callFunction({
        name: 'productManager',
        data: { 
          action: 'getProductById', 
          data: { id: firstProductId } 
        }
      });
      
      if (productResult.result?.success) {
        console.log(`✅ 获取单个产品成功: ${productResult.result.data.name || productResult.result.data.title}`);
      } else {
        console.log(`❌ 获取单个产品失败: ${productResult.result?.error}`);
      }
    }
  } catch (error) {
    console.error('获取单个产品测试失败:', error);
  }
}

// 数据质量分析函数
function analyzeDataQuality(products) {
  const stats = {
    withImages: 0,
    withVideos: 0,
    withPrice: 0,
    withDescription: 0,
    categories: new Set()
  };
  
  products.forEach(product => {
    // 统计图片
    let hasImages = false;
    for (let i = 1; i <= 10; i++) {
      if (product[`imageUrl${i}`] && product[`imageUrl${i}`].trim()) {
        hasImages = true;
        break;
      }
    }
    if (hasImages) stats.withImages++;
    
    // 统计视频
    if (product.videoUrl && product.videoUrl.trim()) stats.withVideos++;
    
    // 统计价格
    if (product.price && product.price.toString().trim()) stats.withPrice++;
    
    // 统计描述
    if (product.description && product.description.trim()) stats.withDescription++;
    
    // 统计分类
    if (product.categoryName && product.categoryName.trim()) {
      stats.categories.add(product.categoryName.trim());
    }
  });
  
  return stats;
}

// 如果在小程序环境中，立即执行测试
if (typeof wx !== 'undefined') {
  testFixedProductManager();
} else {
  console.log('请在小程序开发者工具控制台中运行: testFixedProductManager()');
}
