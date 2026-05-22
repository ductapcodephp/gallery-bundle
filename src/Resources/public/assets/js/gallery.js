document.addEventListener("DOMContentLoaded", function () {
    const galleryGrid = document.getElementById("galleryGrid");
    const breadcrumbsContainer = document.getElementById("breadcrumbsContainer");

    // ĐƯỜNG DẪN URL API: Hãy khớp url này với Route xử lý hàm dataGallery ở Backend của bạn
    const API_DATA_BASE_URL = "/cms/gallery/data";


    function loadFolderContent(folderId) {
        // Tạo hiệu ứng loading nhẹ mắt khi đang chờ nạp dữ liệu
        galleryGrid.innerHTML = `
            <div class="w-100 text-center p-10">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mt-2 text-muted fs-7">Đang tải dữ liệu...</div>
            </div>`;

        // Gọi Ajax ngầm lên server
        fetch(`${API_DATA_BASE_URL}/${folderId}`)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(data => {
                if (!data.success) return;

                // Cập nhật lại ID thư mục hiện tại vào thuộc tính thẻ grid
                galleryGrid.setAttribute("data-current-folder", data.currentFolderId);

                // 1. VẼ LẠI THANH ĐƯỜNG DẪN (BREADCRUMBS)
                renderBreadcrumbs(data.breadcrumbs);

                // 2. LÀM SẠCH VÀ VẼ LẠI LƯỚI NỘI DUNG (FOLDERS & IMAGES)
                galleryGrid.innerHTML = "";

                // Nếu không phải ở thư mục gốc (ID > 0), chèn ô đi ngược ra ".." lên đầu
                if (parseInt(data.currentFolderId) > 0) {
                    // Tìm ID của folder cha ngay phía trước trong mảng breadcrumbs
                    const idx = data.breadcrumbs.findIndex(b => parseInt(b.id) === parseInt(data.currentFolderId));
                    const parentId = idx > 0 ? data.breadcrumbs[idx - 1].id : 0;
                    const backFolderHtml = `
                        <div class="col-folder folder-root" data-folder-id="${parentId}">
                            <div class="folder-item-card root-card">
                                <i class="ti ti-arrow-back-up"></i>
                                <div class="folder-card-name">.. (Quay lại)</div>
                            </div>
                        </div>`;
                    galleryGrid.insertAdjacentHTML("beforeend", backFolderHtml);
                }

                // Nếu trống hoàn toàn (không có cả thư mục con lẫn ảnh)
                if (data.folders.length === 0 && data.pictures.length === 0) {
                    galleryGrid.innerHTML = `
                        <div class="w-100 text-center p-10 text-muted">
                            Thư mục này trống rỗng.
                        </div>`;
                    updateSelectionCount();
                    return;
                }

                // Render danh sách các thư mục con
                data.folders.forEach(folder => {
                    const folderHtml = `
                        <div class="col-folder" data-folder-id="${folder.id}">
                            <div class="folder-item-card">
                                <i class="ti ti-folder-filled"></i>
                                <div class="folder-card-name">${folder.name}</div>
                            </div>
                        </div>`;
                    galleryGrid.insertAdjacentHTML("beforeend", folderHtml);
                });

                // Render danh sách các file hình ảnh
                data.pictures.forEach(img => {
                    const imgHtml = `
                        <div class="col-img" data-id="${img.id}">
                            <div class="gallery-item">
                                <div class="select-badge"><i class="ti ti-check" style="font-size:12px"></i></div>
                                <img src="${img.url}" alt="${img.name}" loading="lazy">
                                <div class="img-name">${img.name}</div>
                            </div>
                        </div>`;
                    galleryGrid.insertAdjacentHTML("beforeend", imgHtml);
                });

                // Reset bộ đếm số ảnh đã chọn về 0 khi nhảy sang thư mục khác
                updateSelectionCount();
            })
            .catch(err => {
                console.error("SPA Fetch Error:", err);
                galleryGrid.innerHTML = `
                    <div class="alert alert-danger w-100 text-center m-0">
                        Không thể kết nối đến hệ thống tệp tin! Vui lòng thử lại.
                    </div>`;
            });
    }

    /**
     * Hàm hỗ trợ vẽ chuỗi Breadcrumbs động dựa trên mảng gửi về từ API
     */
    function renderBreadcrumbs(breadcrumbs) {
        breadcrumbsContainer.innerHTML = "";
        breadcrumbs.forEach((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const iconRoot = index === 0 ? '<i class="ti ti-home"></i> ' : '';

            if (isLast) {
                breadcrumbsContainer.insertAdjacentHTML("beforeend", `
                    <span class="crumb active" data-target-folder="${crumb.id}">
                        ${iconRoot}${crumb.name}
                    </span>
                `);
            } else {
                breadcrumbsContainer.insertAdjacentHTML("beforeend", `
                    <span class="crumb" data-target-folder="${crumb.id}">
                        ${iconRoot}${crumb.name}
                    </span>
                    <span class="crumb-separator"><i class="ti ti-chevron-right"></i></span>
                `);
            }
        });
    }

    // ================= KHU VỰC LẮNG NGHE SỰ KIỆN (EVENT LISTENERS) =================

    // 1. Click đúp (dblclick) vào ô Folder bất kỳ để mở sâu vào trong
    galleryGrid.addEventListener("dblclick", function (e) {
        const folderTarget = e.target.closest(".col-folder");
        if (folderTarget) {
            const id = folderTarget.getAttribute("data-folder-id");
            loadFolderContent(id);
        }
    });

    // 2. Click vào các nút trên thanh Breadcrumbs để giật lùi về các tầng cha nhanh chóng
    breadcrumbsContainer.addEventListener("click", function (e) {
        const crumbTarget = e.target.closest(".crumb:not(.active)");
        if (crumbTarget) {
            const id = crumbTarget.getAttribute("data-target-folder");
            loadFolderContent(id);
        }
    });

    // 3. Click chuột đơn (click) để Chọn / Bỏ chọn ảnh
    galleryGrid.addEventListener("click", function (e) {
        const itemTarget = e.target.closest(".gallery-item");
        if (itemTarget) {
            itemTarget.classList.toggle("selected");
            updateSelectionCount();
        }
    });

    /**
     * Hàm điều khiển bật/tắt & đếm số lượng của các nút bấm dưới footer
     */
    function updateSelectionCount() {
        const selectedElements = galleryGrid.querySelectorAll(".gallery-item.selected");
        const totalSelected = selectedElements.length;

        document.getElementById("selectedCount").innerText = `Đã chọn: ${totalSelected} ảnh`;

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

    // Sự kiện nút hủy chọn nhanh toàn bộ ảnh đang tích trên màn hình hiện tại
    const btnDeselect = document.getElementById("btnDeselectAll");
    if (btnDeselect) {
        btnDeselect.addEventListener("click", function() {
            galleryGrid.querySelectorAll(".gallery-item.selected").forEach(el => el.classList.remove("selected"));
            updateSelectionCount();
        });
    }
});