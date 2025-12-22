// 简化测试脚本 - 测试修改后的 productManager 云函数
// 在微信开发者工具控制台中运行

(async function simpleTest() {
  console.log('🧪 === 简化测试脚本 ===');
  console.log('⚠️  请先确保已重新部署 productManager 云函数！');
  
  try {
    // 测试1: 数据库连接
    console.log('\n📋 测试1: 数据库连接');
    
    const connectionTest = await wx.cloud.callFunction({
      name: 'productManager',
      data: { action: 'testConnection' }
    });
    
    console.log('📊 连接结果:', connectionTest.result);
    
    if (!connectionTest.result?.success) {
      console.error('❌ 数据库连接失败');
      return;
    }
    
    console.log('✅ 数据库连接正常，产品总数:', connectionTest.result.total);
    
    // 测试2: limit=-1 获取所有产品
    console.log('\n📋 测试2: limit=-1 获取所有产品');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    console.log('📊 limit=-1 结果:', {
      success: test1.result?.success,
      error: test1.result?.error,
      total: test1.result?.total,
      dataCount: test1.result?.data?.length || 0,
      queryCondition: test1.result?.debug?.queryCondition,
      fieldIssues: test1.result?.debug?.fieldIssues
    });
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      console.log('✅ 基础查询成功！');
      
      // 检查字段映射
      const sample = test1.result.data[0];
      console.log('🔹 样本数据字段:', {
        id: sample.id ? '✅' : '❌',
        name: sample.name ? '✅' : '❌',
        price: (sample.price !== undefined) ? '✅' : '❌',
        image: sample.image ? '✅' : '❌',
        categoryId: sample.categoryId ? '✅' : '❌'
      });
      
      console.log('🔹 样本数据:', sample);
      
    } else {
      console.error('❌ 基础查询失败或返回空数据');
    }
    
    // 测试3: 分类筛选
    console.log('\n📋 测试3: 分类筛选');
    
    const test2 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { 
          limit: -1, 
          categoryId: 'cat_wood_001' 
        }
      }
    });
    
    console.log('📊 分类筛选结果:', {
      success: test2.result?.success,
      total: test2.result?.total,
      dataCount: test2.result?.data?.length || 0,
      queryCondition: test2.result?.debug?.queryCondition
    });
    
    // 测试4: 热门产品筛选
    console.log('\n📋 测试4: 热门产品筛选');
    
    const test3 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { 
          limit: -1, 
          isHot: true 
        }
      }
    });
    
    console.log('📊 热门产品结果:', {
      success: test3.result?.success,
      total: test3.result?.total,
      dataCount: test3.result?.data?.length || 0,
      queryCondition: test3.result?.debug?.queryCondition
    });
    
    // 测试5: 正常分页
    console.log('\n📋 测试5: 正常分页');
    
    const test4 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { 
          limit: 5, 
          page: 1 
        }
      }
    });
    
    console.log('📊 分页结果:', {
      success: test4.result?.success,
      total: test4.result?.total,
      dataCount: test4.result?.data?.length || 0
    });
    
    // 结果汇总
    console.log('\n🎯 === 测试汇总 ===');
    
    const tests = [
      { name: '数据库连接', success: connectionTest.result?.success },
      { name: 'limit=-1', success: test1.result?.success && test1.result?.data?.length > 0 },
      { name: '分类筛选', success: test2.result?.success },
      { name: '热门筛选', success: test3.result?.success },
      { name: '正常分页', success: test4.result?.success }
    ];
    
    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.success ? '成功' : '失败'}`);
    });
    
    const allSuccess = tests.every(test => test.success);
    console.log(`\n🏆 总体结果: ${allSuccess ? '✅ 全部成功' : '❌ 部分失败'}`);
    
    // 字段问题检查
    if (test1.result?.debug?.fieldIssues?.length > 0) {
      console.log('\n⚠️  发现字段问题:');
      console.log(test1.result.debug.fieldIssues);
    } else {
      console.log('\n✅ 字段检查通过');
    }
    
    // 前端使用建议
    if (allSuccess) {
      console.log('\n🎨 === 前端使用建议 ===');
      console.log('现在可以在前端这样调用:');
      console.log(`
// 获取所有产品
const allProducts = await wx.cloud.callFunction({
  name: 'productManager',
  data: { action: 'getProducts', data: { limit: -1 } }
});

// 获取特定分类产品
const categoryProducts = await wx.cloud.callFunction({
  name: 'productManager',
  data: { action: 'getProducts', data: { limit: -1, categoryId: 'cat_wood_001' } }
});

// 获取热门产品
const hotProducts = await wx.cloud.callFunction({
  name: 'productManager',
  data: { action: 'getProducts', data: { limit: -1, isHot: true } }
});
      `);
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  }
})();













