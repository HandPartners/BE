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
      if (req.file) await fs.unlink(req.file.path);

      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 로고 파일 체크
    if (!req.file) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

      return res.status(400).json({ error: '파일을 업로드 해주세요.' });
    }

    // 카테고리 검증
    if (!Object.values(PortfolioCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

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

    res.send({ success: true });
  } catch (error) {
    console.error(error);

    if (transaction) await transaction.rollback();

    // 파일 삭제
    if (req.file) await fs.unlink(req.file.path);

    res.status(500).send({ error: 'Internal server error' });
  }
};

// 포트폴리오 수정
exports.updatePortfolio = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const portfolioId = req.params.id;
    const { category, name, content } = req.body;

    if (!category || !name || !content) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 로고 파일 체크
    if (!req.file) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

      return res.status(400).json({ error: '파일을 업로드 해주세요.' });
    }

    // 카테고리 검증
    if (!Object.values(PortfolioCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    // 기존 포트폴리오 정보 조회
    const portfolio = await Portfolio.findByPk(portfolioId, {
      transaction,
    });

    if (!portfolio) {
      await transaction.rollback();

      // 파일 삭제
      if (req.file) await fs.unlink(req.file.path);

      return res.status(404).json({ error: '포트폴리오를 찾을 수 없습니다.' });
    }

    // 기존 로고 파일 삭제
    if (portfolio.logo) {
      const oldFilePath = `uploads/${portfolio.logo}`;
      await fs.unlink(oldFilePath);
    }

    // 파일 체크
    const filePath = checkFile(req.file);

    await Portfolio.update(
      {
        category,
        name,
        content,
        logo: filePath,
      },
      {
        where: { id: portfolioId },
        transaction,
      }
    );
    await transaction.commit();

    res.send({
      success: true,
    });
  } catch (error) {
    console.error(error);

    if (transaction) await transaction.rollback();

    // 파일 삭제
    if (req.file) {
      await fs.unlink(req.file.path);
    }

    res.status(500).send({ error: 'Internal server error' });
  }
};

// 포트폴리오 삭제
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolioId = req.params.id;

    const portfolio = await Portfolio.findByPk(portfolioId);

    if (!portfolio)
      return res.status(404).json({ error: '포트폴리오를 찾을 수 없습니다.' });

    if (portfolio.logo) {
      const oldFilePath = `uploads/${portfolio.logo}`;
      await fs.unlink(oldFilePath);
    }

    await Portfolio.destroy({
      where: { id: portfolioId },
    });

    res.send({ success: true });
  } catch {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
