const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 設定 multer 用於處理上傳的封面圖片
const upload = multer({ dest: '/tmp/' }); // Vercel 的寫入路徑必須為 `/tmp`

// Vercel 要求的 handler function
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 初始化 multer
    upload.single('coverImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: 'Error processing file upload' });
        }

        const folderName = req.query.folderName; // 從 query string 中取得 folderName
        if (!folderName) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const jsonFilePath = path.join(process.cwd(), 'public', 'imagesOrder.json'); // 確保讀取 public 資料夾中的檔案
        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Failed to read imagesOrder.json:', err);
                return res.status(500).json({ error: 'Failed to read imagesOrder.json' });
            }

            let imagesOrder;
            try {
                imagesOrder = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
                return res.status(500).json({ error: 'Invalid JSON structure' });
            }

            const group = imagesOrder.find((g) => g.folderName === folderName);
            if (!group) {
                return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
            }

            // 將檔案移動到目標路徑
            const targetPath = path.join(process.cwd(), 'public', 'uploads', folderName, `${folderName}.jpg`);
            fs.rename(req.file.path, targetPath, (err) => {
                if (err) {
                    console.error('Failed to move uploaded file:', err);
                    return res.status(500).json({ error: 'Failed to set cover image' });
                }

                console.log(`Cover image uploaded successfully for folder: ${folderName}`);
                res.status(200).json({ message: 'Cover image uploaded successfully', filePath: targetPath });
            });
        });
    });
};
