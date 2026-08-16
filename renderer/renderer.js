const sourcePath = document.querySelector('#source-path');
const outputPath = document.querySelector('#output-path');
const chooseSource = document.querySelector('#choose-source');
const chooseOutput = document.querySelector('#choose-output');
const convertButton = document.querySelector('#convert');
const status = document.querySelector('#status');

let sourceDir = '';
let outputDir = '';

function showPath(element, value) {
  element.textContent = value || '未选择';
}

chooseSource.addEventListener('click', async () => {
  const selected = await window.webpTool.chooseFolder();
  if (selected) {
    sourceDir = selected;
    showPath(sourcePath, selected);
  }
});

chooseOutput.addEventListener('click', async () => {
  const selected = await window.webpTool.chooseFolder();
  if (selected) {
    outputDir = selected;
    showPath(outputPath, selected);
  }
});

convertButton.addEventListener('click', async () => {
  if (!sourceDir || !outputDir) {
    status.textContent = '请选择源文件夹和输出文件夹';
    return;
  }

  convertButton.disabled = true;
  status.textContent = '正在转换，请稍候…';

  try {
    const result = await window.webpTool.convert(sourceDir, outputDir);
    status.textContent = result.succeeded === 0 && result.failed.length === 0
      ? '未找到 WebP 图片'
      : `完成：成功 ${result.succeeded} 张，失败 ${result.failed.length} 张`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    convertButton.disabled = false;
  }
});
