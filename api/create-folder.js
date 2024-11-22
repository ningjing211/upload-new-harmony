const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folderName } = req.body;

    if (!folderName) {
        return res.status(400).json({ error: 'Missing required parameter: folderName' });
    }

    try {
        const targetFolder = path.join(process.cwd(), 'public', 'uploads', folderName);

        // 檢查資料夾是否已存在
        if (!fs.existsSync(targetFolder)) {
            // 創建資料夾
            fs.mkdirSync(targetFolder, { recursive: true });
            console.log(`Folder created: ${targetFolder}`);
        } else {
            console.log(`Folder already exists: ${targetFolder}`);
        }

        res.status(200).json({ message: 'Folder created or already exists' });
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Failed to create folder' });
    }
};
