'use strict';

require('dotenv').config();

const Sequelize = require('sequelize');
const db = {};

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    timezone: '+09:00',
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
    },
  }
);

// 모델 모듈 불러오기
const News = require('./News')(sequelize);
const Portfolio = require('./Portfolio')(sequelize);
const Program = require('./Program')(sequelize);

// 모델 DB 객체에 저장
db.News = News;
db.Portfolio = Portfolio;
db.Program = Program;

db.sequelize = sequelize;

module.exports = db;
