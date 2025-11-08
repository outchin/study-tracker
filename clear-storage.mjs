// Script to check and clear problematic localStorage data
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple HTML page to clear localStorage
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Study Tracker Storage</title>
</head>
<body>
    <h1>Study Tracker Storage Cleaner</h1>
    <div id="output"></div>
    
    <script>
        const output = document.getElementById('output');
        
        // Check for problematic localStorage items
        output.innerHTML += '<h2>Checking localStorage...</h2>';
        
        const problemKeys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            output.innerHTML += '<p>Key: ' + key + '</p>';
            
            if (value === null || value === undefined || value.trim() === '') {
                problemKeys.push(key);
                output.innerHTML += '<p style="color: red;">  Empty value detected!</p>';
            } else {
                try {
                    JSON.parse(value);
                    output.innerHTML += '<p style="color: green;">  Valid JSON</p>';
                } catch (e) {
                    problemKeys.push(key);
                    output.innerHTML += '<p style="color: red;">  Invalid JSON: ' + e.message + '</p>';
                }
            }
        }
        
        if (problemKeys.length > 0) {
            output.innerHTML += '<h2>Removing problematic keys...</h2>';
            problemKeys.forEach(key => {
                localStorage.removeItem(key);
                output.innerHTML += '<p>Removed: ' + key + '</p>';
            });
        } else {
            output.innerHTML += '<h2>No problems found!</h2>';
        }
        
        output.innerHTML += '<h2>Done! You can close this tab.</h2>';
    </script>
</body>
</html>
`;

writeFileSync(join(__dirname, 'clear-storage.html'), htmlContent);
console.log('Created clear-storage.html - open this file in your browser to clear problematic localStorage data');
console.log('File location:', join(__dirname, 'clear-storage.html'));