// 云存储迁移脚本
// 批量替换项目中的本地路径为云存储URL

const fs = require('fs');
const path = require('path');

// 云存储配置
const CLOUD_BASE_URL = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';

// 需要处理的文件类型
const TARGET_EXTENSIONS = ['.js', '.json', '.wxml', '.wxss'];

// 需要跳过的目录
const SKIP_DIRS = ['node_modules', '.git', 'miniprogram_npm'];

// 路径替换规则
const PATH_REPLACEMENTS = [
  // TabBar 图标
  {
    from: '"images/home.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/home.jpg"`
  },
  {
    from: '"images/home-active.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/home-active.jpg"`
  },
  {
    from: '"images/category.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/category.jpg"`
  },
  {
    from: '"images/category-active.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/category-active.jpg"`
  },
  {
    from: '"images/favorite.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/favorite.jpg"`
  },
  {
    from: '"images/favorite-active.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/favorite-active.jpg"`
  },
  {
    from: '"images/contact.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/contact.jpg"`
  },
  {
    from: '"images/contact-active.jpg"',
    to: `"${CLOUD_BASE_URL}/ui/tabbar/contact-active.jpg"`
  },
  
  // 产品路径 - 使用正则表达式替换
  {
    from: /['"`]\/images\/products\//g,
    to: `'${CLOUD_BASE_URL}/products/`
  },
  {
    from: /['"`]images\/products\//g,
    to: `'${CLOUD_BASE_URL}/products/`
  },
  
  // 轮播图
  {
    from: /['"`]\/images\/banner(\d+)\.jpeg['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/banners/banner$1.jpeg'`
  },
  {
    from: /['"`]images\/banner(\d+)\.jpeg['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/banners/banner$1.jpeg'`
  },
  
  // 分类图标
  {
    from: /['"`]\/images\/category-(\w+)\.jpeg['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/categories/category-$1.jpeg'`
  },
  {
    from: /['"`]images\/category-(\w+)\.jpeg['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/categories/category-$1.jpeg'`
  },
  
  // 品牌相关
  {
    from: /['"`]\/images\/brand\.(png|jpeg)['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/brand/brand.$1'`
  },
  {
    from: /['"`]images\/brand\.(png|jpeg)['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/brand/brand.$1'`
  },
  
  // 其他UI资源
  {
    from: /['"`]\/images\/([^\/]+\.(jpg|jpeg|png))['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/$1'`
  },
  {
    from: /['"`]images\/([^\/]+\.(jpg|jpeg|png))['"`]/g,
    to: `'${CLOUD_BASE_URL}/ui/$1'`
  }
];

// 获取所有需要处理的文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (TARGET_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changes = [];
    
    // 应用所有替换规则
    PATH_REPLACEMENTS.forEach(rule => {
      const originalContent = content;
      
      if (rule.from instanceof RegExp) {
        // 正则表达式替换
        const matches = content.match(rule.from);
        if (matches) {
          content = content.replace(rule.from, rule.to);
          if (content !== originalContent) {
            modified = true;
            changes.push(`正则替换: ${rule.from} -> ${rule.to}`);
          }
        }
      } else {
        // 字符串替换
        if (content.includes(rule.from)) {
          content = content.replace(new RegExp(escapeRegExp(rule.from), 'g'), rule.to);
          modified = true;
          changes.push(`字符串替换: ${rule.from} -> ${rule.to}`);
        }
      }
    });
    
    // 如果有修改，写回文件
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已更新: ${filePath}`);
      changes.forEach(change => console.log(`   ${change}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error.message);
    return false;
  }
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 主函数
function main() {
  console.log('🚀 开始云存储迁移...');
  console.log(`📁 目标云存储: ${CLOUD_BASE_URL}`);
  console.log('');
  
  // 获取所有文件
  const files = getAllFiles('.');
  console.log(`📋 找到 ${files.length} 个文件需要检查`);
  console.log('');
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  // 处理每个文件
  files.forEach(file => {
    processedCount++;
    const wasModified = processFile(file);
    if (wasModified) {
      modifiedCount++;
    }
  });
  
  console.log('');
  console.log('📊 迁移完成统计:');
  console.log(`   检查文件: ${processedCount}`);
  console.log(`   修改文件: ${modifiedCount}`);
  console.log(`   未修改文件: ${processedCount - modifiedCount}`);
  
  if (modifiedCount > 0) {
    console.log('');
    console.log('⚠️  重要提醒:');
    console.log('1. 请检查修改后的文件是否正确');
    console.log('2. 建议先在开发环境测试');
    console.log('3. 确认云存储文件已正确上传');
    console.log('4. 测试所有功能是否正常');
  }
  
  console.log('');
  console.log('✨ 云存储迁移完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  getAllFiles,
  PATH_REPLACEMENTS
};

