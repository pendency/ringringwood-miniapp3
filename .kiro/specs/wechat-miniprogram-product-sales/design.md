# 设计文档

## 概述

本设计文档描述"年轮环环"微信小程序的技术架构和实现方案。小程序采用微信原生开发框架，使用Skyline渲染引擎和glass-easel组件框架，数据采用本地模拟数据模式。

## 架构

### 整体架构

```mermaid
graph TB
    subgraph 表现层
        A[首页 Index] --> E[产品卡片组件]
        B[分类页 Category] --> E
        C[详情页 Product-Detail] --> F[视频播放组件]
        D[收藏页 Favorite] --> E
        G[选购页 Contact]
    end
    
    subgraph 业务逻辑层
        H[Product Manager]
        I[Category Manager]
        J[Favorite Manager]
        K[Cache Manager]
    end
    
    subgraph 数据层
        L[Mock Data]
        M[Local Storage]
    end
    
    A --> H
    B --> H
    B --> I
    C --> H
    D --> J
    H --> L
    I --> L
    J --> M
    K --> M
end
```

### 技术栈

- 框架：微信小程序原生框架
- 渲染引擎：Skyline
- 组件框架：glass-easel
- 数据存储：本地模拟数据 + wx.setStorageSync
- 样式：WXSS + Flex布局


## 组件和接口

### 页面结构

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | pages/index/index | 轮播图、热门产品、新品推荐 |
| 分类 | pages/category/category | 分类列表、产品筛选 |
| 详情 | pages/product-detail/product-detail | 产品详情、图片预览、视频播放 |
| 收藏 | pages/favorite/favorite | 收藏列表管理 |
| 选购 | pages/contact/contact | 商家联系方式 |

### 核心模块接口

#### Product Manager (utils/productManager.js)

```javascript
// 获取产品列表
function getProducts(options: {
  categoryId?: string,
  page?: number,
  pageSize?: number,
  isHot?: boolean,
  isNew?: boolean,
  isRecommended?: boolean
}): Promise<{products: Product[], total: number}>

// 获取单个产品详情
function getProductById(id: string): Promise<Product>

// 获取分类列表
function getCategories(): Promise<Category[]>

// 获取轮播图数据
function getBanners(): Promise<Banner[]>
```

#### Favorite Manager (utils/favoriteManager.js)

```javascript
// 添加收藏
function addFavorite(productId: string): void

// 移除收藏
function removeFavorite(productId: string): void

// 检查是否已收藏
function isFavorite(productId: string): boolean

// 获取收藏列表
function getFavorites(): string[]

// 切换收藏状态
function toggleFavorite(productId: string): boolean
```


## 数据模型

### Product 产品模型

```javascript
{
  _id: string,              // 产品唯一标识
  name: string,             // 产品名称
  description: string,      // 产品描述
  price: number,            // 当前价格
  originalPrice: number,    // 原价
  categoryId: string,       // 分类ID
  imageUrls: string[],      // 主图URL数组
  images: string[],         // 详情图片数组
  features: Feature[],      // 产品特点数组
  params: Param[],          // 产品参数数组
  isHot: boolean,           // 是否热门
  isNew: boolean,           // 是否新品
  isRecommended: boolean    // 是否推荐
}
```

### Feature 特点模型

```javascript
{
  title: string,            // 特点标题
  description: string,      // 特点描述
  video?: string            // 视频路径（可选）
}
```

### Category 分类模型

```javascript
{
  _id: string,              // 分类唯一标识
  name: string,             // 分类名称
  description: string,      // 分类描述
  order: number,            // 排序权重
  status: number            // 状态（1:启用, 0:禁用）
}
```

### Banner 轮播图模型

```javascript
{
  _id: string,              // 轮播图唯一标识
  imageUrl: string,         // 图片URL
  linkType: string,         // 链接类型
  linkValue: string,        // 链接值
  order: number             // 排序权重
}
```


## 正确性属性

*正确性属性是系统在所有有效执行中都应保持为真的特征或行为。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 分类筛选一致性

*For any* 分类ID和产品列表，当按该分类筛选产品时，返回的所有产品的categoryId都应等于筛选的分类ID

**Validates: Requirements 2.2, 7.2**

### Property 2: 分页结果数量约束

*For any* 分页请求，返回的产品数量应不超过请求的pageSize参数值

**Validates: Requirements 2.3, 7.3**

### Property 3: 收藏添加后可查询

*For any* 产品ID，添加到收藏后，调用isFavorite应返回true

**Validates: Requirements 4.1**

### Property 4: 收藏移除后不可查询

*For any* 已收藏的产品ID，移除收藏后，调用isFavorite应返回false

**Validates: Requirements 4.2**

### Property 5: 收藏数据持久化round-trip

*For any* 收藏列表，保存到本地存储后再读取，应得到等价的收藏列表

**Validates: Requirements 4.4, 4.5**

### Property 6: 产品数据序列化round-trip

*For any* 有效的产品对象，JSON序列化后再反序列化，应产生等价的产品对象

**Validates: Requirements 7.6**

### Property 7: 收藏切换幂等性

*For any* 产品ID，连续两次调用toggleFavorite应恢复到初始状态

**Validates: Requirements 4.1, 4.2**


## 错误处理

### 数据加载错误

| 场景 | 处理方式 |
|------|----------|
| 产品列表加载失败 | 显示错误提示，提供重试按钮 |
| 产品详情加载失败 | 显示错误页面，返回上一页选项 |
| 图片加载失败 | 显示默认占位图 |
| 视频加载失败 | 显示错误提示，隐藏播放器 |

### 本地存储错误

| 场景 | 处理方式 |
|------|----------|
| 存储空间不足 | 清理过期缓存，提示用户 |
| 读取数据损坏 | 重置为默认值，记录日志 |

### 网络错误

| 场景 | 处理方式 |
|------|----------|
| 无网络连接 | 使用本地缓存数据，提示离线状态 |
| 请求超时 | 自动重试一次，失败后提示用户 |

## 测试策略

### 单元测试

- 测试Product Manager的数据筛选和分页逻辑
- 测试Favorite Manager的增删改查操作
- 测试数据模型的序列化和反序列化
- 测试缓存管理的过期和刷新逻辑

### 属性测试

使用fast-check库进行属性测试：

- **Property 1-2**: 生成随机分类ID和分页参数，验证筛选和分页结果
- **Property 3-5, 7**: 生成随机产品ID序列，验证收藏操作的正确性
- **Property 6**: 生成随机产品对象，验证序列化round-trip

### 集成测试

- 测试页面间导航流程
- 测试收藏状态在不同页面间的同步
- 测试数据加载和缓存的协作

### 测试配置

- 属性测试最少运行100次迭代
- 每个属性测试需标注对应的设计属性编号
- 标签格式: **Feature: wechat-miniprogram-product-sales, Property {number}: {property_text}**