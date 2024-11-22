const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folderName, imageName, imageIndex } = req.body;

    if (!folderName || !imageName || imageIndex === undefined) {
        return res.status(400).json({ error: 'Missing required parameters: folderName, imageName, or imageIndex' });
    }

    const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');
    const folderPath = path.join(process.cwd(), 'public', 'uploads', folderName);

    try {
        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        const imagesOrder = JSON.parse(data);

        // 查找對應的 group
        const group = imagesOrder.find((g) => g.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        const imageToRemove = group.additionalImages[imageIndex];
        if (!imageToRemove || imageToRemove.name !== imageName) {
            return res.status(404).json({ error: 'Image not found at specified imageIndex' });
        }

        // 刪除圖片實體檔案
        const imagePath = path.join(folderPath, imageName);
        try {
            await fs.promises.unlink(imagePath);
            console.log(`Deleted file: ${imagePath}`);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`File not found: ${imagePath}, skipping deletion`);
            } else {
                throw err;
            }
        }

        // 更新 imagesOrder.json
        group.additionalImages.splice(imageIndex, 1);

        // 重新命名剩餘圖片
        for (let i = imageIndex; i < group.additionalImages.length; i++) {
            const oldName = group.additionalImages[i].name;
            const newName = `${i + 1}.jpg`;
            const oldPath = path.join(folderPath, oldName);
            const newPath = path.join(folderPath, newName);

            try {
                await fs.promises.rename(oldPath, newPath);
                group.additionalImages[i].name = newName;
                group.additionalImages[i].path = `/uploads/${folderName}/${newName}`;
                console.log(`Renamed ${oldPath} to ${newPath}`);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    console.log(`File not found during renaming: ${oldPath}, skipping`);
                } else {
                    throw err;
                }
            }
        }

        // 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log('Updated imagesOrder.json successfully');
        res.json({ message: 'Image removed and renumbered successfully' });
    } catch (err) {
        console.error('Error processing remove request:', err);
        res.status(500).json({ error: 'Failed to process remove request' });
    }
};
