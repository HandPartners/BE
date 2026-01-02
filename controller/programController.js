const { Program, sequelize } = require('../models');
const {
  programCheckFile,
  programCheckFiles,
  deleteUploadedFiles,
} = require('../utils/fileUtil');
const { getByteLength } = require('../utils/lengthUtil');
const { ProgramCategory } = require('../models/enum/programCategory.enum');
const fs = require('fs').promises;
const { Op } = require('sequelize');

// 프로그램 조회
exports.getProgramList = async (req, res) => {
  try {
    const { category, title } = req.query;
    let { pageNum } = req.query;

    // 카테고리 검증
    if (category && !Object.values(ProgramCategory).includes(category))
      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });

    pageNum = parseInt(pageNum) || 1; // 페이지 번호 기본값 1
    const pageSize = 3; // 페이지당 데이터 개수

    const programList = await Program.findAll({
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
      programList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 프로그램 세부 정보
exports.getProgramDetail = async (req, res) => {
  try {
    const programId = req.params.id;

    const programDetail = await Program.findByPk(programId);

    if (!programDetail) {
      return res.status(404).json({ error: '프로그램을 찾을 수 없습니다.' });
    }

    const data = programDetail.toJSON();

    data.image = data.image ? JSON.parse(data.image) : [];

    res.json({
      success: true,
      programDetail: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 프로그램 새로 만들기
exports.createProgram = async (req, res) => {
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
    if (category && !Object.values(ProgramCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);

      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    if (getByteLength(title) > 255) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '제목은 127자 이내로 입력해주세요.' });
    }

    if (getByteLength(content) > 30000) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '내용은 10000자 이내로 입력해주세요.' });
    }

    if (getByteLength(shortcut) > 255) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '바로가기 버튼 이름은 127자 이내로 입력해주세요.' });
    }

    // 파일 체크
    const thumbnailPath = programCheckFile(thumbnail);
    const imagePath = programCheckFiles(imageFiles);

    const programData = {
      ...(category && { category }),
      title,
      content,
      ...(shortcut && { shortcut }),
      ...(link && { link }),
      visible: visible === 'true' ? true : false,
      ...(thumbnail && { thumbnail: thumbnailPath }),
      ...(imageFiles && { image: imagePath }),
    };

    await Program.create(programData, { transaction });

    await transaction.commit();

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 프로그램 수정 불러오기
exports.getProgramUpdate = async (req, res) => {
  try {
    const programId = req.params.id;

    const program = await Program.findByPk(programId, {
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

    if (!program) {
      return res.status(404).json({ error: '프로그램을 찾을 수 없습니다.' });
    }

    res.send({
      success: true,
      program,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

// 프로그램 수정
exports.updateProgram = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const programId = req.params.id;
    const { category, title, content, shortcut, link, visible, keepImages } =
      req.body;

    const thumbnail = req.files?.thumbnail?.[0];
    const imageFiles = req.files?.image;

    // 기존 뉴스 정보 조회
    const program = await Program.findByPk(programId, {
      transaction,
    });
    if (!program) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(404).json({ error: '프로그램을 찾을 수 없습니다.' });
    }

    // 기존 이미지 목록
    let prevImages = [];
    if (program.image) {
      prevImages = JSON.parse(program.image);
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
      const newImagePaths = JSON.parse(programCheckFiles(imageFiles));
      finalImages = finalImages.concat(newImagePaths);
    }

    // 수정할 값만 객체에 담기
    if (category && !Object.values(ProgramCategory).includes(category)) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    if (getByteLength(title) > 255) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '제목은 127자 이내로 입력해주세요.' });
    }

    if (getByteLength(content) > 30000) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '내용은 10000자 이내로 입력해주세요.' });
    }

    if (getByteLength(shortcut) > 255) {
      await transaction.rollback();
      await deleteUploadedFiles(req.files);
      return res
        .status(400)
        .json({ error: '바로가기 버튼 이름은 127자 이내로 입력해주세요.' });
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
      if (program.thumbnail) {
        const oldFilePath = `uploads/${program.thumbnail}`;
        await fs.unlink(oldFilePath);
      }

      updateData.thumbnail = programCheckFile(thumbnail);
    }

    // 아무 값도 넘어오지 않은 경우
    if (Object.keys(updateData).length === 0) {
      await transaction.rollback();

      // 파일 삭제
      await deleteUploadedFiles(req.files);
      return res.status(400).json({ error: '수정할 값을 입력해주세요.' });
    }

    await Program.update(updateData, {
      where: { id: programId },
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

// 프로그램 삭제
exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;

    const program = await Program.findByPk(programId);

    if (!program) {
      return res.status(404).json({ error: '프로그램을 찾을 수 없습니다.' });
    }

    if (program.thumbnail) {
      const oldFilePath = `uploads/${program.thumbnail}`;
      await fs.unlink(oldFilePath);
    }

    if (program.image) {
      const imageFiles = JSON.parse(program.image);
      for (const filePath of imageFiles) {
        const oldFilePath = `uploads/${filePath}`;
        await fs.unlink(oldFilePath);
      }
    }

    await Program.destroy({
      where: {
        id: programId,
      },
    });

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
