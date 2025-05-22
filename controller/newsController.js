const { News, sequelize } = require('../models');
const {
  newsCheckFile,
  newsCheckFiles,
  deleteUploadedFiles,
} = require('../utils/fileUtil');
const { NewsCategory } = require('../models/enum/newsCategory.enum');
const fs = require('fs').promises;
const { Op } = require('sequelize');

// 뉴스 조회
exports.getNewsList = async (req, res) => {
  try {
    const { category, title } = req.query;
    let { pageNum } = req.query;

    // 카테고리 검증
    if (category && !Object.values(NewsCategory).includes(category))
      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });

    pageNum = parseInt(pageNum) || 1; // 페이지 번호 기본값 1
    const pageSize = 3; // 페이지당 데이터 개수

    const newsList = await News.findAll({
      attributes: [
        'id',
        'category',
        'thumbnail',
        'title',
        'content',
        'createdAt',
      ],
      where: {
        ...(category && { category }),
        ...(title && { title: { [Op.like]: `%${title}%` } }),
      },
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
    });

    res.send({
      success: true,
      newsList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 세부 정보
exports.getNewsDetail = async (req, res) => {
  try {
    const newsId = req.params.id;

    const newsDetail = await News.findByPk(newsId);

    if (!newsDetail) {
      return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
    }

    res.send({
      success: true,
      newsDetail,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 새로 만들기
exports.createNews = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { category, title, content, shortcut, link, visible } = req.body;

    const thumbnail = req.files?.thumbnail?.[0];
    const imageFiles = req.files?.image;

    if (!category || !title || !content || !shortcut || !link) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 썸네일 확인
    if (!thumbnail) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '표지 이미지를 업로드 해주세요.' });
    }

    // 이미지 확인
    if (!imageFiles) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '본문 이미지를 업로드 해주세요.' });
    }

    // 카테고리 확인
    if (!Object.values(NewsCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    // 파일 체크
    const thumbnailPath = newsCheckFile(thumbnail);
    const imagePath = newsCheckFiles(imageFiles);

    await News.create(
      {
        category,
        title,
        content,
        thumbnail: thumbnailPath,
        image: imagePath,
        shortcut,
        link,
        visible: visible === 'true' ? true : false,
      },
      { transaction }
    );

    await transaction.commit();

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 수정
exports.updateNews = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 삭제
exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;

    const newsDetail = await News.findByPk(newsId);

    if (!newsDetail) {
      return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
    }

    if (newsDetail.thumbnail) {
      const oldFilePath = `uploads/${newsDetail.thumbnail}`;
      await fs.unlink(oldFilePath);
    }

    if (newsDetail.image) {
      const imageFiles = JSON.parse(newsDetail.image);
      for (const filePath of imageFiles) {
        const oldFilePath = `uploads/${filePath}`;
        await fs.unlink(oldFilePath);
      }
    }

    await News.destroy({
      where: {
        id: newsId,
      },
    });

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
