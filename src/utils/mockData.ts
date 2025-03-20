import { ColumnDefinition } from '../types';

/**
 * Generate mock column definitions for testing
 */
export const generateMockColumnDefinitions = (): ColumnDefinition[] => {
  const columns: ColumnDefinition[] = [];
  
  // Business-related column names organized by categories
  const columnNames = [
    // Customer Information
    'Customer ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Country', 'Postal Code',
    // Order Information
    'Order ID', 'Order Date', 'Order Status', 'Payment Method', 'Total Amount', 'Tax Amount', 'Shipping Cost', 'Discount',
    // Product Information
    'Product ID', 'Product Name', 'Category', 'Subcategory', 'Brand', 'Unit Price', 'Stock Level', 'SKU', 'Description',
    // Financial Information
    'Account Number', 'Balance', 'Credit Limit', 'Payment Due Date', 'Last Payment Date', 'Interest Rate', 'Monthly Payment',
    // Employee Information
    'Employee ID', 'Department', 'Position', 'Hire Date', 'Salary', 'Manager ID', 'Performance Rating', 'Training Status',
    // Inventory Information
    'Warehouse Location', 'Bin Number', 'Reorder Point', 'Lead Time', 'Supplier ID', 'Last Restock Date', 'Inventory Value',
    // Sales Information
    'Sales Region', 'Sales Rep', 'Quota', 'Actual Sales', 'Commission Rate', 'Territory', 'Customer Segment',
    // Project Information
    'Project ID', 'Project Name', 'Start Date', 'End Date', 'Status', 'Priority', 'Budget', 'Actual Cost',
    // Time Tracking
    'Time Entry ID', 'Date', 'Hours Worked', 'Task Description', 'Billable', 'Approval Status', 'Client ID',
    // Analytics
    'Conversion Rate', 'Customer Lifetime Value', 'Churn Rate', 'Net Promoter Score', 'Customer Satisfaction',
    // System Information
    'Created Date', 'Last Modified', 'Modified By', 'Version', 'System Status', 'Audit Trail', 'Security Level'
  ];
  
  // Generate columns with meaningful names
  for (let i = 0; i < columnNames.length; i++) {
    columns.push({
      id: `column_${i + 1}`,
      field: `column_${i + 1}`,
      groupPath: [
        // Group by category (roughly every 10 columns)
        `Group ${Math.ceil((i + 1) / 10)}`,
        // Subgroup (roughly every 5 columns)
        `Subgroup ${Math.ceil((i + 1) / 5)}`,
        columnNames[i]
      ]
    });
  }
  
  return columns;
};

/**
 * Generate mock data for the grid
 */
export const generateMockData = (): any[] => {
  // Generate 100 rows
  return Array.from({ length: 100 }, (_, rowIndex) => {
    const rowData: Record<string, any> = {};
    
    // Generate data for all columns
    for (let i = 1; i <= 100; i++) {
      const fieldName = `column_${i}`;
      
      // Different data types based on column
      switch (i % 4) {
        case 0: // Integer
          rowData[fieldName] = rowIndex * i;
          break;
        case 1: // Float
          rowData[fieldName] = (rowIndex * i) / 10;
          break;
        case 2: // String
          rowData[fieldName] = `Cell ${i}, Row ${rowIndex + 1}`;
          break;
        case 3: // Boolean
          rowData[fieldName] = rowIndex % 2 === 0;
          break;
      }
    }
    
    return rowData;
  });
};