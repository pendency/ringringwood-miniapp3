// scripts/fix-cloud-video-urls.js
/**
 * 修复数据库中的云存储视频URL格式
 * 将错误的环境ID格式修正为正确格式
 */

const correctEnvId = 'cloud1-7gm53wok768268c9';

// 所有可能的错误环境ID格式
const wrongEnvPatterns = [
  /cloud:\/\/636c-cloud1-7gm53wok768268c9-1369425968/g,
  /cloud:\/\/636c-cloud1-7gm53wok768268c9\.636c-636c-cloud1-7gm53wok768268c9-1369425968-1330048780/g,
  /cloud:\/\/636c-cloud1-7gm53wok768268c9/g
];

/**
 * 修正云文件ID格式
 * @param {string} fileID 原始云文件ID
 * @returns {string} 修正后的云文件ID
 */
function correctCloudFileID(fileID) {
  if (!fileID || !fileID.startsWith('cloud://')) {
    return fileID;
  }
  
  let correctedFileID = fileID;
  let wasModified = false;
  
  // 检查并修正各种错误格式
  wrongEnvPatterns.forEach(pattern => {
    if (pattern.test(correctedFileID)) {
      // 提取文件路径部分
      const pathMatch = correctedFileID.match(/cloud:\/\/[^\/]+(.+)$/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        correctedFileID = `cloud://${correctEnvId}${filePath}`;
        wasModified = true;
      }
    }
  });
  
  if (wasModified) {
    console.log('修正云文件ID:', fileID, '->', correctedFileID);
  }
  
  return correctedFileID;
}

/**
 * 修正产品数据中的云文件URL
 * @param {Object} product 产品数据
 * @returns {Object} 修正后的产品数据
 */
function fixProductCloudUrls(product) {
  const fixedProduct = { ...product };
  let hasChanges = false;
  
  // 修正主图URL
  if (fixedProduct.imageUrls && Array.isArray(fixedProduct.imageUrls)) {
    const originalUrls = [...fixedProduct.imageUrls];
    fixedProduct.imageUrls = fixedProduct.imageUrls.map(url => correctCloudFileID(url));
    if (JSON.stringify(originalUrls) !== JSON.stringify(fixedProduct.imageUrls)) {
      hasChanges = true;
    }
  }
  
  // 修正详情图URL
  if (fixedProduct.images && Array.isArray(fixedProduct.images)) {
    const originalImages = [...fixedProduct.images];
    fixedProduct.images = fixedProduct.images.map(url => correctCloudFileID(url));
    if (JSON.stringify(originalImages) !== JSON.stringify(fixedProduct.images)) {
      hasChanges = true;
    }
  }
  
  // 修正视频URL - features中的视频
  if (fixedProduct.features && Array.isArray(fixedProduct.features)) {
    const originalFeatures = JSON.stringify(fixedProduct.features);
    fixedProduct.features = fixedProduct.features.map(feature => {
      if (feature.type === 'video' && feature.video) {
        return {
          ...feature,
          video: correctCloudFileID(feature.video)
        };
      }
      return feature;
    });
    if (originalFeatures !== JSON.stringify(fixedProduct.features)) {
      hasChanges = true;
    }
  }
  
  // 修正视频URL - 直接的videos字段
  if (fixedProduct.videos && Array.isArray(fixedProduct.videos)) {
    const originalVideos = JSON.stringify(fixedProduct.videos);
    fixedProduct.videos = fixedProduct.videos.map(video => ({
      ...video,
      url: video.url ? correctCloudFileID(video.url) : video.url
    }));
    if (originalVideos !== JSON.stringify(fixedProduct.videos)) {
      hasChanges = true;
    }
  }
  
  return { product: fixedProduct, hasChanges };
}

/**
 * 批量修复产品数据
 * @param {Array} products 产品数组
 * @returns {Array} 修复结果
 */
function batchFixProducts(products) {
  const results = [];
  let totalFixed = 0;
  
  products.forEach((product, index) => {
    console.log(`处理产品 ${index + 1}/${products.length}: ${product.name || product._id}`);
    
    const { product: fixedProduct, hasChanges } = fixProductCloudUrls(product);
    
    if (hasChanges) {
      totalFixed++;
      results.push({
        _id: product._id,
        name: product.name,
        fixedProduct: fixedProduct,
        changes: true
      });
      console.log(`✅ 产品 ${product.name || product._id} 已修复`);
    } else {
      results.push({
        _id: product._id,
        name: product.name,
        changes: false
      });
      console.log(`ℹ️ 产品 ${product.name || product._id} 无需修复`);
    }
  });
  
  console.log(`\n修复完成: 共处理 ${products.length} 个产品，修复 ${totalFixed} 个产品`);
  
  return {
    results,
    totalProcessed: products.length,
    totalFixed: totalFixed
  };
}

// 导出函数供云函数使用
module.exports = {
  correctCloudFileID,
  fixProductCloudUrls,
  batchFixProducts
};

// 如果是直接运行脚本，执行测试
if (require.main === module) {
  // 测试数据
  const testProduct = {
    _id: 'test-product',
    name: '测试产品',
    imageUrls: [
      'cloud://636c-cloud1-7gm53wok768268c9-1369425968/products/images/test1.jpg',
      'cloud://636c-cloud1-7gm53wok768268c9.636c-636c-cloud1-7gm53wok768268c9-1369425968-1330048780/products/images/test2.jpg'
    ],
    features: [
      {
        type: 'video',
        title: '产品展示',
        video: 'cloud://636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom1-v1.mp4'
      }
    ]
  };
  
  console.log('测试云文件URL修复功能...\n');
  console.log('原始产品数据:', JSON.stringify(testProduct, null, 2));
  
  const { product: fixedProduct, hasChanges } = fixProductCloudUrls(testProduct);
  
  console.log('\n修复后产品数据:', JSON.stringify(fixedProduct, null, 2));
  console.log('\n是否有变更:', hasChanges);
}




































