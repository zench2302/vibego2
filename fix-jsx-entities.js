const fs = require("fs");
const path = require("path");

// 递归获取项目中所有 .tsx 文件
function getAllTsxFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllTsxFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".tsx")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// 替换 JSX 内部未转义的 ' 和 "
function fixEntitiesInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // 正则只替换 JSX 中文本节点中的 `'` 和 `"`
  content = content.replace(/>([^<]*)'/g, ">$1'");
  content = content.replace(/>([^<]*)"/g, ">$1"");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Fixed: ${filePath}`);
}

// 执行主逻辑
const projectRoot = process.cwd(); // 当前目录
const tsxFiles = getAllTsxFiles(projectRoot);

console.log(`🔍 Found ${tsxFiles.length} .tsx files. Starting replacement...`);
tsxFiles.forEach(fixEntitiesInFile);
console.log("✅ All done.");

