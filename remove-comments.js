const fs = require('fs');
const path = require('path');

const filesToClean = [
    'index.html',
    'dashboard.html',
    'css/style.css',
    'css/dashboard.css',
    'js/main.js'
];

filesToClean.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    
    let newLines = lines.filter(line => {
        const trimmed = line.trim();
        // Remove single line HTML comments
        if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) return false;
        // Remove single line JS comments
        if (trimmed.startsWith('//')) return false;
        // Remove single line CSS comments
        if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) return false;
        return true;
    });
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`Cleaned ${filePath}`);
});
