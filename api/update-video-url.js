const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folderName, newUrl } = req.body;

    if (!folderName || !newUrl) {
        return res.status(400).json({ error: 'Missing required parameters: folderName or newUrl' });
    }

    const filePath = path.join(process.cwd(), 'public', 'imagesOrder.json'); // 確保 JSON 檔案放在 public 資料夾中

    try {
        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(filePath, 'utf8');
        const imagesOrder = JSON.parse(data);

        // 查找目標資料夾
        const group = imagesOrder.find((g) => g.folderName === folderName);

        if (!group) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // 更新 video URL
        group.video = group.video || {};
        group.video.url = newUrl;

        // 將更新後的數據寫回
        await fs.promises.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        res.status(200).json({ message: 'Video URL updated successfully' });
    } catch (err) {
        console.error('Error handling update-video-url:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
};
