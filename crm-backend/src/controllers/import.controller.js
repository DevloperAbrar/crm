const { previewImport, commitImport, undoImport } = require('../services/importParser.service');
const { success, error } = require('../utils/apiResponse');

exports.previewImportFile = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const preview = previewImport(req.file.buffer, req.file.originalname);
    return success(res, preview);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.commitImportFile = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const columnMapping = JSON.parse(req.body.columnMapping || '{}');
    const { categoryId, defaultAssignee } = req.body;

    const result = await commitImport(
      req.file.buffer,
      req.file.originalname,
      columnMapping,
      categoryId,
      defaultAssignee
    );

    if (req.audit) await req.audit('import.committed', 'leads', req.user._id, null, result);

    return success(res, result, 'Import committed');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.undoImportBatch = async (req, res) => {
  try {
    const result = await undoImport(req.params.batchId);
    if (req.audit) await req.audit('import.undone', 'leads', req.user._id, null, result);
    return success(res, result, 'Import batch rolled back');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
