const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const iconv = require('iconv-lite');



// 設定靜態資源
app.use(express.static(path.join(__dirname)));

// 動態設置上傳目標資料夾
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName; // 獲取資料夾名稱
        const uploadPath = path.join(__dirname, 'uploads', folderName);

        // 如果資料夾不存在，則創建
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const folderName = req.params.folderName;
        const uploadPath = path.join(__dirname, 'uploads', folderName);

        // 讀取現有的文件並確定下一個文件的序號
        const existingFiles = fs.readdirSync(uploadPath).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
        const newFileIndex = existingFiles.length + 1; // 新文件的序號為現有文件數量 + 1
        const newFileName = `${newFileIndex}.jpg`; // 使用新文件序號作為文件名
        cb(null, newFileName);
    }
});


const upload = multer({ storage: storage });

// 新增一個函數，用於更新 imagesOrder.json

app.use(express.json()); // This line is critical for parsing JSON in requests

// Set up storage for multer for cover image uploads
const coverStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName;
        const uploadPath = path.join(__dirname, 'uploads', folderName);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const folderName = req.params.folderName;
        cb(null, `${folderName}.jpg`); // Save cover image with a fixed name
    }
});

const coverUpload = multer({ storage: coverStorage });


// 在圖片上傳成功後，更新 imagesOrder.json
app.post('/upload-cover/:folderName', coverUpload.single('coverImage'), (req, res) => {
    const folderName = req.params.folderName;
    const filePath = path.join(__dirname, 'imagesOrder.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to load image order:', err);
            return res.status(500).json({ error: 'Failed to load image order' });
        }

        let imagesOrder = JSON.parse(data);
        const group = imagesOrder.find(g => g.folderName === folderName);

        if (group) {
            const coverImagePath = path.join(__dirname, 'uploads', folderName, `${folderName}.jpg`);
            fs.rename(req.file.path, coverImagePath, (err) => {
                if (err) {
                    console.error('Failed to set cover image:', err);
                    return res.status(500).json({ error: 'Failed to set cover image' });
                }
                
                console.log(`Cover image set for ${folderName}: ${coverImagePath}`);
                res.json({ message: 'Cover image uploaded successfully' });
            });
        } else {
            console.error(`Folder not found: ${folderName}`);
            res.status(404).json({ error: 'Folder not found' });
        }
    });
});

// API 路由：讀取 imagesOrder.json 並提供給前端
// server.js
app.get('/images-order', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

    fs.readFile(imagesOrderPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load image order' });
        }

        let imagesOrder = JSON.parse(data);

        // 將 `imagesOrder.json` 中的內容與 `uploads` 資料夾同步
        imagesOrder.forEach(group => {
            const folderPath = path.join(uploadsDir, group.folderName);
            if (fs.existsSync(folderPath)) {
                let files = fs.readdirSync(folderPath).filter(file => !file.startsWith('.'));

                // 確認封面圖片
                const titleImage = files.find(file => file === `${group.folderName}.jpg`);
                const otherImages = files.filter(file => file !== `${group.folderName}.jpg`).sort();

                // 更新 `group.files` 結構以包含封面和其他圖片
                group.files = [
                    titleImage ? { name: titleImage, path: `/uploads/${group.folderName}/${titleImage}`, isTitle: true } : null,
                    ...otherImages.map((file, index) => ({
                        name: file,
                        path: `/uploads/${group.folderName}/${file}`,
                        isTitle: false,
                        index: index + 1
                    }))
                ].filter(Boolean); // 過濾掉可能的 null 值
            }
        });

        res.json(imagesOrder);
    });
});



// 更新影片連結的 API

app.post('/update-video-url', (req, res) => {
    const { folderName, newUrl } = req.body; // Now req.body should be defined
    const filePath = path.join(__dirname, 'imagesOrder.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load image order' });
        }

        const imagesOrder = JSON.parse(data);
        const group = imagesOrder.find(g => g.folderName === folderName);

        if (group) {
            // Ensure group.video exists before updating
            group.video = group.video || {};
            group.video.url = newUrl;

            fs.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save image order' });
                }
                res.json({ message: 'Video URL updated successfully' });
            });
        } else {
            res.status(404).json({ error: 'Folder not found or video not defined' });
        }
    });
});

app.post('/update-images-order', (req, res) => {
    const newImagesOrder = req.body; // 獲取前端傳送的資料
    const filePath = path.join(__dirname, 'imagesOrder.json');

    // 將接收到的資料寫入 imagesOrder.json
    fs.writeFile(filePath, JSON.stringify(newImagesOrder, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Failed to write imagesOrder.json:', err);
            return res.status(500).json({ error: 'Failed to update image order file' });
        }

        console.log('Images order updated successfully');
        res.json({ message: 'Images order updated successfully' });
    });
});

