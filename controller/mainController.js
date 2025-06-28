const { Portfolio, News, Program } = require('../models');

// 메인 화면
exports.getMain = async (req, res) => {
  try {
    const portfolioList = await Portfolio.findAll({
      attributes: ['id', 'logo'],
      order: [['createdAt', 'DESC']],
      limit: 15,
    });

    const programList = await Program.findAll({
      attributes: [
        'id',
        'thumbnail',
        'category',
        'title',
        'content',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: 3,
    });

    const newsList = await News.findAll({
      attributes: [
        'id',
        'thumbnail',
        'category',
        'title',
        'content',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: 3,
    });

    res.send({
      success: true,
      portfolioList,
      programList,
      newsList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
