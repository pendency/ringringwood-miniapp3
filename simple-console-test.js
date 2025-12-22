// 简化的控制台测试 - 复制以下代码到控制台（去掉注释）

(async function() {
  console.log('🧪 开始测试产品页修复');
  
  try {
    console.log('📋 测试1: 调用productManager云函数');
    
    const result1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    console.log('📥 云函数返回:', result1);
    console.log('📊 结果分析:', {
      success: result1.result?.success,
      error: result1.result?.error,
      total: result1.result?.total,
      dataCount: result1.result?.data?.length || 0
    });
    
    if (result1.result?.error) {
      console.error('❌ 错误详情:', result1.result.error);
      console.error('📋 错误堆栈:', result1.result.stack);
    }
    
    console.log('📋 测试2: 测试includeHidden=true');
    
    const result2 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { includeHidden: true, limit: -1 }
      }
    });
    
    console.log('📊 includeHidden结果:', {
      success: result2.result?.success,
      error: result2.result?.error,
      total: result2.result?.total,
      dataCount: result2.result?.data?.length || 0
    });
    
    console.log('📋 测试3: 测试分类查询');
    
    const result3 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getCategories',
        data: {}
      }
    });
    
    console.log('📊 分类查询结果:', {
      success: result3.result?.success,
      error: result3.result?.error,
      dataCount: result3.result?.data?.length || 0
    });
    
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
})();