app.post('/upload-image/:folderName/:index', upload.single('image'), async (req, res) => {
    const folderName = req.params.folderName;
    const index = Number(req.params.index);
    console.log(index);
    const filePath = path.join(__dirname, 'imagesOrder.json');
    console.log(filePath);
    try {
        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(filePath, 'utf8');
        let imagesOrder = JSON.parse(data);
        const group = imagesOrder.find(g => g.folderName === folderName);

        if (!group) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (!group.additionalImages) {
            group.additionalImages = [];
        }

        // 設定檔案名稱和路徑
        const fileName = index + 1;
        console.log(fileName);
        const imageFileName = `${fileName}.jpg`;
        const imagePath = path.join(__dirname, 'uploads', folderName, imageFileName);
        console.log('imagePath:', imagePath);
        // 移動上傳的檔案到目標位置
        await fs.promises.rename(req.file.path, imagePath);

        // 更新 imagesOrder.json 中的路徑
        const image = group.additionalImages.find(file => file.index === index);
        if (image) {
            image.path = `/uploads/${folderName}/${imageFileName}`;
            console.log('xxx', image.path)
        } else {
            group.additionalImages.push({ name: imageFileName, path: `/uploads/${folderName}/${imageFileName}` });
        }

        // 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log(`Image uploaded successfully for ${folderName}, index ${index}: ${imagePath}`);
        res.json({ path: `/uploads/${folderName}/${imageFileName}`, message: 'Image uploaded successfully' });
    } catch (err) {
        console.error('Error handling upload:', err);
        res.status(500).json({ error: 'Failed to handle upload' });
    }
});


app.post('/reorder-images/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const uploadsDir = path.join(__dirname, 'uploads', folderName);
    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

    // 檢查資料夾是否存在
    if (!fs.existsSync(uploadsDir)) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    // 讀取並重新命名資料夾內的圖片檔案
    let imagesOrder;
    try {
        imagesOrder = JSON.parse(fs.readFileSync(imagesOrderPath, 'utf8'));
    } catch (err) {
        console.error('Failed to load image order:', err);
        return res.status(500).json({ error: 'Failed to load image order' });
    }

    const group = imagesOrder.find(g => g.folderName === folderName);
    if (!group) {
        return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
    }

    // 過濾出有效圖片並排序
    const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.jpg') && !file.startsWith(folderName)).sort();

    // 重新命名圖片和更新 group.files
    group.files = [];
    files.forEach((file, index) => {
        const newFileName = `${index + 1}.jpg`;
        const oldPath = path.join(uploadsDir, file);
        const newPath = path.join(uploadsDir, newFileName);

        // 更新圖片名稱
        fs.renameSync(oldPath, newPath);

        // 更新 group.files 內容
        group.files.push({
            name: newFileName,
            path: `/uploads/${folderName}/${newFileName}`
        });
    });

    // 將更新後的 imagesOrder 寫回檔案
    fs.writeFileSync(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
    console.log(`Images in ${folderName} reordered successfully`);

    res.json({ message: 'Images reordered successfully' });
});


// Serve uploads 資料夾中的圖片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/remove-image', (req, res) => {
    const { folderName, imageName, imageIndex } = req.body;
    console.log(req.body);
    console.log('Received remove request:', { folderName, imageName, imageIndex }); // Debug log

    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
    
    // 讀取並更新 imagesOrder.json
    fs.readFile(imagesOrderPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to load imagesOrder:', err);
            return res.status(500).json({ error: 'Failed to load image order file' });
        }

        let imagesOrder;
        try {
            imagesOrder = JSON.parse(data);
        } catch (parseErr) {
            console.error('Failed to parse imagesOrder.json:', parseErr);
            return res.status(500).json({ error: 'Failed to parse image order file' });
        }

        console.log('imageIndex', imageIndex, 'imageIndex');
        console.log('imageName', imageName);
        console.log('folderName', folderName);
        // 找到對應的 group
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log('group Before:', group)
        if (group && group.additionalImages[imageIndex] && group.additionalImages[imageIndex].name === imageName) {
            // 刪除指定索引的圖片
            group.additionalImages.splice(imageIndex, 1);
        
            // 寫入更新後的 imagesOrder.json
            fs.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Failed to update images order:', writeErr);
                    return res.status(500).json({ error: 'Failed to update image order file' });
                }
        
                // 刪除伺服器上的圖片檔案
                const imagePath = path.join(__dirname, 'uploads', folderName, imageName);
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error('Failed to delete image file:', unlinkErr);
                        return res.status(500).json({ error: 'Failed to delete image file' });
                    }
                    console.log(`Image ${imageName} removed successfully from ${folderName}`);
                    res.json({ message: 'Image removed successfully' });
                });
            });
            console.log('group After:', group)
        } else {
            console.error(`Image not found at specified imageIndex in images order file: ${folderName}`);
            res.status(404).json({ error: 'Image not found at specified imageIndex' });
        }
        
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
