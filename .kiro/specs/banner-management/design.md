# Design Document: Banner Management

## Overview

轮播图管理功能是微信小程序管理后台的一部分，允许管理员上传、编辑、删除轮播图。该功能基于现有的管理页面架构，使用微信云开发进行图片存储和数据管理。

本设计文档描述了轮播图管理功能的架构、组件、数据模型和实现细节。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Page (admin.js)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Banner Management UI                        ││
│  │  - Banner List Display                                   ││
│  │  - Add/Edit Form Modal                                   ││
│  │  - Image Upload Preview                                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Function Layer                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              productManager Cloud Function               ││
│  │  - getBanners: 获取轮播图列表                            ││
│  │  - addBanner: 新增轮播图                                 ││
│  │  - updateBanner: 更新轮播图                              ││
│  │  - deleteBanner: 删除轮播图                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Storage & Database                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │   Cloud Storage      │  │    Cloud Database            ││
│  │   /banners/          │  │    banners collection        ││
│  │   - banner_xxx.jpeg  │  │    - _id, image, title...    ││
│  └──────────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Admin Page Banner Management (pages/admin/admin.js)

负责轮播图管理的前端交互逻辑。

```javascript
// 轮播图管理相关方法接口
interface BannerManagement {
  // 加载轮播图列表
  loadBanners(): Promise<void>;
  
  // 刷新轮播图列表
  refreshBanners(): void;
  
  // 显示新增轮播图表单
  showAddBannerForm(): void;
  
  // 编辑轮播图
  editBanner(e: Event): Promise<void>;
  
  // 关闭轮播图表单
  closeBannerForm(): void;
  
  // 选择轮播图图片
  chooseBannerImage(): void;
  
  // 保存轮播图
  saveBanner(): Promise<void>;
  
  // 删除轮播图
  deleteBanner(e: Event): void;
}
```

### 2. Cloud Function Actions (cloudfunctions/productManager/index.js)

云函数处理轮播图的后端逻辑。

```javascript
// 云函数 action 接口
interface CloudFunctionActions {
  // 获取轮播图列表
  getBanners(data: {
    status?: number;      // 可选，筛选状态
    includeDisabled?: boolean;  // 是否包含禁用的
    limit?: number;       // 返回数量限制
  }): Promise<{
    success: boolean;
    data: Banner[];
    total: number;
  }>;
  
  // 新增轮播图
  addBanner(data: BannerInput): Promise<{
    success: boolean;
    id: string;
  }>;
  
  // 更新轮播图
  updateBanner(data: {
    id: string;
    ...BannerInput;
  }): Promise<{
    success: boolean;
    updated: number;
  }>;
  
  // 删除轮播图
  deleteBanner(data: {
    id: string;
  }): Promise<{
    success: boolean;
    deletedFile: boolean;
  }>;
}
```

### 3. Banner Utility Functions (utils/bannerManager.js - 新增)

提供轮播图相关的工具函数。

```javascript
// 轮播图工具函数接口
interface BannerUtils {
  // 生成轮播图文件名
  generateBannerFilename(extension: string): string;
  
  // 验证轮播图数据
  validateBannerData(data: BannerInput): ValidationResult;
  
  // 排序轮播图列表
  sortBanners(banners: Banner[]): Banner[];
  
  // 验证产品ID格式
  validateProductId(productId: string): boolean;
}
```

## Data Models

### Banner Model

```javascript
// 轮播图数据模型
interface Banner {
  _id: string;           // 轮播图ID，格式: banner_{number}
  image: string;         // 云存储文件ID
  title: string;         // 标题（左下角显示）
  subtitle: string;      // 副标题（左下角显示）
  order: number;         // 排序权重，数字越小越靠前，默认999
  status: number;        // 状态：1=启用，0=禁用
  productId: string;     // 关联产品ID（可选）
  createTime: Date;      // 创建时间
  updateTime: Date;      // 更新时间
}

// 轮播图输入数据
interface BannerInput {
  image: string;         // 必填，云存储文件ID
  title?: string;        // 可选，默认"轮播图"
  subtitle?: string;     // 可选，默认空
  order?: number;        // 可选，默认999
  status?: number;       // 可选，默认1
  productId?: string;    // 可选，默认空
}

// 验证结果
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Cloud Storage Path

```
云存储路径: cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/banners/
文件命名: banner_{timestamp}.{extension}
示例: banners/banner_1704067200000.jpeg
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Banner Filename Format

