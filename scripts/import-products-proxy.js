// scripts/import-products-proxy.js
// 产品数据导入代理脚本
// 用于在小程序中直接运行导入功能

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

/**
 * 运行导入脚本
 */
function runImport() {
  console.log('开始运行产品数据导入...');
  
  // 获取导入脚本的绝对路径
  const importScriptPath = path.resolve(__dirname, './importProducts.js');
  
  // 检查脚本是否存在
  if (!fs.existsSync(importScriptPath)) {
    console.error(`导入脚本不存在: ${importScriptPath}`);
    return;
  }
  
  try {
    // 使用子进程运行导入脚本
    const result = child_process.execSync(`node "${importScriptPath}"`, {
      encoding: 'utf8',
      stdio: 'inherit' // 将输出直接传递到当前进程
    });
    
    console.log('产品数据导入完成！');
  } catch (error) {
    console.error('运行导入脚本时出错:', error.message);
  }
}

// 执行导入
runImport();