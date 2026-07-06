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
    const basename = path.basename(file, '.ts');
    const scssFile = basename + '.scss';
    
    if (!content.includes('styleUrls')) {
      content = content.replace(/templateUrl:\s*'[^']+',?/, match => match + '\n  styleUrls: [\'./' + scssFile + '\'],');
      fs.writeFileSync(fullPath, content);
      console.log('Added styleUrls to ' + file);
    }
  }
});
