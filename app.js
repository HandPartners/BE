const express = require('express');
const app = express();
const PORT = 8080;
const cors = require('cors');
const { sequelize } = require('./models');
const http = require('http');
const multer = require('multer');
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// express 애플리케이션에 프록시 서버를 믿을 수 있다고 알려주는 것
// express는 요청 헤더의 X-Forwarded-Proto 값을 사용하여 원래 프로토콜을 복원
app.set('trust proxy', true); // 로드밸런서가 있을 경우 사용

// 정적 파일 접근
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 메인
const mainRouter = require('./routes/main');
app.use('/', mainRouter);

// 포트폴리오
const portfolioRouter = require('./routes/portfolio');
app.use('/portfolio', portfolioRouter);

// 뉴스
const newsRouter = require('./routes/news');
app.use('/news', newsRouter);

// Multer 에러 및 기타 에러 핸들러
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // 썸네일 개수 초과 등 multer 관련 에러 처리
    if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'thumbnail') {
      return res
        .status(400)
        .json({ error: '표지 이미지는 1개만 업로드 가능합니다.' });
    }
    // 썸네일 개수 초과 등 multer 관련 에러 처리
    if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'image') {
      return res
        .status(400)
        .json({ error: '본문 이미지는 10개까지 업로드 가능합니다.' });
    }
    // 기타 multer 에러
    return res.status(400).json({ error: err.message });
  }
  // 그 외 에러
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

/// 서버 실행
sequelize.sync({ force: false }).then(() => {
  // HTTP 서버 생성
  server = http.createServer(app);

  // 서버 실행
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});
