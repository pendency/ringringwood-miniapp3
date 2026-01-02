# 年轮环环小程序 - 云数据库版

## 项目介绍

"年轮环环"是一款展示和销售木质家具产品的微信小程序，采用微信云开发架构，包含丰富的产品展示和视频演示功能。

## 功能特点

### 产品展示
- 6个产品类别：经典桌面款、玩趣设计款、树脂设计款、树脂定制款、桌架专区、椅子专区
- 高清产品图片展示和详细参数说明
- 产品特点介绍和视频演示

### 界面功能
- 轮播图展示各产品类别
- 分类浏览和产品筛选
- 产品详情页面，支持图片预览和视频播放
- 响应式设计，适配不同设备

### 管理后台
- 产品添加、编辑、删除
- 图片和视频上传到云存储
- 分类管理

## 技术架构

### 数据管理
- 使用微信云开发数据库作为唯一数据源
- 云函数处理数据操作
- 云存储管理图片和视频资源

### 文件结构
```
年轮环环小程序/
├── pages/              # 页面文件
│   ├── index/          # 首页
│   ├── category/       # 分类页面
│   ├── product-detail/ # 产品详情页
│   ├── product-form/   # 产品表单（管理后台）
│   ├── brand/          # 品牌介绍页
│   └── contact/        # 联系页面
├── cloudfunctions/     # 云函数
│   └── productManager/ # 产品管理云函数
├── utils/              # 工具文件
│   ├── productData.js  # 产品数据管理
│   ├── cloudProductData.js # 云数据库操作
│   └── cacheManager.js # 缓存管理
├── components/         # 自定义组件
├── config/             # 配置文件
└── app.js             # 应用入口文件
```

## 数据库集合

### products（产品）
```javascript
{
  _id: "产品ID",        // 格式: {prefix}{number}，如 classic1, resin2
  name: "产品名称",
  description: "产品描述",
  price: "价格",
  categoryId: "分类ID",
  imageUrls: ["主图路径"],
  images: ["详情图片路径数组"],
  video: "视频路径",
  features: [...],
  params: [...],
  isHot: boolean,
  isNew: boolean,
  status: 1
}
```

### categories（分类）
```javascript
{
  _id: "分类ID",        // 格式: cat_{name}，如 cat_classic
  name: "分类名称",
  description: "分类描述",
  order: 排序权重,
  status: 1
}
```

### banners（轮播图）
```javascript
{
  _id: "banner1",
  image: "图片路径",
  title: "标题",
  productId: "关联产品ID"
}
```

## 分类体系

| 分类ID | 分类名称 | 前缀 |
|--------|----------|------|
| cat_classic | 经典桌面款 | classic |
| cat_fun | 玩趣设计款 | fun |
| cat_resin | 树脂设计款 | resin |
| cat_custom | 树脂定制款 | custom |
| cat_frame | 桌架专区 | frame |
| cat_chair | 椅子专区 | chair |

## 云存储命名规范

详见 `.kiro/specs/id-naming-convention.md`

### 产品图片
- 主图: `products/images/{prefix}/{productId}_cover.jpeg`
- 详情图: `products/images/{prefix}/{productId}_detail_{n}.jpeg`

### 产品视频
- 视频: `products/videos/{prefix}/{productId}_video.mp4`

## 安装和运行

1. **下载项目**
   ```bash
   git clone [项目地址]
   cd 年轮环环小程序
   ```

2. **配置云开发**
   - 在微信开发者工具中开通云开发
   - 创建云开发环境
   - 更新 `app.js` 中的云环境ID

3. **部署云函数**
   - 右键 `cloudfunctions/productManager`
   - 选择"上传并部署：云端安装依赖"

4. **编译运行**
   - 点击"编译"按钮
   - 在模拟器中预览效果

## 管理产品

通过小程序管理后台页面：
1. 添加产品：填写产品信息，上传图片和视频
2. 编辑产品：修改现有产品信息
3. 删除产品：移除不需要的产品

## 版本历史

- v1.0.0 - 基本功能实现
- v1.1.0 - 添加视频展示功能
- v2.0.0 - 迁移到云开发架构，数据库作为唯一数据源

## 许可证

该项目仅供学习和参考使用。
