// Image 字段检查测试脚本 - 详细检查产品图片字段
// 在微信开发者工具控制台中运行

(async function imageFieldTest() {
  console.log('🖼️ === Image 字段检查测试 ===');
  console.log('⚠️  请先确保已重新部署 productManager 云函数！');
  
  try {
    // 测试1: 获取少量产品检查 image 字段
    console.log('\n📋 测试1: 检查产品 image 字段');
    
    const test1 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: 5 }
      }
    });
    
    if (test1.result?.success && test1.result?.data?.length > 0) {
      console.log('✅ 获取产品数据成功');
      
      // 检查每个产品的 image 字段
      test1.result.data.forEach((product, index) => {
        console.log(`\n🔹 产品 ${index + 1} (${product.name}) 图片信息:`);
        console.log('- ID:', product.id);
        console.log('- image 字段存在:', 'image' in product);
        console.log('- image 值:', product.image);
        console.log('- image 类型:', typeof product.image);
        console.log('- image 长度:', product.image ? product.image.length : 0);
        
        if (product.image) {
          console.log('- 是 fileID:', product.image.startsWith('cloud://'));
          console.log('- 是 HTTPS URL:', product.image.startsWith('https://'));
          console.log('- 图片URL预览:', product.image.substring(0, 100) + (product.image.length > 100 ? '...' : ''));
        } else {
          console.log('⚠️  - 图片字段为空');
        }
      });
      
      // 统计图片字段情况
      const imageStats = {
        total: test1.result.data.length,
        hasImage: 0,
        fileIDs: 0,
        httpsUrls: 0,
        emptyImages: 0
      };
      
      test1.result.data.forEach(product => {
        if (product.image) {
          imageStats.hasImage++;
          if (product.image.startsWith('cloud://')) {
            imageStats.fileIDs++;
          } else if (product.image.startsWith('https://')) {
            imageStats.httpsUrls++;
          }
        } else {
          imageStats.emptyImages++;
        }
      });
      
      console.log('\n📊 图片字段统计:', imageStats);
      
    } else {
      console.error('❌ 获取产品数据失败');
      return;
    }
    
    // 测试2: 检查更多产品的图片字段
    console.log('\n📋 测试2: 检查所有产品的图片字段分布');
    
    const test2 = await wx.cloud.callFunction({
      name: 'productManager',
      data: {
        action: 'getProducts',
        data: { limit: -1 }
      }
    });
    
    if (test2.result?.success) {
      console.log('✅ 获取所有产品数据成功');
      
      const allImageStats = {
        total: test2.result.data.length,
        hasImage: 0,
        fileIDs: 0,
        httpsUrls: 0,
        emptyImages: 0,
        uniqueImagePrefixes: new Set()
      };
      
      test2.result.data.forEach(product => {
        if (product.image) {
          allImageStats.hasImage++;
          if (product.image.startsWith('cloud://')) {
            allImageStats.fileIDs++;
            // 提取 fileID 的前缀部分
            const prefix = product.image.split('/').slice(0, 3).join('/');
            allImageStats.uniqueImagePrefixes.add(prefix);
          } else if (product.image.startsWith('https://')) {
            allImageStats.httpsUrls++;
          }
        } else {
          allImageStats.emptyImages++;
        }
      });
      
      console.log('📊 所有产品图片统计:', {
        ...allImageStats,
        uniqueImagePrefixes: Array.from(allImageStats.uniqueImagePrefixes)
      });
      
      // 显示图片完整性报告
      const completeness = (allImageStats.hasImage / allImageStats.total * 100).toFixed(1);
      console.log(`\n📈 图片完整性: ${completeness}% (${allImageStats.hasImage}/${allImageStats.total})`);
      
      if (allImageStats.emptyImages > 0) {
        console.log(`⚠️  发现 ${allImageStats.emptyImages} 个产品缺少图片`);
        
        // 显示缺少图片的产品
        const productsWithoutImages = test2.result.data
          .filter(product => !product.image)
          .slice(0, 5); // 只显示前5个
          
        console.log('🔍 缺少图片的产品示例:');
        productsWithoutImages.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} (ID: ${product.id})`);
        });
      }
      
    } else {
      console.error('❌ 获取所有产品数据失败');
    }
    
    // 测试3: 检查云函数控制台日志
    console.log('\n📋 测试3: 云函数详细日志检查');
    console.log('🔍 请查看云函数控制台日志中的以下信息:');
    console.log('- 🔹 === 返回数据结构检查 ===');
    console.log('- 🔹 产品 X 完整数据: (查看完整产品对象)');
    console.log('- 🔹 产品 X image 字段详情: (查看图片字段详细信息)');
    console.log('- 🔹 产品 X 原始图片字段: (查看数据库原始字段)');
    console.log('- 🔹 所有产品 image 字段统计: (查看整体统计)');
    console.log('- 🔹 原始数据库记录的图片相关字段: (如果有丢失)');
    
    // 测试4: 图片URL有效性检查（仅检查前几个）
    console.log('\n📋 测试4: 图片URL有效性检查');
    
    if (test1.result?.data) {
      const productsWithImages = test1.result.data.filter(p => p.image);
      
      if (productsWithImages.length > 0) {
        console.log(`发现 ${productsWithImages.length} 个有图片的产品`);
        
        // 检查前3个图片的格式
        const checkCount = Math.min(3, productsWithImages.length);
        for (let i = 0; i < checkCount; i++) {
          const product = productsWithImages[i];
          console.log(`\n🔍 图片 ${i + 1} 格式检查:`);
          console.log('- 产品:', product.name);
          console.log('- 图片URL:', product.image);
          
          if (product.image.startsWith('cloud://')) {
            console.log('- 类型: 云存储 fileID ✅');
            console.log('- 格式: 符合微信云存储规范 ✅');
          } else if (product.image.startsWith('https://')) {
            console.log('- 类型: HTTPS URL ✅');
            console.log('- 格式: 可直接访问的URL ✅');
          } else {
            console.log('- 类型: 未知格式 ⚠️');
            console.log('- 建议: 检查图片URL格式是否正确');
          }
        }
      } else {
        console.log('⚠️  当前样本中没有找到有图片的产品');
      }
    }
    
    // 总结报告
    console.log('\n🏆 === Image 字段检查总结 ===');
    
    const summary = {
      basicCheck: test1.result?.success && test1.result?.data?.length > 0,
      allProductsCheck: test2.result?.success,
      hasImageField: test1.result?.data?.every(p => 'image' in p),
      imageCompleteness: test2.result ? (test2.result.data.filter(p => p.image).length / test2.result.data.length) : 0
    };
    
    console.log('📊 检查结果:');
    console.log(`${summary.basicCheck ? '✅' : '❌'} 基础数据获取: ${summary.basicCheck ? '正常' : '失败'}`);
    console.log(`${summary.allProductsCheck ? '✅' : '❌'} 全量数据获取: ${summary.allProductsCheck ? '正常' : '失败'}`);
    console.log(`${summary.hasImageField ? '✅' : '❌'} image 字段存在: ${summary.hasImageField ? '所有产品都有 image 字段' : '部分产品缺少 image 字段'}`);
    console.log(`${summary.imageCompleteness > 0.8 ? '✅' : '⚠️'} 图片完整性: ${(summary.imageCompleteness * 100).toFixed(1)}%`);
    
    if (summary.imageCompleteness < 1) {
      console.log('\n💡 问题解决建议:');
      console.log('1. 查看云函数控制台日志中的详细检查信息');
      console.log('2. 确认数据库中图片字段的实际名称');
      console.log('3. 检查字段映射逻辑是否正确');
      console.log('4. 验证图片URL格式是否符合要求');
    } else {
      console.log('\n🎉 所有产品的 image 字段都正常！');
    }
    
  } catch (error) {
    console.error('❌ Image 字段检查测试失败:', error);
  }
})();













