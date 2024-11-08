$(document).ready(function () {
    const placeholderPath = 'https://placehold.co/600x400?text=upload'; // placeholder圖片的路徑
    const expectedImageCount = 20; // 每個資料夾預期有20張圖片

    function loadGallery() {
        $.ajax({
            url: '/images-order',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                console.log('Gallery data loaded:', data); // 檢查取得的畫廊資料
                displayGallery(data);
            },
            error: function () {
                alert('Error loading gallery');
            }
        });
    }

    function collectGalleryData() {
        const data = [];
    
        $('.group').each(function (index) {
            const folderName = $(this).find('h3').text().split(' - ')[1].trim(); // 提取資料夾名稱
            const coverImage = $(this).find('.coverDiv img').attr('src');
            const videoUrl = $(this).find('.videoContainer iframe').attr('src').replace("https://www.youtube.com/embed/", "https://youtu.be/");
    
            // 收集其他圖片
            const additionalImages = [];
            $(this).find('.imageContainer img').each(function () {
                additionalImages.push({
                    name: $(this).attr('alt'),
                    path: $(this).attr('src')
                });
            });
    
            data.push({
                folderName: folderName,
                title: folderName,
                path: coverImage,
                additionalImages: additionalImages,
                index: index + 1, // 設定索引，從 1 開始
                video: {
                    url: videoUrl
                }
            });
        });
    
        return data;
    }
    
    

    function updateImagesOrderOnServer() {
        const galleryData = collectGalleryData(); // 使用 collectGalleryData 函數獲取資料
    
        $.ajax({
            url: '/update-images-order',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(galleryData),
            success: function (response) {
                alert('Images order updated successfully');
                loadGallery(); // 可選：重新加載畫廊來顯示更新
            },
            error: function (error) {
                console.error('Failed to update images order:', error);
                alert('Failed to update images order');
            }
        });
    }
    
    // 例如，在某個按鈕點擊時觸發
    $('#saveButton').on('click', updateImagesOrderOnServer);
    
    
    
    

    

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

             // 顯示資料夾內的圖片，如果缺少則補上 placeholder
            const $imageContainer = $('<div>').addClass('imageContainer');
            const sortedFiles = group.files
                .filter(file => !file.isTitle)
                .sort((a, b) => {
                    const numA = parseInt(a.name.split('.')[0], 10);
                    const numB = parseInt(b.name.split('.')[0], 10);
                    return numA - numB;
                });

            for (let i = 1; i <= expectedImageCount; i++) {
                const file = sortedFiles[i - 1];
                const $imgDiv = $('<div>').addClass('imageItem');

                if (file) {
                    // 使用實際圖片
                    const $img = $('<img>').attr({
                        src: file.path,
                        alt: file.name
                    }).css({ width: '150px', margin: '10px' });

                    const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> ${file.name}`);
                    $imgDiv.append($img).append($caption);
                } else {
                    // 使用 placeholder
                    const $img = $('<img>').attr({
                        src: placeholderPath,
                        alt: 'Placeholder'
                    }).css({ width: '150px', margin: '10px', opacity: 0.5 });

                    const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> placeholder.jpg`);
                    $imgDiv.append($img).append($caption);
                }

                $imageContainer.append($imgDiv);
            }

            $groupDiv.append($imageContainer);
            $galleryContainer.append($groupDiv);
        });
    }

    function updateVideoUrl(folderName, newUrl) {
        $.ajax({
            url: `/update-video-url`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ folderName, newUrl }),
            success: function () {
                alert('Video URL updated successfully');
                loadGallery(); // Reload gallery to see changes
            },
            error: function (err) {
                console.error('Failed to update video URL:', err);
                alert('Failed to update video URL');
            }
        });
    }

    function uploadCoverImage(folderName, file) {
        const formData = new FormData();
        formData.append('coverImage', file);
    
        $.ajax({
            url: `/upload-cover/${folderName}`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                console.log('Cover image uploaded successfully');
                alert('Cover image uploaded successfully');
                loadGallery(); // Reload gallery to see the new cover image
            },
            error: function (err) {
                console.error('Failed to upload cover image:', err);
                alert('Failed to upload cover image');
            }
        });
    }
    

    loadGallery();
});
