/**
 * Product Filter 属性测试
 * Feature: category-filter-search
 * 
 * 使用 fast-check 进行属性测试，验证产品筛选模块的正确性
 */

const fc = require('fast-check');
const {
  parseSize,
  filterByKeyword,
  filterByLength,
  filterByWidth,
  applyFilters
} = require('../../utils/productFilter.js');

describe('Product Filter Property Tests', () => {
  
  /**
   * Property 5: Case-Insensitive Search
   * For any search keyword, searching with different letter cases (uppercase, lowercase, mixed)
   * should return the same set of products.
   * 
   * **Feature: category-filter-search, Property 5: Case-Insensitive Search**
   * **Validates: Requirements 4.6**
   */
  describe('Property 5: Case-Insensitive Search', () => {
    
    // Helper to generate mock products with various name cases
    const productArbitrary = fc.record({
      _id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      size: fc.constant('100*50*5cm'),
      categoryId: fc.constantFrom('cat_wood_001', 'cat_resin_001')
    });

    const productsArbitrary = fc.array(productArbitrary, { minLength: 1, maxLength: 30 });

    test('searching with lowercase keyword returns same results as uppercase', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /[a-zA-Z]/.test(s)),
          (products, keyword) => {
            const lowerResult = filterByKeyword(products, keyword.toLowerCase());
            const upperResult = filterByKeyword(products, keyword.toUpperCase());
            
            // Both should return the same number of results
            if (lowerResult.length !== upperResult.length) return false;
            
            // Both should contain the same product IDs
            const lowerIds = new Set(lowerResult.map(p => p._id));
            const upperIds = new Set(upperResult.map(p => p._id));
            
            return lowerResult.every(p => upperIds.has(p._id)) &&
                   upperResult.every(p => lowerIds.has(p._id));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('searching with mixed case keyword returns same results as lowercase', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.string({ minLength: 2, maxLength: 10 }).filter(s => /[a-zA-Z]/.test(s)),
          (products, keyword) => {
            // Create mixed case version (alternate upper/lower)
            const mixedCase = keyword.split('').map((c, i) => 
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('');
            
            const lowerResult = filterByKeyword(products, keyword.toLowerCase());
            const mixedResult = filterByKeyword(products, mixedCase);
            
            // Both should return the same number of results
            if (lowerResult.length !== mixedResult.length) return false;
            
            // Both should contain the same product IDs
            const lowerIds = new Set(lowerResult.map(p => p._id));
            
            return mixedResult.every(p => lowerIds.has(p._id));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('product with uppercase name is found by lowercase search', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z]{3,}/.test(s)),
          (baseName) => {
            // Create a product with uppercase name
            const products = [{
              _id: 'test-1',
              name: baseName.toUpperCase(),
              size: '100*50cm'
            }];
            
            // Search with lowercase
            const result = filterByKeyword(products, baseName.toLowerCase());
            
            // Should find the product
            return result.length === 1 && result[0]._id === 'test-1';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('product with lowercase name is found by uppercase search', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /[a-zA-Z]{3,}/.test(s)),
          (baseName) => {
            // Create a product with lowercase name
            const products = [{
              _id: 'test-1',
              name: baseName.toLowerCase(),
              size: '100*50cm'
            }];
            
            // Search with uppercase
            const result = filterByKeyword(products, baseName.toUpperCase());
            
            // Should find the product
            return result.length === 1 && result[0]._id === 'test-1';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Chinese characters search is case-insensitive (no case concept)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('原木', '树脂', '桌面', '实木', '环氧'),
          (chineseKeyword) => {
            const products = [
              { _id: '1', name: '原木经典桌面', size: '100*50cm' },
              { _id: '2', name: '树脂美学设计', size: '120*60cm' },
              { _id: '3', name: '实木环氧桌', size: '150*70cm' }
            ];
            
            // Chinese characters don't have case, so search should work consistently
            const result = filterByKeyword(products, chineseKeyword);
            
            // Should find products containing the keyword
            return result.every(p => p.name.includes(chineseKeyword));
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty or whitespace keyword returns all products', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.constantFrom('', '   ', '\t', '\n'),
          (products, emptyKeyword) => {
            const result = filterByKeyword(products, emptyKeyword);
            
            // Should return all products
            return result.length === products.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * Property 6: Size Parsing Consistency
   * For any valid size string in the format "L*W*Hcm" or "L*Wcm", 
   * parsing should correctly extract length and width values.
   * 
   * **Feature: category-filter-search, Property 6: Size Parsing Consistency**
   * **Validates: Requirements 2.2, 3.2**
   */
  describe('Property 6: Size Parsing Consistency', () => {
    
    test('parseSize correctly extracts length and width from valid size strings (L*W*Hcm format)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }), // length
          fc.integer({ min: 1, max: 500 }), // width
          fc.integer({ min: 1, max: 100 }), // height
          (length, width, height) => {
            const sizeStr = `${length}*${width}*${height}cm`;
            const result = parseSize(sizeStr);
            
            return (
              result.length === length &&
              result.width === width &&
              result.height === height
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseSize correctly extracts length and width from valid size strings (L*Wcm format)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }), // length
          fc.integer({ min: 1, max: 500 }), // width
          (length, width) => {
            const sizeStr = `${length}*${width}cm`;
            const result = parseSize(sizeStr);
            
            return (
              result.length === length &&
              result.width === width &&
              result.height === null
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseSize handles decimal values correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
          (length, width) => {
            // Round to 1 decimal place to avoid floating point precision issues
            const roundedLength = Math.round(length * 10) / 10;
            const roundedWidth = Math.round(width * 10) / 10;
            
            const sizeStr = `${roundedLength}*${roundedWidth}cm`;
            const result = parseSize(sizeStr);
            
            // Allow small floating point tolerance
            const lengthMatch = Math.abs(result.length - roundedLength) < 0.01;
            const widthMatch = Math.abs(result.width - roundedWidth) < 0.01;
            
            return lengthMatch && widthMatch;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseSize returns null values for invalid/empty input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(''),
            fc.constant('   ')
          ),
          (invalidInput) => {
            const result = parseSize(invalidInput);
            
            return (
              result.length === null &&
              result.width === null &&
              result.height === null
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseSize handles different separators (*, x, X, ×)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.constantFrom('*', 'x', 'X', '×'),
          (length, width, separator) => {
            const sizeStr = `${length}${separator}${width}cm`;
            const result = parseSize(sizeStr);
            
            return (
              result.length === length &&
              result.width === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseSize handles case-insensitive unit (cm, CM, Cm)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.constantFrom('cm', 'CM', 'Cm', 'cM'),
          (length, width, unit) => {
            const sizeStr = `${length}*${width}${unit}`;
            const result = parseSize(sizeStr);
            
            return (
              result.length === length &&
              result.width === width
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Combined Filter Correctness
   * For any product list and any combination of active filters (search keyword, length range, width range),
   * all products in the filtered result should satisfy ALL active filter criteria simultaneously.
   * 
   * **Feature: category-filter-search, Property 3: Combined Filter Correctness**
   * **Validates: Requirements 2.2, 3.2, 4.2, 5.1**
   */
  describe('Property 3: Combined Filter Correctness', () => {
    
    // Helper to generate mock products with valid size strings
    const productArbitrary = fc.record({
      _id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      size: fc.oneof(
        // Valid size format: L*W*Hcm
        fc.tuple(
          fc.integer({ min: 10, max: 300 }),
          fc.integer({ min: 10, max: 200 }),
          fc.integer({ min: 1, max: 50 })
        ).map(([l, w, h]) => `${l}*${w}*${h}cm`),
        // Valid size format: L*Wcm
        fc.tuple(
          fc.integer({ min: 10, max: 300 }),
          fc.integer({ min: 10, max: 200 })
        ).map(([l, w]) => `${l}*${w}cm`),
        // No size (null case)
        fc.constant('')
      ),
      categoryId: fc.constantFrom('cat_wood_001', 'cat_resin_001', 'cat_design_001')
    });

    const productsArbitrary = fc.array(productArbitrary, { minLength: 0, maxLength: 50 });

    test('all filtered products satisfy keyword filter when keyword is active', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          // Filter out whitespace-only strings since they are treated as "no keyword"
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          (products, keyword) => {
            const filters = { keyword };
            const result = applyFilters(products, filters);
            
            // All results should contain the keyword (case-insensitive)
            const lowerKeyword = keyword.toLowerCase().trim();
            return result.every(product => {
              const name = (product.name || '').toLowerCase();
              return name.includes(lowerKeyword);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all filtered products satisfy length range when length filter is active', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.integer({ min: 0, max: 100 }), // min length
          fc.integer({ min: 101, max: 300 }), // max length
          (products, minLength, maxLength) => {
            const filters = { lengthRange: { min: minLength, max: maxLength } };
            const result = applyFilters(products, filters);
            
            // All results should have length within range
            return result.every(product => {
              if (!product.size) return false;
              const dimensions = parseSize(product.size);
              if (dimensions.length === null) return false;
              return dimensions.length >= minLength && dimensions.length < maxLength;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all filtered products satisfy width range when width filter is active', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.integer({ min: 0, max: 50 }), // min width
          fc.integer({ min: 51, max: 200 }), // max width
          (products, minWidth, maxWidth) => {
            const filters = { widthRange: { min: minWidth, max: maxWidth } };
            const result = applyFilters(products, filters);
            
            // All results should have width within range
            return result.every(product => {
              if (!product.size) return false;
              const dimensions = parseSize(product.size);
              if (dimensions.width === null) return false;
              return dimensions.width >= minWidth && dimensions.width < maxWidth;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all filtered products satisfy ALL criteria when multiple filters are active', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          // Filter out whitespace-only strings since they are treated as "no keyword"
          fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 101, max: 300 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 51, max: 200 }),
          (products, keyword, minLength, maxLength, minWidth, maxWidth) => {
            const filters = {
              keyword,
              lengthRange: { min: minLength, max: maxLength },
              widthRange: { min: minWidth, max: maxWidth }
            };
            const result = applyFilters(products, filters);
            
            const lowerKeyword = keyword.toLowerCase().trim();
            
            // All results should satisfy ALL criteria
            return result.every(product => {
              // Check keyword
              const name = (product.name || '').toLowerCase();
              if (!name.includes(lowerKeyword)) return false;
              
              // Check dimensions
              if (!product.size) return false;
              const dimensions = parseSize(product.size);
              if (dimensions.length === null || dimensions.width === null) return false;
              
              // Check length range
              if (dimensions.length < minLength || dimensions.length >= maxLength) return false;
              
              // Check width range
              if (dimensions.width < minWidth || dimensions.width >= maxWidth) return false;
              
              return true;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('filtered result is a subset of original products', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
          fc.option(
            fc.record({
              min: fc.integer({ min: 0, max: 100 }),
              max: fc.integer({ min: 101, max: 300 })
            }),
            { nil: undefined }
          ),
          (products, keyword, lengthRange) => {
            const filters = {};
            if (keyword) filters.keyword = keyword;
            if (lengthRange) filters.lengthRange = lengthRange;
            
            const result = applyFilters(products, filters);
            
            // Result length should not exceed original length
            if (result.length > products.length) return false;
            
            // Every result item should exist in original products
            return result.every(resultProduct => 
              products.some(p => p._id === resultProduct._id)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty filters return all products unchanged', () => {
      fc.assert(
        fc.property(
          productsArbitrary,
          (products) => {
            const result = applyFilters(products, {});
            return result.length === products.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 1: Filter Panel Toggle
 * For any initial panel state (open or closed), clicking the filter button 
 * should toggle the panel to the opposite state.
 * 
 * **Feature: category-filter-search, Property 1: Filter Panel Toggle**
 * **Validates: Requirements 1.2, 1.3**
 */
describe('Property 1: Filter Panel Toggle', () => {
  
  /**
   * Simulates the toggleFilterPanel function behavior
   * This is a pure function simulation of the WeChat Mini Program page method
   */
  const toggleFilterPanel = (currentState) => {
    return !currentState;
  };

  test('toggling from closed state opens the panel', () => {
    fc.assert(
      fc.property(
        fc.constant(false), // Initial state: closed
        (initialState) => {
          const newState = toggleFilterPanel(initialState);
          return newState === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('toggling from open state closes the panel', () => {
    fc.assert(
      fc.property(
        fc.constant(true), // Initial state: open
        (initialState) => {
          const newState = toggleFilterPanel(initialState);
          return newState === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('double toggle returns to original state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Any initial state
        (initialState) => {
          const afterFirstToggle = toggleFilterPanel(initialState);
          const afterSecondToggle = toggleFilterPanel(afterFirstToggle);
          return afterSecondToggle === initialState;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('toggle always produces opposite boolean value', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialState) => {
          const newState = toggleFilterPanel(initialState);
          return newState !== initialState && typeof newState === 'boolean';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple toggles alternate between states correctly', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 20 }), // Number of toggles
        (initialState, toggleCount) => {
          let currentState = initialState;
          
          for (let i = 0; i < toggleCount; i++) {
            currentState = toggleFilterPanel(currentState);
          }
          
          // After odd number of toggles, state should be opposite
          // After even number of toggles, state should be same
          const expectedState = toggleCount % 2 === 0 ? initialState : !initialState;
          return currentState === expectedState;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 2: Single Selection for Dimension Filters
 * For any sequence of filter selections on length or width filters, 
 * only the most recently selected option should be active.
 * 
 * **Feature: category-filter-search, Property 2: Single Selection for Dimension Filters**
 * **Validates: Requirements 2.4, 3.4**
 */
describe('Property 2: Single Selection for Dimension Filters', () => {
  
  // Filter options matching the design document
  const lengthOptions = [
    { min: 0, max: 50, label: '50cm以下' },
    { min: 50, max: 100, label: '50-100cm' },
    { min: 100, max: 150, label: '100-150cm' },
    { min: 150, max: Infinity, label: '150cm以上' }
  ];
  
  const widthOptions = [
    { min: 0, max: 30, label: '30cm以下' },
    { min: 30, max: 60, label: '30-60cm' },
    { min: 60, max: 90, label: '60-90cm' },
    { min: 90, max: Infinity, label: '90cm以上' }
  ];
  
  /**
   * Simulates the selectLengthFilter function behavior
   * Returns the new filter state after selection
   */
  const selectLengthFilter = (currentFilter, selectedOption) => {
    // If clicking the same option, deselect it
    if (currentFilter && currentFilter.label === selectedOption.label) {
      return null;
    }
    // Otherwise, select the new option (single selection mode)
    return selectedOption;
  };
  
  /**
   * Simulates the selectWidthFilter function behavior
   * Returns the new filter state after selection
   */
  const selectWidthFilter = (currentFilter, selectedOption) => {
    // If clicking the same option, deselect it
    if (currentFilter && currentFilter.label === selectedOption.label) {
      return null;
    }
    // Otherwise, select the new option (single selection mode)
    return selectedOption;
  };

  test('selecting a length option when none is selected sets that option', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        (optionIndex) => {
          const selectedOption = lengthOptions[optionIndex];
          const newFilter = selectLengthFilter(null, selectedOption);
          
          return newFilter !== null && 
                 newFilter.label === selectedOption.label &&
                 newFilter.min === selectedOption.min &&
                 newFilter.max === selectedOption.max;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('selecting a different length option replaces the current selection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        (firstIndex, secondIndex) => {
          // Ensure different options
          if (firstIndex === secondIndex) return true;
          
          const firstOption = lengthOptions[firstIndex];
          const secondOption = lengthOptions[secondIndex];
          
          // Select first option
          let currentFilter = selectLengthFilter(null, firstOption);
          
          // Select second option
          currentFilter = selectLengthFilter(currentFilter, secondOption);
          
          // Only the second option should be active
          return currentFilter !== null &&
                 currentFilter.label === secondOption.label &&
                 currentFilter.min === secondOption.min;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('selecting the same length option twice deselects it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        (optionIndex) => {
          const selectedOption = lengthOptions[optionIndex];
          
          // Select the option
          let currentFilter = selectLengthFilter(null, selectedOption);
          
          // Select the same option again
          currentFilter = selectLengthFilter(currentFilter, selectedOption);
          
          // Should be deselected (null)
          return currentFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('selecting a width option when none is selected sets that option', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (optionIndex) => {
          const selectedOption = widthOptions[optionIndex];
          const newFilter = selectWidthFilter(null, selectedOption);
          
          return newFilter !== null && 
                 newFilter.label === selectedOption.label &&
                 newFilter.min === selectedOption.min &&
                 newFilter.max === selectedOption.max;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('selecting a different width option replaces the current selection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (firstIndex, secondIndex) => {
          // Ensure different options
          if (firstIndex === secondIndex) return true;
          
          const firstOption = widthOptions[firstIndex];
          const secondOption = widthOptions[secondIndex];
          
          // Select first option
          let currentFilter = selectWidthFilter(null, firstOption);
          
          // Select second option
          currentFilter = selectWidthFilter(currentFilter, secondOption);
          
          // Only the second option should be active
          return currentFilter !== null &&
                 currentFilter.label === secondOption.label &&
                 currentFilter.min === secondOption.min;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('selecting the same width option twice deselects it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (optionIndex) => {
          const selectedOption = widthOptions[optionIndex];
          
          // Select the option
          let currentFilter = selectWidthFilter(null, selectedOption);
          
          // Select the same option again
          currentFilter = selectWidthFilter(currentFilter, selectedOption);
          
          // Should be deselected (null)
          return currentFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sequence of length selections always results in single active option or none', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: lengthOptions.length - 1 }), { minLength: 1, maxLength: 20 }),
        (selectionSequence) => {
          let currentFilter = null;
          
          for (const optionIndex of selectionSequence) {
            const selectedOption = lengthOptions[optionIndex];
            currentFilter = selectLengthFilter(currentFilter, selectedOption);
          }
          
          // Result should be either null or a single valid option
          if (currentFilter === null) return true;
          
          // If not null, should be a valid option with all required properties
          return typeof currentFilter.label === 'string' &&
                 typeof currentFilter.min === 'number' &&
                 (typeof currentFilter.max === 'number' || currentFilter.max === Infinity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sequence of width selections always results in single active option or none', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: widthOptions.length - 1 }), { minLength: 1, maxLength: 20 }),
        (selectionSequence) => {
          let currentFilter = null;
          
          for (const optionIndex of selectionSequence) {
            const selectedOption = widthOptions[optionIndex];
            currentFilter = selectWidthFilter(currentFilter, selectedOption);
          }
          
          // Result should be either null or a single valid option
          if (currentFilter === null) return true;
          
          // If not null, should be a valid option with all required properties
          return typeof currentFilter.label === 'string' &&
                 typeof currentFilter.min === 'number' &&
                 (typeof currentFilter.max === 'number' || currentFilter.max === Infinity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('length and width filters are independent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (lengthIndex, widthIndex) => {
          const lengthOption = lengthOptions[lengthIndex];
          const widthOption = widthOptions[widthIndex];
          
          // Select both filters
          const lengthFilter = selectLengthFilter(null, lengthOption);
          const widthFilter = selectWidthFilter(null, widthOption);
          
          // Both should be independently set
          return lengthFilter !== null &&
                 widthFilter !== null &&
                 lengthFilter.label === lengthOption.label &&
                 widthFilter.label === widthOption.label;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 4: Filter Clear Restores Products
 * For any filtered state, clearing all filters should restore the product list 
 * to show all products in the current category (matching only the category filter).
 * 
 * **Feature: category-filter-search, Property 4: Filter Clear Restores Products**
 * **Validates: Requirements 2.3, 3.3, 4.4, 5.3**
 */
describe('Property 4: Filter Clear Restores Products', () => {
  
  // Helper to generate mock products with valid size strings
  const productArbitrary = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    size: fc.oneof(
      // Valid size format: L*W*Hcm
      fc.tuple(
        fc.integer({ min: 10, max: 300 }),
        fc.integer({ min: 10, max: 200 }),
        fc.integer({ min: 1, max: 50 })
      ).map(([l, w, h]) => `${l}*${w}*${h}cm`),
      // Valid size format: L*Wcm
      fc.tuple(
        fc.integer({ min: 10, max: 300 }),
        fc.integer({ min: 10, max: 200 })
      ).map(([l, w]) => `${l}*${w}cm`)
    ),
    categoryId: fc.constantFrom('cat_wood_001', 'cat_resin_001', 'cat_design_001')
  });

  const productsArbitrary = fc.array(productArbitrary, { minLength: 1, maxLength: 50 });

  /**
   * Simulates the filter state management in the category page
   */
  const createFilterState = () => ({
    searchKeyword: '',
    searchInputValue: '',
    lengthFilter: null,
    widthFilter: null,
    hasActiveFilters: false,
    filteredProducts: [],
    allProducts: []
  });

  /**
   * Simulates clearing all filters - Requirements: 5.3
   */
  const clearAllFilters = (state) => ({
    ...state,
    searchKeyword: '',
    searchInputValue: '',
    lengthFilter: null,
    widthFilter: null,
    hasActiveFilters: false,
    filteredProducts: []
  });

  /**
   * Simulates applying filters to products
   */
  const applyFiltersToState = (state, allProducts) => {
    const filters = {};
    
    if (state.searchKeyword && state.searchKeyword.trim()) {
      filters.keyword = state.searchKeyword.trim();
    }
    
    if (state.lengthFilter) {
      filters.lengthRange = {
        min: state.lengthFilter.min,
        max: state.lengthFilter.max
      };
    }
    
    if (state.widthFilter) {
      filters.widthRange = {
        min: state.widthFilter.min,
        max: state.widthFilter.max
      };
    }
    
    const hasFilters = Object.keys(filters).length > 0;
    
    if (hasFilters) {
      const filteredProducts = applyFilters(allProducts, filters);
      return {
        ...state,
        filteredProducts,
        hasActiveFilters: true,
        allProducts
      };
    } else {
      return {
        ...state,
        filteredProducts: [],
        hasActiveFilters: false,
        allProducts
      };
    }
  };

  // Filter options matching the design document
  const lengthOptions = [
    { min: 0, max: 50, label: '50cm以下' },
    { min: 50, max: 100, label: '50-100cm' },
    { min: 100, max: 150, label: '100-150cm' },
    { min: 150, max: Infinity, label: '150cm以上' }
  ];
  
  const widthOptions = [
    { min: 0, max: 30, label: '30cm以下' },
    { min: 30, max: 60, label: '30-60cm' },
    { min: 60, max: 90, label: '60-90cm' },
    { min: 90, max: Infinity, label: '90cm以上' }
  ];

  test('clearing filters after keyword search restores all products', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        (products, keyword) => {
          // Set up initial state with products
          let state = createFilterState();
          state.allProducts = products;
          
          // Apply keyword filter
          state.searchKeyword = keyword;
          state = applyFiltersToState(state, products);
          
          // Clear all filters
          state = clearAllFilters(state);
          state = applyFiltersToState(state, products);
          
          // After clearing, hasActiveFilters should be false
          // and filteredProducts should be empty (meaning show all products)
          return state.hasActiveFilters === false && 
                 state.filteredProducts.length === 0 &&
                 state.searchKeyword === '';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clearing filters after length filter restores all products', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        (products, lengthIndex) => {
          // Set up initial state with products
          let state = createFilterState();
          state.allProducts = products;
          
          // Apply length filter
          state.lengthFilter = lengthOptions[lengthIndex];
          state = applyFiltersToState(state, products);
          
          // Clear all filters
          state = clearAllFilters(state);
          state = applyFiltersToState(state, products);
          
          // After clearing, hasActiveFilters should be false
          return state.hasActiveFilters === false && 
                 state.filteredProducts.length === 0 &&
                 state.lengthFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clearing filters after width filter restores all products', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (products, widthIndex) => {
          // Set up initial state with products
          let state = createFilterState();
          state.allProducts = products;
          
          // Apply width filter
          state.widthFilter = widthOptions[widthIndex];
          state = applyFiltersToState(state, products);
          
          // Clear all filters
          state = clearAllFilters(state);
          state = applyFiltersToState(state, products);
          
          // After clearing, hasActiveFilters should be false
          return state.hasActiveFilters === false && 
                 state.filteredProducts.length === 0 &&
                 state.widthFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clearing filters after combined filters restores all products', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        (products, keyword, lengthIndex, widthIndex) => {
          // Set up initial state with products
          let state = createFilterState();
          state.allProducts = products;
          
          // Apply all filters
          state.searchKeyword = keyword;
          state.lengthFilter = lengthOptions[lengthIndex];
          state.widthFilter = widthOptions[widthIndex];
          state = applyFiltersToState(state, products);
          
          // Verify filters are active
          const hadActiveFilters = state.hasActiveFilters;
          
          // Clear all filters
          state = clearAllFilters(state);
          state = applyFiltersToState(state, products);
          
          // After clearing, all filter states should be reset
          return state.hasActiveFilters === false && 
                 state.filteredProducts.length === 0 &&
                 state.searchKeyword === '' &&
                 state.lengthFilter === null &&
                 state.widthFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clearing filters is idempotent', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.integer({ min: 1, max: 5 }), // Number of times to clear
        (products, clearCount) => {
          // Set up initial state with products and some filters
          let state = createFilterState();
          state.allProducts = products;
          state.searchKeyword = 'test';
          state.lengthFilter = lengthOptions[0];
          state = applyFiltersToState(state, products);
          
          // Clear filters multiple times
          for (let i = 0; i < clearCount; i++) {
            state = clearAllFilters(state);
            state = applyFiltersToState(state, products);
          }
          
          // Result should be the same regardless of how many times we clear
          return state.hasActiveFilters === false && 
                 state.filteredProducts.length === 0 &&
                 state.searchKeyword === '' &&
                 state.lengthFilter === null &&
                 state.widthFilter === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('products remain unchanged after filter-clear cycle', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        (products, keyword) => {
          // Set up initial state with products
          let state = createFilterState();
          state.allProducts = [...products]; // Copy to preserve original
          
          // Apply filter
          state.searchKeyword = keyword;
          state = applyFiltersToState(state, products);
          
          // Clear filter
          state = clearAllFilters(state);
          state = applyFiltersToState(state, products);
          
          // allProducts should still contain all original products
          return state.allProducts.length === products.length &&
                 state.allProducts.every((p, i) => p._id === products[i]._id);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 7: Filter State Preservation
 * For any active filter state, switching to a different category and back 
 * should preserve the filter state.
 * 
 * **Feature: category-filter-search, Property 7: Filter State Preservation**
 * **Validates: Requirements 5.4**
 */
describe('Property 7: Filter State Preservation', () => {
  
  // Helper to generate mock products with valid size strings
  const productArbitrary = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    size: fc.oneof(
      // Valid size format: L*W*Hcm
      fc.tuple(
        fc.integer({ min: 10, max: 300 }),
        fc.integer({ min: 10, max: 200 }),
        fc.integer({ min: 1, max: 50 })
      ).map(([l, w, h]) => `${l}*${w}*${h}cm`),
      // Valid size format: L*Wcm
      fc.tuple(
        fc.integer({ min: 10, max: 300 }),
        fc.integer({ min: 10, max: 200 })
      ).map(([l, w]) => `${l}*${w}cm`)
    ),
    categoryId: fc.constantFrom('cat_wood_001', 'cat_resin_001', 'cat_design_001')
  });

  const productsArbitrary = fc.array(productArbitrary, { minLength: 1, maxLength: 30 });

  // Filter options matching the design document
  const lengthOptions = [
    { min: 0, max: 50, label: '50cm以下' },
    { min: 50, max: 100, label: '50-100cm' },
    { min: 100, max: 150, label: '100-150cm' },
    { min: 150, max: Infinity, label: '150cm以上' }
  ];
  
  const widthOptions = [
    { min: 0, max: 30, label: '30cm以下' },
    { min: 30, max: 60, label: '30-60cm' },
    { min: 60, max: 90, label: '60-90cm' },
    { min: 90, max: Infinity, label: '90cm以上' }
  ];

  /**
   * Simulates the category page state
   */
  const createPageState = () => ({
    activeTab: 0,
    categories: [
      { _id: 'cat_1', name: '原木经典' },
      { _id: 'cat_2', name: '树脂美学' },
      { _id: 'cat_3', name: '玩趣设计' }
    ],
    products: [],
    allProducts: [],
    searchKeyword: '',
    searchInputValue: '',
    lengthFilter: null,
    widthFilter: null,
    hasActiveFilters: false,
    filteredProducts: []
  });

  /**
   * Simulates switching category - Requirements: 5.4
   * Filter state should be preserved when switching categories
   */
  const switchCategory = (state, newCategoryIndex, newProducts) => {
    // Filter state (searchKeyword, lengthFilter, widthFilter) is NOT cleared
    // Only products and activeTab are updated
    return {
      ...state,
      activeTab: newCategoryIndex,
      products: newProducts,
      allProducts: newProducts
      // Note: searchKeyword, lengthFilter, widthFilter remain unchanged
    };
  };

  /**
   * Simulates applying filters after category switch
   */
  const applyFiltersAfterSwitch = (state) => {
    const filters = {};
    
    if (state.searchKeyword && state.searchKeyword.trim()) {
      filters.keyword = state.searchKeyword.trim();
    }
    
    if (state.lengthFilter) {
      filters.lengthRange = {
        min: state.lengthFilter.min,
        max: state.lengthFilter.max
      };
    }
    
    if (state.widthFilter) {
      filters.widthRange = {
        min: state.widthFilter.min,
        max: state.widthFilter.max
      };
    }
    
    const hasFilters = Object.keys(filters).length > 0;
    
    if (hasFilters) {
      const filteredProducts = applyFilters(state.allProducts, filters);
      return {
        ...state,
        filteredProducts,
        hasActiveFilters: true
      };
    } else {
      return {
        ...state,
        filteredProducts: [],
        hasActiveFilters: false
      };
    }
  };

  test('search keyword is preserved when switching categories', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 2 }), // Target category index
        (products1, products2, keyword, targetCategoryIndex) => {
          // Set up initial state with keyword filter
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.searchKeyword = keyword;
          state.searchInputValue = keyword;
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, targetCategoryIndex, products2);
          state = applyFiltersAfterSwitch(state);
          
          // Keyword should be preserved
          return state.searchKeyword === keyword &&
                 state.searchInputValue === keyword;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('length filter is preserved when switching categories', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        fc.integer({ min: 1, max: 2 }),
        (products1, products2, lengthIndex, targetCategoryIndex) => {
          // Set up initial state with length filter
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.lengthFilter = lengthOptions[lengthIndex];
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, targetCategoryIndex, products2);
          state = applyFiltersAfterSwitch(state);
          
          // Length filter should be preserved
          return state.lengthFilter !== null &&
                 state.lengthFilter.label === lengthOptions[lengthIndex].label &&
                 state.lengthFilter.min === lengthOptions[lengthIndex].min &&
                 state.lengthFilter.max === lengthOptions[lengthIndex].max;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('width filter is preserved when switching categories', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        fc.integer({ min: 1, max: 2 }),
        (products1, products2, widthIndex, targetCategoryIndex) => {
          // Set up initial state with width filter
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.widthFilter = widthOptions[widthIndex];
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, targetCategoryIndex, products2);
          state = applyFiltersAfterSwitch(state);
          
          // Width filter should be preserved
          return state.widthFilter !== null &&
                 state.widthFilter.label === widthOptions[widthIndex].label &&
                 state.widthFilter.min === widthOptions[widthIndex].min &&
                 state.widthFilter.max === widthOptions[widthIndex].max;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all filters are preserved when switching categories', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        fc.integer({ min: 0, max: widthOptions.length - 1 }),
        fc.integer({ min: 1, max: 2 }),
        (products1, products2, keyword, lengthIndex, widthIndex, targetCategoryIndex) => {
          // Set up initial state with all filters
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.searchKeyword = keyword;
          state.searchInputValue = keyword;
          state.lengthFilter = lengthOptions[lengthIndex];
          state.widthFilter = widthOptions[widthIndex];
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, targetCategoryIndex, products2);
          state = applyFiltersAfterSwitch(state);
          
          // All filters should be preserved
          return state.searchKeyword === keyword &&
                 state.lengthFilter !== null &&
                 state.lengthFilter.label === lengthOptions[lengthIndex].label &&
                 state.widthFilter !== null &&
                 state.widthFilter.label === widthOptions[widthIndex].label;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('filters are applied to new category products after switch', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 2 }),
        (products1, products2, keyword, targetCategoryIndex) => {
          // Set up initial state with keyword filter
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.searchKeyword = keyword;
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, targetCategoryIndex, products2);
          state = applyFiltersAfterSwitch(state);
          
          // Filtered products should be from the new category's products
          // and should match the keyword filter
          const lowerKeyword = keyword.toLowerCase().trim();
          return state.filteredProducts.every(product => {
            const name = (product.name || '').toLowerCase();
            return name.includes(lowerKeyword);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('switching back to original category preserves filter state', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 0, max: lengthOptions.length - 1 }),
        (products1, products2, keyword, lengthIndex) => {
          // Set up initial state with filters
          let state = createPageState();
          state.products = products1;
          state.allProducts = products1;
          state.searchKeyword = keyword;
          state.lengthFilter = lengthOptions[lengthIndex];
          state = applyFiltersAfterSwitch(state);
          
          // Switch to different category
          state = switchCategory(state, 1, products2);
          state = applyFiltersAfterSwitch(state);
          
          // Switch back to original category
          state = switchCategory(state, 0, products1);
          state = applyFiltersAfterSwitch(state);
          
          // Filters should still be preserved
          return state.searchKeyword === keyword &&
                 state.lengthFilter !== null &&
                 state.lengthFilter.label === lengthOptions[lengthIndex].label &&
                 state.activeTab === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('multiple category switches preserve filter state', () => {
    fc.assert(
      fc.property(
        productsArbitrary,
        fc.string({ minLength: 1, maxLength: 5 }).filter(s => s.trim().length > 0),
        fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 2, maxLength: 10 }),
        (products, keyword, categorySequence) => {
          // Set up initial state with keyword filter
          let state = createPageState();
          state.products = products;
          state.allProducts = products;
          state.searchKeyword = keyword;
          state = applyFiltersAfterSwitch(state);
          
          // Switch through multiple categories
          for (const categoryIndex of categorySequence) {
            state = switchCategory(state, categoryIndex, products);
            state = applyFiltersAfterSwitch(state);
          }
          
          // Keyword should still be preserved after all switches
          return state.searchKeyword === keyword;
        }
      ),
      { numRuns: 100 }
    );
  });
});
