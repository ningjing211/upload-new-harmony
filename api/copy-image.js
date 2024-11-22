const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { folderName, newFileName } = req.body;

    if (!folderName || !newFileName) {
        return res.status(400).json({ error: 'Missing required parameters: folderName or newFileName' });
    }

    try {
        const sourcePath = path.join(process.cwd(), 'public', 'uploads', 'upload.jpg'); // 來源檔案
        const destinationFolder = path.join(process.cwd(), 'public', 'uploads', folderName);
        const destinationPath = path.join(destinationFolder, `${newFileName}.jpg`); // 目標檔案

        // 確保目標資料夾存在
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
            console.log(`Created folder: ${destinationFolder}`);
        }

        // 複製檔案
        await fs.promises.copyFile(sourcePath, destinationPath);
        console.log(`Successfully copied to ${destinationPath}`);

        // 回應成功訊息
        res.status(200).json({ message: `Successfully copied to ${destinationPath}` });
    } catch (err) {
        console.error('Error copying file:', err);
        res.status(500).json({ error: 'Failed to copy file' });
    }
};
