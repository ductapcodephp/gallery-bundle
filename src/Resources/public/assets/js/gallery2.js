console.log('gallery2');
// Thay vì dùng DOMContentLoaded, hãy lắng nghe sự kiện của Turbo để nó hoạt động chính xác sau mỗi lần đổi folder
document.addEventListener("turbo:load", function () {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return; // Bảo vệ nếu ở trang khác

    // Click đơn để chọn/bỏ chọn ảnh
    galleryGrid.addEventListener("click", function (e) {
        const itemTarget = e.target.closest(".gallery-item");
        if (itemTarget) {
            itemTarget.classList.toggle("selected");
            updateSelectionCount();
        }
    });

    function updateSelectionCount() {
        const selectedElements = galleryGrid.querySelectorAll(".gallery-item.selected");
        const totalSelected = selectedElements.length;

        const countBadge = document.getElementById("selectedCount");
        if(countBadge) countBadge.innerText = `Đã chọn: ${totalSelected} ảnh`;

        const btnDeselectAll = document.getElementById("btnDeselectAll");
        const btnDeleteSelected = document.getElementById("btnDeleteSelected");
        const btnConfirmSelect = document.getElementById("btnConfirmSelect");

        if (totalSelected > 0) {
            if (btnDeselectAll) btnDeselectAll.removeAttribute("disabled");
            if (btnDeleteSelected) btnDeleteSelected.removeAttribute("disabled");
            if (btnConfirmSelect) {
                btnConfirmSelect.removeAttribute("disabled");
                btnConfirmSelect.querySelector(".count").innerText = totalSelected;
            }
        } else {
            if (btnDeselectAll) btnDeselectAll.setAttribute("disabled", "true");
            if (btnDeleteSelected) btnDeleteSelected.setAttribute("disabled", "true");
            if (btnConfirmSelect) {
                btnConfirmSelect.setAttribute("disabled", "true");
                btnConfirmSelect.querySelector(".count").innerText = "0";
            }
        }
    }

    const btnDeselect = document.getElementById("btnDeselectAll");
    if (btnDeselect) {
        btnDeselect.addEventListener("click", function() {
            galleryGrid.querySelectorAll(".gallery-item.selected").forEach(el => el.classList.remove("selected"));
            updateSelectionCount();
        });
    }
});
document.addEventListener("turbo:load", function () {
    const frame = document.getElementById("media_library_spa");
    const btnUploadImg = document.getElementById("btnUploadImg");

    if (!frame || !btnUploadImg) return; // Bảo vệ nếu không ở đúng trang kho ảnh

    // 1. Tạo một input file ẩn bằng JS để click chọn file trực tiếp từ máy tính
    let hiddenInput = document.getElementById("spaHiddenFileInput");
    if (!hiddenInput) {
        hiddenInput = document.createElement("input");
        hiddenInput.type = "file";
        hiddenInput.id = "spaHiddenFileInput";
        hiddenInput.multiple = true; // Cho phép chọn nhiều ảnh một lúc
        hiddenInput.accept = "image/*"; // Chỉ nhận file ảnh
        hiddenInput.style.display = "none";
        document.body.appendChild(hiddenInput);
    }

    // Kích hoạt chọn file khi bấm nút "Tải ảnh lên"
    btnUploadImg.addEventListener("click", function () {
        hiddenInput.click();
    });

    // 2. Bắt sự kiện khi người dùng chọn ảnh xong xuôi
    hiddenInput.onchange = function (e) {
        const files = e.target.files;
        if (files.length === 0) return;

        // Lấy folderId hiện tại từ thuộc tính data của Turbo Frame
        const currentFolderId = frame.getAttribute("data-current-folder") || 0;

        // Đổi nút upload sang trạng thái Loading để người dùng biết hệ thống đang xử lý
        const originalBtnHtml = btnUploadImg.innerHTML;
        btnUploadImg.setAttribute("disabled", "true");
        btnUploadImg.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Đang tải...`;

        // Tạo danh sách các luồng upload song song (Promise) nếu chọn nhiều ảnh
        const uploadPromises = Array.from(files).map(file => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folderId", currentFolderId); // Bắn folderId kèm theo ở đây!

            return fetch("/cms/gallery/upload", { // Điền chuẩn Route dẫn tới hàm upload của bạn
                method: "POST",
                body: formData
            }).then(res => res.json());
        });

        // 3. Đợi tất cả ảnh upload xong thì làm mới lại giao diện (SPA style)
        Promise.all(uploadPromises)
            .then(results => {
                // Reset lại input file ẩn
                hiddenInput.value = "";

                // Ra lệnh cho Turbo tự động reload lại nội dung bên trong Frame để lôi ảnh mới ra
                // Turbo sẽ giữ nguyên thư mục hiện tại vì URL thanh địa chỉ không thay đổi
                if (window.Turbo) {
                    // Ép Turbo tải lại trang ngầm và đè dữ liệu vào Frame cực kỳ mượt mà
                    window.Turbo.visit(window.location.href, { action: "replace" });
                } else {
                    // Dự phòng nếu ko có đối tượng Turbo toàn cục
                    frame.src = window.location.href;
                }
            })
            .catch(err => {
                alert("Đã xảy ra lỗi trong quá trình tải ảnh lên!");
                console.error(err);
            })
            .finally(() => {
                // Trả lại trạng thái nguyên bản cho nút bấm ban đầu
                btnUploadImg.removeAttribute("disabled");
                btnUploadImg.innerHTML = originalBtnHtml;
            });
    };
});