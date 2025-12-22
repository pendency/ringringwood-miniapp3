// test-product-fix.js - 测试产品页修复结果
// 在小程序开发者工具控制台中运行此代码

async function testProductFix() {
  console.log('🧪 === 开始测试产品页修复结果 ===');
  
  try {
    // 测试1：直接调用云函数
    console.log('\n📋 测试1：直接调用 productManager 云函数');
    const cloudResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          limit: -1
        }
      }
    });
    
    console.log('✅ 云函数调用成功');
    console.log('📊 云函数返回数据:', {
      success: cloudResult.result?.success,
      total: cloudResult.result?.total,
      returned: cloudResult.result?.returned,
      dataLength: cloudResult.result?.data?.length || 0
    });
    
    if (cloudResult.result?.data?.length > 0) {
      console.log('📝 第一个产品示例:', cloudResult.result.data[0]);
    }
    
    // 测试2：测试cloudProductData模块
    console.log('\n📋 测试2：调用 cloudProductData.getProducts()');
    const cloudProductData = require('./utils/cloudProductData.js');
    const result = await cloudProductData.getProducts();
    
    console.log('✅ cloudProductData 调用成功');
    console.log('📊 返回数据:', {
      success: result.success,
      total: result.total,
      dataLength: result.data?.length || 0
    });
    
    if (result.data?.length > 0) {
      console.log('📝 第一个产品示例:', result.data[0]);
    }
    
    // 测试3：测试分类筛选
    console.log('\n📋 测试3：测试分类筛选功能');
    const categoryResult = await cloudProductData.getProducts({
      categoryId: 'cat_wood_001'
    });
    
    console.log('✅ 分类筛选调用成功');
    console.log('📊 筛选结果:', {
      success: categoryResult.success,
      total: categoryResult.total,
      dataLength: categoryResult.data?.length || 0
    });
    
    // 测试4：测试热门产品筛选
    console.log('\n📋 测试4：测试热门产品筛选');
    const hotResult = await cloudProductData.getProducts({
      isHot: true
    });
    
    console.log('✅ 热门产品筛选调用成功');
    console.log('📊 筛选结果:', {
      success: hotResult.success,
      total: hotResult.total,
      dataLength: hotResult.data?.length || 0
    });
    
    // 测试5：测试productData模块
    console.log('\n📋 测试5：测试 productData 模块');
    const productData = require('./utils/productData.js');
    
    const hotProducts = await productData.getHotProducts({ limit: 4 });
    console.log('🔥 热门产品:', hotProducts.length);
    
    const categories = await productData.getCategories();
    console.log('📂 分类列表:', categories.length);
    
    if (categories.length > 0) {
      const categoryProducts = await productData.getProductsByCategory(categories[0]._id, { limit: 5 });
      console.log('📦 分类产品:', categoryProducts.products.length, '/', categoryProducts.total);
    }
    
    console.log('\n🎉 === 所有测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testProductFix();













