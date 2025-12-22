// 修复验证测试脚本 - 验证字段映射修复效果
// 在微信开发者工具控制台中运行

(async function fixVerificationTest() {
  console.log('🔧 === 修复验证测试 ===');
  console.log('⚠️  请先确保已重新部署 productManager 云函数！');
  
  try {
    // 测试1: 验证字段修复效果
    console.log('\n📋 测试1: 验证字段修复效果');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 5 }
      }
    });
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      const sample = test1.result.data[0];
      
      console.log('✅ 修复后的样本数据:');
      console.log('🔹 基本信息:', {
        id: sample.id,
        name: sample.name,
        price: sample.price,
        priceType: typeof sample.price
      });
      
      console.log('🔹 分类信息:', {
        categoryId: sample.categoryId || '空',
        categoryName: sample.categoryName || '空'
      });
      
      console.log('🔹 状态信息:', {
        isHot: sample.isHot,
        isVisible: sample.isVisible
      });
      
      // 检查修复效果
      const improvements = [];
      if (sample.categoryId) improvements.push('✅ categoryId 已修复');
      if (sample.price !== null && sample.price !== 0) improvements.push('✅ price 已修复');
      if (sample.image) improvements.push('✅ image 正常');
      if (sample.name && sample.name !== '未知产品') improvements.push('✅ name 正常');
      
      console.log('🎯 修复效果:', improvements);
      
    } else {
      console.error('❌ 获取数据失败');
      return;
    }
    
    // 测试2: 使用修复后的分类进行筛选
    console.log('\n📋 测试2: 使用修复后的分类进行筛选');
    
    if (test1.result?.data?.length > 0) {
      const sampleCategoryId = test1.result.data[0].categoryId;
      
      if (sampleCategoryId) {
        console.log('🔹 使用分类ID进行筛选:', sampleCategoryId);
        
        const categoryTest = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'getProducts',
            data: { 
              limit: -1, 
              categoryId: sampleCategoryId 
            }
          }
        });
        
        console.log('📊 分类筛选结果:', {
          success: categoryTest.result?.success,
          total: categoryTest.result?.total,
          dataCount: categoryTest.result?.data?.length || 0,
          queryCondition: categoryTest.result?.debug?.queryCondition
        });
        
        if (categoryTest.result?.success && categoryTest.result?.data?.length > 0) {
          console.log('✅ 分类筛选修复成功！');
        } else {
          console.log('⚠️  分类筛选仍有问题');
        }
        
      } else {
        console.log('⚠️  样本数据中仍然没有 categoryId');
      }
    }
    
    // 测试3: 热门产品筛选（由于所有产品都是热门，测试非热门）
    console.log('\n📋 测试3: 测试非热门产品筛选');
    
    const nonHotTest = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { 
          limit: -1, 
          isHot: false 
        }
      }
    });
    
    console.log('📊 非热门产品结果:', {
      success: nonHotTest.result?.success,
      total: nonHotTest.result?.total,
      dataCount: nonHotTest.result?.data?.length || 0,
      queryCondition: nonHotTest.result?.debug?.queryCondition
    });
    
    // 测试4: 获取所有分类
    console.log('\n📋 测试4: 获取所有可用分类');
    
    const allData = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    if (allData.result?.success) {
      const categoriesMap = new Map();
      
      allData.result.data.forEach(item => {
        if (item.categoryId && item.categoryName) {
          categoriesMap.set(item.categoryId, item.categoryName);
        }
      });
      
      const categories = Array.from(categoriesMap.entries());
      console.log('🔹 所有可用分类:', categories);
      
      // 测试第一个分类的筛选
      if (categories.length > 0) {
        const [firstCategoryId, firstCategoryName] = categories[0];
        console.log(`\n📋 测试分类 "${firstCategoryName}" (${firstCategoryId}) 的筛选:`);
        
        const specificCategoryTest = await wx.cloud.callFunction({
          name: 'productManager',
          data: {
            action: 'getProducts',
            data: { 
              limit: -1, 
              categoryId: firstCategoryId 
            }
          }
        });
        
        console.log('📊 具体分类筛选结果:', {
          categoryId: firstCategoryId,
          categoryName: firstCategoryName,
          success: specificCategoryTest.result?.success,
          total: specificCategoryTest.result?.total,
          dataCount: specificCategoryTest.result?.data?.length || 0
        });
      }
    }
    
    // 测试5: 字段问题统计
    console.log('\n📋 测试5: 字段问题统计');
    
    if (test1.result?.debug?.fieldIssues) {
      console.log('🔹 当前字段问题:', test1.result.debug.fieldIssues);
      
      if (test1.result.debug.fieldIssues.length === 0) {
        console.log('✅ 所有字段问题已修复！');
      } else {
        console.log('⚠️  仍有字段问题需要解决');
      }
    }
    
    // 总结
    console.log('\n🏆 === 修复总结 ===');
    
    const checks = [
      {
        name: '基础数据获取',
        success: test1.result?.success && test1.result?.data?.length > 0
      },
      {
        name: 'categoryId 修复',
        success: test1.result?.data?.[0]?.categoryId ? true : false
      },
      {
        name: '分类筛选功能',
        success: categories && categories.length > 0
      },
      {
        name: '字段完整性',
        success: test1.result?.debug?.fieldIssues?.length === 0
      }
    ];
    
    checks.forEach(check => {
      console.log(`${check.success ? '✅' : '❌'} ${check.name}: ${check.success ? '正常' : '需要进一步修复'}`);
    });
    
    const allFixed = checks.every(check => check.success);
    console.log(`\n🎯 总体状态: ${allFixed ? '✅ 修复完成' : '⚠️  部分功能仍需调整'}`);
    
    if (allFixed) {
      console.log('\n🎉 恭喜！productManager 云函数已完全修复，可以正常使用！');
      console.log('📝 前端可以正常调用分类筛选、热门筛选等功能了。');
    } else {
      console.log('\n💡 如果仍有问题，请查看云函数控制台日志中的原始数据结构。');
    }
    
  } catch (error) {
    console.error('❌ 修复验证测试失败:', error);
  }
})();













