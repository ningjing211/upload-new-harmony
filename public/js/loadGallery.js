$(document).ready(function () {
    const placeholderPath = 'https://placehold.co/600x400?text=upload'; // placeholder圖片的路徑
    const expectedImageCount = 20; // 每個資料夾預期有20張圖片

    function loadGallery() {
        $.ajax({
            url: '/api/images-order',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
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
            $(this).find('.imageContainer img').each(function (imgIndex) {
                additionalImages.push({
                    name: $(this).attr('alt'),
                    path: $(this).attr('src'),
                    index: imgIndex  // additionalImages 直接設定 index，從 0 開始
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
            url: '/api/update-images-order',
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
            
            // const $groupDiv = $('<div>').addClass('group');
            // $groupDiv.append(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);

            const $groupDiv = $('<div>').addClass('group');

            // 可編輯 Group 名稱的區域
            const $groupNameInput = $('<input>')
                .attr('type', 'text')
                .addClass('group-name-input')
                .val(`${group.folderName}`)
                .css({ display: 'none' }); // 初始隱藏

            const $groupNameText = $(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);

            const $editButton = $('<button>').text('編輯').on('click', function () {
                $groupNameText.hide();
                $groupNameInput.show().focus();
            });

            const $saveButton = $('<button>').text('保存').on('click', function () {
                const newName = $groupNameInput.val();
                updateGroupName(group.folderName, newName); // 更新 Group 名稱的函數
                $groupNameText.text(newName).show();
                $groupNameInput.hide();
            });
    
            const coverImage = group.files.find(file => file.isTitle);
            console.log('xxxxxxxxxxxxx', coverImage);
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
                        url: '/api/update-images-order',
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
            let lastUploadedIndex = sortedFiles.length; //目前有的照片數
            console.log('test', group.additionalImages[0].index, index, lastUploadedIndex);
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
                    const $uploadButton = $('<button>').text('Upload').attr('data-index', i - 1).on('click', function () {

                        const $fileInput = $('<input>').attr({
                            type: 'file',
                            accept: '.jpg'
                        }).css({ display: 'none' });

                        console.log('uploadbutton clicked:',group.folderName, i - 1);
                        console.log(file, $img);
                        
                        
                        console.log('here or not');

                        $fileInput.on('change', async function () {
                            const xFile = this.files[0];
                            if (xFile && xFile.type === 'image/jpeg') {
                                try {
                                    // const clickedIndex = $uploadButton.data('index');
                                    // console.log("1111", group.folderName, clickedIndex, xFile);
                    
                                    // const imageItems = $imageContainer.find('.imageItem').toArray();
                                    
                                    // const hasImage = imageItems.filter(item => {
                                    //     const altText = $(item).find('img').attr('alt');
                                    //     return altText !== 'no image yet';
                                    // });
                    
                                    // console.log("目前有的格子數:", imageItems);
                                    // console.log("所有的位置的長度:", imageItems.length);
                                    // console.log("有照片的格子:", hasImage);
                                    // console.log("有照片的格子長度:", hasImage.length);
                    
                                    // 使用 await 等待上傳完成
                                    console.log('sss', group.folderName, i - 1, xFile, $img);
                                    await uploadImage(group.folderName, i - 1, xFile, $img);
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
    
                    // Remove button
                    // Remove button with server sync
                    // Remove button with server sync
                    const $removeButton = $('<button>').text('Remove')
                    .attr('data-index', i - 1) // 設置唯一的 data-index
                    .on('click', function () {
                    const folderName = group.folderName;
                    const imageName = $(this).siblings('img').attr('alt');
                    const imageIndex = Number($(this).data('index'));

                    console.log('Removing image:', { folderName, imageName, imageIndex });

                    // 發送刪除請求
                    $.ajax({
                        url: '/api/remove-image',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ folderName, imageName, imageIndex }),
                        success: function () {
                            console.log($imgDiv);
                            alert('Image removed successfully, another');
                            $imgDiv.remove();
                            loadGallery(); // Reload the gallery to reflect changes
                        },
                        error: function (error) {
                            console.error('Failed to remove image:', error);
                            alert('Failed to remove image, another');
                        }
                    });
                    });

                    
                    $imgDiv.append($img, $caption, $uploadButton, $removeButton);
    
                } else {
                    const $img = $('<img>').attr({
                        src: placeholderPath,
                        alt: 'Placeholder'
                    }).css({ width: '150px', margin: '10px', opacity: 1 });
    
                    const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> no image yet`);
                    $imgDiv.append($img).append($caption);
    
                }
    
                $imageContainer.append($imgDiv);
            }
    
            $groupDiv.append($groupNameText, $groupNameInput, $editButton, $saveButton);
            $groupDiv.append($imageContainer);
            $galleryContainer.append($groupDiv);
        });
    }

    function updateGroupName(oldFolderName, newFolderName) {
        console.log('folderName, newName', oldFolderName, newFolderName);
        $.ajax({
            url: '/api/update-group-name',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ oldFolderName, newFolderName }),
            success: function () {
                alert('Group 名稱更新成功');
                loadGallery(); // 重新加載畫廊顯示更新
            },
            error: function (err) {
                console.error('更新 Group 名稱失敗:', err);
                alert('更新 Group 名稱失敗');
            }
        });
    }
    

    function generatePlaceholders(count, group, startIndex) {
        const $imageContainer = $(`.group:contains("${group.folderName}") .imageContainer`);
        
        // 偵測當前已有的 .imageItem 數量
        let existingItemsCount = $imageContainer.find('.imageItem').length;
        
        // 檢查是否達到上限
        if (existingItemsCount >= 20) {
            alert("最多只能上傳20張圖片");
            return; // 結束函數，不再新增
        }
    
        // 計算可新增的 placeholder 數量（避免超過 20）
        const placeholdersToAdd = Math.min(count, 20 - existingItemsCount);
        for (let i = 0; i < placeholdersToAdd; i++) {
            const placeholderIndex = existingItemsCount + i; // 計算新的 placeholder 索引
            
            // 定義上傳目標資料夾
            const targetFolder = `/uploads/${group.folderName}`;
            console.log('要上傳的資料夾為:', targetFolder);
            // 檢查 targetFolder 是否存在，若不存在則創建（在前端執行會受到限制，實際應該在伺服器端執行）
            $.ajax({
                url: `/create-folder`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ folderName: group.folderName }),
                success: function () {
                    console.log('資料夾檢查/創建成功');
                },
                error: function (err) {
                    console.error('資料夾檢查/創建失敗', err);
                }
            });

            // 請求複製 upload.jpg 到目標資料夾
            $.ajax({
                url: `/copy-image`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    folderName: `${targetFolder}`,
                    newFileName: `${placeholderIndex + 1}`
                }),
                success: function () {
                    console.log(`成功複製 upload.jpg 到 ${targetFolder}/${placeholderIndex + 1}.jpg`);
                },
                error: function (err) {
                    console.error(`複製 upload.jpg 到 ${targetFolder}/${placeholderIndex + 1}.jpg 失敗`, err);
                }
            });

            const $imgDiv = $('<div>').addClass('imageItem');
            
            const $img = $('<img>').attr({
                src: `${targetFolder}/${placeholderIndex + 1}.jpg`,
                alt: `${placeholderIndex + 1}.jpg`
            }).css({ width: '150px', margin: '10px', opacity: 1 });
    
            const $caption = $('<p>').addClass('caption').html(`${group.index}.${placeholderIndex + 1} <br> ${placeholderIndex + 1}.jpg`);
            
             // Upload button
             const $uploadButton = $('<button>').text('Upload').attr('data-index', placeholderIndex).on('click', function () {
                const $fileInput = $('<input>').attr({
                    type: 'file',
                    accept: '.jpg'
                }).css({ display: 'none' });

                $fileInput.on('change', async function () {
                    console.log('ooo-',this.files[0]);
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
            
            // Remove button with server sync
            const $removeButton = $('<button>').text('Remove').attr('data-index', placeholderIndex).on('click', function () {
                const folderName = group.folderName;
                const imageName = $(this).siblings('img').attr('alt');
                
                const imageIndex = $(this).parent().index() - 1; // 獲取圖片在 additionalImages 中的索引
                
                console.log('Removing image:', { folderName, imageName, imageIndex }); // Debug log

                // Send delete request to the server
                $.ajax({
                    url: '/api/remove-image',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ folderName, imageName, imageIndex }), // 確保這裡包含 imageIndex
                    success: function () {
                        alert('Image removed successfully, placeholder');
                        $imgDiv.remove(); // 成功刪除後才移除 DOM 元素
                        loadGallery(); // Reload the gallery to reflect changes
                    },
                    error: function (error) {
                        console.error('Failed to remove image:', error);
                        alert('Failed to remove image, placeholder');
                    }
                });
            });
            
            $imgDiv.append($img, $caption, $uploadButton, $removeButton);
    
            $imageContainer.append($imgDiv);
        }
    }

    function rebindRemoveButtons($imageContainer) {
        $imageContainer.find('.imageItem').each(function (index) {
            const newIndex = index + 1;
   
            // 更新 remove 按鈕事件綁定
            $(this).find('button:contains("Remove")').off('click').on('click', function () {
                $(this).closest('.imageItem').remove();
                rebindRemoveButtons($imageContainer); // 重新綁定所有 remove 按鈕
            });
        });
    }
    
    
    function updateImageOrder($imageContainer) {
        $imageContainer.find('.imageItem').each(function (index) {
            // 更新每個 .imageItem 的順序顯示
            $(this).find('.caption').html(`1.${index + 1} <br> ${$(this).find('img').attr('alt')}`);
        });
    }

    function removeImage(folderName, index) {
        console.log(`Removing image at ${folderName}, index ${index}`);
        // 可以在這裡添加刪除圖片的伺服器端邏輯
    }
    

    async function uploadImage(folderName, index, file, $imgElement) {
        console.log('uploadImage 執行:', folderName, index, file, $imgElement);
        const fileName = Number(index) + 1;
        console.log('fn', fileName);
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('image', file);
    
            $.ajax({
                url: `/upload-image/${folderName}/${index}`,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log(`Image uploaded successfully for ${folderName}, index ${index}`);
                    $imgElement.attr('src', response.path);
                    $imgElement.attr('alt', `${fileName}.jpg`); // 更新圖片 src
                    const $caption = $imgElement.siblings('.caption');
                    const existingText = $caption.contents().first().text().trim(); // 取得 "1.3"
                    $caption.html(`${existingText}<br>${fileName}.jpg`); // 保留格式並更新圖片名稱
                    resolve(response); // 成功後 resolve
                },
                error: function (err) {
                    console.error('Failed to upload image:', err);
                    reject(err); // 發生錯誤時 reject
                }
            });
        });
    }
    

    function reorderImages(folderName) {
        const $images = $(`.group:contains("${folderName}") .imageContainer .imageItem`);
        $images.each(function (index) {
            const newIndex = index + 1; // 重新計算 index
            const $img = $(this).find('img');
            const newFileName = `${newIndex}.jpg`; // 新的檔案名稱
    
            // 更新顯示的索引和名稱
            $(this).find('.caption').html(`${folderName}.${newIndex} <br> ${newFileName}`);
            
            // 可以在伺服器端進行重新命名操作
            // Example: send a request to rename the file on the server
            $.ajax({
                url: `/rename-image/${folderName}/${$img.attr('alt')}`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ newFileName }),
                success: function () {
                    console.log(`Image renamed successfully to ${newFileName}`);
                    $img.attr('alt', newFileName); // 更新 alt 屬性
                },
                error: function (err) {
                    console.error('Failed to rename image:', err);
                }
            });
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
