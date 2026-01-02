# 数据库ID与云存储命名规范

## 概述

本文档定义了微信小程序云数据库中各集合的ID命名规范以及云存储文件命名规范。

---

## 一、分类体系

| 分类ID | 分类名称 | 前缀 |
|--------|----------|------|
| cat_classic | 经典桌面款 | classic |
| cat_fun | 玩趣设计款 | fun |
| cat_resin | 树脂设计款 | resin |
| cat_custom | 树脂定制款 | custom |
| cat_frame | 桌架专区 | frame |
| cat_chair | 椅子专区 | chair |

---

## 二、数据库ID规范

### 2.1 产品 (products)
**格式**: `{prefix}{number}`
**示例**: `classic1`, `fun2`, `chair5`

### 2.2 分类 (categories)
**格式**: `cat_{name}`
**示例**: `cat_classic`, `cat_fun`

### 2.3 轮播图 (banners)
**格式**: `banner{number}`
**示例**: `banner1`, `banner2`

### 2.4 客户案例 (cases)
**格式**: `custom{number}`
**示例**: `custom1`, `custom2`, `custom3`

---

## 三、图片类型说明

### 3.1 图片类型与用途对照表

| 类型 | 英文标识 | 用途位置 | 比例 | 数量 | 说明 |
|------|----------|----------|------|------|------|
| 轮播图 | banner | 首页顶部轮播 | 16:9 横图 | 多张 | 独立上传，不属于产品 |
| 主图 | cover | 分类页面列表、灵感上新栏目 | 3:4 竖图 | 1张/产品 | 产品封面图 |
| 精选图 | featured | 首页精选产品、相似推荐 | 1:1 正方形 | 1张/产品 | 正方形裁切 |
| 详情图 | detail | 产品详情页图片展示 | 不限 | 多张/产品 | 产品细节展示 |
| 分类图 | category | 首页产品分类栏目 | 1:1 或 16:9 | 1张/分类 | 分类入口图 |

### 3.2 图片使用位置示意

```
┌─────────────────────────────────────┐
│           首页 (index)              │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │      轮播图 (banner)         │    │  ← 16:9 横图
│  └─────────────────────────────┘    │
│                                     │
│  精选产品                            │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 1:1 │ │ 1:1 │ │ 1:1 │           │  ← 精选图 (featured)
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  灵感上新                            │
│  ┌───────────┐ ┌───────────┐       │
│  │   3:4     │ │   3:4     │       │  ← 主图 (cover)
│  │   竖图    │ │   竖图    │       │
│  └───────────┘ └───────────┘       │
│                                     │
│  产品分类                            │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │分类1│ │分类2│ │分类3│           │  ← 分类图 (category)
│  └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         分类页面 (category)          │
├─────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 3:4   │ │ 3:4   │ │ 3:4   │     │  ← 主图 (cover)
│  │ 竖图  │ │ 竖图  │ │ 竖图  │     │
│  └───────┘ └───────┘ └───────┘     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       产品详情页 (product-detail)    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │        详情图轮播            │    │  ← 详情图 (detail)
│  │      (可左右滑动)            │    │
│  └─────────────────────────────┘    │
│                                     │
│  相似推荐                            │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 1:1 │ │ 1:1 │ │ 1:1 │           │  ← 精选图 (featured)
│  └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────┘
```

---

## 四、云存储目录结构

```
cloud://your-env-id/
│
├── banners/                      # 轮播图（独立存放）
│   ├── banner1.jpg
│   ├── banner2.jpg
│   └── banner3.jpg
│
├── cases/                        # 客户案例图片
│   └── custom/                   # 定制案例
│       ├── custom1.jpg
│       ├── custom2.png
│       └── custom3.jpg
│
├── categories/                   # 分类图
│   ├── cat_classic.jpg
│   ├── cat_fun.jpg
│   ├── cat_resin.jpg
│   ├── cat_custom.jpg
│   ├── cat_frame.jpg
│   └── cat_chair.jpg
│
└── products/                     # 产品相关（简化结构）
    │
    ├── images/                   # 所有产品图片（通过文件名区分类型）
    │   ├── classic/
    │   │   ├── classic1_cover.jpg       # 主图
    │   │   ├── classic1_featured.jpg    # 精选图
    │   │   ├── classic1_detail_1.jpg    # 详情图1
    │   │   ├── classic1_detail_2.jpg    # 详情图2
    │   │   └── classic1_detail_3.jpg    # 详情图3
    │   ├── fun/
    │   ├── resin/
    │   ├── custom/
    │   ├── frame/
    │   └── chair/
    │
    └── videos/                   # 产品视频
        ├── classic/
        │   └── classic1_video.mp4
        ├── fun/
        ├── resin/
        ├── custom/
        ├── frame/
        └── chair/
```

---

## 五、文件命名规范

### 5.1 轮播图
**格式**: `banner{number}.{ext}`
**路径**: `banners/`
**示例**: 
- `banners/banner1.jpg`
- `banners/banner2.png`

### 5.2 分类图
**格式**: `{categoryId}.{ext}`
**路径**: `categories/`
**示例**: 
- `categories/cat_classic.jpg`
- `categories/cat_fun.jpg`

