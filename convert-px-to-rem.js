const fs = require('fs');
const path = require('path');

// px를 rem으로 변환하는 함수 (10으로 나누기)
function convertPxToRem(content) {
  // px 단위를 찾아서 rem으로 변환 (소수점 처리)
  return content.replace(/(\d+(?:\.\d+)?)px/g, (match, value) => {
    const remValue = parseFloat(value) / 10;
    return `${remValue}rem`;
  });
}

// 파일 처리 함수
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const convertedContent = convertPxToRem(content);
    
    // 변경사항이 있을 때만 파일 업데이트
    if (content !== convertedContent) {
      fs.writeFileSync(filePath, convertedContent, 'utf8');
      console.log(`✅ Converted: ${filePath}`);
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// CSS 파일들 처리
const cssFiles = [
  'src/styles/Attendance.css',
  'src/styles/Calendar.css',
  'src/styles/AuthForm.css',
  'src/styles/Header.css',
  'src/styles/Sidebar.css',
  'src/styles/Layout.css',
  'src/styles/global.css',
  'src/styles/CreateLab.css',
  'src/styles/Interview.css',
  'src/styles/Intro.css',
  'src/styles/JoinLab.css',
  'src/styles/LabCard.css',
  'src/styles/LabDetail.css',
  'src/styles/LabPromo.css',
  'src/styles/MyLab.css',
  'src/styles/NoticePage.css',
  'src/styles/Profile.css',
  'src/styles/schedule.css',
  'src/styles/VoteSection.css',
  'src/MemberList.css'
];

console.log('🔄 Converting px to rem units...\n');

cssFiles.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('\n✨ Conversion complete!');