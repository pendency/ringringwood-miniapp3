# Implementation Plan: Customer Cases Feature

## Overview

本实现计划将客户案例功能分解为可执行的编码任务。按照数据层 → 工具模块 → 云函数 → 前端页面 → 管理后台的顺序实现，确保每个步骤都能增量验证。

## Tasks

- [x] 1. 创建案例管理工具模块
  - [x] 1.1 创建 utils/caseManager.js 基础结构
    - 创建文件并定义模块导出结构
    - 实现 validateCaseData 函数（验证案例数据完整性）
    - 实现 validateImageFile 函数（验证图片格式和大小）
    - 实现 sortCases 函数（按 order 和 createTime 排序）
    - _Requirements: 3.1, 4.4, 6.1, 6.5_

  - [x] 1.2 编写 caseManager 属性测试
    - **Property 3: Case Data Completeness**
    - **Property 5: Image Validation**
    - **Property 8: Case Sorting**
    - **Validates: Requirements 3.1, 4.4, 6.1, 6.5**

  - [x] 1.3 实现案例数据操作函数
    - 实现 generateNextCaseId 函数（生成下一个案例ID）
    - 实现 getActiveCases 函数（获取启用的案例）
    - 实现 getAllCases 函数（获取所有案例）
    - 实现 createCase 函数（创建案例）
    - 实现 updateCase 函数（更新案例）
    - 实现 deleteCase 函数（删除案例）
    - _Requirements: 3.2, 3.4, 3.5, 4.5, 4.7, 6.2_

  - [x] 1.4 编写案例ID生成和过滤属性测试
    - **Property 4: Case ID and Image Path Generation**
    - **Property 9: Active Case Filtering**
    - **Validates: Requirements 3.2, 5.1, 5.2, 6.2**

- [x] 2. 扩展云函数支持案例管理
  - [x] 2.1 在 productManager 云函数中添加案例操作
    - 添加 getCases action（获取案例列表）
    - 添加 addCase action（新增案例）
    - 添加 updateCase action（更新案例）
    - 添加 deleteCase action（删除案例）
    - 添加 getNextCaseId action（获取下一个案例ID）
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.5, 4.7_

- [x] 3. 扩展图片上传模块
  - [x] 3.1 在 cloudUploader.js 中添加案例图片上传函数
    - 实现 uploadCaseImage 函数
    - 按照 cases/case{number}.{ext} 格式命名
    - 保留原始文件扩展名
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Checkpoint - 确保工具模块和云函数正常工作
  - 运行属性测试确保通过
  - 如有问题请询问用户

- [x] 5. 创建案例展示页面
  - [x] 5.1 创建 pages/customer-cases 页面文件
    - 创建 customer-cases.js（页面逻辑）
    - 创建 customer-cases.wxml（页面结构，参考 new-products 页面）
    - 创建 customer-cases.wxss（页面样式）
    - 创建 customer-cases.json（页面配置）
    - 在 app.json 中注册页面
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.2 编写案例计数属性测试
    - **Property 2: Case Count Display Accuracy**
    - **Validates: Requirements 2.2**

- [x] 6. 在分类页面添加案例入口按钮
  - [x] 6.1 修改 category.wxml 添加案例入口按钮
    - 在产品数量和产品列表之间添加按钮
    - 仅在 cat_custom 分类显示
    - 样式参考首页"立即选购"按钮
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 6.2 修改 category.js 添加导航函数
    - 实现 navigateToCases 函数
    - _Requirements: 1.4_

  - [x] 6.3 修改 category.wxss 添加按钮样式
    - 添加 .case-entry 相关样式
    - _Requirements: 1.2_

  - [x] 6.4 编写按钮可见性属性测试
    - **Property 1: Case Button Visibility**
    - **Validates: Requirements 1.5**

- [x] 7. Checkpoint - 确保前端页面正常工作
  - 验证案例展示页面可以正常加载和显示
  - 验证分类页面按钮正确显示和跳转
  - 如有问题请询问用户

- [x] 8. 在管理后台添加案例管理功能
  - [x] 8.1 修改 admin.wxml 添加案例管理标签页
    - 添加"案例管理"标签
    - 添加案例列表展示区域
    - 添加新增/编辑案例表单弹窗
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 修改 admin.js 添加案例管理逻辑
    - 添加案例相关 data 字段
    - 实现 loadCases 函数（加载案例列表）
    - 实现 showAddCaseForm 函数（显示新增表单）
    - 实现 editCase 函数（编辑案例）
    - 实现 deleteCase 函数（删除案例）
    - 实现 saveCase 函数（保存案例）
    - 实现 chooseCaseImage 函数（选择案例图片）
    - _Requirements: 4.2, 4.3, 4.5, 4.6, 4.7, 4.8_

  - [x] 8.3 修改 admin.wxss 添加案例管理样式
    - 添加案例列表样式
    - 添加案例表单样式
    - _Requirements: 4.2, 4.3_

  - [x] 8.4 编写案例编辑预填充属性测试
    - **Property 7: Case Edit Form Pre-population**
    - **Validates: Requirements 4.6**

- [x] 9. Final Checkpoint - 确保所有功能正常工作 ✅
  - 运行所有测试确保通过 ✅ (47 property tests passed)
  - 验证完整的案例管理流程（新增、编辑、删除） ✅
  - 验证前端展示页面正确显示案例 ✅
  - 如有问题请询问用户

## Notes

- All tasks are required including property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 页面样式参考现有的 new-products 页面和首页"立即选购"按钮
- 云存储路径遵循 `.kiro/specs/id-naming-convention.md` 中的命名规范
