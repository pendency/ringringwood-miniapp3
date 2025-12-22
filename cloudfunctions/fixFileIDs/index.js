// cloudfunctions/fixFileIDs/index.js
// 云端修复脚本 - 扫描并修复products集合中的文件ID错误

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('fixFileIDs 云函数开始执行', event);
  
  const { 
    dryRun = true, // 默认干跑模式，不实际修改数据
    limit = 100    // 每批处理数量
  } = event;

  try {
    const results = {
      total: 0,
      processed: 0,
      fixed: 0,
      errors: [],
      changes: [],
      dryRun: dryRun
    };

    console.log(`开始扫描products集合，模式: ${dryRun ? '干跑' : '实际修复'}`);

    // 获取所有产品
    const allProducts = await getAllProducts();
    results.total = allProducts.length;
    
    console.log(`获取到 ${allProducts.length} 个产品，开始检查...`);

    // 分批处理
    for (let i = 0; i < allProducts.length; i += limit) {
      const batch = allProducts.slice(i, i + limit);
      const batchNumber = Math.floor(i / limit) + 1;
      
      console.log(`处理第 ${batchNumber} 批，产品数: ${batch.length}`);

      for (const product of batch) {
        try {
          const fixes = analyzeProduct(product);
          results.processed++;
          
          if (fixes.length > 0) {
            results.fixed++;
            
            // 记录修改内容
            const changeRecord = {
              productId: product._id,
              productName: product.name || product.title,
              fixes: fixes
            };
            results.changes.push(changeRecord);
            
            console.log(`产品 ${product._id} 需要修复 ${fixes.length} 个字段`);
            
            // 如果不是干跑模式，执行实际修复
            if (!dryRun) {
              await applyFixes(product._id, fixes);
              console.log(`产品 ${product._id} 修复完成`);
            }
          }
          
        } catch (error) {
          console.error(`处理产品 ${product._id} 时出错:`, error);
          results.errors.push({
            productId: product._id,
            error: error.message
          });
        }
      }
    }

    // 生成报告
    const report = generateReport(results);
    console.log('修复完成，生成报告:', report);

    return {
      success: true,
      ...results,
      report: report
    };

  } catch (error) {
    console.error('fixFileIDs 执行失败:', error);
    return {
      success: false,
      error: error.message,
      errCode: error.errCode || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * 获取所有产品
 */
async function getAllProducts() {
  const allProducts = [];
  const batchSize = 100;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await db.collection('products')
      .skip(skip)
      .limit(batchSize)
      .get();

    allProducts.push(...batch.data);
    
    if (batch.data.length < batchSize) {
      hasMore = false;
    } else {
      skip += batchSize;
    }
  }

  return allProducts;
}

/**
 * 分析产品，找出需要修复的字段
 */
function analyzeProduct(product) {
  const fixes = [];

  // 检查图片URL字段
  for (let i = 1; i <= 10; i++) {
    const field = `imageUrl${i}`;
    const value = product[field];
    
    if (value && typeof value === 'string') {
      const cleanedValue = cleanFileId(value);
      if (cleanedValue !== value) {
        fixes.push({
          field: field,
          oldValue: value,
          newValue: cleanedValue,
          issue: getIssueDescription(value)
        });
      }
    }
  }

  // 检查视频URL字段
  if (product.videoUrl && typeof product.videoUrl === 'string') {
    const cleanedValue = cleanFileId(product.videoUrl);
    if (cleanedValue !== product.videoUrl) {
      fixes.push({
        field: 'videoUrl',
        oldValue: product.videoUrl,
        newValue: cleanedValue,
        issue: getIssueDescription(product.videoUrl)
      });
    }
  }

  // 检查布尔值字段
  const booleanFields = ['isHot', 'isNew', 'isVisible'];
  booleanFields.forEach(field => {
    const value = product[field];
    if (typeof value === 'string') {
      const normalizedValue = normalizeBoolean(value);
      fixes.push({
        field: field,
        oldValue: value,
        newValue: normalizedValue,
        issue: `字符串布尔值需要转换为真正的布尔值`
      });
    }
  });

  // 检查数字字段
  if (product.sortPriority && typeof product.sortPriority === 'string') {
    const numValue = parseInt(product.sortPriority, 10);
    if (!isNaN(numValue)) {
      fixes.push({
        field: 'sortPriority',
        oldValue: product.sortPriority,
        newValue: numValue,
        issue: '字符串数字需要转换为数字类型'
      });
    }
  }

  return fixes;
}

/**
 * 清理文件ID
 */
function cleanFileId(fileId) {
  if (!fileId || typeof fileId !== 'string') return fileId;

  let cleaned = fileId.trim();

  // 去除多余的cloud://前缀
  if (cleaned.indexOf('cloud://') !== cleaned.lastIndexOf('cloud://')) {
    const parts = cleaned.split('cloud://').filter(part => part.length > 0);
    if (parts.length > 0) {
      cleaned = 'cloud://' + parts[parts.length - 1];
    }
  }

  // 去除空格和特殊字符
  cleaned = cleaned.replace(/\s+/g, '');

  // 修正环境ID格式
  if (cleaned.startsWith('cloud://')) {
    const correctEnvId = 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
    const wrongPatterns = [
      /cloud:\/\/636c-cloud1-7gm53wok768268c9-1369425968/g,
      /cloud:\/\/636c-cloud1-7gm53wok768268c9\.636c-636c-cloud1-7gm53wok768268c9-1369425968-1330048780/g,
      /cloud:\/\/636c-cloud1-7gm53wok768268c9/g,
      /cloud:\/\/cloud1-7gm53wok768268c9(?!\.636c-cloud1-7gm53wok768268c9-1369425968)/g
    ];

    wrongPatterns.forEach(pattern => {
      if (pattern.test(cleaned)) {
        const pathMatch = cleaned.match(/cloud:\/\/[^\/]+(.+)$/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          cleaned = `cloud://${correctEnvId}${filePath}`;
        }
      }
    });
  }

  return cleaned;
}

/**
 * 获取问题描述
 */
function getIssueDescription(value) {
  if (value.indexOf('cloud://') !== value.lastIndexOf('cloud://')) {
    return '存在多个cloud://前缀';
  }
  if (/\s/.test(value)) {
    return '包含空格字符';
  }
  if (value.includes('636c-cloud1-7gm53wok768268c9-1369425968')) {
    return '使用了错误的环境ID格式';
  }
  if (value.includes('636c-cloud1-7gm53wok768268c9') && !value.includes('636c-cloud1-7gm53wok768268c9-1369425968')) {
    return '环境ID不完整';
  }
  return '文件ID格式需要修正';
}

/**
 * 布尔值规范化
 */
function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const str = value.toLowerCase().trim();
    return str === 'true' || str === '是' || str === '1' || str === 'yes';
  }
  return false;
}

