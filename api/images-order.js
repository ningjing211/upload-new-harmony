const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads'); // 指向 public/uploads 資料夾
        const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json'); // 指向 public 資料夾

        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        let imagesOrder = JSON.parse(data);

        // 將 `imagesOrder.json` 中的內容與 `uploads` 資料夾同步
        imagesOrder = imagesOrder.map((group) => {
            const folderPath = path.join(uploadsDir, group.folderName);
            if (fs.existsSync(folderPath)) {
                let files = fs.readdirSync(folderPath).filter((file) => !file.startsWith('.'));

                // 確認封面圖片
                const titleImage = files.find((file) => file === `${group.folderName}.jpg`);
                const otherImages = files.filter((file) => file !== `${group.folderName}.jpg`).sort();

                // 更新 `group.files` 結構以包含封面和其他圖片
                group.files = [
                    titleImage
                        ? {
                              name: titleImage,
                              path: `/uploads/${group.folderName}/${titleImage}`,
                              isTitle: true,
                          }
                        : null,
                    ...otherImages.map((file, index) => ({
                        name: file,
                        path: `/uploads/${group.folderName}/${file}`,
                        isTitle: false,
                        index: index + 1,
                    })),
                ].filter(Boolean); // 過濾掉可能的 null 值
            }
            return group;
        });

        // 返回結果
        res.status(200).json(imagesOrder);
    } catch (err) {
        console.error('Error reading imagesOrder.json:', err);
        res.status(500).json({ error: 'Failed to load image order' });
    }
};
