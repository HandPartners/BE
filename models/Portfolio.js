const { DataTypes } = require('sequelize');

const Portfolio = (sequelize) => {
  const model = sequelize.define(
    'portfolio',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '포트폴리오 pri 키',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '카테고리',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '회사명',
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '회사 소개',
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '회사 로고',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'portfolio',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  );
  return model;
};

module.exports = Portfolio;
