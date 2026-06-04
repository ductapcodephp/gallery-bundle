(function () {
    "use strict";

    // BƯỚC 1: Đổi từ khai báo cố định sang biến không gán giá trị trước
    var MODAL_URL = "";

    var MODAL_ID  = "amzsGalleryPickerModal";
    var BODY_ID   = "amzsGalleryPickerBody";

    var _trigger     = null;
    var _modalEl     = null;
    var _modalInst   = null;
    var _folderTimer = null;

    var _style = document.createElement("style");
    _style.textContent = [
        "#" + MODAL_ID + " { z-index: 99999 !important; }",
        "#" + BODY_ID + " { transition: opacity 0.15s ease; }",
        "#" + BODY_ID + ".amzs-fading { opacity: 0; pointer-events: none; }",
        "#" + BODY_ID + " .amzs-overlay {",
        "  position:absolute; inset:0; z-index:10;",
        "  display:flex; align-items:center; justify-content:center;",
        "  background:rgba(255,255,255,0.65);",
        "}",
        "@media (min-width: 1200px) {",
        "  .amzs-modal-xl-custom { max-width: 1100px !important; }",
        "}"
    ].join("\n");
    document.head.appendChild(_style);

    document.addEventListener("click", function (e) {
        if (e.target.closest("#" + MODAL_ID)) return;

        var t = e.target.closest("[data-amzs-gallery-modal]");
        if (!t) return;
        e.preventDefault();
        _trigger = t;
        _open();
    });

    document.addEventListener("amzsGalleryOpen", function () {
        _trigger = null;
        _open();
    });

    function _open() {
        if (!MODAL_URL && typeof Routing !== "undefined") {
            MODAL_URL = Routing.generate('amzs_admin_gallery_modal_route');
        }

        _ensureShell();
        document.body.appendChild(_modalEl);
        _load(0);
        _modalInst.show();
    }

    // khởi tạo modal
    function _ensureShell() {
        var existing = document.getElementById(MODAL_ID);
        if (existing) {
            _modalEl   = existing;
            _modalInst = bootstrap.Modal.getOrCreateInstance(_modalEl);
            return;
        }

        _modalEl    = document.createElement("div");
        _modalEl.id = MODAL_ID;
        _modalEl.setAttribute("class", "modal fade");
        _modalEl.setAttribute("tabindex", "-1");
        _modalEl.setAttribute("data-amzs-gallery-modal-container", "true");
        _modalEl.style.zIndex = "99999";

        var dialog  = document.createElement("div");
        dialog.setAttribute("class", "modal-dialog modal-xl modal-dialog-centered amzs-modal-xl-custom");

        var content = document.createElement("div");
        content.setAttribute("class", "modal-content");

        var header  = document.createElement("div");
        header.setAttribute("class", "modal-header py-4 px-6");
        header.innerHTML = [
            '<h5 class="modal-title fw-bold">',
            '  <i class="ti ti-photo me-2 text-primary"></i> Chọn ảnh từ thư viện',
            '</h5>',
            '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>'
        ].join("");

        var body    = document.createElement("div");
        body.setAttribute("class", "modal-body p-0");
        body.id     = BODY_ID;

        content.appendChild(header);
        content.appendChild(body);
        dialog.appendChild(content);
        _modalEl.appendChild(dialog);
        document.body.appendChild(_modalEl);

        // backdrop: false — không tạo backdrop đè lên CKEditor dialog
        _modalInst = new bootstrap.Modal(_modalEl, { backdrop: false, keyboard: false });
        _modalEl.addEventListener("hidden.bs.modal", _onHidden);
    }

    // render data gallery
    function _load(folderId, page) {
        var body  = document.getElementById(BODY_ID);
        var frame = document.getElementById("gallery_main_content");
        var isEmpty = body.innerHTML.trim() === "";

        page = page || 1;
        var requestUrl = MODAL_URL || (typeof Routing !== "undefined" ? Routing.generate('amzs_admin_gallery_modal_route') : "");
        var fullUrl    = requestUrl + "?folderId=" + folderId + "&page=" + page;

        if (isEmpty) {
            body.innerHTML = '<div style="min-height:300px;display:flex;align-items:center;justify-content:center">'
                + '<span class="spinner-border spinner-border-sm me-2"></span> Đang tải...'
                + '</div>';

            fetch(fullUrl, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            })
                .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
                .then(function (html) {
                    _unbind(body);
                    body.innerHTML = html;
                    _bind(body);
                    _updateCount();
                })
                .catch(function (err) {
                    body.innerHTML = '<div class="alert alert-danger m-4">Lỗi tải thư viện: ' + err.message + '</div>';
                });

            return;
        }

        var targetContainer = frame ? frame : body;

        targetContainer.classList.add("amzs-fading");
        targetContainer.style.position = "relative";
        if (!targetContainer.querySelector(".amzs-overlay")) {
            var ov = document.createElement("div");
            ov.className = "amzs-overlay";
            ov.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span>';
            targetContainer.appendChild(ov);
        }

        fetch(fullUrl, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Turbo-Frame": "gallery_main_content"
            }
        })
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(function (html) {
                _unbind(body);
                targetContainer.style.opacity = "0";

                setTimeout(function () {
                    if (frame) {
                        frame.outerHTML = html;
                    } else {
                        body.innerHTML = html;
                    }

                    var newFrame = document.getElementById("gallery_main_content");
                    if (newFrame) {
                        newFrame.classList.remove("amzs-fading");
                        newFrame.style.position = "";
                        newFrame.style.opacity = "1";
                    }

                    _bind(document.getElementById(BODY_ID));
                    _updateCount();
                }, 120);
            })
            .catch(function (err) {
                targetContainer.classList.remove("amzs-fading");
                targetContainer.style.opacity = "1";
                console.error("[AmzsGallery Modal]", err);
            });
    }

    function _bind(c) {
        c.addEventListener("click",    _onClick);
        c.addEventListener("dblclick", _onDblClick);
    }
    function _unbind(c) {
        if (!c) return;
        c.removeEventListener("click",    _onClick);
        c.removeEventListener("dblclick", _onDblClick);
    }

    // xử lý sự kiện click
    function _onClick(e) {
        var pageLink = e.target.closest("[data-modal-page]");
        if (pageLink) {
            e.preventDefault();
            _load(pageLink.dataset.modalNavigate, pageLink.dataset.modalPage);
            return;
        }
        var nav = e.target.closest("[data-modal-navigate]");
        if (nav) {
            e.preventDefault();
            _load(nav.dataset.modalNavigate);
            return;
        }

        var item = e.target.closest(".gallery-item");
        if (item) {
            if (item.dataset.type === "picture") {
                item.classList.toggle("selected");
                _updateCount();
                return;
            }
            if (item.dataset.type === "folder") {
                e.preventDefault();
                if (_folderTimer) { clearTimeout(_folderTimer); _folderTimer = null; return; }
                var fid = item.dataset.id;
                _folderTimer = setTimeout(function () {
                    _folderTimer = null;
                    _load(fid);
                }, 250);
                return;
            }
        }

        var body = document.getElementById(BODY_ID);

        if (e.target.closest("#modal-btnDeselectAll")) {
            body.querySelectorAll(".gallery-item.selected")
                .forEach(function (el) { el.classList.remove("selected"); });
            _updateCount();
            return;
        }

        if (e.target.closest("#modal-btnUploadImg")) { _triggerUpload(); return; }

        var btnDel = e.target.closest("#modal-btnDeleteSelected");
        if (btnDel) { _deleteSelected(btnDel); return; }

        if (e.target.closest("#modal-btnAddFolder")) {
            e.preventDefault();
            _openSubModal(
                Routing.generate('amzs_admin_gallery_add_route', {
                    id: _getFolderId()
                }),
                "Đang tạo thư mục..."
            );
            return;
        }

        if (e.target.closest("#modal-btnEditSelected")) {
            e.preventDefault();
            var sel = body.querySelector(".gallery-item.selected");
            if (!sel) return;

            var url = sel.dataset.type === "folder"
                ? Routing.generate('amzs_admin_gallery_edit_route', {
                    id: sel.dataset.id
                })
                : Routing.generate('amzs_admin_gallery_edit_picture_route', {
                    galleryPictureId: sel.dataset.id
                });

            _openSubModal(url, "Đang lưu thay đổi...");
            return;
        }

        if (e.target.closest("#modal-btnConfirmSelect")) { _confirm(); return; }
    }

    // Dblclick chọn hoặc hủy chọn folder
    function _onDblClick(e) {
        var folder = e.target.closest(".gallery-item[data-type='folder']");
        if (!folder) return;
        e.preventDefault();
        if (_folderTimer) { clearTimeout(_folderTimer); _folderTimer = null; }
        folder.classList.toggle("selected");
        _updateCount();
    }

    // Upload
    function _triggerUpload() {
        var input = document.getElementById("amzsGalleryFileInput");
        if (!input) {
            input          = document.createElement("input");
            input.type     = "file";
            input.multiple = true;
            input.accept   = "image/*";
            input.id       = "amzsGalleryFileInput";
            input.style.display = "none";
            document.body.appendChild(input);
            input.addEventListener("change", function () {
                var files    = Array.from(input.files);
                if (!files.length) return;
                var folderId = _getFolderId();
                var btn      = document.getElementById(BODY_ID).querySelector("#modal-btnUploadImg");
                var orig     = btn ? btn.innerHTML : "";
                if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang tải...'; }
                Promise.all(files.map(function (file) {
                    var fd = new FormData();
                    fd.append("file", file);
                    fd.append("folderId", folderId);
                    return fetch(
                        Routing.generate('amzs_admin_gallery_upload_route'),
                        {
                            method: "POST",
                            body: fd
                        }
                    ).then(function (r) { return r.json(); });
                }))
                    .then(function () { input.value = ""; _load(folderId); })
                    .catch(function (err) { alert("Upload thất bại!"); console.error(err); })
                    .finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = orig; } });
            });
        }
        input.value = "";
        input.click();
    }

    // Xóa hàng loạt
    function _deleteSelected(btn) {
        if (!confirm("Bạn có chắc chắn muốn xóa các mục đã chọn?")) return;
        var body     = document.getElementById(BODY_ID);
        var selected = Array.from(body.querySelectorAll(".gallery-item.selected"));
        var folderId = _getFolderId();
        btn.disabled = true;
        Promise.all(selected.map(function (el) {
            var url = el.dataset.type === "picture"
                ? Routing.generate('amzs_admin_gallery_delete_picture_route', {
                    id: folderId,
                    galleryPictureId: el.dataset.id
                })
                : Routing.generate('amzs_admin_gallery_delete_route', {
                    id: el.dataset.id
                });

            return fetch(url, {
                method: "DELETE",
                headers: { "X-Requested-With": "XMLHttpRequest" }
            }).then(function (r) { return r.json(); });
        }))
            .then(function () { _load(folderId); })
            .catch(function (err) { alert("Có lỗi xảy ra khi xóa!"); console.error(err); })
            .finally(function () { btn.disabled = false; });
    }

    // add/edit
    function _openSubModal(url, loadingText) {
        fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(function (html) {
                var w = document.getElementById("amzsGallerySubModal");
                if (w) w.remove();
                w    = document.createElement("div");
                w.id = "amzsGallerySubModal";
                w.innerHTML = html;
                document.body.appendChild(w);

                var el = w.querySelector(".modal");
                if (!el) { alert("Không tìm thấy cấu trúc Modal!"); return; }

                var inst = new bootstrap.Modal(el);
                inst.show();

                var form = el.querySelector("form");
                if (form) {
                    form.addEventListener("submit", function (ev) {
                        ev.preventDefault();
                        var btn  = form.querySelector("[type='submit']");
                        var orig = btn ? btn.innerHTML : "";
                        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + loadingText; }
                        fetch(form.action, {
                            method: form.method || "POST",
                            body: new FormData(form),
                            headers: { "X-Requested-With": "XMLHttpRequest" }
                        })
                            .then(function (r) {
                                if (r.ok || r.status === 201) return r.json();
                                throw new Error("Lỗi server");
                            })
                            .then(function () { inst.hide(); _load(_getFolderId()); })
                            .catch(function (err) {
                                alert("Có lỗi xảy ra khi lưu!"); console.error(err);
                                if (btn) { btn.disabled = false; btn.innerHTML = orig; }
                            });
                    });
                }
                el.addEventListener("hidden.bs.modal", function () { w.remove(); });
            })
            .catch(function (err) { alert("Không thể tải form!"); console.error(err); });
    }

    // xác nhận chọn ảnh
    function _confirm() {
        var pictures = Array.from(
            document.getElementById(BODY_ID).querySelectorAll(".gallery-item.selected[data-type='picture']")
        ).map(function (el) {
            return {
                id   : el.dataset.id,
                image: el.querySelector("img") ? el.querySelector("img").src : null,
                name : el.querySelector(".img-name") ? el.querySelector(".img-name").innerText.trim() : null
            };
        });

        if (!pictures.length) return;

        document.dispatchEvent(new CustomEvent("amzsGalleryPicked", {
            bubbles: true,
            detail: {
                pictures: pictures,
                trigger : _trigger
            }
        }));

        _modalInst.hide();
    }

    // cập nhật số lượng thanh nav dưới footer
    function _updateCount() {
        var body = document.getElementById(BODY_ID);
        if (!body) return;

        var all  = body.querySelectorAll(".gallery-item.selected");
        var pics = body.querySelectorAll(".gallery-item.selected[data-type='picture']");
        var n    = pics.length;

        var badge = body.querySelector("#modal-selectedCount");
        if (badge) badge.innerText = "Đã chọn: " + n + " ảnh";

        var deSel = body.querySelector("#modal-btnDeselectAll");
        if (deSel) deSel.disabled = all.length === 0;

        var del = body.querySelector("#modal-btnDeleteSelected");
        if (del) del.disabled = all.length === 0;

        var conf = body.querySelector("#modal-btnConfirmSelect");
        if (conf) {
            conf.disabled = n === 0;
            var c = conf.querySelector(".count");
            if (c) c.innerText = n;
        }

        var edit = body.querySelector("#modal-btnEditSelected");
        if (edit) edit.classList.toggle("d-none", all.length !== 1);

    }

    function _getFolderId() {
        var body  = document.getElementById(BODY_ID);
        var frame = body ? body.querySelector("turbo-frame#media_library_modal_spa") : null;
        return (frame && frame.dataset.currentFolder !== undefined) ? frame.dataset.currentFolder : 0;
    }

    function _onHidden() {
        _unbind(document.getElementById(BODY_ID));
        _trigger = null;
    }

}());