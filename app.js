const express = require("express");
const app = express();
const PORT = 8080;
const { sequelize } = require("./models");
const http = require("http");

app.get("/", (req, res) => {
  res.send("Hello World!");
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
