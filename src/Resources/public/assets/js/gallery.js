var GalleryIndex = (function () {
    "use strict";

    var FRAME_ID      = "media_library_spa";
    var WRAPPER_CLASS = "media-manager-wrapper";
    var folderTimer   = null;

    function getCurrentFolderId() {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("folderId") || 0;
    }

    function _getWrapper() {
        return document.querySelector("." + WRAPPER_CLASS);
    }

    if (!window._galleryEventsBound) {
        document.addEventListener("click", handleGlobalClick);
        document.addEventListener("dblclick", handleGlobalDblClick);
        document.addEventListener("change", handleGlobalChange);
        document.addEventListener("turbo:frame-load", handleFrameLoad);

        window._galleryEventsBound = true; // Đánh dấu đã đăng ký
    }

    // HÀM XỬ LÝ SỰ KIỆN CLICK TOÀN CỤC
    async function handleGlobalClick(e) {
        var wrapper = _getWrapper();
        if (!wrapper) return;

        var pageLink = e.target.closest(".manager-pagination .page-link");
        if (pageLink && wrapper.contains(pageLink)) {
            var href = pageLink.getAttribute("href");
            if (href && href !== "#") {
                e.preventDefault();
                Turbo.visit(href, { frame: FRAME_ID, action: "advance" });
                return;
            }
        }

        var galleryItem = e.target.closest(".gallery-item") || e.target.closest(".amzs-folder-item");
        if (galleryItem && wrapper.contains(galleryItem)) {

            if (galleryItem.classList.contains("amzs-folder-item")) {
                return;
            }

            var type = galleryItem.dataset.type;

            if (type === "picture") {
                galleryItem.classList.toggle("selected");

                var badge = galleryItem.querySelector(".select-badge");
                if (badge) {
                    badge.classList.toggle("d-none", !galleryItem.classList.contains("selected"));
                }

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

        // Nút bỏ chọn tất cả
        var btnDeselectAll = e.target.closest("#btnDeselectAll");
        if (btnDeselectAll && wrapper.contains(btnDeselectAll)) {
            wrapper.querySelectorAll(".gallery-item.selected")
                .forEach(function (el) {
                    el.classList.remove("selected");
                    var badge = el.querySelector(".select-badge");
                    if (badge) badge.classList.add("d-none");
                });
            updateSelectionCount();
            return;
        }

        // Upload
        var btnUpload = e.target.closest("#btnUploadImg");
        if (btnUpload && wrapper.contains(btnUpload)) {
            // Xóa sạch input rác (nếu có) trước khi tạo mới
            var cleanOlds = document.querySelectorAll("#spaHiddenFileInput");
            cleanOlds.forEach(function(old) { old.remove(); });

            var hiddenInput          = document.createElement("input");
            hiddenInput.type         = "file";
            hiddenInput.multiple     = true;
            hiddenInput.accept       = "image/*";
            hiddenInput.id           = "spaHiddenFileInput";
            hiddenInput.style.display = "none";
            document.body.appendChild(hiddenInput);

            hiddenInput.click();
            return;
        }

        // Xóa ảnh/thư mục được chọn
        var btnDeleteSelected = e.target.closest("#btnDeleteSelected");
        if (btnDeleteSelected && wrapper.contains(btnDeleteSelected)) {
            if (!confirm("Bạn có chắc chắn muốn xóa các mục đã chọn?")) return;
            var selectedElements = wrapper.querySelectorAll(".gallery-item.selected");
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
        if (btnAddFolder && wrapper.contains(btnAddFolder)) {
            e.preventDefault();
            openAjaxModal(
                Routing.generate('amzs_admin_gallery_add_route', { id: getCurrentFolderId() }),
                "Đang tạo thư mục..."
            );
            return;
        }

        // Sửa thông tin thư mục / ảnh
        var btnEditSelected = e.target.closest("#btnEditSelected");
        if (btnEditSelected && wrapper.contains(btnEditSelected)) {
            e.preventDefault();

            var selectedEl = wrapper.querySelector(".gallery-item.selected");
            if (!selectedEl) return;

            var editUrl = selectedEl.dataset.type === "folder"
                ? Routing.generate('amzs_admin_gallery_edit_route', { id: selectedEl.dataset.id })
                : Routing.generate('amzs_admin_gallery_edit_picture_route', { galleryPictureId: selectedEl.dataset.id });

            openAjaxModal(editUrl, "Đang lưu thay đổi...");
            return;
        }
    }

    // HÀM XỬ LÝ SỰ KIỆN DBLCLICK TOÀN CỤC
    function handleGlobalDblClick(e) {
        var wrapper = _getWrapper();
        if (!wrapper) return;

        var folderItem = e.target.closest(".gallery-item[data-type='folder']");
        if (folderItem && wrapper.contains(folderItem)) {
            e.preventDefault();
            if (folderTimer) { clearTimeout(folderTimer); folderTimer = null; }
            folderItem.classList.toggle("selected");

            var badge = folderItem.querySelector(".select-badge");
            if (badge) {
                badge.classList.toggle("d-none", !folderItem.classList.contains("selected"));
            }

            updateSelectionCount();
        }
    }

    // HÀM XỬ LÝ UPLOAD
    async function handleGlobalChange(e) {
        if (e.target.id !== "spaHiddenFileInput") return;

        var hiddenInput     = e.target;
        var files           = Array.from(hiddenInput.files);
        if (!files.length) return;

        var currentFolderId = getCurrentFolderId();
        var btnUpload       = document.getElementById("btnUploadImg");
        var originalHtml    = btnUpload ? btnUpload.innerHTML : "";

        try {
            if (btnUpload) {
                btnUpload.disabled = true;
                btnUpload.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang tải...';
            }

            await Promise.all(files.map(function (file) {
                var formData = new FormData();
                formData.append("file", file);
                formData.append("folderId", currentFolderId);

                return fetch(
                    Routing.generate('amzs_admin_gallery_upload_route'),
                    { method: "POST", body: formData }
                ).then(function (r) { return r.json(); });
            }));

            // Xóa file thừa tránh vướng víu
            hiddenInput.value = "";
            hiddenInput.remove();

            Turbo.visit(
                Routing.generate('amzs_admin_gallery_index_route') + "?folderId=" + currentFolderId,
                { frame: FRAME_ID, action: "advance" }
            );

        } catch (err) {
            console.error(err);
            alert("Upload thất bại!");
        } finally {
            if (btnUpload) { btnUpload.disabled = false; btnUpload.innerHTML = originalHtml; }
        }
    }

    // HÀM KHI TURBO LOAD
    function handleFrameLoad(e) {
        if (e.target.id === FRAME_ID) {
            updateSelectionCount();
        }
    }

    // Cập nhật số lượng ảnh đã chọn xuống Footer nằm ngoài SPA
    function updateSelectionCount() {
        var wrapper = _getWrapper();
        if (!wrapper) return;

        var selectedElements = Array.from(wrapper.querySelectorAll(".gallery-item.selected"));
        var selectedPictures = selectedElements.filter(function (el) { return el.dataset.type === "picture"; });
        var selectedCount    = selectedPictures.length;

        var countBadge        = wrapper.querySelector("#selectedCount");
        var btnDeselectAll    = wrapper.querySelector("#btnDeselectAll");
        var btnDeleteSelected = wrapper.querySelector("#btnDeleteSelected");
        var btnEditSelected   = wrapper.querySelector("#btnEditSelected");

        if (countBadge)        countBadge.innerText        = selectedCount === 0 ? "Chưa chọn ảnh nào" : "Đã chọn: " + selectedCount + " ảnh";
        if (btnDeselectAll)    btnDeselectAll.disabled      = selectedElements.length === 0;
        if (btnDeleteSelected) btnDeleteSelected.disabled   = selectedElements.length === 0;

        if (btnEditSelected) {
            btnEditSelected.classList.toggle("d-none", selectedElements.length !== 1);
        }
    }

    // Mở Ajax Modal (Thêm/Sửa Thư mục)
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