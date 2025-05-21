const express = require('express');
const router = express.Router();
const controller = require('../controller/newsController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 이미지 설정
const uploadImg = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      const date = new Date();
      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      // 월과 일이 2자리가 아닌 경우, 0을 붙여줌
      if (month < 10) month = '0' + month;
      if (day < 10) day = '0' + day;

      const dir = `uploads/${year}${month}${day}/news`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      callback(null, dir); // 이미지 업로드 폴더 경로 설정
    },
    filename(req, file, callback) {
      // 한글 파일명 처리 및 특수문자/널바이트 제거
      let originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8'
      );
      originalName = originalName
        .replace(/\0/g, '')
        .replace(/[^\w.\-가-힣]/g, '');

      const random = Math.trunc(Math.random() * Math.pow(10, 15)); // 임의의 15자리 숫자를 가지고 온다.
      const ext = path.extname(file.originalname); // 확장자 추출
      const base = path.basename(originalName, ext);

      fileName = base + random + ext; // 파일명
      // Ex) apple.png → apple40195724.png
      callback(null, fileName); // 업로드할 이미지의 파일명 설정
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 파일 최대 사이즈 : 50MB
  },
});

router.get('/', controller.getNewsList);
router.get('/:id', controller.getNewsDetail);
router.post(
  '/new',
  uploadImg.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'image', maxCount: 10 },
  ]),
  controller.createNews
);
router.patch(
  '/:id',
  uploadImg.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'image', maxCount: 10 },
  ]),
  controller.updateNews
);
router.delete('/:id', controller.deleteNews);

module.exports = router;
