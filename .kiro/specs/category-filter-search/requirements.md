# Requirements Document

## Introduction

本功能为产品分类页面增加筛选、搜索和排序功能，使用户能够通过长度、宽度等尺寸条件筛选产品，通过关键词搜索产品标题，以及按不同方式排序产品，从而更快速地找到所需产品。

产品尺寸数据存储在数据库的 `params` 数组中，格式为 `{ name: "规格 (cm)", value: "200*80*4.5" }`，其中第一个数字是长度，第二个数字是宽度。

## Glossary

- **Category_Page**: 产品分类页面，展示按分类组织的产品列表
- **Filter_Panel**: 筛选面板，包含长度和宽度的筛选选项
- **Search_Bar**: 搜索栏，用于输入关键词搜索产品标题
- **Filter_Button**: 筛选按钮，点击后展开筛选面板
- **Length_Filter**: 长度筛选器，用于按产品长度范围筛选
- **Width_Filter**: 宽度筛选器，用于按产品平均宽度范围筛选
- **Sort_Selector**: 排序选择器，用于选择产品排序方式
- **Product_List**: 产品列表，显示筛选、搜索和排序结果

## Requirements

### Requirement 1: 筛选按钮和面板

**User Story:** As a user, I want to click a filter button to see length and width filter options, so that I can narrow down products by dimensions.

#### Acceptance Criteria

1. THE Category_Page SHALL display a Filter_Button in the product content area header
2. WHEN a user clicks the Filter_Button, THE Filter_Panel SHALL expand to show Length_Filter and Width_Filter options
3. WHEN the Filter_Panel is open and user clicks the Filter_Button again, THE Filter_Panel SHALL collapse and hide
4. THE Filter_Panel SHALL display predefined length range options for user selection
5. THE Filter_Panel SHALL display predefined width range options for user selection
6. WHEN a user selects a length or width option, THE Filter_Panel SHALL visually indicate the selected option

### Requirement 2: 长度筛选功能

**User Story:** As a user, I want to filter products by length range, so that I can find products that fit my space requirements.

#### Acceptance Criteria

1. THE Length_Filter SHALL provide the following predefined length range options: 不限, 150cm以下, 150-180cm, 180-210cm, 210-240cm, 240-270cm, 270-300cm, 300-350cm, 350-400cm, 400-500cm, 500cm以上
2. WHEN a user selects a length range, THE Product_List SHALL display only products within that length range
3. WHEN a user selects "不限", THE Product_List SHALL show all products without length filtering
4. WHEN a user clears the length filter, THE Product_List SHALL restore to show all products matching other active filters
5. THE Length_Filter SHALL support single selection mode (only one range can be active at a time)
6. THE Length_Filter SHALL parse length from product params array where name contains "规格" and value format is "长度*宽度*高度"

### Requirement 3: 平均宽度筛选功能

**User Story:** As a user, I want to filter products by average width range, so that I can find products that match my width requirements.

#### Acceptance Criteria

1. THE Width_Filter SHALL provide the following predefined width range options: 不限, 60cm以下, 60-80cm, 80-100cm, 100-120cm, 120-140cm, 140cm以上
2. WHEN a user selects a width range, THE Product_List SHALL display only products within that width range
3. WHEN a user selects "不限", THE Product_List SHALL show all products without width filtering
4. WHEN a user clears the width filter, THE Product_List SHALL restore to show all products matching other active filters
5. THE Width_Filter SHALL support single selection mode (only one range can be active at a time)
6. THE Width_Filter SHALL parse width from product params array where name contains "规格" and value format is "长度*宽度*高度"

### Requirement 4: 搜索栏功能

**User Story:** As a user, I want to search products by title keywords, so that I can quickly find specific products.

#### Acceptance Criteria

1. THE Category_Page SHALL display a Search_Bar in the product content area header
2. WHEN a user types in the Search_Bar, THE Product_List SHALL filter to show only products whose title contains the search keyword
3. THE Search_Bar SHALL support real-time filtering as user types (with debounce to optimize performance)
4. WHEN the Search_Bar is empty, THE Product_List SHALL show all products matching other active filters
5. THE Search_Bar SHALL provide a clear button to quickly remove the search keyword
6. THE search matching SHALL be case-insensitive

### Requirement 5: 组合筛选

**User Story:** As a user, I want to combine multiple filters and search, so that I can precisely find products meeting all my criteria.

#### Acceptance Criteria

1. WHEN multiple filters are active (length, width, search), THE Product_List SHALL display only products matching ALL active criteria
2. THE Category_Page SHALL display active filter indicators showing current filter state
3. WHEN a user clicks a "clear all filters" option, THE Category_Page SHALL reset all filters and search to default state
4. THE filter and search state SHALL be preserved when switching between categories within the same session

### Requirement 6: 空结果处理

**User Story:** As a user, I want to see helpful feedback when no products match my filters, so that I know to adjust my criteria.

#### Acceptance Criteria

1. WHEN no products match the current filter and search criteria, THE Category_Page SHALL display an empty state message
2. THE empty state message SHALL suggest the user to adjust filter criteria or clear filters
3. THE empty state SHALL provide a quick action button to clear all filters

### Requirement 7: 排序功能

**User Story:** As a user, I want to sort products by different criteria, so that I can find products more easily based on my preferences.

#### Acceptance Criteria

1. THE Category_Page SHALL display a Sort_Selector next to the Filter_Button
2. THE Sort_Selector SHALL provide the following sorting options: 默认排序, 最新优先, 价格升序, 价格降序
3. WHEN a user selects "默认排序", THE Product_List SHALL display products in their original order
4. WHEN a user selects "最新优先", THE Product_List SHALL display products sorted by creation date in descending order (newest first)
5. WHEN a user selects "价格升序", THE Product_List SHALL display products sorted by price in ascending order (lowest first)
6. WHEN a user selects "价格降序", THE Product_List SHALL display products sorted by price in descending order (highest first)
7. THE Sort_Selector SHALL visually indicate the currently selected sorting option
8. THE sorting SHALL be applied after filtering, so filtered results are sorted according to the selected option
9. WHEN products have "联系销售" as price, THE sorting by price SHALL treat them as having the highest price value
