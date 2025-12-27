# 数据库ID命名规范

## 概述

本文档定义了微信小程序云数据库中各集合的ID命名规范，确保数据的一致性和可读性。

## ID格式规范

### 1. 产品 (products)

**格式**: `{category_prefix}{sequence_number}`

**分类前缀映射**:
| 分类ID | 分类名称 | ID前缀 |
|--------|----------|--------|
| cat_classic | 经典桌面款 | classic |
| cat_fun | 玩趣设计款 | fun |
| cat_resin | 树脂设计款 | resin |
| cat_custom | 树脂定制款 | custom |
| cat_frame | 桌架专区 | frame |
| cat_chair | 椅子专区 | chair |

**示例**:
- `classic1`, `classic2`, `classic13` - 经典桌面款系列
- `fun1`, `fun2` - 玩趣设计款系列
- `resin1`, `resin2` - 树脂设计款系列
- `custom1`, `custom2` - 树脂定制款系列
- `frame1`, `frame8` - 桌架专区系列
- `chair1`, `chair5` - 椅子专区系列

### 2. 分类 (categories)

**格式**: `cat_{category_name}`

**示例**:
- `cat_classic` - 经典桌面款
- `cat_fun` - 玩趣设计款
- `cat_resin` - 树脂设计款
- `cat_custom` - 树脂定制款
- `cat_frame` - 桌架专区
- `cat_chair` - 椅子专区

### 3. 轮播图 (banners)

**格式**: `banner{sequence_number}`

**示例**:
- `banner1`, `banner2`, `banner5`

### 4. 用户收藏 (favorites)

**格式**: 使用微信云数据库自动生成的ID（因为与用户openid关联）

### 5. 云存储路径规范

**产品图片路径格式**: `products/images/{category_prefix}/`

| 分类 | 文件夹路径 |
|------|-----------|
| 经典桌面款 | products/images/classic/ |
| 玩趣设计款 | products/images/fun/ |
| 树脂设计款 | products/images/resin/ |
| 树脂定制款 | products/images/custom/ |
| 桌架专区 | products/images/frame/ |
| 椅子专区 | products/images/chair/ |

**产品视频路径格式**: `products/videos/{category_prefix}/`

**轮播图路径格式**: `banners/`

## ID生成规则

### 产品ID生成算法

1. 根据产品分类获取对应的ID前缀
2. 查询该分类下现有产品的最大序号
3. 新产品ID = 前缀 + (最大序号 + 1)

```javascript
// 示例代码
async function generateProductId(categoryId) {
  const prefixMap = {
    'cat_classic': 'classic',
    'cat_fun': 'fun',
    'cat_resin': 'resin',
    'cat_custom': 'custom',
    'cat_frame': 'frame',
    'cat_chair': 'chair'
  };
  
  const prefix = prefixMap[categoryId] || 'prod';
  
  // 查询该分类下的最大序号
  const result = await db.collection('products')
    .where({ categoryName: categoryId })
    .orderBy('_id', 'desc')
    .limit(1)
    .get();
  
  let maxNumber = 0;
  if (result.data.length > 0) {
    const lastId = result.data[0]._id;
    const match = lastId.match(/\d+$/);
    if (match) {
      maxNumber = parseInt(match[0], 10);
    }
  }
  
  return `${prefix}${maxNumber + 1}`;
}
```

## 迁移现有数据

### 通过云函数迁移

云函数 `productManager` 提供了两个迁移 action：

#### 1. 迁移产品ID

```javascript
// 在小程序中调用
wx.cloud.callFunction({
  name: 'productManager',
  data: {
    action: 'migrateProductIds'
  }
}).then(res => {
  console.log('迁移结果:', res.result);
  // 返回: { success: true, total: 10, migrated: 5, skipped: 5, errors: [] }
});
```

#### 2. 迁移轮播图ID

```javascript
// 在小程序中调用
wx.cloud.callFunction({
  name: 'productManager',
  data: {
    action: 'migrateBannerIds'
  }
}).then(res => {
  console.log('迁移结果:', res.result);
  // 返回: { success: true, total: 5, migrated: 3, skipped: 2, errors: [] }
});
```

### 迁移说明

- `total`: 总记录数
- `migrated`: 成功迁移的记录数
- `skipped`: 已经是规范ID，跳过的记录数
- `errors`: 迁移失败的记录列表

**注意**: 
1. 迁移前请先备份数据
2. 迁移会删除旧记录并创建新记录
3. 如果有关联引用（如收藏中的产品ID），需要手动更新

## 最佳实践

1. **新增产品时**：云函数会自动生成规范化ID
2. **导入数据时**：确保CSV中的产品ID符合规范
3. **关联引用时**：使用产品的 `_id` 字段而非其他字段
4. **查询时**：可以通过ID前缀快速判断产品分类


