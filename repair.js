const fs = require('fs');

let lines = fs.readFileSync('js/app.js', 'utf8').split('\n');

// The last line was: "    showToast('✅ Program restored from las"
let lastLine = lines[lines.length - 1];

if (lastLine.includes("showToast('✅ Program restored from las")) {
    lines[lines.length - 1] = "    showToast('✅ Program restored from last save');";
    lines.push("  }");
    lines.push("}");
    lines.push("window.addEventListener('load', init);");
    
    fs.writeFileSync('js/app.js', lines.join('\n'), 'utf8');
    console.log('File repaired successfully.');
} else {
    console.log('End of file did not match expected truncation. Found: ', lastLine);
}
