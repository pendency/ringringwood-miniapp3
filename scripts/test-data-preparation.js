// scripts/test-data-preparation.js
// 测试数据准备过程

const mockData = require('../utils/mock-data.js');

/**
 * 测试数据准备
 */
async function testDataPreparation() {
  try {
    console.log('=== 测试数据准备 ===');

    // 测试获取分类数据
    console.log('\n1. 测试获取分类数据...');
    const categoriesResult = await mockData.getCategoryList();
    const categories = categoriesResult.data || [];
    console.log(`获取到 ${categories.length} 个分类`);
    
    if (categories.length > 0) {
      console.log('第一个分类示例:', {
        _id: categories[0]._id,
        name: categories[0].name,
        order: categories[0].order
      });
    }

    // 测试获取产品数据
    console.log('\n2. 测试获取产品数据...');
    const productsResult = await mockData.getProductList({ limit: 10 });
    const products = productsResult.data || [];
    console.log(`获取到 ${products.length} 个产品`);
    
    if (products.length > 0) {
      console.log('第一个产品示例:', {
        _id: products[0]._id,
        name: products[0].name,
        categoryId: products[0].categoryId,
        status: products[0].status
      });
    }

    // 测试完整数据获取
    console.log('\n3. 测试完整数据获取...');
    const allProductsResult = await mockData.getProductList({ limit: 1000 });
    const allProducts = allProductsResult.data || [];
    console.log(`完整产品数据: ${allProducts.length} 个`);

    return {
      categories,
      products: allProducts,
      success: true
    };
  } catch (error) {
    console.error('数据准备测试失败:', error);
    return {
      categories: [],
      products: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * 在小程序中执行数据准备测试
 */
async function testDataPreparationInMiniProgram() {
  try {
    const result = await testDataPreparation();
    
    if (result.success) {
      console.log('\n=== 测试结果 ===');
      console.log(`分类数量: ${result.categories.length}`);
      console.log(`产品数量: ${result.products.length}`);
      
      // 显示一些样本数据
      if (result.categories.length > 0) {
        console.log('\n分类样本:');
        result.categories.slice(0, 3).forEach(cat => {
          console.log(`- ${cat.name} (${cat._id})`);
        });
      }
      
      if (result.products.length > 0) {
        console.log('\n产品样本:');
        result.products.slice(0, 3).forEach(prod => {
          console.log(`- ${prod.name} (${prod._id}) - 分类: ${prod.categoryId}`);
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('数据准备测试执行失败:', error);
    return null;
  }
}

module.exports = {
  testDataPreparation,
  testDataPreparationInMiniProgram
};






































