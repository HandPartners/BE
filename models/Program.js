const { DataTypes } = require('sequelize');

const Program = (sequelize) => {
  const model = sequelize.define(
    'program',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '프로그램 pri 키',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '카테고리',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '제목',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '내용',
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '표지 이미지',
      },
      image: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
        comment: '본문 이미지',
      },
      shortcut: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '바로가기 버튼 이름',
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '바로가기 버튼 링크',
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '노출 여부',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'program',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  );
  return model;
};

module.exports = Program;
