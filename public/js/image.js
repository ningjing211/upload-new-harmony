let uploadedImages = []; // 用於儲存圖片的 URL

// 更新 displayUploadedImages 函數，將圖片 URL 儲存到 uploadedImages 陣列
function displayUploadedImages(images) {
    uploadedImages = images; // 儲存圖片路徑
    renderImages();
}

// 顯示圖片的函數
function renderImages() {
    const container = document.getElementById('imageContainer');
    container.innerHTML = '';
    uploadedImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.width = "150px";
        img.style.margin = "10px";
        container.appendChild(img);
    });
}

