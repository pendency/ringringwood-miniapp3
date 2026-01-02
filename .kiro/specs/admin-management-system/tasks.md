# 实现计划：后台管理系统

## 概述

本实现计划基于已有的"年轮环环"小程序项目，实现分类管理和产品管理的后台功能。

## 任务

- [x] 1. 实现数据验证模块
  - [x] 1.1 创建 Data Validator 模块
    - 实现 validateCategory 方法验证分类数据
    - 实现 validateProduct 方法验证产品数据
    - 实现 validatePrice 方法验证价格格式
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 1.2 编写 Property 8 属性测试：数据验证完整性

    - **Property 8: 数据验证完整性**
    - **Validates: Requirements 10.1, 10.2**

- [x] 2. 实现分类管理模块
  - [x] 2.1 创建 Category Admin Manager 模块
    - 实现 getCategories 获取所有分类
    - 实现 getCategoryById 根据ID获取分类
    - 实现 addCategory 新增分类
    - 实现 updateCategory 更新分类
    - 实现 deleteCategory 删除分类
    - 实现 checkCategoryHasProducts 检查分类下是否有产品
    - _Requirements: 1.1, 1.2, 2.3, 2.4, 3.3, 3.4, 4.2, 4.3, 4.4_
  - [x] 2.2 编写 Property 1 属性测试：分类新增后可查询

    - **Property 1: 分类新增后可查询**
    - **Validates: Requirements 2.6**
  - [x] 2.3 编写 Property 2 属性测试：分类修改后数据一致

    - **Property 2: 分类修改后数据一致**
    - **Validates: Requirements 3.5**
  - [x] 2.4 编写 Property 3 属性测试：分类删除后不可查询

    - **Property 3: 分类删除后不可查询**
    - **Validates: Requirements 4.6**

- [x] 3. 实现产品管理模块
  - [x] 3.1 创建 Product Admin Manager 模块
    - 实现 getProducts 获取产品列表（支持分页和筛选）
    - 实现 getProductById 根据ID获取产品
    - 实现 addProduct 新增产品
    - 实现 updateProduct 更新产品
    - 实现 deleteProduct 删除产品
    - 实现 updateProductStatus 更新产品状态
    - 实现 batchUpdateStatus 批量更新状态
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.4, 7.4, 8.2, 9.1, 9.2_
  - [x] 3.2 编写 Property 4 属性测试：产品新增后可查询

    - **Property 4: 产品新增后可查询**
    - **Validates: Requirements 6.6**
  - [x] 3.3 编写 Property 5 属性测试：产品修改后数据一致

    - **Property 5: 产品修改后数据一致**
    - **Validates: Requirements 7.6**
  - [x] 3.4 编写 Property 6 属性测试：产品删除后不可查询

    - **Property 6: 产品删除后不可查询**
    - **Validates: Requirements 8.4**
  - [x] 3.5 编写 Property 7 属性测试：产品状态变更一致性

    - **Property 7: 产品状态变更一致性**
    - **Validates: Requirements 9.5**

- [x] 4. 检查点 - 确保核心模块测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 实现分类管理云函数
  - [x] 5.1 创建 categoryAdmin 云函数
    - 实现 getCategories action
    - 实现 getCategoryById action
    - 实现 addCategory action
    - 实现 updateCategory action
    - 实现 deleteCategory action
    - _Requirements: 1.1, 2.3, 3.3, 4.4_

- [x] 6. 实现产品管理云函数
  - [x] 6.1 更新 productManager 云函数
    - 添加 addProduct action
    - 添加 updateProduct action
    - 添加 deleteProduct action
    - 添加 updateProductStatus action
    - _Requirements: 6.4, 7.4, 8.2, 9.1, 9.2_

- [x] 7. 实现分类管理页面
  - [x] 7.1 创建分类管理页面
    - 实现分类列表展示
    - 实现分类搜索功能
    - 实现新增、编辑、删除按钮
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 7.2 创建分类表单页面
    - 实现分类信息表单
    - 实现表单验证
    - 实现提交和取消功能
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  - [x] 7.3 实现分类删除功能
    - 实现删除确认对话框
    - 实现关联产品检查
    - 实现删除操作
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. 实现产品管理页面
  - [x] 8.1 创建产品管理页面
    - 实现产品列表展示
    - 实现分类筛选功能
    - 实现产品搜索功能
    - 实现分页加载
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 8.2 创建产品表单页面
    - 实现产品信息表单
    - 实现分类选择下拉框
    - 实现图片上传功能
    - 实现表单验证
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  - [x] 8.3 实现产品删除功能
    - 实现删除确认对话框
    - 实现删除操作
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 8.4 实现上架下架功能
    - 实现状态切换按钮
    - 实现状态更新操作
    - 实现列表状态刷新
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 9. 检查点 - 确保页面功能测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 实现产品视频上传功能
  - [x] 10.1 在产品表单页面添加视频上传UI
    - 在 `pages/product-form/product-form.wxml` 添加视频预览和上传按钮
    - 在 `pages/product-form/product-form.wxss` 添加视频上传样式
    - _Requirements: 18.1, 18.4_
  - [x] 10.2 实现视频上传逻辑
    - 在 `pages/product-form/product-form.js` 添加 `videoUrl` 字段到 formData
    - 实现 `chooseVideo()` 方法选择和上传视频
    - 实现 `removeVideo()` 方法删除视频
    - 视频命名格式: `products/videos/{category}/{productId}_video.mp4`
    - _Requirements: 18.2, 18.3, 18.5, 18.6, 18.7_
  - [x] 10.3 更新产品管理模块支持视频
    - 在 `utils/productAdminManager.js` 的 `addProduct` 和 `updateProduct` 中添加 `videoUrl` 字段
    - 在 `cloudfunctions/productManager/index.js` 的 `getProducts` 返回中添加 `videoUrl` 字段
    - _Requirements: 18.8_

- [x] 11. 集成和优化
  - [x] 11.1 集成到现有管理后台
    - 在 admin 页面添加分类管理和产品管理入口
    - 实现页面导航
    - _Requirements: 1.1, 5.1_
  - [x] 11.2 实现错误处理
    - 添加数据加载失败提示
    - 添加操作失败提示
    - 添加网络错误处理
    - _Requirements: 1.3, 10.4_
  - [x] 11.3 实现权限验证
    - 验证管理员身份
    - 未授权时跳转到首页
    - _Requirements: 管理员权限_

- [x] 12. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快MVP开发
- 每个任务都引用了具体的需求编号以便追溯
- 检查点用于确保增量验证
- 属性测试用于验证CRUD操作的正确性
- 云函数需要部署到微信云开发环境
