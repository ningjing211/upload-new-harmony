const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const folderName = req.query.folderName;

    if (!folderName) {
        return res.status(400).json({ error: 'Missing folderName parameter' });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folderName);
    const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

    try {
        // 檢查目標資料夾是否存在
        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // 讀取 imagesOrder.json
        const imagesOrderData = await fs.promises.readFile(imagesOrderPath, 'utf8');
        const imagesOrder = JSON.parse(imagesOrderData);

        // 查找對應的 group
        const group = imagesOrder.find((g) => g.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        // 過濾圖片並排序
        const files = fs
            .readdirSync(uploadsDir)
            .filter((file) => file.endsWith('.jpg') && !file.startsWith(folderName))
            .sort();

        // 重新命名圖片並更新 group.files
        group.files = [];
        await Promise.all(
            files.map(async (file, index) => {
                const newFileName = `${index + 1}.jpg`;
                const oldPath = path.join(uploadsDir, file);
                const newPath = path.join(uploadsDir, newFileName);

                // 重新命名圖片
                await fs.promises.rename(oldPath, newPath);

                // 更新 group.files
                group.files.push({
                    name: newFileName,
                    path: `/uploads/${folderName}/${newFileName}`,
                });
            })
        );

        // 將更新後的 imagesOrder.json 寫回
        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');

        console.log(`Images in ${folderName} reordered successfully`);
        res.status(200).json({ message: 'Images reordered successfully' });
    } catch (err) {
        console.error('Error reordering images:', err);
        res.status(500).json({ error: 'Failed to reorder images' });
    }
};
