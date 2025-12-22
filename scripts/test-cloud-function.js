// scripts/test-cloud-function.js - 云函数测试脚本

/**
 * 在小程序中测试云函数
 * @param {Object} options - 测试选项
 * @returns {Promise<Object>} 测试结果
 */
async function testCloudFunctionInMiniProgram(options = {}) {
  console.log('开始测试云函数...');
  
  const {
    functionName = 'productManager',
    testCases = [],
    timeout = 10000 // 10秒超时
  } = options;

  const results = {
    functionName,
    total: testCases.length,
    passed: 0,
    failed: 0,
    errors: [],
    details: [],
    startTime: new Date(),
    endTime: null
  };

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`执行测试用例 ${i + 1}: ${testCase.name}`);
      
      const testResult = await runSingleTest(functionName, testCase, timeout);
      results.details.push(testResult);
      
      if (testResult.passed) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`${testCase.name}: ${testResult.error}`);
      }
    }

    results.endTime = new Date();
    console.log('云函数测试完成:', results);
    
    return results;
  } catch (error) {
    console.error('云函数测试失败:', error);
    results.endTime = new Date();
    results.errors.push(error.message);
    throw error;
  }
}

/**
 * 运行单个测试用例
 * @param {string} functionName - 云函数名称
 * @param {Object} testCase - 测试用例
 * @param {number} timeout - 超时时间
 * @returns {Promise<Object>} 测试结果
 */
async function runSingleTest(functionName, testCase, timeout) {
  const result = {
    name: testCase.name,
    passed: false,
    error: null,
    response: null,
    duration: 0,
    startTime: new Date()
  };

  try {
    const startTime = Date.now();
    
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('测试超时')), timeout);
    });
    
    // 调用云函数
    const callPromise = wx.cloud.callFunction({
      name: functionName,
      data: testCase.data
    });
    
    // 等待结果或超时
    const response = await Promise.race([callPromise, timeoutPromise]);
    
    result.duration = Date.now() - startTime;
    result.response = response.result;
    
    // 验证结果
    if (testCase.validator) {
      const validationResult = testCase.validator(response.result);
      if (validationResult === true) {
        result.passed = true;
      } else {
        result.error = validationResult || '验证失败';
      }
    } else {
      // 默认验证：检查是否有错误
      if (response.result && !response.result.error) {
        result.passed = true;
      } else {
        result.error = response.result?.error || '云函数返回错误';
      }
    }
    
  } catch (error) {
    result.error = error.message;
    result.duration = Date.now() - result.startTime.getTime();
  }
  
  result.endTime = new Date();
  return result;
}

/**
 * 创建基础测试用例
 * @returns {Array} 测试用例数组
 */
