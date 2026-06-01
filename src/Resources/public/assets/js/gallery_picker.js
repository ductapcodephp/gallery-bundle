/**
 * gallery_picker.js
 *
 * Lắng nghe sự kiện "amzsGalleryPicked" do gallery_modal.js phát ra,
 * tự động tìm container [data-gallery-target] gần nhất với trigger,
 * rồi cập nhật preview và input ẩn bên trong.
 *
 * Cách dùng — chỉ cần thêm data-gallery-target vào container:
 *
 *   <div class="card" data-gallery-target>
 *     <a data-amzs-gallery-modal ...>Chọn ảnh</a>
 *     <div class="image-input" style="background-image: url(...)"></div>
 *     <input type="hidden" name="thumbnail">
 *   </div>
 *
 * Nhận diện tự động bên trong container:
 *   Preview → phần tử đầu tiên có style.backgroundImage  /  hoặc <img>
 *   Input   → <input type="hidden">  /  fallback <input type="text">
 *
 */

(function () {
    "use strict";

    document.addEventListener("amzsGalleryPicked", function (e) {
        var pictures = e.detail.pictures;
        var trigger  = e.detail.trigger;

        console.group("[GalleryPicker] amzsGalleryPicked nhận được");
        console.log("pictures :", pictures);
        if (!pictures.length || !trigger) {
            console.warn("→ Bỏ qua: không có ảnh hoặc không có trigger");
            console.groupEnd();
            return;
        }

        var container = trigger.closest("[data-gallery-target]");

        if (!container) {
            console.warn("→ Bỏ qua: không tìm thấy [data-gallery-target] quanh trigger");
            console.groupEnd();
            return;
        }

        console.groupEnd();
        _applyToContainer(container, pictures[0]);
    });

    function _applyToContainer(container, picture) {
        var path = _toRelativePath(picture.image);

        console.group("[GalleryPicker] _applyToContainer");
        console.log("path     :", path);

        var preview = _findPreview(container);
        console.log("preview  :", preview);
        if (preview) {
            if (preview.tagName === "IMG") {
                preview.src = path;
            } else {
                preview.style.backgroundImage = "url('" + path + "')";
                preview.classList.remove("image-input-empty", "image-input-placeholder");
            }
        } else {
            console.warn("→ Không tìm thấy preview");
        }

        var input = _findInput(container);
        console.log("input    :", input);
        if (input) {
            input.value = path;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("input",  { bubbles: true }));
            console.log("→ set input.value =", path);
        } else {
            console.warn("→ Không tìm thấy input");
        }

        console.groupEnd();
    }

    function _findPreview(container) {
        var wrapper = container.querySelector(".image-input-wrapper");
        if (wrapper) return wrapper;

        var all = container.querySelectorAll("*");
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.tagName === "INPUT" || el.tagName === "BUTTON" || el.tagName === "A") continue;
            if (el.style.backgroundImage) return el;
        }1
        return container.querySelector("img") || null;
    }

    function _findInput(container) {
        return (
            container.querySelector("input[type='hidden']") ||
            container.querySelector("input[type='text']")   ||
            null
        );
    }

    function _toRelativePath(url) {
        if (!url) return "";
        try {
            return new URL(url).pathname;
        } catch (e) {
            return url;
        }
    }

}());