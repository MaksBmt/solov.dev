const fs = require('fs');
const path = require('path');

const srcApp = path.resolve(__dirname, 'src/app');
const srcScss = path.resolve(__dirname, 'src/scss');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.scss')) {
      results.push(file);
    }
  });
  return results;
}

const scssFiles = walk(srcApp);

scssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const newContent = content.replace(/@use\s+"[^"]+variable\.scss"\s+as\s+\*;/g, (match) => {
    let relPath = path.relative(path.dirname(file), path.join(srcScss, 'variable.scss'));
    relPath = relPath.replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    changed = true;
    return `@use "${relPath}" as *;`;
  }).replace(/@use\s+"[^"]+mixins\.scss"\s+as\s+\*;/g, (match) => {
    let relPath = path.relative(path.dirname(file), path.join(srcScss, 'mixins.scss'));
    relPath = relPath.replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    changed = true;
    return `@use "${relPath}" as *;`;
  });

  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
