const $uploadButton = $('<button>').text('Upload').attr('data-index', placeholderIndex).on('click', function () {
    const $fileInput = $('<input>').attr({
        type: 'file',
        accept: '.jpg'
    }).css({ display: 'none' });

    $fileInput.on('change', async function () {
        const file = this.files[0];
        if (file && file.type === 'image/jpeg') {
            try {
      
                const clickedIndex = $uploadButton.data('index');
                console.log("1111", group.folderName, clickedIndex, file);

                const imageItems = $imageContainer.find('.imageItem').toArray();
                
                const hasImage = imageItems.filter(item => {
                    const altText = $(item).find('img').attr('alt');
                    return altText !== 'no image yet';
                });

                console.log("目前有的格子數:", imageItems);
                console.log("所有的位置的長度:", imageItems.length);
                console.log("有照片的格子:", hasImage);
                console.log("有照片的格子長度:", hasImage.length);

                // 使用 await 等待上傳完成
                await uploadImage(group.folderName, clickedIndex, file, $img);
            } catch (error) {
                console.error('Error during image upload:', error);
                alert('Failed to upload image');
            }
        } else {
            alert('Please upload a .jpg file');
        }
    });

    $fileInput.click(); // Trigger file selection dialog
});