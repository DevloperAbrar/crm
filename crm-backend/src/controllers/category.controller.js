const Category = require('../models/Category');
const { success, error } = require('../utils/apiResponse');

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    return success(res, categories);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    if (req.audit) await req.audit('category.created', 'categories', category._id, null, category);
    return success(res, category, 'Category created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const previous = await Category.findById(req.params.id);
    if (!previous) return error(res, 'Category not found', 404);

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.audit) await req.audit('category.updated', 'categories', updated._id, previous, updated);

    return success(res, updated, 'Category updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
