// config/app-config.js
// 应用统一配置文件

/**
 * 默认图片配置
 */
export const DEFAULT_IMAGES = {
  // 产品相关
  product: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/default.jpeg',
  productPlaceholder: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/placeholder.jpeg',
  
  // 分类相关
  categoryWood: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-wood.jpeg',
  categoryResin: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-resin.jpeg',
  categoryDesign: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-design.jpeg',
  categoryCustom: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-custom.jpeg',
  categoryFrame: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/categories/category-frame.jpeg',
  
  // 品牌相关
  brand: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/brand/brand.jpeg',
  logo: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/ui/brand/brand.jpeg'
};

/**
 * 联系方式配置
 */
export const CONTACT_INFO = {
  phone: '15794781359',
  wechat: 'nianluanhuanhuan',
  email: 'contact@nianluanhuanhuan.com',
  address: '请联系客服获取地址信息'
};

/**
 * 页面路径配置
 */
export const PAGE_PATHS = {
  index: '/pages/index/index',
  category: '/pages/category/category',
  productDetail: '/pages/product-detail/product-detail',
  favorite: '/pages/favorite/favorite',
  contact: '/pages/contact/contact',
  admin: '/pages/admin/admin'
};

/**
 * 轮播图配置
 */
export const SWIPER_CONFIG = {
  autoplay: false,
  circular: true,
  duration: 300,
  interval: 3000,
  indicatorDots: true,
  indicatorColor: 'rgba(0,0,0,0.3)',
  indicatorActiveColor: '#D4B08C'
};

/**
 * 主题色彩配置
 */
export const THEME_COLORS = {
  primary: '#8B5A2B',      // 主色调
  secondary: '#D4B08C',    // 辅助色
  background: '#F5F5DC',   // 背景色
  text: '#5D4037',         // 文字色
  textSecondary: '#666',   // 次要文字色
  border: '#f0f0f0',       // 边框色
  success: '#4CAF50',      // 成功色
  warning: '#FF9800',      // 警告色
  error: '#F44336'         // 错误色
};

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  hotProductsLimit: 4,
  newProductsLimit: 4,
  similarProductsLimit: 5
};

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  // 缓存键名
  keys: {
    favorites: 'favorites',
    userInfo: 'userInfo',
    categories: 'categories',
    recentViewed: 'recentViewed'
  },
  
  // 缓存过期时间（毫秒）
  expiry: {
    categories: 24 * 60 * 60 * 1000,    // 24小时
    products: 60 * 60 * 1000,           // 1小时
    userInfo: 7 * 24 * 60 * 60 * 1000   // 7天
  }
};

/**
 * 图片尺寸配置
 */
export const IMAGE_SIZES = {
  // 产品图片
  productThumbnail: { width: 300, height: 300 },
  productDetail: { width: 750, height: 750 },
  productBanner: { width: 750, height: 400 },
  
  // 分类图片
  categoryIcon: { width: 120, height: 120 },
  categoryBanner: { width: 750, height: 300 },
  
  // 轮播图
  swiperBanner: { width: 750, height: 400 }
};

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// 兼容CommonJS导出（小程序环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_IMAGES,
    CONTACT_INFO,
    PAGE_PATHS,
    SWIPER_CONFIG,
    THEME_COLORS,
    PAGINATION_CONFIG,
    CACHE_CONFIG,
    IMAGE_SIZES,
    ANIMATION_CONFIG
  };
}
