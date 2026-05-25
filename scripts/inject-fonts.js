const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    // Definitions for the missing icons
    const cdnStyles = `
    <style>
      @font-face { 
        font-family: 'Feather'; 
        src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/Feather.ttf') format('truetype'); 
      }
      @font-face { 
        font-family: 'FontAwesome'; 
        src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/FontAwesome.ttf') format('truetype'); 
      }
      @font-face { 
        font-family: 'MaterialCommunityIcons'; 
        src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/MaterialCommunityIcons.ttf') format('truetype'); 
      }
      @font-face { 
        font-family: 'Ionicons'; 
        src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/Ionicons.ttf') format('truetype'); 
      }
      @font-face { 
        font-family: 'Material Icons'; 
        src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/MaterialIcons.ttf') format('truetype'); 
      }
    </style>
  `;

    // Inject before closing head tag
    if (html.includes('</head>')) {
        html = html.replace('</head>', `${cdnStyles}</head>`);
        fs.writeFileSync(indexPath, html);
        console.log('✅ Successfully injected CDN fonts into dist/index.html');
    } else {
        console.error('❌ Could not find </head> tag in dist/index.html');
    }
} else {
    console.error('❌ dist/index.html not found. Make sure to run build first.');
}
