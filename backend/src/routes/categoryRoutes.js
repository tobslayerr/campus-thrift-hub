const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', createCategory);

// Tambahkan rute untuk Edit (PUT) dan Hapus (DELETE)
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;