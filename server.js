const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const iconv = require('iconv-lite');



// 設定靜態資源
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

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
        const newFileIndex = Number(req.params.index) + 1; // index + 1 才會變成file name
        // 讀取現有的文件並確定下一個文件的序號
        const existingFiles = fs.readdirSync(uploadPath).filter(f => f.endsWith('.jpg'));
        console.log('sssssssss-existingFiles', newFileIndex);
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
app.post('/api/upload-cover/:folderName', coverUpload.single('coverImage'), (req, res) => {
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

app.post('/api/update-video-url', (req, res) => {
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

app.post('/api/update-images-order', (req, res) => {
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

app.post('/api/upload-image/:folderName/:index', upload.single('image'), async (req, res) => {
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
        console.log(group);
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
        console.log(req);
        console.log('breakkkkkkkkkkkkkkkkkkery');
        console.log(req.file);
        console.log(req.file.path);
        await fs.promises.rename(req.file.path, imagePath);

        // 更新 imagesOrder.json 中的路徑
        const image = group.additionalImages.find(file => file.index === index);
        if (image) {
            image.path = `/uploads/${folderName}/${imageFileName}`;
            image.name = imageFileName;
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


app.post('/api/reorder-images/:folderName', (req, res) => {
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
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));


app.post('/api/remove-image', async (req, res) => {
    const { folderName, imageName, imageIndex } = req.body;
    console.log(req.body);
    console.log('Received remove request:', { folderName, imageName, imageIndex }); // Debug log

    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
    // console.log('imagesOrderPath', imagesOrderPath);

    try {
        // 讀取並解析 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        let imagesOrder = JSON.parse(data);
        // console.log('imagesOrder', imagesOrder);
        console.log('imageIndex', imageIndex, 'imageIndex');
        console.log('imageName', imageName);
        console.log('folderName', folderName);

        // 找到對應的 group
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log('group Before:', group);
        console.log('----分隔線----');
        console.log(group.additionalImages[imageIndex]);
        console.log(group.additionalImages[imageIndex].name);
        console.log(imageName);

        if (group && group.additionalImages[imageIndex] && group.additionalImages[imageIndex].name === imageName) {
            // 刪除指定索引的圖片
            console.log('有進來嗎?')
            
            let hasNotDeleted = true;
            // 刪除伺服器上的圖片檔案
            const imagePath = path.join(__dirname, 'uploads', folderName, imageName);
            console.log('有imagePath嗎?', imagePath)
            const originalLength = group.additionalImages.length;
            

            // 遞補剩餘圖片的 index 和 name，並重新命名伺服器中的實際檔案
            for (const [index, image] of group.additionalImages.entries()) {
                console.log('在一開頭印出index', index);
                console.log('在一開頭印出group.additionalImages.length', group.additionalImages.length);
                console.log('index:', index, 'imageIndex:', imageIndex);
                console.log('abc - image.name', image.name);
                console.log('abc - imageName', imageName);
                console.log('確定是不是最後一個:', imageIndex == originalLength - 1);
                console.log('group.additionalImages.length - 1', originalLength - 1);
                // Check if file exists before unlinking
                try {
                    if (image.name !== "no image yet" && image.name == imageName && hasNotDeleted) {

                        console.log('在刪除陣列前印出index, image', index, image);
                        console.log('...', group.additionalImages[index]);
                        group.additionalImages.splice(imageIndex, 1); //刪除陣列裡面的 8.jpg, index: 7

                        console.log('長度:', originalLength)
                        console.log(index != originalLength - 1)
                        if(index != originalLength - 1) {
                            console.log('在刪除陣列後印出index, image', index, image);
                            console.log('動作前...', group.additionalImages[index]); //這個才是真實的陣列
                            const theOldName = group.additionalImages[index].name;
                            console.log('theOldName', theOldName);
                            const nextUpIndex = index + 1;
                            group.additionalImages[index].name = `${nextUpIndex}.jpg`;
                            group.additionalImages[index].path = `/uploads/image-1/${nextUpIndex}.jpg`;
                            const theNewName = group.additionalImages[index].name;
                            console.log('theNewName', theNewName);

                            const newName = `${index + 1}.jpg`; // 新的名稱，例如 "8.jpg", index: 7
                
                            const theOldPath = path.join(__dirname, 'uploads', folderName, theOldName);
                            const theNewPath = path.join(__dirname, 'uploads', folderName, theNewName);

                            group.additionalImages[index].index = index;
                            console.log('動作後...', group.additionalImages[index]); //這個才是真實的陣列
                            await fs.promises.stat(imagePath);
                            console.log('執的行imagePath?', imagePath);
                            console.log('有執行到這裡嗎?');
                            await fs.promises.unlink(imagePath); //刪除實體檔案的 8.jpg, index: 7
                            await fs.promises.rename(theOldPath, theNewPath); //把原本的9.jpg變成8.jpg[路徑]
                            console.log('在刪除檔案後印出index, image', index, image);
                            console.log('...', group.additionalImages[index]); //這個才是真實的陣列
                            console.log('漢堡1')
                            hasNotDeleted = !hasNotDeleted;
                            console.log('漢堡2')
                            console.log(`Image ${imageName} removed successfully from ${folderName}`);
                        } else {
                            await fs.promises.unlink(imagePath); //刪除實體檔案的 8.jpg, index: 7
                        }
                    } 
                } catch (unlinkErr) {
                    if (unlinkErr.code === 'ENOENT') {
                        console.log(`File ${imageName} does not exist, skipping unlink.`);
                    } else {
                        console.error('Failed to delete image file:', unlinkErr);
                        return res.status(500).json({ error: 'Failed to delete image file' });
                    }
                }
                

                // 更新 image: 代表迴圈裡面的每一個物件{} 另外一個空間, 非真實的陣列
                
                image.index = index; //7
                console.log('外面------image', image); // { name: '8.jpg', path: '/uploads/image-1/8.jpg', index: 7 }
                console.log('外面------index', index); // 7
                console.log('image.name', image.name); //8.jpg
                const oldName = image.name; //8.jpg

                // 確認 oldName 不是 "no image yet" 才執行重新命名
                if (image.name !== "no image yet" && index != originalLength - 1) {
                    
                    const newName = `${index + 1}.jpg`; // 新的名稱，例如 "8.jpg", index: 7
                    image.name = newName; // 8.jpg 。 這時old與new一樣
                    console.log('new', newName);
                    image.path = `/uploads/${folderName}/${newName}`;
                    console.log('xxxxxxxxxxxxxxxx', image.path);
                    console.log('old', oldName);
                    const oldPath = path.join(__dirname, 'uploads', folderName, oldName);
                    const newPath = path.join(__dirname, 'uploads', folderName, newName);
                    try {
                        console.log('yyyyyyyyyy有進來嗎?');
                        console.log(oldPath);
                        console.log(newPath);
                        console.log('準備跳進去');
                        console.log(oldPath != newPath) // 這時一樣
                        console.log(!hasNotDeleted)
                        if( oldPath != newPath && !hasNotDeleted) {
                            console.log('在轉換網址前印出index', index);
                            await fs.promises.rename(oldPath, newPath);
                            console.log(`Renamed ${oldPath} to ${newPath}`);
                        }
                        console.log('跳出來了');
                        // await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
                        console.log('裡面index', index);
                        console.log('裡面group After:', group);
                    } catch (renameErr) {
                        if (renameErr.code !== 'ENOENT') {
                            console.error('重新命名圖片檔案失敗:', renameErr);
                            return res.status(500).json({ error: 'Failed to rename image file' });
                        }
                    }
                } else {
                    console.log(`Skipping rename for ${oldName}`);
                }
            }

            // 写入更新后的 imagesOrder.json
            try {
                await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
                console.log('已更新 imagesOrder.json');
            } catch (writeErr) {
                console.error('写入 imagesOrder.json 失败:', writeErr);
                return res.status(500).json({ error: 'Failed to update image order file' });
            }

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

// 創建資料夾 API
app.post('/api/create-folder', (req, res) => {
    const { folderName } = req.body;
    const targetFolder = path.join(__dirname, 'uploads', folderName);
    
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }
    res.status(200).send({ message: 'Folder created or already exists' });
});

// 複製圖片 API
app.post('/api/copy-image', async (req, res) => {
    try {
        const { folderName, newFileName } = req.body; // 確認接收到 folderName 和 newFileName
        console.log('folderName:', folderName);
        console.log('newFileName:', newFileName);

        // 定義來源和目標路徑
        const sourcePath = path.join(__dirname, 'uploads', 'upload.jpg');
        const destinationPath = path.join(__dirname, folderName, `${newFileName}.jpg`);

        // 複製檔案
        await fs.promises.copyFile(sourcePath, destinationPath);
        console.log(`Successfully copied to ${destinationPath}`);

        // 回應成功訊息
        res.json({ message: `Successfully copied to ${destinationPath}` });
    } catch (err) {
        console.error('Error copying file:', err);
        res.status(500).json({ error: 'Failed to copy file' });
    }
});


app.post('/api/update-group-name', async (req, res) => {
    const { oldFolderName, newFolderName } = req.body;

    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
    const oldFolderPath = path.join(__dirname, 'uploads', oldFolderName);
    const newFolderPath = path.join(__dirname, 'uploads', newFolderName);

    try {
        // 1. 更新 imagesOrder.json
        console.log('Step 1: Updating imagesOrder.json');
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        const imagesOrder = JSON.parse(data);

        const group = imagesOrder.find(g => g.folderName === oldFolderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        group.folderName = newFolderName;
        group.title = newFolderName;
        group.path = group.path.replace(`/uploads/${oldFolderName}/${oldFolderName}.jpg`, `/uploads/${newFolderName}/${newFolderName}.jpg`); // 更新 group.path

        
        group.additionalImages.forEach(image => {
            image.name = image.name.replace(oldFolderName, newFolderName);
            image.path = image.path.replace(`/uploads/${oldFolderName}/`, `/uploads/${newFolderName}/`);
        });

        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log('imagesOrder.json updated successfully.');

        // 2. 更改封面圖片名稱
        console.log('Step 2: Renaming cover image');
        const oldCoverPath = path.join(oldFolderPath, `${oldFolderName}.jpg`);
        const newCoverPath = path.join(oldFolderPath, `${newFolderName}.jpg`);
        if (fs.existsSync(oldCoverPath)) {
            await fs.promises.rename(oldCoverPath, newCoverPath);
            console.log('Cover image renamed successfully.');
        } else {
            console.log('No cover image found to rename.');
        }

        // 3. 更改資料夾名稱
        console.log('Step 3: Renaming folder');
        if (fs.existsSync(oldFolderPath)) {
            await fs.promises.rename(oldFolderPath, newFolderPath);
            console.log('Folder renamed successfully.');
        } else {
            return res.status(404).json({ error: 'Folder not found in file system' });
        }

        res.json({ message: 'Group name updated successfully.' });
    } catch (error) {
        console.error('Error updating group name:', error);
        res.status(500).json({ error: 'Failed to update group name' });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


