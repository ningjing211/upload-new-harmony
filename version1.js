app.post('/remove-image', async (req, res) => {
    const { folderName, imageName, imageIndex } = req.body;
    console.log(req.body);
    console.log('Received remove request:', { folderName, imageName, imageIndex }); // Debug log

    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

    try {
        // 讀取並解析 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        let imagesOrder = JSON.parse(data);

        console.log('imageIndex', imageIndex, 'imageIndex');
        console.log('imageName', imageName);
        console.log('folderName', folderName);

        // 找到對應的 group
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log('group Before:', group);

        if (group && group.additionalImages[imageIndex] && group.additionalImages[imageIndex].name === imageName) {
            // 刪除指定索引的圖片
            group.additionalImages.splice(imageIndex, 1);

            // 刪除伺服器上的圖片檔案
            const imagePath = path.join(__dirname, 'uploads', folderName, imageName);
            await fs.promises.unlink(imagePath);
            console.log(`Image ${imageName} removed successfully from ${folderName}`);

            // 遞補剩餘圖片的 index 和 name，並重新命名伺服器中的實際檔案
            for (const [index, image] of group.additionalImages.entries()) {
                const oldName = image.name;
                const newName = `${index + 1}.jpg`; // 新的名稱，例如 "1.jpg", "2.jpg", etc.

                // 更新 image 的屬性
                image.index = index;
                image.name = newName;
                image.path = `/uploads/${folderName}/${newName}`;
                console.log('old', oldName);
                console.log('index', index);
                console.log('new', newName);

                // 實際檔案重新命名
                const oldPath = path.join(__dirname, 'uploads', folderName, oldName);
                const newPath = path.join(__dirname, 'uploads', folderName, newName);
                try {
                    await fs.promises.rename(oldPath, newPath);
                    console.log(`Renamed ${oldPath} to ${newPath}`);
                } catch (renameErr) {
                    if (renameErr.code !== 'ENOENT') {
                        console.error('重新命名圖片檔案失敗:', renameErr);
                        return res.status(500).json({ error: 'Failed to rename image file' });
                    }
                }
            }

            // 寫入更新後的 imagesOrder.json
            await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
            console.log('group After:', group);

            res.json({ message: 'Image removed and renumbered successfully' });
        } else {
            console.error(`Image not found at specified imageIndex in images order file: ${folderName}`);
            res.status(404).json({ error: 'Image not found at specified imageIndex' });
        }
    } catch (err) {
        console.error('Error processing remove request:', err);
        res.status(500).json({ error: 'Failed to process remove request' });
    }
});