### 5.3 客户案例图
**格式**: `custom{number}.{ext}`
**路径**: `cases/custom/`
**数量**: 每个案例1张
**比例**: 4:3 或 3:4（推荐）
**最大文件大小**: 2MB
**示例**: 
- `cases/custom/custom1.jpg`
- `cases/custom/custom2.png`
- `cases/custom/custom3.jpeg`

### 5.4 产品主图（封面图）
**格式**: `{productId}_cover.{ext}`
**路径**: `products/images/{prefix}/`
**数量**: 每个产品1张
**比例**: 3:4 竖图（推荐 900x1200px）
**示例**: 
- `products/images/classic/classic1_cover.jpg`
- `products/images/fun/fun2_cover.jpg`

### 5.4 产品精选图
**格式**: `{productId}_featured.{ext}`
**路径**: `products/images/{prefix}/`
**数量**: 每个产品1张
**比例**: 1:1 正方形（推荐 800x800px）
**示例**: 
- `products/images/classic/classic1_featured.jpg`
- `products/images/chair/chair1_featured.jpg`

### 5.5 产品详情图
**格式**: `{productId}_detail_{number}.{ext}`
**路径**: `products/images/{prefix}/`
**数量**: 每个产品多张
**比例**: 不限（推荐宽度1200px）
**示例**: 
- `products/images/classic/classic1_detail_1.jpg`
- `products/images/classic/classic1_detail_2.jpg`
- `products/images/classic/classic1_detail_3.jpg`

### 5.6 产品视频
**格式**: `{productId}_video.{ext}`
**路径**: `products/videos/{prefix}/`
**数量**: 每个产品0-1个
**示例**: 
- `products/videos/classic/classic1_video.mp4`
- `products/videos/custom/custom5_video.mp4`

---

## 六、图片尺寸规范

| 图片类型 | 推荐尺寸 | 比例 | 最大文件大小 | 格式 |
|----------|----------|------|--------------|------|
| 轮播图 | 1125×633px | 16:9 | 500KB | jpg/png |
| 主图 | 900×1200px | 3:4 | 300KB | jpg/png |
| 精选图 | 800×800px | 1:1 | 200KB | jpg/png |
| 详情图 | 1200×不限 | 不限 | 500KB | jpg/png |
| 分类图 | 400×400px | 1:1 | 100KB | jpg/png |
| 案例图 | 900×1200px | 3:4 或 4:3 | 2MB | jpg/jpeg/png |

---

## 七、数据库字段对应关系

### 7.1 产品表 (products)

```javascript
{
  "_id": "classic1",
  "name": "产品名称",
  "categoryName": "cat_classic",
  
  // 主图 - 用于分类页面、灵感上新
  "coverImage": "cloud://xxx/products/images/classic/classic1_cover.jpg",
  
  // 精选图 - 用于首页精选、相似推荐
  "featuredImage": "cloud://xxx/products/images/classic/classic1_featured.jpg",
  
  // 详情图数组 - 用于产品详情页
  "detailImages": [
    "cloud://xxx/products/images/classic/classic1_detail_1.jpg",
    "cloud://xxx/products/images/classic/classic1_detail_2.jpg",
    "cloud://xxx/products/images/classic/classic1_detail_3.jpg"
  ],
  
  // 视频（可选）
  "video": "cloud://xxx/products/videos/classic/classic1_video.mp4"
}
```

### 7.2 轮播图表 (banners)

```javascript
{
  "_id": "banner1",
  "image": "cloud://xxx/banners/banner1.jpg",
  "title": "轮播标题",
  "productId": "classic1"  // 关联产品（可选）
}
```

### 7.3 分类表 (categories)

```javascript
{
  "_id": "cat_classic",
  "name": "经典桌面款",
  "image": "cloud://xxx/categories/cat_classic.jpg"
}
```

### 7.4 案例表 (cases)

```javascript
{
  "_id": "custom1",                                              // 案例ID，格式: custom{number}
  "title": "客户定制案例",                                        // 案例标题
  "description": "案例描述",                                      // 案例描述
  "imageUrl": "cloud://xxx/cases/custom/custom1.jpg",            // 云存储图片URL
  "order": 1,                                                    // 排序权重（越小越靠前）
  "status": 1,                                                   // 状态：1-启用，0-禁用
  "createTime": Date,                                            // 创建时间
  "updateTime": Date                                             // 更新时间
}
```

---

## 八、命名规则总结

| 规则 | 说明 |
|------|------|
| 全小写 | 所有文件名使用小写字母 |
| 下划线分隔 | 使用 `_` 分隔各部分 |
| 无空格 | 文件名不含空格 |
| 无中文 | 文件名不使用中文 |
| 有意义 | 文件名包含产品ID和类型标识 |

---

## 九、快速参考

**一个产品需要准备的图片：**
1. `{productId}_cover.jpg` - 主图（1张，3:4竖图）
2. `{productId}_featured.jpg` - 精选图（1张，1:1正方形）
3. `{productId}_detail_1.jpg` 等 - 详情图（多张）
4. `{productId}_video.mp4` - 视频（可选）

**示例 - classic1 产品的完整文件列表：**
```
products/images/classic/classic1_cover.jpg
products/images/classic/classic1_featured.jpg
products/images/classic/classic1_detail_1.jpg
products/images/classic/classic1_detail_2.jpg
products/images/classic/classic1_detail_3.jpg
products/videos/classic/classic1_video.mp4
```
