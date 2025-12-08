import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiPath = path.join(__dirname, '../static/openapi.json');

console.log('Validating OpenAPI spec...');

// Check if file exists
if (!fs.existsSync(openApiPath)) {
  console.error('❌ OpenAPI spec file not found at:', openApiPath);
  console.error('Run "npm run generate-openapi" first');
  process.exit(1);
}

// Load and parse JSON
let spec;
try {
  const content = fs.readFileSync(openApiPath, 'utf-8');
  spec = JSON.parse(content);
  console.log('✓ Valid JSON format');
} catch (error) {
  console.error('❌ Invalid JSON:', String(error));
  process.exit(1);
}

// Validate OpenAPI structure
const validations = [
  { field: 'openapi', expected: '3.0.0', type: 'string' },
  { field: 'info', type: 'object' },
  { field: 'paths', type: 'object' },
];

let errors = 0;
for (const validation of validations) {
  const value = spec[validation.field];
  
  if (value === undefined) {
    console.error(`❌ Missing required field: ${validation.field}`);
    errors++;
    continue;
  }
  
  if (validation.expected && value !== validation.expected) {
    console.error(`❌ ${validation.field} should be "${validation.expected}", got "${value}"`);
    errors++;
    continue;
  }
  
  if (validation.type && typeof value !== validation.type) {
    console.error(`❌ ${validation.field} should be ${validation.type}, got ${typeof value}`);
    errors++;
    continue;
  }
  
  console.log(`✓ ${validation.field} is valid`);
}

// Check paths count
const pathCount = Object.keys(spec.paths).length;
console.log(`✓ Found ${pathCount} API paths`);

if (errors > 0) {
  console.error(`\n❌ Validation failed with ${errors} error(s)`);
  process.exit(1);
}

console.log('\n✅ OpenAPI spec is valid!');
console.log(`   - OpenAPI version: ${spec.openapi}`);
console.log(`   - API title: ${spec.info.title}`);
console.log(`   - API version: ${spec.info.version}`);
console.log(`   - Total paths: ${pathCount}`);
