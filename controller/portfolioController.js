const { Portfolio, sequelize } = require('../models');
const { checkFile } = require('../utils/fileUtil');
const { PortfolioCategory } = require('../models/enum/portfolioCategory.enum');
const fs = require('fs').promises;

// 포트폴리오 새로 만들기
exports.createPortfolio = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { category, name, content } = req.body;

    if (!category || !name || !content) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 로고 파일 체크
    if (!req.file) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      return res.status(400).json({ error: '파일을 업로드 해주세요.' });
    }

    // 카테고리 검증
    if (!Object.values(PortfolioCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    // 파일 체크
    const filePath = checkFile(req.file);

    await Portfolio.create(
      {
        category,
        name,
        content,
        logo: filePath,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    if (transaction) await transaction.rollback();

    // 파일 삭제
    if (req.file) {
      await fs.unlink(req.file.path);
    }

    res
      .status(500)
      .send({ error: 'Internal server error', message: error.message });
  }
};