/**
 * 应用修复
 */
async function applyFixes(productId, fixes) {
  const updateData = {};
  
  fixes.forEach(fix => {
    updateData[fix.field] = fix.newValue;
  });

  await db.collection('products').doc(productId).update({
    data: updateData
  });
}

/**
 * 生成报告
 */
function generateReport(results) {
  const report = {
    summary: {
      total: results.total,
      processed: results.processed,
      needsFix: results.fixed,
      errors: results.errors.length,
      mode: results.dryRun ? '干跑模式' : '实际修复'
    },
    statistics: {
      imageUrlIssues: 0,
      videoUrlIssues: 0,
      booleanIssues: 0,
      numberIssues: 0
    },
    topIssues: {}
  };

  // 统计问题类型
  results.changes.forEach(change => {
    change.fixes.forEach(fix => {
      if (fix.field.startsWith('imageUrl')) {
        report.statistics.imageUrlIssues++;
      } else if (fix.field === 'videoUrl') {
        report.statistics.videoUrlIssues++;
      } else if (['isHot', 'isNew', 'isVisible'].includes(fix.field)) {
        report.statistics.booleanIssues++;
      } else if (fix.field === 'sortPriority') {
        report.statistics.numberIssues++;
      }

      // 统计问题类型
      const issue = fix.issue;
      report.topIssues[issue] = (report.topIssues[issue] || 0) + 1;
    });
  });

  return report;
}
