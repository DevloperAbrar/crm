const CityCoverage = require('../models/CityCoverage');
const Category = require('../models/Category');
const { success, error } = require('../utils/apiResponse');

// GET /api/coverage/:stateCode
// Returns every city in the state with the done/not-done status of every
// active category, so the frontend can render the grid in one call.
exports.getStateCoverage = async (req, res) => {
  try {
    const { stateCode } = req.params;

    const [categories, records] = await Promise.all([
      Category.find({ isActive: true }).select('name colour').lean(),
      CityCoverage.find({ stateCode }).lean(),
    ]);

    const recordMap = {}; // `${cityName}::${categoryId}` -> record
    records.forEach((r) => {
      recordMap[`${r.cityName}::${r.categoryId}`] = r;
    });

    return success(res, { categories, recordMap: records, count: records.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/coverage/:stateCode/:cityName
// Category checklist for a single city (used by the modal).
exports.getCityCoverage = async (req, res) => {
  try {
    const { stateCode, cityName } = req.params;

    const [categories, records] = await Promise.all([
      Category.find({ isActive: true }).select('name colour description').lean(),
      CityCoverage.find({ stateCode, cityName }).lean(),
    ]);

    const doneMap = {};
    records.forEach((r) => {
      doneMap[String(r.categoryId)] = { done: r.done, doneDate: r.doneDate };
    });

    const checklist = categories.map((c) => ({
      categoryId: c._id,
      categoryName: c.name,
      colour: c.colour,
      done: doneMap[String(c._id)]?.done || false,
      doneDate: doneMap[String(c._id)]?.doneDate || null,
    }));

    return success(res, { stateCode, cityName, checklist });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PUT /api/coverage/:stateCode/:cityName/:categoryId
// Toggles (or explicitly sets) done status for one category in one city.
// Upserts, since a record only needs to exist once someone touches it.
exports.toggleCoverage = async (req, res) => {
  try {
    const { stateCode, cityName, categoryId } = req.params;
    const { done } = req.body; // boolean, required

    if (typeof done !== 'boolean') {
      return error(res, '"done" must be true or false', 400);
    }

    const category = await Category.findById(categoryId).select('name');
    if (!category) {
      return error(res, 'Category not found', 404);
    }

    const record = await CityCoverage.findOneAndUpdate(
      { stateCode, cityName, categoryId },
      {
        stateCode,
        cityName,
        categoryId,
        categoryName: category.name,
        done,
        doneDate: done ? new Date() : null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return success(res, record);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/coverage/summary/:stateCode
// Small helper for a "X/Y cities covered for category Z" style summary,
// in case you want it on the state view header later.
exports.getStateSummary = async (req, res) => {
  try {
    const { stateCode } = req.params;
    const records = await CityCoverage.find({ stateCode, done: true }).lean();
    const citiesCovered = new Set(records.map((r) => r.cityName));
    return success(res, {
      stateCode,
      citiesWithAtLeastOneCategoryDone: citiesCovered.size,
      totalDoneMarks: records.length,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
