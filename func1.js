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
