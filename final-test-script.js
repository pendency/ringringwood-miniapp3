// final-test-script.js - 最终验证脚本
// 复制到小程序开发者工具控制台运行

(async function() {
  console.log('🎯 === 最终修复验证测试 ===');
  
  try {
    // 测试1: limit=-1 获取所有产品
    console.log('📋 测试1: limit=-1 获取所有产品');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    console.log('📊 测试1结果:', {
      success: test1.result?.success,
      error: test1.result?.error,
      total: test1.result?.total,
      dataCount: test1.result?.data?.length || 0
    });
    
    if (test1.result?.success) {
      console.log('✅ 测试1成功！获取所有产品');
    } else {
      console.error('❌ 测试1失败:', test1.result?.error);
    }
    
    // 测试2: includeHidden=true
    console.log('\n📋 测试2: includeHidden=true，limit=-1');
    
    const test2 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { includeHidden: true, limit: -1 }
      }
    });
    
    console.log('📊 测试2结果:', {
      success: test2.result?.success,
      error: test2.result?.error,
      total: test2.result?.total,
      dataCount: test2.result?.data?.length || 0
    });
    
    if (test2.result?.success) {
      console.log('✅ 测试2成功！包含隐藏产品');
    } else {
      console.error('❌ 测试2失败:', test2.result?.error);
    }
    
    // 测试3: 分类筛选
    console.log('\n📋 测试3: 分类筛选');
    
    const test3 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { categoryId: 'cat_wood_001', limit: -1 }
      }
    });
    
    console.log('📊 测试3结果:', {
      success: test3.result?.success,
      error: test3.result?.error,
      total: test3.result?.total,
      dataCount: test3.result?.data?.length || 0
    });
    
    // 测试4: 热门产品筛选
    console.log('\n📋 测试4: 热门产品筛选');
    
    const test4 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { isHot: true, limit: -1 }
      }
    });
    
    console.log('📊 测试4结果:', {
      success: test4.result?.success,
      error: test4.result?.error,
      total: test4.result?.total,
      dataCount: test4.result?.data?.length || 0
    });
    
    // 汇总结果
    console.log('\n🎯 === 测试总结 ===');
    const tests = [
      { name: '获取所有产品', success: test1.result?.success },
      { name: '包含隐藏产品', success: test2.result?.success },
      { name: '分类筛选', success: test3.result?.success },
      { name: '热门筛选', success: test4.result?.success }
    ];
    
    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.success ? '成功' : '失败'}`);
    });
    
    const allPassed = tests.every(test => test.success);
    console.log(`\n🏆 总体结果: ${allPassed ? '全部通过！' : '部分失败'}`);
    
    if (allPassed) {
      console.log('🎉 产品页修复完成，可以正常使用了！');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
})();













