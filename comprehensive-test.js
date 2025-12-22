// 全面排查 productManager 云函数测试脚本
// 在微信开发者工具控制台中运行

(async function comprehensiveTest() {
  console.log('🧪 === 全面排查 productManager 云函数测试 ===');
  console.log('⚠️  请先确保已重新部署 productManager 云函数！');
  
  try {
    // 🔹 1️⃣ 测试数据库连接
    console.log('\n📋 1️⃣ 测试数据库连接');
    
    const connectionTest = await wx.cloud.callFunction({
      name: 'productManager',
      data: { action: 'testConnection' }
    });
    
    console.log('📊 数据库连接结果:', connectionTest.result);
    
    if (!connectionTest.result?.success) {
      console.error('❌ 数据库连接失败，停止测试');
      return;
    }
    
    console.log('✅ 数据库连接正常，产品总数:', connectionTest.result.total);
    
    // 🔹 2️⃣ 测试 limit=-1 无筛选条件
    console.log('\n📋 2️⃣ 测试 limit=-1 无筛选条件');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    console.log('📊 limit=-1 无筛选结果:', {
      success: test1.result?.success,
      error: test1.result?.error,
      total: test1.result?.total,
      dataCount: test1.result?.data?.length || 0,
      hasDebugInfo: !!test1.result?.debug,
      fieldIssues: test1.result?.debug?.fieldIssues || []
    });
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      console.log('✅ 基础查询成功！样本数据字段:', Object.keys(test1.result.data[0]));
      
      // 检查前端必需字段
      const sample = test1.result.data[0];
      const requiredFields = ['id', 'name', 'price', 'image'];
      const fieldCheck = {};
      requiredFields.forEach(field => {
        fieldCheck[field] = sample[field] ? '✅' : '❌';
      });
      console.log('🔹 前端必需字段检查:', fieldCheck);
      
    } else {
      console.error('❌ 基础查询失败或返回空数据');
    }
    
    // 🔹 3️⃣ 测试 includeHidden=true
    console.log('\n📋 3️⃣ 测试 includeHidden=true');
    
    const test2 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1, includeHidden: true }
      }
    });
    
    console.log('📊 includeHidden=true 结果:', {
      success: test2.result?.success,
      error: test2.result?.error,
      total: test2.result?.total,
      dataCount: test2.result?.data?.length || 0
    });
    
    // 🔹 4️⃣ 测试分类筛选
    console.log('\n📋 4️⃣ 测试分类筛选');
    
    const test3 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1, categoryId: 'cat_wood_001' }
      }
    });
    
    console.log('📊 分类筛选结果:', {
      success: test3.result?.success,
      error: test3.result?.error,
      total: test3.result?.total,
      dataCount: test3.result?.data?.length || 0,
      queryCondition: test3.result?.debug?.queryCondition
    });
    
    // 🔹 5️⃣ 测试热门产品筛选
    console.log('\n📋 5️⃣ 测试热门产品筛选');
    
    const test4 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1, isHot: true }
      }
    });
    
    console.log('📊 热门产品结果:', {
      success: test4.result?.success,
      error: test4.result?.error,
      total: test4.result?.total,
      dataCount: test4.result?.data?.length || 0,
      queryCondition: test4.result?.debug?.queryCondition
    });
    
    // 🔹 6️⃣ 测试正常分页
    console.log('\n📋 6️⃣ 测试正常分页');
    
    const test5 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 5, page: 1 }
      }
    });
    
    console.log('📊 正常分页结果:', {
      success: test5.result?.success,
      error: test5.result?.error,
      total: test5.result?.total,
      returned: test5.result?.returned,
      dataCount: test5.result?.data?.length || 0
    });
    
    // 🔹 7️⃣ 测试布尔值处理
    console.log('\n📋 7️⃣ 测试布尔值处理');
    
    const test6 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 3, isHot: false, includeHidden: false }
      }
    });
    
    console.log('📊 布尔值处理结果:', {
      success: test6.result?.success,
      error: test6.result?.error,
      dataCount: test6.result?.data?.length || 0,
      queryCondition: test6.result?.debug?.queryCondition
    });
    
    // 🔹 8️⃣ 分析和总结
    console.log('\n🔍 === 测试结果分析 ===');
    
    const tests = [
      { name: 'testConnection', result: connectionTest.result },
      { name: 'limit=-1 无筛选', result: test1.result },
      { name: 'includeHidden=true', result: test2.result },
      { name: '分类筛选', result: test3.result },
      { name: '热门筛选', result: test4.result },
      { name: '正常分页', result: test5.result },
      { name: '布尔值处理', result: test6.result }
    ];
    
    tests.forEach((test, index) => {
      const status = test.result?.success ? '✅' : '❌';
      const dataCount = test.result?.data?.length || 0;
      console.log(`${status} ${test.name}: ${test.result?.success ? '成功' : '失败'} (数据: ${dataCount}条)`);
    });
    
    // 🔹 9️⃣ 字段完整性报告
    console.log('\n📋 === 字段完整性报告 ===');
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      const sampleData = test1.result.data[0];
      const frontendFields = {
        '基本信息': {
          'id': sampleData.id ? '✅' : '❌',
          'name': sampleData.name ? '✅' : '❌',
          'price': (sampleData.price !== undefined && sampleData.price !== null) ? '✅' : '❌',
          'image': sampleData.image ? '✅' : '❌'
        },
        '分类信息': {
          'categoryId': sampleData.categoryId ? '✅' : '❌',
          'categoryName': sampleData.categoryName ? '✅' : '❌'
        },
        '状态信息': {
          'isHot': (typeof sampleData.isHot === 'boolean') ? '✅' : '❌',
          'isVisible': (typeof sampleData.isVisible === 'boolean') ? '✅' : '❌'
        }
      };
      
      Object.entries(frontendFields).forEach(([category, fields]) => {
        console.log(`📊 ${category}:`, fields);
      });
      
      // 检查字段问题
      const fieldIssues = test1.result?.debug?.fieldIssues || [];
      if (fieldIssues.length > 0) {
        console.log('⚠️  发现字段问题:', fieldIssues);
      } else {
        console.log('✅ 所有必需字段检查通过');
      }
      
    } else {
      console.log('❌ 无法进行字段完整性检查，基础查询失败');
    }
    
    // 🔹 🔟 前端渲染建议
    console.log('\n🎨 === 前端渲染建议 ===');
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      const sampleData = test1.result.data[0];
      
      console.log('📝 前端渲染代码示例:');
      console.log(`
// 获取产品列表
const getProducts = async (options = {}) => {
  try {
    const result = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {
          limit: -1,  // 获取所有产品
          ...options   // 其他筛选条件
        }
      }
    });
    
    if (result.result?.success) {
      return result.result.data;
    } else {
      console.error('获取产品失败:', result.result?.error);
      return [];
    }
  } catch (error) {
    console.error('调用云函数失败:', error);
    return [];
  }
};

// 在页面中使用
const products = await getProducts({ categoryId: 'cat_wood_001' });
console.log('获取到产品:', products.length, '个');
      `);
      
      console.log('📋 数据字段说明:');
      console.log('- id: 产品唯一标识');
      console.log('- name: 产品名称');
      console.log('- price: 产品价格（数字类型）');
      console.log('- image: 产品图片URL');
      console.log('- categoryId: 分类ID');
      console.log('- categoryName: 分类名称');
      console.log('- isHot: 是否热门产品（布尔类型）');
      console.log('- isVisible: 是否可见（布尔类型）');
      
    }
    
    // 🔹 总结
    const allTestsSuccess = tests.every(test => test.result?.success);
    const hasData = test1.result?.success && test1.result?.data?.length > 0;
    
    console.log('\n🏆 === 最终总结 ===');
    if (allTestsSuccess && hasData) {
      console.log('✅ 所有测试通过！productManager 云函数工作正常');
      console.log('✅ 分类页和主页应该能够正常显示产品信息和图片');
      console.log('✅ limit=-1、分类筛选、热门筛选、分页功能均正常');
    } else if (hasData) {
      console.log('⚠️  基础功能正常，但部分高级功能可能有问题');
      console.log('💡 建议检查云函数控制台日志获取详细信息');
    } else {
      console.log('❌ 基础功能异常，需要进一步排查');
      console.log('💡 请检查数据库数据和云函数日志');
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  }
})();













