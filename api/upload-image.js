const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 使用 multer 處理上傳的圖片
const upload = multer({ dest: '/tmp/' }); // 使用 Vercel 唯一可寫的 /tmp 目錄

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 初始化 multer 處理檔案
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        const { folderName, index } = req.query;
        if (!folderName || !index) {
            return res.status(400).json({ error: 'Missing folderName or index in query' });
        }

        const filePath = path.join(process.cwd(), 'public', 'imagesOrder.json'); // JSON 文件路徑
        try {
            // 讀取 imagesOrder.json
            const data = await fs.promises.readFile(filePath, 'utf8');
            const imagesOrder = JSON.parse(data);

            // 查找目標資料夾
            const group = imagesOrder.find((g) => g.folderName === folderName);
            if (!group) {
                return res.status(404).json({ error: 'Folder not found' });
            }

            if (!group.additionalImages) {
                group.additionalImages = [];
            }

            // 設定檔案名稱和目標路徑
            const fileName = `${Number(index) + 1}.jpg`;
            const targetPath = path.join(process.cwd(), 'public', 'uploads', folderName, fileName);

            // 移動檔案到目標目錄
            await fs.promises.rename(req.file.path, targetPath);

            // 更新 imagesOrder.json
            const image = group.additionalImages.find((file) => file.index === Number(index));
            if (image) {
                image.path = `/uploads/${folderName}/${fileName}`;
                image.name = fileName;
            } else {
                group.additionalImages.push({ name: fileName, path: `/uploads/${folderName}/${fileName}` });
            }

            // 寫回更新後的 imagesOrder.json
            await fs.promises.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), 'utf8');

            console.log(`Image uploaded successfully for ${folderName}, index ${index}`);
            res.json({ path: `/uploads/${folderName}/${fileName}`, message: 'Image uploaded successfully' });
        } catch (err) {
            console.error('Error handling upload:', err);
            res.status(500).json({ error: 'Failed to handle upload' });
        }
    });
};
