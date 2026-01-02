# Implementation Plan: Category Filter and Search

## Overview

为微信小程序产品分类页面实现筛选、搜索和排序功能，包括长度/宽度范围筛选、标题关键词搜索和多种排序方式。

## Tasks

- [x] 1. 创建产品筛选工具模块
  - [x] 1.1 创建 `utils/productFilter.js` 文件，实现核心筛选逻辑
    - 实现 `parseSize()` 函数解析产品尺寸字符串
    - 实现 `filterByKeyword()` 函数进行标题搜索
    - 实现 `filterByLength()` 和 `filterByWidth()` 函数进行尺寸筛选
    - 实现 `applyFilters()` 函数组合所有筛选条件
    - _Requirements: 2.2, 3.2, 4.2, 5.1_
  - [x] 1.2 编写 `parseSize()` 函数的属性测试
    - **Property 6: Size Parsing Consistency**
    - **Validates: Requirements 2.6, 3.6**
  - [x] 1.3 编写组合筛选的属性测试
    - **Property 3: Combined Filter Correctness**
    - **Validates: Requirements 2.2, 3.2, 4.2, 5.1**

- [x] 2. 更新筛选选项配置
  - [x] 2.1 更新 `utils/productFilter.js` 中的 FILTER_OPTIONS 配置
    - 更新长度选项：不限, 150cm以下, 150-180cm, 180-210cm, 210-240cm, 240-270cm, 270-300cm, 300-350cm, 350-400cm, 400-500cm, 500cm以上
    - 更新宽度选项：不限, 60cm以下, 60-80cm, 80-100cm, 100-120cm, 120-140cm, 140cm以上
    - _Requirements: 2.1, 3.1_
  - [x] 2.2 更新 `pages/category/category.js` 中的 lengthOptions 和 widthOptions
    - 同步更新筛选选项配置
    - 添加 "不限" 选项的处理逻辑
    - _Requirements: 2.1, 2.3, 3.1, 3.3_

- [x] 3. 实现排序功能
  - [x] 3.1 在 `utils/productFilter.js` 中添加排序函数
    - 实现 `sortProducts()` 函数支持四种排序方式
    - 实现 `parsePrice()` 函数解析价格（处理 "联系销售"）
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.9_
  - [x] 3.2 在 `pages/category/category.js` 中添加排序相关数据和方法
    - 添加 sortOption、showSortDropdown、sortOptions 数据字段
    - 实现 `toggleSortDropdown()` 切换排序下拉菜单
    - 实现 `selectSortOption()` 选择排序方式
    - 更新 `applyAllFilters()` 在筛选后应用排序
    - _Requirements: 7.1, 7.2, 7.7, 7.8_
  - [x] 3.3 在 `pages/category/category.wxml` 中添加排序选择器 UI
    - 在筛选按钮旁边添加排序选择器
    - 添加排序下拉菜单
    - _Requirements: 7.1, 7.2, 7.7_
  - [x] 3.4 在 `pages/category/category.wxss` 中添加排序选择器样式
    - _Requirements: 7.1, 7.7_
  - [ ]* 3.5 编写排序正确性的属性测试
    - **Property 8: Sorting Correctness**
    - **Validates: Requirements 7.4, 7.5, 7.6, 7.9**
  - [ ]* 3.6 编写排序在筛选后应用的属性测试
    - **Property 9: Sorting Applied After Filtering**
    - **Validates: Requirements 7.8**

- [x] 4. 更新筛选面板 UI
  - [x] 4.1 更新 `pages/category/category.wxml` 中的筛选面板
    - 更新长度筛选选项显示
    - 更新宽度筛选选项显示
    - 添加 "不限" 选项的特殊样式
    - _Requirements: 1.4, 1.5, 2.1, 3.1_
  - [x] 4.2 更新 `pages/category/category.wxss` 中的筛选面板样式
    - 调整筛选选项布局以适应更多选项
    - _Requirements: 1.4, 1.5_

- [x] 5. 更新筛选逻辑处理 "不限" 选项
  - [x] 5.1 更新 `pages/category/category.js` 中的筛选方法
    - 更新 `selectLengthFilter()` 处理 "不限" 选项
    - 更新 `selectWidthFilter()` 处理 "不限" 选项
    - 更新 `applyAllFilters()` 跳过 "不限" 筛选
    - _Requirements: 2.3, 3.3_

- [x] 6. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 确保筛选、搜索和排序功能正常工作
  - 如有问题请询问用户

- [x] 7. 集成测试和优化
  - [x] 7.1 在真机上测试筛选、搜索和排序功能
    - 测试各种筛选组合
    - 测试排序功能
    - 测试 "不限" 选项
    - 测试 "联系销售" 价格排序
    - _Requirements: 1.1-7.9_

## Notes

- 标记 `*` 的任务为可选测试任务
- 产品尺寸数据来自 `params` 数组中的 "规格" 字段，格式为 "长度*宽度*高度"
- 搜索使用防抖机制，延迟 300ms 执行筛选
- 排序在筛选后应用，确保筛选结果按选定方式排序
- "联系销售" 价格在排序时视为最高价格
