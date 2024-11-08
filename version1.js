function displayGallery(data) {
    const $galleryContainer = $('#galleryContainer');
    $galleryContainer.empty();

    $.each(data, function (index, group) {
        const $groupDiv = $('<div>').addClass('group');
        $groupDiv.append(`<h3>Group ${group.index} - ${group.folderName}</h3>`);

        const coverImage = group.files.find(file => file.isTitle);
        if (coverImage) {
            const $coverImageContainer = $('<div>').addClass('coverImageContainer').css({ display: 'flex', alignItems: 'center' });

            const $titleDiv = $('<div>').addClass('imageItem').addClass('coverDiv');
            const $titleImg = $('<img>').attr({
                src: `${coverImage.path}?t=${new Date().getTime()}`, // 加入時間戳避免緩存
                alt: coverImage.name
            }).css({ width: '100%', marginRight: '20px' });

            const $titleCaption = $('<p>').addClass('caption').text(`Cover Image: ${group.folderName}.jpg`);

            // Cover Image Upload Input
            const $coverInput = $('<input>').attr({
                type: 'file',
                accept: '.jpg'
            }).css({ marginTop: '10px' });

            // Button to Upload Cover Image
            const $uploadButton = $('<button>').text('上傳封面圖片 ( 僅限 .jpg)').css({ marginTop: '5px' });
            $uploadButton.on('click', function () {
                const file = $coverInput[0].files[0];
                if (file) {
                    const fileExtension = file.name.split('.').pop().toLowerCase();
                    if (fileExtension === 'jpg') {
                        uploadCoverImage(group.folderName, file);
                    } else {
                        alert('請上傳.jpg檔案');
                    }
                } else {
                    alert('Please select a file to upload.');
                }
            });

            $titleDiv.append($titleImg).append($titleCaption);
            $coverImageContainer.append($titleDiv);
            $titleDiv.append($coverInput).append($uploadButton);
            $groupDiv.append($coverImageContainer);

            // Video Embed and Edit URL
            const embedUrl = group.video.url.replace("https://youtu.be/", "https://www.youtube.com/embed/");
            const $videoEmbed = $('<iframe>').attr({
                src: embedUrl,
                width: "840",
                height: "473",
                title: "YouTube video player",
                frameborder: "0",
                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                referrerpolicy: "strict-origin-when-cross-origin",
                allowfullscreen: true
            });

            const $videoContainer = $('<div>').addClass('videoContainer').append($videoEmbed);
            
            // New input and save button for editing video URL
            const $inputContainer = $('<div>').addClass('inputContainer');
            const $videoInput = $('<input>').attr({
                type: 'text',
                value: group.video.url,
                placeholder: 'Enter new video URL'
            }).css({ marginTop: '10px', width: '100%' });

            const $saveButton = $('<button>').text('儲存更新').css({ marginTop: '5px' });
            $saveButton.on('click', function () {
                const newUrl = $videoInput.val();
                updateVideoUrl(group.folderName, newUrl);
            });

            $inputContainer.append($videoInput).append($saveButton);
            $videoContainer.append($inputContainer);

            $coverImageContainer.append($videoContainer);
            $groupDiv.append($coverImageContainer);
        }

        // 添加 "Upload More Image" 按鈕，不計入索引
        
        const $imageContainer = $('<div>').addClass('imageContainer');
        const $buttonDiv = $('<div>').addClass('uploadMoreImage');
        const $uploadMoreButton = $('<button>').text('Upload More Images');
        const $caption = $('<p>').addClass('caption').html(`上傳更多圖片`);

        $buttonDiv.append($uploadMoreButton).append($caption);
        $imageContainer.append($buttonDiv);

        // 點擊 "Upload More Images" 按鈕時彈出對話框
        $uploadMoreButton.on('click', function () {
            const numberOfImages = prompt('請問要上傳幾張照片？');
            if (numberOfImages && !isNaN(numberOfImages) && numberOfImages > 0) {
                generatePlaceholders(numberOfImages, group, 1);
                
                // Collect updated gallery data
                const updatedGalleryData = collectGalleryData();
                
                // Send updated order to server
                $.ajax({
                    url: '/update-images-order',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(updatedGalleryData),
                    success: function () {
                        alert('Images order updated successfully');
                    },
                    error: function (error) {
                        console.error('Failed to update images order:', error);
                        alert('Failed to update images order');
                    }
                });
            }
        });

        // 顯示資料夾內的圖片，從索引 1 開始
        const sortedFiles = group.additionalImages
            .filter(file => !file.isTitle)
            .sort((a, b) => {
            const numA = parseInt(a.name.split('.')[0], 10);
            const numB = parseInt(b.name.split('.')[0], 10);
            return numA - numB;
        });

        // 顯示資料夾內的圖片，並且僅顯示一個 placeholder 在最後
        let lastUploadedIndex = sortedFiles.length;

        for (let i = 1; i <= lastUploadedIndex; i++) {  // 更新此處條件
            const file = sortedFiles[i - 1];
            const $imgDiv = $('<div>').addClass('imageItem');

            if (file) {
                const $img = $('<img>').attr({
                    src: file.path,
                    alt: file.name
                }).css({ width: '150px', margin: '10px' });

                const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> ${file.name}`);

                 // Upload button
                const $uploadButton = $('<button>').text('Upload').on('click', function () {
                    uploadImage(group.folderName, i);
                });

                // Remove button
                // Remove button with server sync
                // Remove button with server sync
                const $removeButton = $('<button>').text('Remove')
                .attr('data-index', index) // 設置唯一的 data-index
                .on('click', function () {
                const folderName = group.folderName;
                const imageName = img.name;
                const imageIndex = $(this).data('index');

                console.log('Removing image:', { folderName, imageName, imageIndex });

                // 發送刪除請求
                $.ajax({
                    url: '/remove-image',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ folderName, imageName, imageIndex }),
                    success: function () {
                        alert('Image removed successfully');
                        displayGallery(data); // 刪除後重新加載畫廊
                    },
                    error: function (error) {
                        console.error('Failed to remove image:', error);
                        alert('Failed to remove image');
                    }
                });
                });

                
                $imgDiv.append($img, $caption, $uploadButton, $removeButton);

            } else {
                const $img = $('<img>').attr({
                    src: placeholderPath,
                    alt: 'Placeholder'
                }).css({ width: '150px', margin: '10px', opacity: 0.5 });

                const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> no image yet`);
                $imgDiv.append($img).append($caption);

            }

            $imageContainer.append($imgDiv);
        }


        $groupDiv.append($imageContainer);
        $galleryContainer.append($groupDiv);
    });
}