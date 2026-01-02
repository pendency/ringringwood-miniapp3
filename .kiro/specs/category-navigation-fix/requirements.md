# Requirements Document

## Introduction

本文档定义了修复产品详情页返回分类页时导航错误的需求。当用户从某个分类（如"树脂定制款"）进入产品详情页后，点击返回按钮应该返回到原来的分类位置，而不是跳转到其他分类（如"树脂设计款"）。

## Glossary

- **Category_Page**: 分类页面，显示产品分类列表和对应分类下的产品
- **Product_Detail_Page**: 产品详情页面，显示单个产品的详细信息
- **Active_Tab**: 当前选中的分类索引，用于标识用户正在浏览的分类
- **Navigation_Stack**: 微信小程序的页面栈，记录用户的页面访问历史
- **Global_Data**: 全局数据对象，用于在页面间传递数据

## Requirements

### Requirement 1: 保持分类页状态

**User Story:** 作为用户，我希望从产品详情页返回分类页时，能够回到我之前浏览的分类位置，以便继续浏览该分类下的其他产品。

#### Acceptance Criteria

1. WHEN 用户从分类页进入产品详情页后点击返回按钮 THEN Category_Page SHALL 保持用户离开时的 Active_Tab 状态
2. WHEN 用户从分类页返回时 THEN Category_Page SHALL 不重新加载分类数据，除非有明确的刷新请求
3. WHEN 用户从分类页返回时 THEN Category_Page SHALL 保持产品列表的滚动位置
4. IF 分类页的 onShow 被触发且没有新的分类切换请求 THEN Category_Page SHALL 保持当前的 Active_Tab 不变

### Requirement 2: 区分导航来源

**User Story:** 作为开发者，我需要区分用户是从其他页面跳转到分类页还是从详情页返回，以便正确处理分类状态。

#### Acceptance Criteria

1. WHEN 用户从首页或侧边栏跳转到分类页并指定分类 THEN Category_Page SHALL 切换到指定的分类
2. WHEN 用户从产品详情页返回分类页 THEN Category_Page SHALL 不切换分类，保持原有状态
3. WHEN 全局数据中存在分类切换请求 THEN Category_Page SHALL 在处理后立即清除该请求
4. WHEN 分类页刷新数据时 THEN Category_Page SHALL 在刷新完成后恢复到之前选中的分类索引

### Requirement 3: 优化分类数据刷新策略

**User Story:** 作为用户，我希望分类页能够在需要时刷新数据，同时不影响我的浏览体验。

#### Acceptance Criteria

1. WHEN 用户首次进入分类页 THEN Category_Page SHALL 加载分类数据并默认选中第一个分类
2. WHEN 用户从详情页返回分类页 THEN Category_Page SHALL 不强制刷新分类数据
3. WHEN 用户下拉刷新分类页 THEN Category_Page SHALL 刷新分类数据并保持当前选中的分类
4. IF 分类数据需要刷新 THEN Category_Page SHALL 在刷新后恢复到之前的 Active_Tab 索引
