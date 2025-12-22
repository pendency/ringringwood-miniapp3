// 云存储迁移配置文件
// 本地路径到云存储URL的映射关系

const CLOUD_CONFIG = {
  // 云存储基础路径
  CLOUD_BASE_URL: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968',
  
  // 路径映射规则
  PATH_MAPPINGS: {
    // UI相关资源 (tabbar图标、轮播图等)
    'images/home.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home.jpg',
    'images/home-active.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/home-active.jpg',
    'images/category.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category.jpg',
    'images/category-active.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/category-active.jpg',
    'images/favorite.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite.jpg',
    'images/favorite-active.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/favorite-active.jpg',
    'images/contact.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact.jpg',
    'images/contact-active.jpg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/tabbar/contact-active.jpg',
    
    // 轮播图
    'images/banner1.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/banners/banner1.jpeg',
    'images/banner2.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/banners/banner2.jpeg',
    'images/banner3.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/banners/banner3.jpeg',
    'images/banner4.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/banners/banner4.jpeg',
    'images/banner5.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/banners/banner5.jpeg',
    
    // 分类图标
    'images/category-wood.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-wood.jpeg',
    'images/category-custom.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-custom.jpeg',
    'images/category-design.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-design.jpeg',
    'images/category-frame.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-frame.jpeg',
    'images/category-resin.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-resin.jpeg',
    
    // 品牌相关
    'images/brand.png': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/brand/brand.png',
    'images/brand.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/brand/brand.jpeg',
    'images/qrcode小.jpeg': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/brand/qrcode小.jpeg',
  },
  
  // 动态路径规则 (用于产品图片和视频)
  DYNAMIC_RULES: {
    // 产品图片规则
    '/images/products/': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/',
    
    // 产品视频规则
    '/images/products/custom': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/custom',
    
    // 其他产品资源
    '/images/products/wood': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood',
    '/images/products/design': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design',
    '/images/products/resin': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/resin',
    '/images/products/frame': 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/frame',
  }
};

// 路径转换函数
function convertToCloudPath(localPath) {
  // 移除开头的斜杠
  const cleanPath = localPath.replace(/^\//, '');
  
  // 检查精确匹配
  if (CLOUD_CONFIG.PATH_MAPPINGS[cleanPath]) {
    return CLOUD_CONFIG.PATH_MAPPINGS[cleanPath];
  }
  
  // 检查动态规则
  for (const [pattern, replacement] of Object.entries(CLOUD_CONFIG.DYNAMIC_RULES)) {
    if (localPath.startsWith(pattern)) {
      return localPath.replace(pattern, replacement);
    }
  }
  
  // 默认规则：如果是products下的文件，直接映射
  if (localPath.startsWith('/images/products/')) {
    return localPath.replace('/images/products/', 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/');
  }
  
  // 如果是其他images下的文件，映射到ui目录
  if (localPath.startsWith('/images/') || localPath.startsWith('images/')) {
    const fileName = localPath.replace(/^\/?(images\/)/, '');
    return `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/${fileName}`;
  }
  
  // 如果都不匹配，返回原路径
  console.warn(`未找到路径映射: ${localPath}`);
  return localPath;
}

module.exports = {
  CLOUD_CONFIG,
  convertToCloudPath
};

