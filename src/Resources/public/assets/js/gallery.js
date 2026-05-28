let folderClickTimeout = null;
function getCurrentFolderId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('folderId') || 0;
}

function openAjaxModal(url, loadingText = "Đang xử lý...") {
    fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .then(response => {
            if (!response.ok) throw new Error(`Server báo lỗi ${response.status}`);
            return response.text();
        })
        .then(html => {
            let existingModal = document.getElementById('amzs-dynamic-modal-container');
            if (existingModal) existingModal.remove();

            const modalContainer = document.createElement('div');
            modalContainer.id = 'amzs-dynamic-modal-container';
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);

            const modalElement = modalContainer.querySelector('.modal');
            if (!modalElement) {
                alert("Không tìm thấy cấu trúc Modal! Vui lòng kiểm tra lại cấu hình Controller.");
                return;
            }

            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();

            const form = modalElement.querySelector('form');
            if (form) {
                form.addEventListener('submit', function (submitEvent) {
                    submitEvent.preventDefault();
                    const formData = new FormData(form);

                    const submitBtn = form.querySelector('[type="submit"]');
                    let originalBtnText = '';
                    if (submitBtn) {
                        originalBtnText = submitBtn.innerHTML;
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${loadingText}`;
                    }

                    fetch(form.action, {
                        method: form.method || 'POST',
                        body: formData,
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    })
                        .then(res => {
                            if (res.status === 200 || res.status === 201 || res.ok) return res.json();
                            throw new Error('Lỗi xử lý form từ server');
                        })
                        .then(data => {
                            modalInstance.hide();

                            const folderId = getCurrentFolderId();
                            Turbo.visit(`/cms/gallery?folderId=${folderId}`, {
                                frame: "media_library_spa",
                                action: "advance"
                            });
                        })
                        .catch(err => {
                            console.error(err);
                            alert("Có lỗi xảy ra khi lưu, vui lòng kiểm tra lại dữ liệu!");
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = originalBtnText;
                            }
                        });
                });
            }

            modalElement.addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });
        })
        .catch(err => {
            console.error("Lỗi AJAX Modal:", err);
            alert("Không thể tải form! Hãy ấn F12 xem tab Network hoặc Console.");
        });
}

document.addEventListener("click", async function (e) {

    const galleryItem = e.target.closest(".gallery-item");
    if (galleryItem) {
        const type = galleryItem.dataset.type;

        if (type === "picture") {
            galleryItem.classList.toggle("selected");
            updateSelectionCount();
        }
        else if (type === "folder") {
            e.preventDefault();
            if (folderClickTimeout) {
                clearTimeout(folderClickTimeout);
                folderClickTimeout = null;
                return;
            }
            folderClickTimeout = setTimeout(() => {
                folderClickTimeout = null;
                const url = galleryItem.dataset.url || galleryItem.getAttribute("href");
                if (url) {
                    Turbo.visit(url, { frame: "media_library_spa", action: "advance" });
                }
            }, 250);
        }
        return;
    }

    const btnDeselectAll = e.target.closest("#btnDeselectAll");
    if (btnDeselectAll) {
        document.querySelectorAll(".gallery-item.selected").forEach(el => el.classList.remove("selected"));
        updateSelectionCount();
        return;
    }

    const btnUpload = e.target.closest("#btnUploadImg");
    if (btnUpload) {
        let hiddenInput = document.getElementById("spaHiddenFileInput");
        if (!hiddenInput) {
            hiddenInput = document.createElement("input");
            hiddenInput.type = "file";
            hiddenInput.multiple = true;
            hiddenInput.accept = "image/*";
            hiddenInput.id = "spaHiddenFileInput";
            hiddenInput.style.display = "none";
            document.body.appendChild(hiddenInput);
        }
        hiddenInput.click();
        return;
    }

    const btnDeleteSelected = e.target.closest("#btnDeleteSelected");
    if (btnDeleteSelected) {
        if (!confirm("Bạn có chắc chắn muốn xóa các mục đã chọn?")) return;

        const selectedElements = document.querySelectorAll(".gallery-item.selected");
        const currentFolderId = getCurrentFolderId();

        const deletePromises = Array.from(selectedElements).map(el => {
            const itemId = el.dataset.id;
            const type = el.dataset.type;
            const deleteUrl = (type === 'picture') ? `/cms/gallery/delete-picture/${itemId}` : `/cms/gallery/delete/${itemId}`;

            return fetch(deleteUrl, {
                method: "DELETE",
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(r => r.json());
        });

        try {
            btnDeleteSelected.disabled = true;
            await Promise.all(deletePromises);
            Turbo.visit(`/cms/gallery?folderId=${currentFolderId}`, { frame: "media_library_spa", action: "advance" });
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra khi xóa!");
        } finally {
            btnDeleteSelected.disabled = false;
        }
        return;
    }

    const btnAddFolder = e.target.closest("#btnAddFolder");
    if (btnAddFolder) {
        e.preventDefault();
        const currentFolderId = getCurrentFolderId();
        const baseUrl = "/cms/gallery/add";

        openAjaxModal(`${baseUrl}/${currentFolderId}`, "Đang tạo thư mục...");
        return;
    }

    const btnEditSelected = e.target.closest("#btnEditSelected");
    if (btnEditSelected) {
        e.preventDefault();
        const selectedElement = document.querySelector(".gallery-item.selected");
        if (!selectedElement) return;

        const itemId = selectedElement.dataset.id;
        const type = selectedElement.dataset.type;

        const editUrl = (type === "folder") ? `/cms/gallery/edit/${itemId}` : `/cms/gallery/edit-picture/${itemId}`;

        openAjaxModal(editUrl, "Đang lưu thay đổi...");
        return;
    }

    if (btnConfirmSelect) {

        const selectedPictures = Array.from(
            document.querySelectorAll(
                ".gallery-item.selected[data-type='picture']"
            )
        );

        const selectedData = selectedPictures.map(el => ({
            id: el.dataset.id,
            image: el.querySelector("img")?.src || null,
            name: el.querySelector(".img-name")?.innerText || null
        }));

        console.log("PICTURES:", selectedData);

        return;
    }
});
document.addEventListener("dblclick", function (e) {
    const folderItem = e.target.closest(".gallery-item[data-type='folder']");
    if (folderItem) {
        e.preventDefault();
        if (folderClickTimeout) {
            clearTimeout(folderClickTimeout);
            folderClickTimeout = null;
        }
        folderItem.classList.toggle("selected");
        updateSelectionCount();
    }
});

document.addEventListener("change", async function (e) {
    if (e.target.id !== "spaHiddenFileInput") return;

    const hiddenInput = e.target;
    const files = Array.from(hiddenInput.files);
    if (!files.length) return;

    const currentFolderId = getCurrentFolderId();
    const btnUpload = document.getElementById("btnUploadImg");
    const originalHtml = btnUpload.innerHTML;

    try {
        btnUpload.disabled = true;
        btnUpload.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Đang tải...`;

        const uploadPromises = files.map(file => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folderId", currentFolderId);
            return fetch("/cms/gallery/upload", { method: "POST", body: formData }).then(r => r.json());
        });

        await Promise.all(uploadPromises);
        hiddenInput.value = "";
        Turbo.visit(`/cms/gallery?folderId=${currentFolderId}`, { frame: "media_library_spa", action: "advance" });
    } catch (err) {
        console.error(err);
        alert("Upload thất bại!");
    } finally {
        btnUpload.disabled = false;
        btnUpload.innerHTML = originalHtml;
    }
});

function updateSelectionCount() {

    const selectedElements = Array.from(
        document.querySelectorAll(".gallery-item.selected")
    );

    const selectedPictures = selectedElements.filter(
        el => el.dataset.type === "picture"
    );

    const selectedCount = selectedPictures.length;

    const countBadge = document.getElementById("selectedCount");
    const btnDeselectAll = document.getElementById("btnDeselectAll");
    const btnDeleteSelected = document.getElementById("btnDeleteSelected");
    const btnConfirmSelect = document.getElementById("btnConfirmSelect");
    const btnEditSelected = document.getElementById("btnEditSelected");

    const hasSelected = selectedCount > 0;

    if (countBadge) {
        countBadge.innerText = `Đã chọn: ${selectedCount} ảnh`;
    }

    if (btnDeselectAll) {
        btnDeselectAll.disabled = selectedElements.length === 0;
    }

    if (btnDeleteSelected) {
        btnDeleteSelected.disabled = selectedElements.length === 0;
    }

    if (btnConfirmSelect) {

        btnConfirmSelect.disabled = !hasSelected;

        const countEl = btnConfirmSelect.querySelector(".count");

        if (countEl) {
            countEl.innerText = selectedCount;
        }


    }
    if (btnEditSelected) {

        if (selectedElements.length === 1) {
            btnEditSelected.classList.remove("d-none");
        } else {
            btnEditSelected.classList.add("d-none");
        }
    }
}
document.addEventListener("turbo:frame-load", function () {
    console.log("frame loaded");
    updateSelectionCount();
});