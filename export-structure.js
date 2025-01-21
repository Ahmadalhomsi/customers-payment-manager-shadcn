// To run the script, run the following command: 
/* 
  node export-structure.js
*/

import { readdirSync, statSync, readFileSync, createWriteStream } from 'fs';
import { join, relative } from 'path';

// Directory to scan
const dir = '.';
// Output file
const outputFile = 'file-structure-with-code.txt';
// Directories to exclude
const excludedDirs = ['.next', '.git', 'node_modules'];

// Function to write the directory structure recursively
function writeStructure(directory, fileStream, prefix = '') {
  const files = readdirSync(directory);
  const totalFiles = files.length;

  files.forEach((file, index) => {
    const filePath = join(directory, file);
    const relativePath = relative('.', filePath);

    if (excludedDirs.some((excluded) => relativePath.includes(excluded))) {
      return; // Skip excluded directories
    }

    const stats = statSync(filePath);
    const isLast = index === totalFiles - 1;
    const newPrefix = prefix + (isLast ? '    ' : '│   ');

    if (stats.isDirectory()) {
      fileStream.write(`${prefix}${isLast ? '└── ' : '├── '}${file}/\n`);
      writeStructure(filePath, fileStream, newPrefix);
    } else {
      fileStream.write(`${prefix}${isLast ? '└── ' : '├── '}${file}\n`);
    }
  });
}

// Function to write file contents
function writeFileContents(directory, fileStream) {
  const files = readdirSync(directory);

  files.forEach((file) => {
    const filePath = join(directory, file);
    const relativePath = relative('.', filePath);

    if (excludedDirs.some((excluded) => relativePath.includes(excluded))) {
      return; // Skip excluded directories
    }

    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      writeFileContents(filePath, fileStream);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileStream.write(`\n------------ ${relativePath} ------------\n`);
      fileStream.write(readFileSync(filePath, 'utf-8') + '\n');
    }
  });
}

// Main function
function exportStructure() {
  const fileStream = createWriteStream(outputFile);

  fileStream.write('File Structure:\n');
  writeStructure(dir, fileStream);
  fileStream.write('\nFile Contents:\n');
  writeFileContents(dir, fileStream);

  fileStream.end(() => console.log(`Done. The file is saved as ${outputFile}`));
}

exportStructure();
