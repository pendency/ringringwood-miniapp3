# Implementation Plan: Category Image Upload Enhancement

## Overview

本实现计划将分类图片上传功能的改进分解为具体的编码任务。主要工作包括：在管理员后台页面添加分类选择器、改进图片上传流程、添加预览功能，以及编写相应的测试。

## Tasks

- [x] 1. 扩展页面数据和添加分类选择器方法
  - 在 `pages/admin/admin.js` 的 data 中添加 `selectedCategoryForUpload`、`categoryUploadType`、`categoryTempImage`、`categoryUploading` 字段
  - 添加 `onCategorySelectChange` 方法处理分类选择器变更
  - 添加 `resetCategoryUploadState` 方法重置上传状态
  - _Requirements: 1.1, 1.4, 2.1, 2.2_

- [x] 2. 实现分类图片上传功能
  - [x] 2.1 添加 `chooseCategoryIconForUpload` 方法处理图标上传
    - 检查是否已选择分类，未选择时显示提示
    - 调用 `wx.chooseMedia` 选择图片
    - 设置 `categoryUploadType` 为 'icon'
    - 设置 `categoryTempImage` 为临时图片路径
    - _Requirements: 2.3, 2.4, 3.1_
  
  - [x] 2.2 添加 `chooseCategoryImageForUpload` 方法处理图片上传
    - 检查是否已选择分类，未选择时显示提示
    - 调用 `wx.chooseMedia` 选择图片
    - 设置 `categoryUploadType` 为 'image'
    - 设置 `categoryTempImage` 为临时图片路径
    - _Requirements: 2.3, 2.4, 3.2_
  
  - [x] 2.3 添加 `confirmCategoryImageUpload` 方法确认上传
    - 上传图片到云存储
    - 调用云函数更新分类数据
    - 显示成功/失败提示
    - 刷新分类列表
    - _Requirements: 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.4 添加 `cancelCategoryImageUpload` 方法取消上传
    - 清除临时图片
    - 重置上传类型
    - _Requirements: 3.3_

- [x] 3. 更新页面模板添加分类选择器UI
  - [x] 3.1 在 `pages/admin/admin.wxml` 分类管理标签页中添加分类选择器
    - 使用 picker 组件实现下拉选择
    - 显示"请选择分类"占位文本
    - 分类列表为空时显示提示信息
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 添加当前分类预览区域
    - 显示已选分类的名称
    - 显示已选分类的图标预览（如果有）
    - 显示已选分类的图片预览（如果有）
    - _Requirements: 5.2_
  
  - [x] 3.3 更新上传按钮区域
    - 根据是否选择分类控制按钮禁用状态
    - 根据分类是否有图标/图片显示不同按钮文本
    - 添加上传中状态显示
    - _Requirements: 2.3, 2.4, 5.3_
  
  - [x] 3.4 添加图片预览和确认上传弹窗
    - 显示待上传的图片预览
    - 提供确认和取消按钮
    - 显示上传进度状态
    - _Requirements: 3.3, 4.1_

- [x] 4. 添加样式支持
  - 在 `pages/admin/admin.wxss` 中添加分类选择器样式
  - 添加分类预览区域样式
  - 添加上传按钮状态样式（禁用/启用）
  - 保持与现有页面风格一致
  - _Requirements: 5.1, 5.4_

- [x] 5. Checkpoint - 功能验证
  - 确保所有功能正常工作
  - 测试分类选择、图片上传、预览显示
  - 如有问题请告知

- [x] 6. 编写属性测试
  - [x] 6.1 编写 Property 1 测试：分类选择器数据完整性
    - **Property 1: 分类选择器数据完整性**
    - **Validates: Requirements 1.2, 2.2**
  
  - [x] 6.2 编写 Property 2 测试：上传按钮状态联动
    - **Property 2: 上传按钮状态联动**
    - **Validates: Requirements 2.3, 2.4**
  
  - [x] 6.3 编写 Property 3 测试：分类字段更新正确性
    - **Property 3: 分类字段更新正确性**
    - **Validates: Requirements 3.5**
  
  - [x] 6.4 编写 Property 4 测试：错误信息显示
    - **Property 4: 错误信息显示**
    - **Validates: Requirements 4.3**
  
  - [x] 6.5 编写 Property 5 测试：分类预览和按钮文本显示
    - **Property 5: 分类预览和按钮文本显示**
    - **Validates: Requirements 5.2, 5.3**

- [x] 7. Final Checkpoint - 确保所有测试通过
  - 运行所有测试
  - 确保功能完整
  - 如有问题请告知

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
