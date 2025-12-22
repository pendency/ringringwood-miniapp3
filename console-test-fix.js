// console-test-fix.js - 适合控制台的测试脚本
// 在小程序开发者工具控制台中运行

async function testProductFixConsole() {
  console.log('🧪 === 开始测试产品页修复结果（控制台版本） ===');
  
  try {
    // 测试1：详细调试云函数调用
    console.log('\n📋 测试1：详细调试 productManager 云函数');
    
    console.log('🔍 调用参数:', {
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          limit: -1
        }
      }
    });
    
    const cloudResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          limit: -1
        }
      }
    });
    
    console.log('📥 云函数原始返回:', cloudResult);
    
    if (cloudResult.result) {
      console.log('📊 云函数result内容:', {
        success: cloudResult.result.success,
        error: cloudResult.result.error,
        total: cloudResult.result.total,
        returned: cloudResult.result.returned,
        dataLength: cloudResult.result.data?.length || 0,
        hasData: !!cloudResult.result.data
      });
      
      if (cloudResult.result.error) {
        console.error('❌ 云函数错误:', cloudResult.result.error);
        console.error('📋 错误堆栈:', cloudResult.result.stack);
      }
      
      if (cloudResult.result.data && cloudResult.result.data.length > 0) {
        console.log('📝 第一个产品示例:', cloudResult.result.data[0]);
      } else {
        console.warn('⚠️ 没有产品数据返回');
      }
    } else {
      console.error('❌ 云函数没有返回result');
    }
    
    // 测试2：测试不同参数
    console.log('\n📋 测试2：测试无参数调用');
    const noParamsResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {}
      }
    });
    
    console.log('📊 无参数调用结果:', {
      success: noParamsResult.result?.success,
      error: noParamsResult.result?.error,
      total: noParamsResult.result?.total,
      dataLength: noParamsResult.result?.data?.length || 0
    });
    
    // 测试3：测试includeHidden参数
    console.log('\n📋 测试3：测试includeHidden=true');
    const includeHiddenResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          includeHidden: true,
          limit: -1
        }
      }
    });
    
    console.log('📊 includeHidden=true结果:', {
      success: includeHiddenResult.result?.success,
      error: includeHiddenResult.result?.error,
      total: includeHiddenResult.result?.total,
      dataLength: includeHiddenResult.result?.data?.length || 0
    });
    
    // 测试4：测试分页调用
    console.log('\n📋 测试4：测试分页调用');
    const paginatedResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          page: 1,
          limit: 10,
          includeHidden: true
        }
      }
    });
    
    console.log('📊 分页调用结果:', {
      success: paginatedResult.result?.success,
      error: paginatedResult.result?.error,
      total: paginatedResult.result?.total,
      returned: paginatedResult.result?.returned,
      dataLength: paginatedResult.result?.data?.length || 0
    });
    
    // 测试5：检查数据库连接
    console.log('\n📋 测试5：测试getCategories（检查数据库连接）');
    const categoriesResult = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getCategories',
        data: {}
      }
    });
    
    console.log('📊 分类查询结果:', {
      success: categoriesResult.result?.success,
      error: categoriesResult.result?.error,
      dataLength: categoriesResult.result?.data?.length || 0
    });
    
    if (categoriesResult.result?.data?.length > 0) {
      console.log('📂 第一个分类:', categoriesResult.result.data[0]);
    }
    
    console.log('\n🎉 === 控制台测试完成 ===');
    
    // 总结
    console.log('\n📋 === 测试总结 ===');
    const tests = [
      { name: '基本调用', success: cloudResult.result?.success },
      { name: '无参数调用', success: noParamsResult.result?.success },
      { name: 'includeHidden调用', success: includeHiddenResult.result?.success },
      { name: '分页调用', success: paginatedResult.result?.success },
      { name: '分类查询', success: categoriesResult.result?.success }
    ];
    
    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}: ${test.success ? '成功' : '失败'}`);
    });
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testProductFixConsole();













