const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs').promises;

const logoCheckFile = (file) => {
  let filePath = null;
  // 파일 정보 유무 확인
  if (file) {
    const { destination, filename } = file;
    filePath =
      destination.split(path.sep)[1] + path.sep + 'logo' + path.sep + filename; // 파일명
  }

  return filePath;
};

const newsCheckFile = (file) => {
  let filePath = null;
  // 파일 정보 유무 확인
  if (file) {
    const { destination, filename } = file;
    filePath =
      destination.split(path.sep)[1] + path.sep + 'news' + path.sep + filename; // 파일명
  }

  return filePath;
};

const newsCheckFiles = (files) => {
  let filePaths = [];
  let filePath = null;
  // 파일 정보 유무 확인
  if (files) {
    for (let file of files) {
      const { destination, filename } = file;
      filePath =
        destination.split(path.sep)[1] +
        path.sep +
        'news' +
        path.sep +
        filename; // 파일명
      filePaths.push(filePath);
    }
  }
  filePaths = JSON.stringify(filePaths);

  return filePaths;
};

const programCheckFile = (file) => {
  let filePath = null;
  // 파일 정보 유무 확인
  if (file) {
    const { destination, filename } = file;
    filePath =
      destination.split(path.sep)[1] +
      path.sep +
      'program' +
      path.sep +
      filename; // 파일명
  }

  return filePath;
};

const programCheckFiles = (files) => {
  let filePaths = [];
  let filePath = null;
  // 파일 정보 유무 확인
  if (files) {
    for (let file of files) {
      const { destination, filename } = file;
      filePath =
        destination.split(path.sep)[1] +
        path.sep +
        'program' +
        path.sep +
        filename; // 파일명
      filePaths.push(filePath);
    }
  }
  filePaths = JSON.stringify(filePaths);

  return filePaths;
};

const deleteUploadedFiles = async (files) => {
  if (!files) return;

  for (const fileArray of Object.values(files)) {
    for (const file of fileArray) {
      try {
        await fs.unlink(file.path);
      } catch (error) {}
    }
  }
};

module.exports = {
  logoCheckFile,
  newsCheckFile,
  newsCheckFiles,
  programCheckFile,
  programCheckFiles,
  deleteUploadedFiles,
};