function createBasicTestCases() {
  return [
    {
      name: '获取产品列表',
      data: {
        action: 'getProducts',
        limit: 10
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    },
    {
      name: '获取分类列表',
      data: {
        action: 'getCategories'
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    },
    {
      name: '搜索产品',
      data: {
        action: 'searchProducts',
        keyword: '桌'
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    },
    {
      name: '获取热门产品',
      data: {
        action: 'getHotProducts',
        limit: 5
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    },
    {
      name: '获取新品',
      data: {
        action: 'getNewProducts',
        limit: 5
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    }
  ];
}

/**
 * 创建管理员功能测试用例
 * @returns {Array} 管理员测试用例数组
 */
function createAdminTestCases() {
  return [
    {
      name: '导出所有产品',
      data: {
        action: 'exportAll'
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (!Array.isArray(result.data)) return '返回数据不是数组';
        return true;
      }
    },
    {
      name: '批量导入测试（空数组）',
      data: {
        action: 'batchImport',
        products: []
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        // 空数组应该返回成功，但没有处理任何数据
        if (result.success !== 0 && result.failed !== 0) return '空数组处理结果不正确';
        return true;
      }
    },
    {
      name: '获取产品统计',
      data: {
        action: 'getStatistics'
      },
      validator: (result) => {
        if (!result) return '返回结果为空';
        if (!result.success) return result.error || '操作失败';
        if (typeof result.data !== 'object') return '统计数据格式不正确';
        return true;
      }
    }
  ];
}

/**
 * 性能测试
 * @param {string} functionName - 云函数名称
 * @param {Object} testData - 测试数据
 * @param {number} iterations - 迭代次数
 * @returns {Promise<Object>} 性能测试结果
 */
async function performanceTest(functionName, testData, iterations = 10) {
  console.log(`开始性能测试，迭代 ${iterations} 次...`);
  
  const results = {
    iterations,
    durations: [],
    averageDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    successCount: 0,
    failureCount: 0,
    errors: []
  };

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      
      const response = await wx.cloud.callFunction({
        name: functionName,
        data: testData
      });
      
      const duration = Date.now() - startTime;
      results.durations.push(duration);
      
      if (duration < results.minDuration) {
        results.minDuration = duration;
      }
      
      if (duration > results.maxDuration) {
        results.maxDuration = duration;
      }
      
      if (response.result && !response.result.error) {
        results.successCount++;
      } else {
        results.failureCount++;
        results.errors.push(`迭代 ${i + 1}: ${response.result?.error || '未知错误'}`);
      }
      
    } catch (error) {
      results.failureCount++;
      results.errors.push(`迭代 ${i + 1}: ${error.message}`);
    }
    
    // 避免请求过于频繁
    await sleep(100);
  }
  
  // 计算平均时间
  if (results.durations.length > 0) {
    results.averageDuration = Math.round(
      results.durations.reduce((sum, duration) => sum + duration, 0) / results.durations.length
    );
  }
  
  console.log('性能测试完成:', results);
  return results;
}

/**
 * 压力测试
 * @param {string} functionName - 云函数名称
 * @param {Object} testData - 测试数据
 * @param {number} concurrency - 并发数
 * @returns {Promise<Object>} 压力测试结果
 */
async function stressTest(functionName, testData, concurrency = 5) {
  console.log(`开始压力测试，并发数 ${concurrency}...`);
  
  const results = {
    concurrency,
    totalRequests: concurrency,
    successCount: 0,
    failureCount: 0,
    durations: [],
    errors: [],
    startTime: new Date()
  };

  // 创建并发请求
  const promises = Array.from({ length: concurrency }, async (_, index) => {
    try {
      const startTime = Date.now();
      
      const response = await wx.cloud.callFunction({
        name: functionName,
        data: testData
      });
      
      const duration = Date.now() - startTime;
      
      return {
        index,
        success: response.result && !response.result.error,
        duration,
        error: response.result?.error || null
      };
    } catch (error) {
      return {
        index,
        success: false,
        duration: 0,
        error: error.message
      };
    }
  });

  // 等待所有请求完成
  const responses = await Promise.all(promises);
  
  // 统计结果
  responses.forEach(response => {
    if (response.success) {
      results.successCount++;
      results.durations.push(response.duration);
    } else {
      results.failureCount++;
      results.errors.push(`请求 ${response.index + 1}: ${response.error}`);
    }
  });
  
  results.endTime = new Date();
  results.totalDuration = results.endTime.getTime() - results.startTime.getTime();
  
  if (results.durations.length > 0) {
    results.averageDuration = Math.round(
      results.durations.reduce((sum, duration) => sum + duration, 0) / results.durations.length
    );
  }
  
  console.log('压力测试完成:', results);
  return results;
}

/**
 * 工具函数：延迟
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成测试报告
 * @param {Object} testResults - 测试结果
 * @returns {string} 测试报告
 */
function generateTestReport(testResults) {
  const { functionName, total, passed, failed, details, startTime, endTime } = testResults;
  const duration = endTime ? endTime.getTime() - startTime.getTime() : 0;
  
  let report = `\n=== 云函数测试报告 ===\n`;
  report += `函数名称: ${functionName}\n`;
  report += `测试时间: ${startTime.toLocaleString()} - ${endTime ? endTime.toLocaleString() : '进行中'}\n`;
  report += `总耗时: ${duration}ms\n`;
  report += `测试用例: ${total} 个\n`;
  report += `通过: ${passed} 个\n`;
  report += `失败: ${failed} 个\n`;
  report += `成功率: ${total > 0 ? Math.round((passed / total) * 100) : 0}%\n\n`;
  
  if (details && details.length > 0) {
    report += `=== 详细结果 ===\n`;
    details.forEach((detail, index) => {
      const status = detail.passed ? '✅ 通过' : '❌ 失败';
      report += `${index + 1}. ${detail.name}: ${status} (${detail.duration}ms)\n`;
      if (!detail.passed && detail.error) {
        report += `   错误: ${detail.error}\n`;
      }
    });
  }
  
  return report;
}

module.exports = {
  testCloudFunctionInMiniProgram,
  createBasicTestCases,
  createAdminTestCases,
  performanceTest,
  stressTest,
  generateTestReport
};























