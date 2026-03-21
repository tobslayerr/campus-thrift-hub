const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Ambil Semua Kategori
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Buat Kategori Baru
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi' });

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) return res.status(400).json({ message: 'Kategori sudah ada' });

        const category = await Category.create({ name });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Edit Kategori & Sinkronisasi ke Produk
// @route   PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

        const oldCategoryName = category.name;
        
        // Update nama kategori di tabel Category
        category.name = name;
        await category.save();

        // SINKRONISASI: Ubah semua barang yang pakai kategori lama ke kategori baru
        await Product.updateMany(
            { category: oldCategoryName }, 
            { category: name }
        );

        res.status(200).json({ success: true, message: 'Kategori dan barang terkait berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Hapus Kategori & Reset Produk ke "Buku"
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

        const oldCategoryName = category.name;

        // SINKRONISASI: Ubah semua barang yang pakai kategori ini menjadi default "Buku"
        await Product.updateMany(
            { category: oldCategoryName }, 
            { category: 'Buku' }
        );

        // Hapus kategori dari tabel Category
        await category.deleteOne();

        res.status(200).json({ success: true, message: 'Kategori dihapus, barang dialihkan ke kategori Buku' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};