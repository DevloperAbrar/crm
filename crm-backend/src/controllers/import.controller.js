const { previewImport, commitImport, undoImport } = require('../services/importParser.service');
const { success, error } = require('../utils/apiResponse');

exports.previewImportFile = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const preview = previewImport(req.file.buffer, req.file.originalname);
    return success(res, preview);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.commitImportFile = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    let columnMapping;
    try {
      columnMapping = JSON.parse(req.body.columnMapping || '{}');
    } catch (parseErr) {
      return error(res, 'Invalid column mapping', 400);
    }

    // categoryId is OPTIONAL - it acts as the default category for rows
    // whose category cell is blank (or for files with no category column).
    const { categoryId, defaultAssignee } = req.body;

    const result = await commitImport(
      req.file.buffer,
      req.file.originalname,
      columnMapping,
      categoryId || null,
      defaultAssignee || null
    );

    if (req.audit) {
      await req.audit('import.committed', 'leads', req.user._id, null, {
        batchId: result.batchId,
        totalRows: result.totalRows,
        inserted: result.inserted,
        skippedDuplicates: result.skippedDuplicates,
        flagged: result.flagged.length,
        failed: result.failed.length,
        unmatchedRowCount: result.unmatchedRowCount,
        invalidPhones: result.invalidPhones.length,
        byCategory: result.byCategory,
      });
    }

    return success(res, result, 'Import committed');
  } catch (err) {
    console.error('[import.commit] failed:', err);
    return error(res, err.message, err.status || 500);
  }
};

exports.undoImportBatch = async (req, res) => {
  try {
    const result = await undoImport(req.params.batchId);
    if (req.audit) await req.audit('import.undone', 'leads', req.user._id, null, result);
    return success(res, result, 'Import batch rolled back');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};