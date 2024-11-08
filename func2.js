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