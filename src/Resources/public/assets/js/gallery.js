var GalleryIndex = (function () {
    "use strict";

    var FRAME_ID     = "media_library_spa";
    var SPA_ID       = "gallerySPA";
    var folderTimer  = null;

    function getCurrentFolderId() {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("folderId") || 0;
    }

    function _isInsidePickerModal(el) {
        return !!el.closest("[data-amzs-gallery-modal-container]");
    }

    function _getSPA() {
        return document.getElementById(SPA_ID);
    }

    document.addEventListener("click", async function (e) {

        if (_isInsidePickerModal(e.target)) return;

        var spa = _getSPA();
        if (!spa) return;
        var pageLink = e.target.closest(".manager-pagination .page-link");
        if (pageLink && spa.contains(pageLink)) {
            var href = pageLink.getAttribute("href");
            if (href && href !== "#") {
                e.preventDefault();
                Turbo.visit(href, { frame: FRAME_ID, action: "advance" });
                return;
            }
        }
        var galleryItem = e.target.closest(".gallery-item");
        if (galleryItem && spa.contains(galleryItem)) {
            var type = galleryItem.dataset.type;

            if (type === "picture") {
                galleryItem.classList.toggle("selected");
                updateSelectionCount();
                return;
            }

            if (type === "folder") {
                e.preventDefault();
                if (folderTimer) { clearTimeout(folderTimer); folderTimer = null; return; }
                folderTimer = setTimeout(function () {
                    folderTimer = null;
                    var url = galleryItem.dataset.url || galleryItem.getAttribute("href");
                    if (url) Turbo.visit(url, { frame: FRAME_ID, action: "advance" });
                }, 250);
                return;
            }
        }

        // Nút bỏ chọn
        var btnDeselectAll = e.target.closest("#btnDeselectAll");
        if (btnDeselectAll && spa.contains(btnDeselectAll)) {
            spa.querySelectorAll(".gallery-item.selected")
                .forEach(function (el) { el.classList.remove("selected"); });
            updateSelectionCount();
            return;
        }

        // Upload
        var btnUpload = e.target.closest("#btnUploadImg");
        if (btnUpload && spa.contains(btnUpload)) {
            var hiddenInput = document.getElementById("spaHiddenFileInput");
            if (!hiddenInput) {
                hiddenInput          = document.createElement("input");
                hiddenInput.type     = "file";
                hiddenInput.multiple = true;
                hiddenInput.accept   = "image/*";
                hiddenInput.id       = "spaHiddenFileInput";
                hiddenInput.style.display = "none";
                document.body.appendChild(hiddenInput);
            }
            hiddenInput.click();
            return;
        }

        // Xóa
        var btnDeleteSelected = e.target.closest("#btnDeleteSelected");
        if (btnDeleteSelected && spa.contains(btnDeleteSelected)) {
            if (!confirm("Bạn có chắc chắn muốn xóa các mục đã chọn?")) return;
            var selectedElements = spa.querySelectorAll(".gallery-item.selected");
            var currentFolderId  = getCurrentFolderId();
            try {
                btnDeleteSelected.disabled = true;
                await Promise.all(Array.from(selectedElements).map(function (el) {
                    var deleteUrl = el.dataset.type === "picture"
                        ? Routing.generate('amzs_admin_gallery_delete_picture_route', {
                            id: currentFolderId,
                            galleryPictureId: el.dataset.id
                        })
                        : Routing.generate('amzs_admin_gallery_delete_route', {
                            id: el.dataset.id
                        });

                    return fetch(deleteUrl, {
                        method: "DELETE",
                        headers: { "X-Requested-With": "XMLHttpRequest" }
                    }).then(function (r) { return r.json(); });
                }));

                Turbo.visit(
                    Routing.generate('amzs_admin_gallery_index_route') + "?folderId=" + currentFolderId,
                    { frame: FRAME_ID, action: "advance" }
                );

            } catch (err) {
                console.error(err);
                alert("Có lỗi xảy ra khi xóa!");
            } finally {
                btnDeleteSelected.disabled = false;
            }
            return;
        }

        // Thêm thư mục
        var btnAddFolder = e.target.closest("#btnAddFolder");
        if (btnAddFolder && spa.contains(btnAddFolder)) {
            e.preventDefault();

            openAjaxModal(
                Routing.generate('amzs_admin_gallery_add_route', {
                    id: getCurrentFolderId()
                }),
                "Đang tạo thư mục..."
            );

            return;
        }

        // Sửa
        var btnEditSelected = e.target.closest("#btnEditSelected");
        if (btnEditSelected && spa.contains(btnEditSelected)) {
            e.preventDefault();

            var selectedEl = spa.querySelector(".gallery-item.selected");
            if (!selectedEl) return;

            var editUrl = selectedEl.dataset.type === "folder"
                ? Routing.generate('amzs_admin_gallery_edit_route', {
                    id: selectedEl.dataset.id
                })
                : Routing.generate('amzs_admin_gallery_edit_picture_route', {
                    galleryPictureId: selectedEl.dataset.id
                });

            openAjaxModal(editUrl, "Đang lưu thay đổi...");
            return;
        }


    });

    //  Dblclick chọn hoặc hủy chọn folder
    document.addEventListener("dblclick", function (e) {
        if (_isInsidePickerModal(e.target)) return;
        var spa = _getSPA();
        if (!spa) return;

        var folderItem = e.target.closest(".gallery-item[data-type='folder']");
        if (folderItem && spa.contains(folderItem)) {
            e.preventDefault();
            if (folderTimer) { clearTimeout(folderTimer); folderTimer = null; }
            folderItem.classList.toggle("selected");
            updateSelectionCount();
        }
    });

    //  Upload change
    document.addEventListener("change", async function (e) {
        if (e.target.id !== "spaHiddenFileInput") return;

        var hiddenInput     = e.target;
        var files           = Array.from(hiddenInput.files);
        if (!files.length) return;

        var currentFolderId = getCurrentFolderId();
        var btnUpload       = document.getElementById("btnUploadImg");
        var originalHtml    = btnUpload ? btnUpload.innerHTML : "";

        try {
            if (btnUpload) { btnUpload.disabled = true; btnUpload.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang tải...'; }

            await Promise.all(files.map(function (file) {
                var formData = new FormData();
                formData.append("file", file);
                formData.append("folderId", currentFolderId);

                return fetch(
                    Routing.generate('amzs_admin_gallery_upload_route'),
                    {
                        method: "POST",
                        body: formData
                    }
                ).then(function (r) { return r.json(); });
            }));

            hiddenInput.value = "";

            Turbo.visit(
                Routing.generate('amzs_admin_gallery_index_route') + "?folderId=" + currentFolderId,
                { frame: FRAME_ID, action: "advance" }
            );

        } catch (err) {
            console.error(err); alert("Upload thất bại!");
        } finally {
            if (btnUpload) { btnUpload.disabled = false; btnUpload.innerHTML = originalHtml; }
        }
    });

    // cập nhật số lượng thanh nav dưới footer
    function updateSelectionCount() {
        var spa = _getSPA();
        if (!spa) return;

        var selectedElements = Array.from(spa.querySelectorAll(".gallery-item.selected"));
        var selectedPictures = selectedElements.filter(function (el) { return el.dataset.type === "picture"; });
        var selectedCount    = selectedPictures.length;

        var countBadge        = spa.querySelector("#selectedCount");
        var btnDeselectAll    = spa.querySelector("#btnDeselectAll");
        var btnDeleteSelected = spa.querySelector("#btnDeleteSelected");
        var btnConfirmSelect  = spa.querySelector("#btnConfirmSelect");
        var btnEditSelected   = spa.querySelector("#btnEditSelected");
        var btnCropSelected   = spa.querySelector("#btnCropSelected");

        if (countBadge)        countBadge.innerText        = "Đã chọn: " + selectedCount + " ảnh";
        if (btnDeselectAll)    btnDeselectAll.disabled      = selectedElements.length === 0;
        if (btnDeleteSelected) btnDeleteSelected.disabled   = selectedElements.length === 0;

        if (btnConfirmSelect) {
            btnConfirmSelect.disabled = selectedCount === 0;
            var countEl = btnConfirmSelect.querySelector(".count");
            if (countEl) countEl.innerText = selectedCount;
        }

        if (btnEditSelected)
            btnEditSelected.classList.toggle("d-none", selectedElements.length !== 1);

        if (btnCropSelected)
            btnCropSelected.classList.toggle("d-none", !(selectedPictures.length === 1 && selectedElements.length === 1));
    }

    //  Turbo frame load
    document.addEventListener("turbo:frame-load", function () {
        updateSelectionCount();
    });

    // openAjaxModal (dùng trong trang index)
    function openAjaxModal(url, loadingText) {
        loadingText = loadingText || "Đang xử lý...";
        fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then(function (response) {
            if (!response.ok) throw new Error("Server báo lỗi " + response.status);
            return response.text();
        })
        .then(function (html) {
            var existingModal = document.getElementById("amzs-dynamic-modal-container");
            if (existingModal) existingModal.remove();

            var modalContainer    = document.createElement("div");
            modalContainer.id     = "amzs-dynamic-modal-container";
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);

            var modalElement = modalContainer.querySelector(".modal");
            if (!modalElement) { alert("Không tìm thấy cấu trúc Modal!"); return; }

            var modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();

            var form = modalElement.querySelector("form");
            if (form) {
                form.addEventListener("submit", function (submitEvent) {
                    submitEvent.preventDefault();
                    var submitBtn    = form.querySelector("[type='submit']");
                    var originalText = submitBtn ? submitBtn.innerHTML : "";

                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + loadingText;
                    }

                    fetch(form.action, {
                        method: form.method || "POST",
                        body: new FormData(form),
                        headers: { "X-Requested-With": "XMLHttpRequest" }
                    })
                    .then(function (res) {
                        if (res.ok || res.status === 201) return res.json();
                        throw new Error("Lỗi xử lý form từ server");
                    })
                    .then(function () {
                        modalInstance.hide();

                        Turbo.visit(
                            Routing.generate('amzs_admin_gallery_index_route') + "?folderId=" + getCurrentFolderId(),
                            { frame: FRAME_ID, action: "advance" }
                        );
                    })
                    .catch(function (err) {
                        console.error(err); alert("Có lỗi xảy ra khi lưu!");
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                        }
                    });
                });
            }

            modalElement.addEventListener("hidden.bs.modal", function () {
                modalContainer.remove();
            });
        })
        .catch(function (err) {
            console.error("Lỗi AJAX Modal:", err);
            alert("Không thể tải form!");
        });
    }

    return { updateSelectionCount: updateSelectionCount };

}());

