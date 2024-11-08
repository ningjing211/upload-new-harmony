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
function updateImagesOrder() {
    const uploadsDir = path.join(__dirname, 'uploads');

    // 定義固定順序的資料夾名稱
    const fixedOrder = [
        "image-1",
        "image-2",
        "Hitachi Solar Energy",
        "Toyota Motor Show",
        "Garena Gaming",
        "Racing Master",
        "Michelin PS4 Launch",
        "Hitachi Annual Party",
        "Lexus Glamping",
        "Unite with Tomorrowland"
    ];

    // 讀取所有資料夾名稱並過濾掉非資料夾項目
    let folderNames = fs.readdirSync(uploadsDir)
        .filter(name => !name.startsWith('.') && fs.lstatSync(path.join(uploadsDir, name)).isDirectory());

    // 根據固定順序清單來排序
    folderNames = fixedOrder.filter(folder => folderNames.includes(folder));

    const imagesOrder = folderNames.map(folderName => {
        console.log(`Processing folder: ${folderName}`); // 調試資料夾名稱
        const folderPath = path.join(uploadsDir, folderName);

        // 按自然順序排序圖片名稱
        const files = fs.readdirSync(folderPath)
            .filter(fileName => !fileName.startsWith('.'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
            .map(fileName => {
                console.log(`Adding file: ${fileName} in folder: ${folderName}`); // 調試檔案名稱
                return {
                    name: fileName,
                    path: `/uploads/${folderName}/${fileName}`
                };
            });

        return {
            folderName,
            title: folderName,
            path: files[0] ? files[0].path : '',
            additionalImages: files.slice(1)
        };
    });

    console.log("Final images order:", imagesOrder); // 調試最終生成的 JSON 結構

    // 寫入 JSON 文件
    fs.writeFileSync(path.join(__dirname, 'imagesOrder.json'), JSON.stringify(imagesOrder, null, 2), 'utf8');
}

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



// const filePath = path.join(__dirname, 'imagesOrder.json');
// Function to ensure each item has an index
// function addIndexesToImagesOrder() {
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             console.error('Error reading imagesOrder.json:', err);
//             return;
//         }

//         let imagesOrder = JSON.parse(data);
//         imagesOrder = imagesOrder.map((item, index) => {
//             item.index = index + 1; // Add index starting from 1
//             return item;
//         });

//         fs.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), (err) => {
//             if (err) {
//                 console.error('Error writing to imagesOrder.json:', err);
//             } else {
//                 console.log('Indexes added successfully.');
//             }
//         });
//     });
// }

// Call the function to add indexes
// addIndexesToImagesOrder();

// API 路由：讀取 imagesOrder.json 並提供給前端
// server.js
app.get('/images-order', (req, res) => {
    fs.readFile(path.join(__dirname, 'imagesOrder.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load image order' });
        }
        const imagesOrder = JSON.parse(data);
        imagesOrder.forEach(group => {
            const folderPath = path.join(__dirname, 'uploads', group.folderName);
            let files = fs.readdirSync(folderPath);

            // 過濾掉 .DS_Store
            files = files.filter(file => file !== '.DS_Store');

            const titleImage = files.find(file => file === `${group.folderName}.jpg`);
            const otherImages = files.filter(file => file !== `${group.folderName}.jpg`).sort();

            group.files = [
                { name: titleImage, path: `/uploads/${group.folderName}/${titleImage}`, isTitle: true },
                ...otherImages.map((file, index) => ({
                    name: file,
                    path: `/uploads/${group.folderName}/${file}`,
                    isTitle: false,
                    index: index + 1
                }))
            ];
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



// Serve uploads 資料夾中的圖片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
