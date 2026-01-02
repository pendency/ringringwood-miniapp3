# Implementation Plan: Banner Management

## Overview

本实现计划基于现有的轮播图管理代码进行完善和修复。主要工作包括：修正云存储路径、完善数据验证、添加工具函数、编写测试用例。

## Tasks

- [x] 1. 修正云存储上传路径
  - [x] 1.1 修改 admin.js 中的 chooseBannerImage 方法，将上传路径改为 `banners/banner_{timestamp}.jpeg`
    - 当前路径 `ui/banners/` 需要改为 `banners/`
    - 确保文件名格式为 `banner_{timestamp}.{extension}`
    - _Requirements: 1.1, 1.2_

- [x] 2. 创建轮播图工具函数模块
  - [x] 2.1 创建 utils/bannerManager.js 文件
    - 实现 generateBannerFilename 函数
    - 实现 validateBannerData 函数
    - 实现 sortBanners 函数
    - 实现 validateProductId 函数
    - _Requirements: 1.2, 2.1, 5.2, 7.3_
  - [x] 2.2 编写属性测试：Banner Filename Format
    - **Property 1: Banner Filename Format**
    - **Validates: Requirements 1.2**
  - [x] 2.3 编写属性测试：Banner Sorting Order
    - **Property 4: Banner Sorting Order**
    - **Validates: Requirements 5.2, 6.2, 6.4**
  - [x] 2.4 编写属性测试：Product ID Validation
    - **Property 7: Product ID Validation**
    - **Validates: Requirements 7.3**

- [x] 3. Checkpoint - 确保工具函数测试通过
  - 运行所有属性测试，确保通过
  - 如有问题请询问用户

- [x] 4. 完善云函数轮播图处理逻辑
  - [x] 4.1 修改 productManager 云函数中的 addBanner action
    - 确保使用规范化的 banner ID 生成
    - 添加数据验证逻辑
    - 设置默认值（order=999, status=1）
    - _Requirements: 2.1, 2.2, 6.3_
  - [x] 4.2 修改 productManager 云函数中的 getBanners action
    - 确保按 order 升序排序
    - 相同 order 时按 createTime 排序
    - 支持 includeDisabled 参数
    - _Requirements: 5.2, 6.2, 6.4_
  - [x] 4.3 编写属性测试：Banner Data Completeness
    - **Property 2: Banner Data Completeness**
    - **Validates: Requirements 2.1**
  - [x] 4.4 编写属性测试：Banner ID Format
    - **Property 3: Banner ID Format**
    - **Validates: Requirements 2.2**

- [x] 5. 完善前端轮播图管理功能
  - [x] 5.1 修改 admin.js 中的 loadBanners 方法
    - 使用 bannerManager 的 sortBanners 函数
    - 处理空列表情况
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 5.2 修改 admin.js 中的 saveBanner 方法
    - 添加数据验证
    - 使用 bannerManager 的 validateBannerData 函数
    - _Requirements: 2.1, 7.3_
  - [x] 5.3 编写属性测试：Default Order Value
    - **Property 5: Default Order Value**
    - **Validates: Requirements 6.3**
  - [x] 5.4 编写属性测试：Optional Product ID
    - **Property 8: Optional Product ID**
    - **Validates: Requirements 7.1, 7.2**

- [x] 6. Checkpoint - 确保所有功能测试通过
  - 运行所有属性测试，确保通过
  - 如有问题请询问用户

- [x] 7. 完善更新和删除功能
  - [x] 7.1 修改 productManager 云函数中的 updateBanner action
    - 确保只更新提供的字段
    - 自动更新 updateTime
    - 处理图片替换时删除旧图片
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 7.2 验证 deleteBanner action 的图片删除逻辑
    - 确保删除数据库记录
    - 尝试删除云存储图片
    - 图片删除失败不影响记录删除
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 7.3 编写属性测试：Update Preserves Unchanged Fields
    - **Property 6: Update Preserves Unchanged Fields**
    - **Validates: Requirements 3.3**

- [x] 8. Final Checkpoint - 确保所有测试通过
  - 运行所有属性测试和单元测试
  - 验证功能完整性
  - 如有问题请询问用户

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 现有代码已实现大部分功能，主要工作是修正路径和添加验证
