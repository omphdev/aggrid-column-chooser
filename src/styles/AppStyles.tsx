// src/styles/AppStyles.js
export const appStyles = {
    // Main app container
    appContainer: {
      height: '600px',
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    },
    
    // Layout for app components (grid + column chooser)
    appLayout: {
      display: 'flex',
      gap: '20px',
      height: '100%',
      overflow: 'hidden'
    },
    
    // Container for the main grid
    mainGridContainer: {
      flex: '2',
      display: 'flex',
      flexDirection: 'column'
    },
    
    // Container for the column chooser
    columnChooserContainer: {
      flex: '1',
      display: 'flex',
      flexDirection: 'column'
    },
    
    // Common heading style
    heading: {
      marginTop: '0',
      marginBottom: '10px'
    },
    
    // Additional styles for the main grid
    gridWrapper: {
      flex: '1',
      overflow: 'auto'
    },
    
    // Styles for the grid itself
    grid: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box'
    }
  };
  
  export default appStyles;