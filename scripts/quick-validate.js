// scripts/quick-validate.js
// 快速验证产品数据的脚本
// 作用：检查修复后的产品数据是否正确

/**
 * 快速验证产品数据
 */
function quickValidateProducts() {
  console.log('=== 开始快速验证产品数据 ===');
  
  try {
    // 加载mock数据
    const mockData = require('../utils/mock-data.js');
    
    if (!mockData || !Array.isArray(mockData.mockProducts)) {
      console.error('❌ 无法加载产品数据或数据格式错误');
      return false;
    }

    const products = mockData.mockProducts;
    console.log(`📊 找到 ${products.length} 个产品`);

    // 统计信息
    const stats = {
      total: products.length,
      byCategory: {},
      withImages: 0,
      withVideos: 0,
      withParams: 0,
      validImagePaths: 0,
      validVideoPaths: 0,
      issues: []
    };

    // 验证每个产品
    for (const product of products) {
      // 统计分类
      if (!stats.byCategory[product.categoryId]) {
        stats.byCategory[product.categoryId] = 0;
      }
      stats.byCategory[product.categoryId]++;

      // 检查图片
      if (product.imageUrls && product.imageUrls.length > 0) {
        stats.withImages++;
        
        // 检查图片路径格式
        for (const imageUrl of product.imageUrls) {
          if (imageUrl && imageUrl.startsWith('/images/products/') && imageUrl.endsWith('.jpeg')) {
            stats.validImagePaths++;
          } else {
            stats.issues.push(`产品 ${product._id} 图片路径格式错误: ${imageUrl}`);
          }
        }
      }

      // 检查视频
      if (product.features && Array.isArray(product.features)) {
        for (const feature of product.features) {
          if (feature.video) {
            stats.withVideos++;
            
            // 检查视频路径格式
            if (feature.video.startsWith('/images/products/') && feature.video.endsWith('.mp4')) {
              stats.validVideoPaths++;
            } else {
              stats.issues.push(`产品 ${product._id} 视频路径格式错误: ${feature.video}`);
            }
            break; // 只统计一次
          }
        }
      }

      // 检查参数
      if (product.params && product.params.length > 0) {
        stats.withParams++;
      }

      // 检查必填字段
      if (!product._id || !product.name || !product.categoryId) {
        stats.issues.push(`产品 ${product._id || '未知'} 缺少必填字段`);
      }
    }

    // 输出统计结果
    console.log('\n📈 统计结果:');
    console.log(`总产品数: ${stats.total}`);
    console.log('\n分类分布:');
    for (const [categoryId, count] of Object.entries(stats.byCategory)) {
      console.log(`  ${categoryId}: ${count} 个产品`);
    }
    
    console.log('\n内容统计:');
    console.log(`包含图片: ${stats.withImages} (${(stats.withImages/stats.total*100).toFixed(1)}%)`);
    console.log(`包含视频: ${stats.withVideos} (${(stats.withVideos/stats.total*100).toFixed(1)}%)`);
    console.log(`包含参数: ${stats.withParams} (${(stats.withParams/stats.total*100).toFixed(1)}%)`);
    
    console.log('\n路径验证:');
    console.log(`有效图片路径: ${stats.validImagePaths}`);
    console.log(`有效视频路径: ${stats.validVideoPaths}`);

    // 输出问题
    if (stats.issues.length > 0) {
      console.log('\n⚠️  发现的问题:');
      stats.issues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue}`);
      });
      
      if (stats.issues.length > 10) {
        console.log(`  ... 还有 ${stats.issues.length - 10} 个问题`);
      }
    }

    // 检查关键产品
    console.log('\n🔍 关键产品检查:');
    
    // 检查wood1产品
    const wood1 = products.find(p => p._id === 'wood1');
    if (wood1) {
      console.log(`✅ wood1产品存在: ${wood1.name}`);
      console.log(`   图片: ${wood1.imageUrls?.[0] || '无'}`);
      console.log(`   参数数量: ${wood1.params?.length || 0}`);
    } else {
      console.log('❌ wood1产品不存在');
    }

    // 检查custom1产品
    const custom1 = products.find(p => p._id === 'custom1');
    if (custom1) {
      console.log(`✅ custom1产品存在: ${custom1.name}`);
      console.log(`   图片: ${custom1.imageUrls?.[0] || '无'}`);
      const videoFeature = custom1.features?.find(f => f.video);
      console.log(`   视频: ${videoFeature?.video || '无'}`);
    } else {
      console.log('❌ custom1产品不存在');
    }

    // 检查design1产品
    const design1 = products.find(p => p._id === 'design1');
    if (design1) {
      console.log(`✅ design1产品存在: ${design1.name}`);
      console.log(`   图片: ${design1.imageUrls?.[0] || '无'}`);
      console.log(`   详情图数量: ${design1.images?.length || 0}`);
    } else {
      console.log('❌ design1产品不存在');
    }

    // 总结
    console.log('\n📋 验证总结:');
    if (stats.issues.length === 0) {
      console.log('✅ 所有产品数据验证通过！');
      return true;
    } else {
      console.log(`⚠️  发现 ${stats.issues.length} 个问题，需要进一步修复`);
      return false;
    }

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    return false;
  }
}

// 执行验证
if (require.main === module) {
  const success = quickValidateProducts();
  process.exit(success ? 0 : 1);
}

module.exports = { quickValidateProducts };
