# Implementation Plan: Category Navigation Fix

## Overview

本实现计划描述了修复产品详情页返回分类页时导航错误的具体任务。主要修改集中在 `pages/category/category.js` 文件中的状态管理和生命周期方法。

## Tasks

- [x] 1. 修改分类页数据结构和初始化逻辑
  - [x] 1.1 在 data 对象中添加新的状态属性
    - 添加 `isFirstLoad: true` 标识首次加载
    - 添加 `lastActiveTab: 0` 保存刷新前的分类索引
    - _Requirements: 1.1, 2.4_
  - [x] 1.2 修改 onLoad 方法
    - 确保 `isFirstLoad` 在首次加载时为 true
    - _Requirements: 3.1_

- [x] 2. 修改 onShow 方法的刷新策略
  - [x] 2.1 重构 onShow 方法逻辑
    - 检查全局数据中是否有分类切换请求
    - 如果有请求，处理分类切换并清除全局数据
    - 如果没有请求且不是首次加载，保持当前状态不变
    - 移除无条件的 `loadCategoriesWithRefresh()` 调用
    - _Requirements: 1.1, 1.2, 1.4, 2.2, 2.3, 3.2_
  - [x] 2.2 编写 onShow 行为的属性测试
    - **Property 1: 返回时保持分类状态** (3/3 passed)
    - **Property 2: 返回时不触发数据刷新** (5/5 passed)
    - **Validates: Requirements 1.1, 1.2, 1.4, 2.2, 3.2**

- [x] 3. 修改 loadCategoriesWithRefresh 方法
  - [x] 3.1 添加分类索引保存和恢复逻辑
    - 在刷新前保存当前 `activeTab` 到 `lastActiveTab`
    - 刷新完成后，如果没有待切换的分类，恢复到 `lastActiveTab`
    - 处理索引越界的边界情况
    - _Requirements: 2.4, 3.3, 3.4_
  - [x] 3.2 编写刷新恢复的属性测试
    - **Property 4: 刷新后恢复分类状态**
    - **Validates: Requirements 2.4, 3.4**
    - **Test Results**: 5/5 passed

- [x] 4. 优化全局数据清理逻辑
  - [x] 4.1 确保分类切换请求处理后立即清除全局数据
    - 在处理完 categoryType 和 categoryId 后设置为 null
    - 避免残留数据影响后续导航
    - _Requirements: 2.3_
  - [x] 4.2 编写全局数据清理的属性测试
    - **Property 3: 分类切换请求正确设置全局状态**
    - **Validates: Requirements 1.3, 2.1, 2.3**
    - **Test Results**: 7/7 passed

- [x] 5. Checkpoint - 验证核心功能 (Integration Tests: passed)
  - 确保所有测试通过，手动测试导航流程
  - 测试场景：首页 → 分类页（选择树脂定制款）→ 详情页 → 返回
  - 验证返回后仍在树脂定制款分类
  - **Integration Test File**: `__tests__/integration/category-navigation.integration.test.js`
  - **Test Results**: 7/7 passed

- [x] 6. 编写指定分类跳转的属性测试
  - **Property 5: 指定分类跳转正确切换**
  - **Validates: Requirements 2.1**
  - **Test Results**: Covered in Property 3 tests (3.1-3.7)

- [x] 7. Final Checkpoint - 完整测试
  - 所有测试通过
  - **Integration Tests**: 7/7 passed
  - **Property Tests**: 14/14 passed
  - 验证多种导航场景的正确性

## Notes

- 所有任务都是必需的，包含完整的属性测试
- 主要修改集中在 `pages/category/category.js` 文件
- 不需要修改产品详情页或导航组件
- 修复方案向后兼容，不影响现有功能
