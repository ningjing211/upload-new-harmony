const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const newImagesOrder = req.body;

    if (!newImagesOrder || !Array.isArray(newImagesOrder)) {
        return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
    }

    const filePath = path.join(process.cwd(), 'public', 'imagesOrder.json'); // 確保 JSON 檔案位於 public 資料夾

    try {
        // 寫入新順序到 imagesOrder.json
        await fs.promises.writeFile(filePath, JSON.stringify(newImagesOrder, null, 2), 'utf8');
        console.log('Images order updated successfully');
        res.status(200).json({ message: 'Images order updated successfully' });
    } catch (err) {
        console.error('Failed to update imagesOrder.json:', err);
        res.status(500).json({ error: 'Failed to update image order file' });
    }
};
