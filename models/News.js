const { DataTypes } = require("sequelize");

const News = (sequelize) => {
  const model = sequelize.define(
    "news",
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: "뉴스 pri 키",
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "카테고리",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "제목",
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "내용",
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "표지 이미지",
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "본문 이미지",
      },
      shortcut: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "바로가기 버튼 이름",
      },
      link: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "바로가기 버튼 링크",
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "노출 여부",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "news",
      freezeTableName: true,
      timestamps: false,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
  return model;
};

module.exports = News;
