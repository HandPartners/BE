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

    if (!title || !content) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 카테고리 확인
    if (category && !Object.values(NewsCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    // 파일 체크
    const thumbnailPath = newsCheckFile(thumbnail);
    const imagePath = newsCheckFiles(imageFiles);

    const newsData = {
      ...(category && { category }),
      title,
      content,
      ...(shortcut && { shortcut }),
      ...(link && { link }),
      visible: visible === 'true' ? true : false,
      ...(thumbnail && { thumbnail: thumbnailPath }),
      ...(imageFiles && { image: imagePath }),
    };

    await News.create(newsData, { transaction });

    await transaction.commit();

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 수정 불러오기
exports.getNewsUpdate = async (req, res) => {
  try {
    const newsId = req.params.id;

    const news = await News.findByPk(newsId, {
      attributes: [
        'category',
        'title',
        'createdAt',
        'content',
        'thumbnail',
        'image',
        'shortcut',
        'link',
        'visible',
      ],
    });

    if (!news) {
      return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
    }

    res.send({
      success: true,
      news,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 뉴스 수정
exports.updateNews = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const newsId = req.params.id;
    const { category, title, content, shortcut, link, visible, keepImages } =
      req.body;

    const thumbnail = req.files?.thumbnail?.[0];
    const imageFiles = req.files?.image;

    // 기존 뉴스 정보 조회
    const news = await News.findByPk(newsId, {
      transaction,
    });
    if (!news) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
    }

    // 기존 이미지 목록
    let prevImages = [];
    if (news.image) {
      prevImages = JSON.parse(news.image);
    }

    // 프론트에서 유지할 이미지 목록(문자열로 오면 피싱)
    let keepImagesArr = [];
    if (keepImages) {
      keepImagesArr =
        typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
    }

    // 삭제할 이미지 = 기존 이미지 - 유지할 이미지
    const deleteImages = prevImages.filter(
      (img) => !keepImagesArr?.includes(img)
    );
    for (const filePath of deleteImages) {
      const oldFilePath = `uploads/${filePath}`;
      await fs.unlink(oldFilePath);
    }

    // 최종 이미지 목록 = 유지할 이미지 + 새로 업로드한 이미지
    let finalImages = [...keepImagesArr];
    if (imageFiles) {
      const newImagePaths = JSON.parse(newsCheckFiles(imageFiles));
      finalImages = finalImages.concat(newImagePaths);
    }

    // 수정할 값만 객체에 담기
    if (category && !Object.values(NewsCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    const updateData = {
      ...(category && { category }),
      ...(title && { title }),
      ...(content && { content }),
      ...(shortcut && { shortcut }),
      ...(link && { link }),
      ...(visible !== undefined && { visible: visible === 'true' }),
      image: JSON.stringify(finalImages),
    };

    // 파일이 넘어온 경우 기존 파일 삭제 및 새 파일 경로 저장
    if (thumbnail) {
      // 기존 로고 파일 삭제
      if (news.thumbnail) {
        const oldFilePath = `uploads/${news.thumbnail}`;
        await fs.unlink(oldFilePath);
      }

      updateData.thumbnail = newsCheckFile(thumbnail);
    }

    // 아무 값도 넘어오지 않은 경우
    if (Object.keys(updateData).length === 0) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(400).json({ error: '수정할 값을 입력해주세요.' });
    }

    await News.update(updateData, {
      where: { id: newsId },
      transaction,
    });

    await transaction.commit();

    res.send({ success: true });
  } catch (error) {
    console.error(error);

    if (transaction) await transaction.rollback();

    // 파일 삭제
    await deleteUploadedFiles(req.files);

    res.status(500).send('Internal server error');
  }
};

// 뉴스 삭제
exports.deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;

    const news = await News.findByPk(newsId);

    if (!news) {
      return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });
    }

    if (news.thumbnail) {
      const oldFilePath = `uploads/${news.thumbnail}`;
      await fs.unlink(oldFilePath);
    }

    if (news.image) {
      const imageFiles = JSON.parse(news.image);
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
