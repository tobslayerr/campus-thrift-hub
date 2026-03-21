const express = require('express');
const router = express.Router();
const { createReport, getAllReports, updateReportStatus } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/upload');

router.post('/', protect, upload.single('evidenceImage'), createReport);
router.get('/', protect, getAllReports); // Admin
router.put('/:id', protect, updateReportStatus); // Admin

module.exports = router;