*For any* timestamp and file extension, the generated banner filename SHALL match the pattern `banner_{timestamp}.{extension}` where timestamp is a positive integer.

**Validates: Requirements 1.2**

### Property 2: Banner Data Completeness

*For any* valid banner input, the created banner record SHALL contain all required fields: `_id`, `image`, `title`, `subtitle`, `order`, `status`, `productId`, `createTime`, `updateTime`.

**Validates: Requirements 2.1**

### Property 3: Banner ID Format

*For any* newly created banner, the generated ID SHALL match the pattern `banner_{number}` where number is a positive integer.

**Validates: Requirements 2.2**

### Property 4: Banner Sorting Order

*For any* list of banners, when sorted, banners with lower `order` values SHALL appear before banners with higher `order` values. When `order` values are equal, banners with earlier `createTime` SHALL appear first.

**Validates: Requirements 5.2, 6.2, 6.4**

### Property 5: Default Order Value

*For any* new banner created without an explicit order value, the `order` field SHALL be set to 999.

**Validates: Requirements 6.3**

### Property 6: Update Preserves Unchanged Fields

*For any* banner update operation, fields not included in the update payload SHALL remain unchanged in the resulting banner record.

**Validates: Requirements 3.3**

### Property 7: Product ID Validation

*For any* product ID provided for a banner, if the ID is non-empty, it SHALL match a valid product ID format (alphanumeric with optional underscores and hyphens).

**Validates: Requirements 7.3**

### Property 8: Optional Product ID

*For any* banner, the `productId` field SHALL accept both empty string and valid product ID values.

**Validates: Requirements 7.1, 7.2**

## Error Handling

### Upload Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Network failure | 显示错误提示，允许重试 |
| File too large | 显示文件大小限制提示 |
| Invalid file type | 显示支持的文件类型提示 |
| Cloud storage error | 记录错误日志，显示通用错误提示 |

### Database Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Banner not found | 返回 `success: false` 和错误信息 |
| Duplicate ID | 重新生成ID并重试 |
| Update failed | 返回失败状态和错误详情 |
| Delete failed | 记录日志，返回失败状态 |

### Validation Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Missing required field | 显示具体缺失字段提示 |
| Invalid order value | 使用默认值999 |
| Invalid status value | 使用默认值1 |

## Testing Strategy

### Unit Tests

单元测试覆盖以下场景：

1. **文件名生成测试**
   - 测试不同时间戳和扩展名的文件名生成
   - 验证文件名格式正确性

2. **数据验证测试**
   - 测试必填字段验证
   - 测试可选字段默认值
   - 测试产品ID格式验证

3. **排序逻辑测试**
   - 测试按order排序
   - 测试相同order时按createTime排序

### Property-Based Tests

使用 fast-check 库进行属性测试，每个属性测试运行至少100次迭代。

1. **Property 1: Banner Filename Format**
   - 生成随机时间戳和扩展名
   - 验证输出格式匹配正则表达式

2. **Property 2: Banner Data Completeness**
   - 生成随机有效输入
   - 验证输出包含所有必需字段

3. **Property 3: Banner ID Format**
   - 生成多个banner
   - 验证所有ID匹配格式

4. **Property 4: Banner Sorting Order**
   - 生成随机banner列表
   - 验证排序后顺序正确

5. **Property 5: Default Order Value**
   - 生成不含order的输入
   - 验证输出order为999

6. **Property 6: Update Preserves Unchanged Fields**
   - 生成随机banner和部分更新
   - 验证未更新字段保持不变

7. **Property 7: Product ID Validation**
   - 生成各种格式的产品ID
   - 验证验证函数正确识别有效/无效ID

8. **Property 8: Optional Product ID**
   - 生成空和非空productId
   - 验证两种情况都被接受

### Integration Tests

集成测试覆盖完整的用户流程：

1. 新增轮播图流程
2. 编辑轮播图流程
3. 删除轮播图流程
4. 列表加载和刷新流程
