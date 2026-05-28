
(function () {
    "use strict";

    var MODAL_URL = "/cms/gallery/modal";
    var MODAL_ID  = "amzsGalleryPickerModal";
    var BODY_ID   = "amzsGalleryPickerBody";

    var _trigger     = null;
    var _modalEl     = null;
    var _modalInst   = null;
    var _folderTimer = null;

    // ── Inject CSS 1 lần ──────────────────────────────────────────────────────
    var _style = document.createElement("style");
    _style.textContent = [
        "#" + BODY_ID + " { transition: opacity 0.15s ease; }",
        "#" + BODY_ID + ".amzs-fading { opacity: 0; pointer-events: none; }",
        "#" + BODY_ID + " .amzs-overlay {",
        "  position:absolute; inset:0; z-index:10;",
        "  display:flex; align-items:center; justify-content:center;",
        "  background:rgba(255,255,255,0.65);",
        "}"
    ].join("\n");
    document.head.appendChild(_style);

    // lắng nghe attribute mở modal
    document.addEventListener("click", function (e) {
        var t = e.target.closest("[data-amzs-gallery-modal]");
        if (!t) return;
        e.preventDefault();
        _trigger = t;
        _open();
    });

    // ── Mở modal
    function _open() {
        _ensureShell();
        _load(0);
        _modalInst.show();
    }

    // ── Tạo shell 1 lần
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

        var dialog  = document.createElement("div");
        dialog.setAttribute("class", "modal-dialog modal-xl modal-dialog-centered");
        dialog.style.maxWidth = "1100px";

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

        _modalInst = new bootstrap.Modal(_modalEl, { backdrop: "static" });
        _modalEl.addEventListener("hidden.bs.modal", _onHidden);
    }

    // load dữ liệu ra twig
    function _load(folderId) {
        var body    = document.getElementById(BODY_ID);
        var isEmpty = body.innerHTML.trim() === "";

        if (isEmpty) {
            body.innerHTML = '<div style="min-height:300px;display:flex;align-items:center;justify-content:center">'
                + '<span class="spinner-border spinner-border-sm me-2"></span> Đang tải...'
                + '</div>';
        } else {
            body.classList.add("amzs-fading");
            body.style.position = "relative";
            if (!body.querySelector(".amzs-overlay")) {
                var ov = document.createElement("div");
                ov.className = "amzs-overlay";
                ov.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span>';
                body.appendChild(ov);
            }
        }

        fetch(MODAL_URL + "?folderId=" + folderId, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(function (html) {
                _unbind(body);
                body.style.opacity = "0";
                setTimeout(function () {
                    body.innerHTML = html;
                    body.classList.remove("amzs-fading");
                    body.style.position = "";
                    body.offsetHeight; // force reflow
                    body.style.opacity = "1";
                    _bind(body);
                    _updateCount();
                }, 120);
            })
            .catch(function (err) {
                body.classList.remove("amzs-fading");
                body.style.opacity = "1";
                body.innerHTML = '<div class="alert alert-danger m-4">Lỗi tải thư viện: ' + err.message + '</div>';
                console.error("[AmzsGallery]", err);
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

    //sự kiện click trên modal
    function _onClick(e) {
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
                }
                _updateCount();
                return;

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

        if (e.target.closest("#btnDeselectAll")) {
            document.getElementById(BODY_ID)
                .querySelectorAll(".gallery-item.selected")
                .forEach(function (el) { el.classList.remove("selected"); });
            _updateCount();
            return;
        }

        if (e.target.closest("#btnUploadImg")) { _triggerUpload(); return; }

        // Xóa
        var btnDel = e.target.closest("#btnDeleteSelected");
        if (btnDel) { _deleteSelected(btnDel); return; }

        // Thêm thư mục
        if (e.target.closest("#btnAddFolder")) {
            e.preventDefault();
            _openSubModal("/cms/gallery/add/" + _getFolderId(), "Đang tạo thư mục...");
            return;
        }

        // Sửa
        if (e.target.closest("#btnEditSelected")) {
            e.preventDefault();
            var sel = document.getElementById(BODY_ID).querySelector(".gallery-item.selected");
            if (!sel) return;
            var url = sel.dataset.type === "folder"
                ? "/cms/gallery/edit/" + sel.dataset.id
                : "/cms/gallery/edit-picture/" + sel.dataset.id;
            _openSubModal(url, "Đang lưu thay đổi...");
            return;
        }

        // Confirm
        if (e.target.closest("#btnConfirmSelect")) { _confirm(); return; }
    }

    // dbclick chọn hoặc bỏ chọn mục hiện tại
    function _onDblClick(e) {
        var folder = e.target.closest(".gallery-item[data-type='folder']");
        if (!folder) return;
        e.preventDefault();
        if (_folderTimer) { clearTimeout(_folderTimer); _folderTimer = null; }
        folder.classList.toggle("selected");
        _updateCount();
    }

    // upload ảnh
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
                var btn      = document.getElementById(BODY_ID).querySelector("#btnUploadImg");
                var orig     = btn ? btn.innerHTML : "";
                if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang tải...'; }
                Promise.all(files.map(function (file) {
                    var fd = new FormData();
                    fd.append("file", file);
                    fd.append("folderId", folderId);
                    return fetch("/cms/gallery/upload", { method: "POST", body: fd }).then(function (r) { return r.json(); });
                }))
                    .then(function () {
                        input.value = "";
                        _load(folderId);
                    })
                    .catch(function (err) {
                        alert("Upload thất bại!");
                        console.error(err);
                    })
                    .finally(function () {
                        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
                    });
            });
        }
        input.value = "";
        input.click();
    }

    // Xóa hàng loạt
    function _deleteSelected(btn) {
        if (!confirm("Bạn có chắc chắn muốn xóa các mục đã chọn?")) return;
        var selected  = Array.from(document.getElementById(BODY_ID).querySelectorAll(".gallery-item.selected"));
        var folderId  = _getFolderId();
        btn.disabled  = true;
        Promise.all(selected.map(function (el) {
            var url = el.dataset.type === "picture"
                ? "/cms/gallery/delete-picture/" + el.dataset.id
                : "/cms/gallery/delete/" + el.dataset.id;
            return fetch(url, { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } }).then(function (r) { return r.json(); });
        }))
            .then(function () { _load(folderId); })
            .catch(function (err) { alert("Có lỗi xảy ra khi xóa!"); console.error(err); })
            .finally(function () { btn.disabled = false; });
    }

    // add/edit thư mục
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
                            .then(function () {
                                inst.hide();
                                _load(_getFolderId());
                            })
                            .catch(function (err) {
                                alert("Có lỗi xảy ra khi lưu!");
                                console.error(err);
                                if (btn) { btn.disabled = false; btn.innerHTML = orig; }
                            });
                    });
                }
                el.addEventListener("hidden.bs.modal", function () { w.remove(); });
            })
            .catch(function (err) { alert("Không thể tải form!"); console.error(err); });
    }

   // comfirm ảnh và có thể tạo sự kiện
    function _confirm() {
        var pictures = Array.from(
            document.getElementById(BODY_ID).querySelectorAll(".gallery-item.selected[data-type='picture']")
        ).map(function (el) {
            return {
                id    : el.dataset.id,
                image : el.querySelector("img") ? el.querySelector("img").src : null,
                name  : el.querySelector(".img-name") ? el.querySelector(".img-name").innerText.trim() : null
            };
        });
        if (!pictures.length) return;

        var eventName = (_trigger && _trigger.dataset.event) ? _trigger.dataset.event : "amzsGalleryPicked";
        document.dispatchEvent(new CustomEvent(eventName, {
            detail  : { pictures: pictures, trigger: _trigger },
            bubbles : true
        }));
        _modalInst.hide();
    }

    // update số lượng thanh nav ở footer
    function _updateCount() {
        var body = document.getElementById(BODY_ID);
        if (!body) return;

        var all  = body.querySelectorAll(".gallery-item.selected");
        var pics = body.querySelectorAll(".gallery-item.selected[data-type='picture']");
        var n    = pics.length;

        var badge = body.querySelector("#selectedCount");
        if (badge) badge.innerText = "Đã chọn: " + n + " ảnh";

        var deSel = body.querySelector("#btnDeselectAll");
        if (deSel) deSel.disabled = all.length === 0;

        var del = body.querySelector("#btnDeleteSelected");
        if (del) del.disabled = all.length === 0;

        var conf = body.querySelector("#btnConfirmSelect");
        if (conf) {
            conf.disabled = n === 0;
            var c = conf.querySelector(".count");
            if (c) c.innerText = n;
        }

        var edit = body.querySelector("#btnEditSelected");
        if (edit) edit.classList.toggle("d-none", all.length !== 1);
    }

    // Lấy id của folder
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