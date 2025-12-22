// diagnose-productManager.js - 诊断 productManager 云函数和数据库问题
// 在小程序开发者工具控制台中运行此代码

async function diagnoseProductManager() {
  console.log('=== 开始诊断 productManager 云函数和数据库 ===');
  
  // 1. 检查数据库连接和权限
  console.log('\n1. 检查数据库连接和权限...');
  try {
    const db = wx.cloud.database();
    const collection = db.collection('products');
    
    // 尝试直接查询数据库（不通过云函数）
    console.log('正在直接查询 products 集合...');
    
    // 先查询总数
    const countResult = await collection.count();
    console.log(`✅ 数据库连接成功，products 集合总数: ${countResult.total}`);
    
    if (countResult.total === 0) {
      console.warn('⚠️ products 集合为空，没有任何数据');
      return;
    }
    
    // 查询前几条记录看数据结构
    console.log('\n查询前5条记录的数据结构...');
    const sampleResult = await collection.limit(5).get();
    console.log(`获取到 ${sampleResult.data.length} 条样本数据`);
    
    if (sampleResult.data.length > 0) {
      console.log('\n📋 样本数据结构分析:');
      sampleResult.data.forEach((item, index) => {
        console.log(`\n样本 ${index + 1}:`);
        console.log(`  - _id: ${item._id}`);
        console.log(`  - name/title: ${item.name || item.title || 'N/A'}`);
        console.log(`  - status: ${item.status} (类型: ${typeof item.status})`);
        console.log(`  - categoryId: ${item.categoryId || 'N/A'}`);
        console.log(`  - categoryName: ${item.categoryName || 'N/A'}`);
        console.log(`  - isHot: ${item.isHot} (类型: ${typeof item.isHot})`);
        console.log(`  - isNew: ${item.isNew} (类型: ${typeof item.isNew})`);
        console.log(`  - isVisible: ${item.isVisible} (类型: ${typeof item.isVisible})`);
        console.log(`  - createTime: ${item.createTime || 'N/A'}`);
        
        // 显示所有字段
        const allFields = Object.keys(item);
        console.log(`  - 所有字段 (${allFields.length}个): ${allFields.join(', ')}`);
      });
      
      // 分析 status 字段的值分布
      console.log('\n📊 status 字段值分布:');
      const statusStats = {};
      const allData = await collection.get();
      allData.data.forEach(item => {
        const status = item.status;
        const statusKey = `${status} (${typeof status})`;
        statusStats[statusKey] = (statusStats[statusKey] || 0) + 1;
      });
      
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}条`);
      });
      
    }
    
  } catch (error) {
    console.error('❌ 直接数据库查询失败:', error);
    console.error('错误详情:', error.errMsg || error.message);
    
    if (error.errMsg && error.errMsg.includes('permission denied')) {
      console.error('💡 权限问题：请检查数据库安全规则');
    }
  }
  
  // 2. 测试云函数的查询条件
  console.log('\n\n2. 测试云函数查询条件...');
  
  // 测试不同的查询条件
  const testCases = [
    { name: '无条件查询', params: {} },
    { name: '查询status=1', params: { status: 1 } },
    { name: '查询status不存在', params: { statusNotExist: true } },
    { name: '查询所有可见产品', params: { isVisible: true } },
    { name: '查询热门产品', params: { isHot: true } },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    try {
      const result = await wx.cloud.callFunction({
        name: 'productManager',
        data: {
          action: 'getProducts',
          data: testCase.params
        }
      });
      
      if (result.result && result.result.success) {
        console.log(`  ✅ 成功，返回 ${result.result.data.length} 条数据`);
        if (result.result.data.length > 0) {
          const first = result.result.data[0];
          console.log(`  首条数据: ${first.name || first.title} (status: ${first.status})`);
        }
      } else {
        console.log(`  ❌ 失败: ${result.result?.error}`);
      }
    } catch (error) {
      console.log(`  ❌ 异常: ${error.errMsg || error.message}`);
    }
  }
  
  // 3. 检查云函数日志输出
  console.log('\n\n3. 调用云函数查看详细日志...');
  try {
    console.log('调用 productManager.getProducts (无参数)...');
    const result = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {}
      }
    });
    
    console.log('云函数返回结果:', result);
    
    if (result.result) {
      if (result.result.success) {
        console.log('✅ 云函数调用成功');
        console.log(`数据数量: ${result.result.data ? result.result.data.length : 0}`);
        console.log(`总数: ${result.result.total}`);
      } else {
        console.log('❌ 云函数返回失败:', result.result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ 云函数调用异常:', error);
  }
  
  // 4. 提供修复建议
  console.log('\n\n4. 问题分析和修复建议:');
  console.log('根据以上测试结果，可能的问题包括:');
  console.log('1. 云函数查询条件 { status: 1 } 过滤掉了所有数据');
  console.log('2. 数据库中的 status 字段值可能不是数字 1');
  console.log('3. 数据库权限配置问题');
  console.log('4. 云函数代码逻辑问题');
  
  console.log('\n建议的修复方案:');
  console.log('1. 检查数据库中 status 字段的实际值');
  console.log('2. 修改云函数查询条件，移除或调整 status 过滤');
  console.log('3. 使用 isVisible 字段代替 status 字段');
  console.log('4. 检查数据库安全规则配置');
  
  console.log('\n=== 诊断完成 ===');
}

// 如果在小程序环境中，立即执行诊断
if (typeof wx !== 'undefined') {
  diagnoseProductManager();
} else {
  console.log('请在小程序开发者工具控制台中运行: diagnoseProductManager()');
}
