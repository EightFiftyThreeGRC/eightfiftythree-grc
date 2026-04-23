const fs = require('fs');

function fixEncoding(filePath) {
  try {
    // Read the corrupted UTF-8 string
    const brokenHtml = fs.readFileSync(filePath, 'utf8');
    
    // Windows PowerShell uses Windows-1252 generally when 'ANSI' is implied, 
    // but in Node.js 'latin1' is an alias for ISO-8859-1 which maps exactly to the first 256 unicode codepoints.
    // If characters like '€' (0x80) were lost or transformed because it was Windows-1252, 'binary' might work.
    
    const fixedContent = Buffer.from(brokenHtml, 'binary').toString('utf8');
    
    // Check if it looks fixed! (Contains normal dashboard texts) 
    if (fixedContent.includes('—') || fixedContent.includes('🚀') || fixedContent.includes('📝') || fixedContent.includes('key')) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log("Fixed " + filePath);
    } else {
        console.log("No obvious fix detected or missing indicators in " + filePath);
        // Let's force it anyway just in case the indicators aren't there but it's broken
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log("Forced fix " + filePath);
    }

  } catch (e) {
    console.log("Error on " + filePath, e.message);
  }
}

fixEncoding('index.html');
fixEncoding('js/app.js');
fixEncoding('css/app.css');
