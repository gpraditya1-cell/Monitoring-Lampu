const fs = require('fs');
const path = require('path');

console.log('=== ENV SETUP VERIFICATION ===');

// Check root .env.example
const rootEnvExample = path.join(process.cwd(), '.env.example');
console.log('\n1. Root .env.example:');
if (fs.existsSync(rootEnvExample)) {
  const content = fs.readFileSync(rootEnvExample, 'utf8');
  console.log(content);
  
  // Verify no real credentials
  if (content.includes('postgres:postgres') || content.includes('your-project.supabase.co')) {
    console.error('❌ FAIL: Real credentials found in .env.example');
    process.exit(1);
  }
  console.log('✅ PASS: No real credentials in .env.example');
} else {
  console.error('❌ FAIL: .env.example not found');
  process.exit(1);
}

// Check frontend .env.example
const mhlEnvExample = path.join(process.cwd(), 'artifacts/mhl/.env.example');
console.log('\n2. Frontend artifacts/mhl/.env.example:');
if (fs.existsSync(mhlEnvExample)) {
  const content = fs.readFileSync(mhlEnvExample, 'utf8');
  console.log(content);
  
  // Verify placeholders are present
  if (!content.includes('your-project.supabase.co') || !content.includes('your-anon-key-here')) {
    console.error('❌ FAIL: Placeholders missing from frontend .env.example');
    process.exit(1);
  }
  console.log('✅ PASS: Frontend .env.example contains expected placeholders');
} else {
  console.error('❌ FAIL: artifacts/mhl/.env.example not found');
  process.exit(1);
}

// Check .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
console.log('\n3. .gitignore coverage:');
if (fs.existsSync(gitignorePath)) {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n');
  const envLines = lines.filter(line => line.includes('.env') || line.includes('.key') || line.includes('.pem') || line.includes('.secret'));
  console.log('Found .env related lines:')
  envLines.forEach(line => console.log(`  ${line}`));
  
  if (!content.includes('.env.local') || !content.includes('.env.*.local')) {
    console.error('❌ FAIL: .env.local or .env.*.local not in .gitignore');
    process.exit(1);
  }
  console.log('✅ PASS: .env.local patterns properly ignored');
} else {
  console.error('❌ FAIL: .gitignore not found');
  process.exit(1);
}

console.log('\n=== ALL CHECKS PASSED ===');
