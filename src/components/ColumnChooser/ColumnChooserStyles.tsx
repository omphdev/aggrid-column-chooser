// src/styles/ColumnChooserStyles.js
export const columnChooserStyles = {
    // Main container
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#fff'
    },
    
    // Header section
    header: {
      padding: '12px',
      borderBottom: '1px solid #ddd'
    },
    
    title: {
      margin: '0 0 12px 0',
      fontSize: '16px',
      fontWeight: '600'
    },
    
    controls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    
    searchInput: {
      flex: '1',
      padding: '6px 8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      outline: 'none',
      '&:focus': {
        borderColor: '#2196f3',
        boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)'
      }
    },
    
    searchToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#666'
    },
    
    checkbox: {
      margin: 0
    },
    
    flatViewToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#666'
    },
    
    // Panels section
    panels: {
      display: 'flex',
      flex: '1',
      minHeight: 0
    },
    
    panelContainer: {
      flex: '1'
    },
    
    // Available columns
    availableColumnsContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    
    // TreeItem styles for available columns
    treeItemSelected: {
      backgroundColor: '#e6f7ff !important',
      color: '#1890ff !important',
      fontWeight: '500 !important',
      borderLeft: '3px solid #1890ff !important',
      boxShadow: '0 0 0 1px rgba(24, 144, 255, 0.1) !important',
      paddingLeft: '5px !important'
    },
    
    treeItemHover: {
      backgroundColor: '#f5f5f5',
      cursor: 'pointer'
    },
    
    treeItemSelectedHover: {
      backgroundColor: '#d4edff !important'
    },
    
    treeGroupItem: {
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #eee'
    },
    
    treeGroupSelected: {
      backgroundColor: '#e6f7ff !important',
      borderLeft: '3px solid #1890ff !important',
      paddingLeft: '5px !important'
    },
    
    expandButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      border: '1px solid #d9d9d9',
      borderRadius: '2px',
      backgroundColor: 'white',
      color: '#666',
      fontSize: '12px',
      lineHeight: '1',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f0f0f0',
        color: '#1890ff',
        borderColor: '#1890ff'
      }
    },
    
    // Selected columns
    selectedColumnsContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    
    selectedColumnsHeader: {
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd'
    },
    
    headerTitle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    
    headerTitleText: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600'
    },
    
    selectionCount: {
      fontSize: '12px',
      color: '#1890ff'
    },
    
    headerActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    
    selectionActions: {
      display: 'flex',
      gap: '5px'
    },
    
    columnActions: {
      display: 'flex',
      gap: '5px'
    },
    
    actionButton: {
      padding: '4px 8px',
      border: '1px solid #ddd',
      borderRadius: '3px',
      backgroundColor: '#f0f0f0',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:hover:not(:disabled)': {
        backgroundColor: '#e6f7ff',
        borderColor: '#1890ff',
        color: '#1890ff'
      },
      '&:active:not(:disabled)': {
        backgroundColor: '#dcf5ff'
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    
    moveUpBtn: {
      width: '30px',
      fontWeight: 'bold'
    },
    
    moveDownBtn: {
      width: '30px',
      fontWeight: 'bold'
    },
    
    clearBtn: {
      backgroundColor: '#fff1f0',
      borderColor: '#ffa39e',
      '&:hover:not(:disabled)': {
        backgroundColor: '#fff1f0',
        borderColor: '#ff4d4f',
        color: '#ff4d4f'
      }
    },
    
    selectedColumnsContent: {
      flex: '1',
      overflow: 'auto',
      minHeight: '0'
    },
    
    columnStats: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    
    columnCount: {
      fontSize: '12px',
      color: '#666',
      backgroundColor: '#e6e6e6',
      padding: '2px 6px',
      borderRadius: '10px'
    },
    
    selectedCount: {
      fontSize: '12px',
      color: '#1890ff',
      backgroundColor: '#e6f7ff',
      padding: '2px 6px',
      borderRadius: '10px'
    },
    
    // Column Group Styles
    groupContainer: {
      marginBottom: '12px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      overflow: 'hidden',
      transition: 'box-shadow 0.3s, border-color 0.3s',
      '&:hover': {
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.08)'
      }
    },
    
    groupContainerDragOver: {
      borderColor: '#1890ff',
      boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
    },
    
    groupHeader: {
      backgroundColor: '#f5f5f5',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #d9d9d9',
      cursor: 'grab'
    },
    
    groupHeaderDragging: {
      opacity: 0.6,
      backgroundColor: '#e6f7ff',
      cursor: 'grabbing'
    },
    
    groupHeaderWrapper: {
      border: '2px dashed transparent',
      transition: 'border-color 0.2s ease, background-color 0.2s ease'
    },
    
    groupHeaderWrapperDragOver: {
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.05)'
    },
    
    groupName: {
      fontWeight: '500',
      color: '#555',
      display: 'flex',
      alignItems: 'center'
    },
    
    groupCount: {
      marginLeft: '5px',
      fontSize: '12px',
      color: '#888',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      padding: '0 6px'
    },
    
    groupActions: {
      display: 'flex',
      gap: '4px'
    },
    
    groupContent: {
      padding: '4px 0',
      backgroundColor: '#fafafa',
      minHeight: '30px',
      border: '2px dashed transparent',
      transition: 'border-color 0.2s ease, background-color 0.2s ease'
    },
    
    groupContentDragOver: {
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.05)'
    },
    
    // Enhanced style for when content is a drop target
    groupContentDragTarget: {
      backgroundColor: 'rgba(24, 144, 255, 0.08) !important',
      boxShadow: 'inset 0 0 10px rgba(24, 144, 255, 0.1) !important',
      transition: 'all 0.3s ease'
    },
    
    // Empty group placeholder
    emptyGroupPlaceholder: {
      padding: '10px',
      margin: '5px',
      textAlign: 'center',
      color: '#bbb',
      border: '1px dashed #ddd',
      borderRadius: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      transition: 'all 0.3s ease'
    },
    
    emptyGroupPlaceholderDragOver: {
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.05)',
      color: '#1890ff'
    },
    
    // Enhanced flat item for dragging
    flatItem: {
      padding: '6px 8px',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      borderBottom: '1px solid #f0f0f0',
      userSelect: 'none',
      position: 'relative',
      transition: 'background-color 0.2s ease, margin 0.15s ease-out'
    },
    
    flatItemDragging: {
      opacity: 0.6,
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      border: '1px dashed #1890ff'
    },
    
    flatItemDragToGroup: {
      cursor: 'move'
    },
    
    flatItemGrouped: {
      marginLeft: '12px',
      borderLeft: '3px solid #f0f0f0',
      backgroundColor: '#ffffff',
      '&:hover': {
        borderLeft: '3px solid #d4edff',
        backgroundColor: '#f9f9f9'
      }
    },
    
    flatItemGroupedSelected: {
      borderLeft: '3px solid #1890ff !important',
      backgroundColor: '#e6f7ff !important'
    },
    
    // Remove from group button
    removeFromGroupBtn: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#bbb',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: 'auto',
      padding: '2px 6px',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      visibility: 'hidden'
    },
    
    // Show remove button on hover
    removeButtonVisible: {
      visibility: 'visible'
    },
    
    removeButtonHover: {
      backgroundColor: '#ffebeb',
      color: '#ff4d4f'
    },
    
    // Drop position indicators
    dropIndicator: {
      position: 'absolute',
      height: '2px',
      backgroundColor: '#1890ff',
      left: 0,
      right: 0,
      zIndex: 10,
      pointerEvents: 'none',
      '&::before': {
        content: "''",
        position: 'absolute',
        width: '6px',
        height: '6px',
        backgroundColor: '#1890ff',
        borderRadius: '50%',
        top: '-2px',
        left: '10px'
      }
    },
    
    // Group droppable areas
    groupDroppableArea: {
      position: 'relative',
      minHeight: '20px',
      margin: '4px 0',
      border: '1px dashed transparent',
      borderRadius: '2px',
      transition: 'all 0.2s'
    },
    
    groupDroppableAreaDragOver: {
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.05)'
    },
    
    // Enhanced group move handle
    groupMoveHandle: {
      cursor: 'grab',
      marginRight: '8px',
      color: '#bbb',
      transition: 'color 0.2s',
      '&:hover': {
        color: '#666'
      },
      '&:active': {
        cursor: 'grabbing'
      }
    },
    
    // Group context menu
    groupContextMenu: {
      position: 'fixed',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      padding: '8px 0'
    },
    
    menuItem: {
      padding: '8px 16px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      }
    },
    
    menuDivider: {
      height: '1px',
      backgroundColor: '#ddd',
      margin: '4px 0'
    },
    
    menuLabel: {
      padding: '4px 16px',
      color: '#666',
      fontSize: '12px'
    },
    
    menuItemCancel: {
      padding: '8px 16px',
      cursor: 'pointer',
      color: '#999'
    },
    
    // Create group dialog
    modalBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '4px',
      padding: '16px',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    
    modalTitle: {
      margin: '0 0 16px'
    },
    
    formGroup: {
      marginBottom: '16px'
    },
    
    label: {
      display: 'block',
      marginBottom: '8px'
    },
    
    textInput: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    
    modalActions: {
      textAlign: 'right'
    },
    
    modalCancelBtn: {
      padding: '8px 16px',
      marginRight: '8px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    
    modalConfirmBtn: {
      padding: '8px 16px',
      backgroundColor: '#1890ff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      '&:disabled': {
        opacity: 0.5
      }
    },
    
    // TreeView styles
    treeView: {
      height: '100%',
      border: '1px solid #ddd',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    },
    
    treeViewHeader: {
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    
    titleText: {
      fontWeight: 'bold'
    },
    
    treeViewContent: {
      flex: '1',
      overflow: 'auto',
      position: 'relative'
    },
    
    // Drag position indicators
    dragOverTop: {
      borderTop: '2px solid #1890ff !important',
      paddingTop: '4px !important',
      marginTop: '0 !important',
      position: 'relative',
      '&::before': {
        content: "''",
        position: 'absolute',
        height: '6px',
        width: '6px',
        background: '#1890ff',
        borderRadius: '50%',
        zIndex: 10,
        top: '-4px',
        left: '10px'
      }
    },
    
    dragOverBottom: {
      borderBottom: '2px solid #1890ff !important',
      paddingBottom: '4px !important',
      marginBottom: '0 !important',
      position: 'relative',
      '&::before': {
        content: "''",
        position: 'absolute',
        height: '6px',
        width: '6px',
        background: '#1890ff',
        borderRadius: '50%',
        zIndex: 10,
        bottom: '-4px',
        left: '10px'
      }
    },
    
    // Empty state styling
    emptyMessage: {
      padding: '15px',
      textAlign: 'center',
      color: '#999',
      border: '2px dashed #ddd',
      borderRadius: '4px',
      margin: '10px',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    
    emptyMessageDragOver: {
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.05)',
      color: '#1890ff'
    }
  };
  
  export default columnChooserStyles;