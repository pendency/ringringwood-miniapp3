// test-productManager.js - 测试调用productManager云函数
// 在小程序开发者工具控制台中运行此代码

async function testProductManager() {
  console.log('=== 开始测试 productManager 云函数 ===');
  
  try {
    // 调用 productManager 云函数获取所有产品数据
    console.log('正在调用 productManager 云函数...');
    
    const result = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: {} // 参数为空，获取所有产品
      }
    });

    console.log('云函数调用成功！');
    console.log('原始返回结果:', result);
    
    if (result.result) {
      const cloudResult = result.result;
      
      if (cloudResult.success) {
        console.log('✅ productManager 调用成功');
        console.log('📊 数据统计:');
        console.log(`   - 产品总数: ${cloudResult.total || 0}`);
        console.log(`   - 返回产品数: ${cloudResult.data ? cloudResult.data.length : 0}`);
        console.log(`   - 当前页: ${cloudResult.page || 1}`);
        console.log(`   - 每页限制: ${cloudResult.limit || 100}`);
        
        if (cloudResult.data && cloudResult.data.length > 0) {
          console.log('\n📋 产品列表预览:');
          
          // 显示前3个产品的详细信息
          cloudResult.data.slice(0, 3).forEach((product, index) => {
            console.log(`\n${index + 1}. 产品信息:`);
            console.log(`   - ID: ${product._id || 'N/A'}`);
            console.log(`   - 名称: ${product.name || product.title || 'N/A'}`);
            console.log(`   - 分类: ${product.categoryName || product.categoryId || 'N/A'}`);
            console.log(`   - 价格: ${product.price || 'N/A'}`);
            console.log(`   - 是否热门: ${product.isHot}`);
            console.log(`   - 是否新品: ${product.isNew}`);
            console.log(`   - 是否可见: ${product.isVisible}`);
            
            // 统计图片数量
            let imageCount = 0;
            for (let i = 1; i <= 10; i++) {
              if (product[`imageUrl${i}`]) imageCount++;
            }
            console.log(`   - 图片数量: ${imageCount}`);
            console.log(`   - 视频URL: ${product.videoUrl ? '有' : '无'}`);
            
            // 显示第一张图片URL（如果有）
            if (product.imageUrl1) {
              console.log(`   - 第一张图片: ${product.imageUrl1}`);
            }
          });
          
          // 统计数据类型
          console.log('\n📈 数据类型统计:');
          const stats = analyzeProductData(cloudResult.data);
          console.log(`   - 包含图片的产品: ${stats.withImages}/${cloudResult.data.length}`);
          console.log(`   - 包含视频的产品: ${stats.withVideos}/${cloudResult.data.length}`);
          console.log(`   - 热门产品: ${stats.hotProducts}/${cloudResult.data.length}`);
          console.log(`   - 新品: ${stats.newProducts}/${cloudResult.data.length}`);
          console.log(`   - 可见产品: ${stats.visibleProducts}/${cloudResult.data.length}`);
          
          // 分类统计
          console.log('\n🏷️ 分类统计:');
          Object.entries(stats.categories).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count}个产品`);
          });
          
          // 检查数据格式问题
          console.log('\n⚠️ 数据格式检查:');
          const issues = checkDataFormat(cloudResult.data);
          if (issues.length > 0) {
            console.warn('发现以下数据格式问题:');
            issues.forEach(issue => console.warn(`   - ${issue}`));
          } else {
            console.log('   - 数据格式检查通过 ✅');
          }
          
        } else {
          console.warn('⚠️ 未获取到产品数据');
        }
        
      } else {
        console.error('❌ productManager 返回错误:');
        console.error('错误信息:', cloudResult.error || '未知错误');
        console.error('错误代码:', cloudResult.errCode || 'N/A');
      }
      
    } else {
      console.error('❌ 云函数返回结果为空');
    }
    
  } catch (error) {
    console.error('❌ 调用 productManager 云函数失败:');
    console.error('错误类型:', error.name || 'Error');
    console.error('错误信息:', error.message || error);
    console.error('错误代码:', error.errCode || 'N/A');
    
    if (error.errMsg) {
      console.error('详细错误:', error.errMsg);
      
      // 根据错误类型给出建议
      if (error.errMsg.includes('cloud function not found')) {
        console.error('💡 建议: 请确认 productManager 云函数已正确部署');
      } else if (error.errMsg.includes('permission denied')) {
        console.error('💡 建议: 请检查云函数权限配置');
      } else if (error.errMsg.includes('network')) {
        console.error('💡 建议: 请检查网络连接');
      }
    }
    
    console.error('完整错误对象:', error);
  }
  
  console.log('\n=== productManager 云函数测试完成 ===');
}

// 分析产品数据统计
function analyzeProductData(products) {
  const stats = {
    withImages: 0,
    withVideos: 0,
    hotProducts: 0,
    newProducts: 0,
    visibleProducts: 0,
    categories: {}
  };
  
  products.forEach(product => {
    // 统计图片
    let hasImages = false;
    for (let i = 1; i <= 10; i++) {
      if (product[`imageUrl${i}`]) {
        hasImages = true;
        break;
      }
    }
    if (hasImages) stats.withImages++;
    
    // 统计视频
    if (product.videoUrl) stats.withVideos++;
    
    // 统计热门产品
    if (product.isHot === true || product.isHot === 'true' || product.isHot === '是') {
      stats.hotProducts++;
    }
    
    // 统计新品
    if (product.isNew === true || product.isNew === 'true' || product.isNew === '是') {
      stats.newProducts++;
    }
    
    // 统计可见产品
    if (product.isVisible !== false && product.isVisible !== 'false' && product.isVisible !== '否') {
      stats.visibleProducts++;
    }
    
    // 统计分类
    const category = product.categoryName || product.categoryId || '未分类';
    stats.categories[category] = (stats.categories[category] || 0) + 1;
  });
  
  return stats;
}

// 检查数据格式问题
function checkDataFormat(products) {
  const issues = [];
  let booleanStringCount = 0;
  let numberStringCount = 0;
  let duplicateCloudPrefixCount = 0;
  
  products.forEach((product, index) => {
    // 检查布尔值字符串
    ['isHot', 'isNew', 'isVisible'].forEach(field => {
      if (typeof product[field] === 'string') {
        booleanStringCount++;
      }
    });
    
    // 检查数字字符串
    if (typeof product.sortPriority === 'string') {
      numberStringCount++;
    }
    
    // 检查重复的cloud://前缀
    for (let i = 1; i <= 10; i++) {
      const imageUrl = product[`imageUrl${i}`];
      if (imageUrl && typeof imageUrl === 'string') {
        if (imageUrl.indexOf('cloud://') !== imageUrl.lastIndexOf('cloud://')) {
          duplicateCloudPrefixCount++;
          break;
        }
      }
    }
    
    if (product.videoUrl && typeof product.videoUrl === 'string') {
      if (product.videoUrl.indexOf('cloud://') !== product.videoUrl.lastIndexOf('cloud://')) {
        duplicateCloudPrefixCount++;
      }
    }
  });
  
  if (booleanStringCount > 0) {
    issues.push(`${booleanStringCount} 个布尔值字段为字符串类型，需要转换`);
  }
  
  if (numberStringCount > 0) {
    issues.push(`${numberStringCount} 个数字字段为字符串类型，需要转换`);
  }
  
  if (duplicateCloudPrefixCount > 0) {
    issues.push(`${duplicateCloudPrefixCount} 个文件ID包含重复的cloud://前缀`);
  }
  
  return issues;
}

// 如果在小程序环境中，立即执行测试
if (typeof wx !== 'undefined') {
  testProductManager();
} else {
  console.log('请在小程序开发者工具控制台中运行: testProductManager()');
}

// 导出函数供手动调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testProductManager;
}
