// 字段诊断测试脚本 - 帮助识别数据库中的实际字段名
// 在微信开发者工具控制台中运行

(async function fieldDiagnosisTest() {
  console.log('🔍 === 字段诊断测试 ===');
  console.log('⚠️  请先确保已重新部署 productManager 云函数！');
  
  try {
    // 测试1: 获取样本数据查看原始字段
    console.log('\n📋 测试1: 获取样本数据查看原始字段');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 3 }  // 只获取3条用于分析
      }
    });
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      console.log('✅ 获取样本数据成功');
      
      // 检查修复后的字段映射效果
      const sample = test1.result.data[0];
      console.log('🔹 修复后的样本数据:', sample);
      
      console.log('🔹 字段检查:');
      console.log('- name:', sample.name);
      console.log('- price:', sample.price, '(类型:', typeof sample.price, ')');
      console.log('- image:', sample.image ? '有图片' : '无图片');
      console.log('- categoryId:', sample.categoryId || '空');
      console.log('- categoryName:', sample.categoryName || '空');
      
    } else {
      console.error('❌ 获取样本数据失败');
      return;
    }
    
    // 测试2: 检查调试信息中的原始数据
    console.log('\n📋 测试2: 检查调试信息');
    console.log('请查看云函数控制台日志中的以下信息:');
    console.log('- 🔹 样本原始数据: (显示数据库中的原始字段)');
    console.log('- 🔹 样本数据字段: (显示所有可用字段名)');
    console.log('- 🔹 字段问题统计: (显示字段问题统计)');
    
    // 测试3: 检测不同的分类值
    console.log('\n📋 测试3: 检测现有分类值');
    
    if (test1.result?.data) {
      const categories = new Set();
      const categoryFields = new Set();
      
      test1.result.data.forEach(item => {
        if (item.categoryId) {
          categories.add(item.categoryId);
        }
        // 检查可能的分类字段名
        Object.keys(item).forEach(key => {
          if (key.toLowerCase().includes('categ') || 
              key.toLowerCase().includes('type') ||
              key.toLowerCase().includes('class')) {
            categoryFields.add(key);
          }
        });
      });
      
      console.log('🔹 发现的分类值:', Array.from(categories));
      console.log('🔹 可能的分类字段:', Array.from(categoryFields));
    }
    
    // 测试4: 使用发现的分类值进行测试
    console.log('\n📋 测试4: 使用实际分类值测试筛选');
    
    // 先获取所有数据看看有哪些分类
    const allData = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    if (allData.result?.success) {
      const allCategories = new Set();
      const hotProducts = [];
      
      allData.result.data.forEach(item => {
        if (item.categoryId) allCategories.add(item.categoryId);
        if (item.isHot) hotProducts.push(item.id);
      });
      
      console.log('🔹 所有分类:', Array.from(allCategories));
      console.log('🔹 热门产品:', hotProducts.length, '个');
      
      // 如果有分类，测试第一个分类
      if (allCategories.size > 0) {
        const firstCategory = Array.from(allCategories)[0];
        console.log('\n📋 测试分类筛选:', firstCategory);
        
        const categoryTest = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'getProducts',
            data: { limit: -1, categoryId: firstCategory }
          }
        });
        
        console.log('📊 分类筛选结果:', {
          success: categoryTest.result?.success,
          total: categoryTest.result?.total,
          dataCount: categoryTest.result?.data?.length || 0
        });
      }
    }
    
    // 测试5: 字段修复建议
    console.log('\n💡 === 字段修复建议 ===');
    
    if (test1.result?.debug?.fieldIssues?.length > 0) {
      console.log('发现的问题:', test1.result.debug.fieldIssues);
      
      console.log('\n建议的修复方案:');
      test1.result.debug.fieldIssues.forEach(issue => {
        if (issue.includes('price 为 0')) {
          console.log('💰 价格问题: 检查数据库中是否有 price、productPrice、salePrice 或 originalPrice 字段');
        }
        if (issue.includes('categoryId')) {
          console.log('📂 分类问题: 检查数据库中是否有 categoryId、category_id、typeId 或 type 字段');
        }
        if (issue.includes('image')) {
          console.log('🖼️ 图片问题: 检查数据库中是否有 imageUrl1、image、mainImage 或 imageUrl 字段');
        }
      });
    } else {
      console.log('✅ 所有字段都正常');
    }
    
    console.log('\n📝 === 使用建议 ===');
    console.log('1. 查看云函数控制台日志中的原始数据结构');
    console.log('2. 根据实际字段名调整云函数中的字段映射');
    console.log('3. 如果价格都是0，检查数据库中价格字段的实际名称');
    console.log('4. 如果分类筛选返回0，使用实际存在的分类ID进行测试');
    
  } catch (error) {
    console.error('❌ 诊断测试失败:', error);
  }
})();













