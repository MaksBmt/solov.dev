const fs = require('fs');
const path = require('path');

const files = [
  'src/app/layout/header/header.component.ts',
  'src/app/layout/footer/footer.component.ts',
  'src/app/shared/components/pointer/pointer.component.ts',
  'src/app/shared/components/ambient-canvas/ambient-canvas.component.ts',
  'src/app/features/lab/components/lab-carousel/lab-carousel.component.ts',
  'src/app/features/lab/components/experiment-card/experiment-card.component.ts',
  'src/app/layout/brand.component.ts'
];

files.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Find all occurrences of templateUrl and ensure they end with a comma
    content = content.replace(/(templateUrl:\s*'[^']+')(\s*\n\s*styleUrls:)/g, '$1,$2');
    
    fs.writeFileSync(fullPath, content);
  }
});
