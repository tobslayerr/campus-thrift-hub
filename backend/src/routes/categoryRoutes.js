const express = require('express');
const router = express.Router();
// Import deleteCategory
const { getCategories, addCategory, deleteCategory } = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', addCategory); 
router.delete('/:id', deleteCategory); // Rute baru untuk admin menghapus kategori

module.exports = router;