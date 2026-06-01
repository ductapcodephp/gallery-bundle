# AmzsGallery Picker — Tài liệu tích hợp

## 1. Tạo AssetUtil

### 1.1 AssetUtil.php

Tạo file `src/CoreBundle/Utils/AssetUtil.php`:

```php
<?php

namespace AmzsCMS\CoreBundle\Utils;

class AssetUtil
{
    private function __construct()
    {
    }

    public static function getPrefixGalleryBundle(): string
    {
        return 'bundles/amzsgallery/';
    }
}
```

---

### 1.2 Đăng ký Twig function

Trong `CoreExtension.php`, thêm vào `getFunctions()`:

```php
use AmzsCMS\CoreBundle\Utils\AssetUtil;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class CoreExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            // ... các function khác
            new TwigFunction('get_path_gallery_cms_asset', [AssetUtil::class, 'getPrefixGalleryBundle']),
        ];
    }
}
```

Sau khi đăng ký, dùng được trong mọi Twig template extend core-bundle:

```twig
{{ get_path_gallery_cms_asset() }}
{# output: bundles/amzsgallery/ #}
```

---

## 2. Đăt CSS

Đặt trong `<head>`, trước khi đóng `</head>`:

```html
<link
    rel="stylesheet"
    href="{{ asset(get_path_gallery_cms_asset() ~ 'assets/css/gallery.css') }}"
    data-turbo-track="reload"
>
```

---

## 3. Đặt Script — đúng thứ tự

Thứ tự bắt buộc, đặt trước `</body>`:

```html
<!-- 1. FOSJsRouting runtime -->
<script src="/bundles/fosjsrouting/js/router.min.js"></script>

<!-- 2. FOSJsRouting data (cung cấp Routing.generate) -->
<script src="/js/routing.js?callback=fos.Router.setData"></script>

<!-- 3. Gallery modal (mở modal, xử lý chọn ảnh, dispatch sự kiện) -->
<script src="{{ asset(get_path_gallery_cms_asset() ~ 'assets/js/gallery_modal.js') }}"></script>

<!-- 4. Gallery picker (nhận sự kiện, cập nhật preview + input) -->
<script src="{{ asset(get_path_gallery_cms_asset() ~ 'assets/js/gallery_picker.js') }}"></script>
```

> **Lưu ý:** `gallery_modal.js` phải đứng trước `gallery_picker.js`.
> FOSJsRouting phải đứng trước cả hai vì `gallery_modal.js` dùng `Routing.generate`.

---

## 4. Cách dùng — đặt attribute trên HTML

### Nguyên tắc

| Attribute | Đặt ở đâu | Tác dụng |
|---|---|---|
| `data-amzs-gallery-modal` | Nút/link mở modal | Kích hoạt mở gallery modal khi click |
| `data-gallery-target` | Container bọc ngoài | Xác định vùng nhận ảnh sau khi chọn |

`gallery_picker.js` tự động nhận diện bên trong `[data-gallery-target]`:
- **Preview**: ưu tiên `.image-input-wrapper` → fallback phần tử có `style.backgroundImage` → fallback `<img>`
- **Input**: ưu tiên `input[type="hidden"]` → fallback `input[type="text"]`

---

###  1 — KTImageInput (thumbnail card)

```html
<div class="card card-flush py-4" data-gallery-target>
    <div class="card-header">
        <div class="card-title"><h2>Thumbnail</h2></div>
        <div class="card-toolbar">

            <!-- Nút mở modal: chỉ cần data-amzs-gallery-modal -->
            <a
                href="javascript:void(0)"
                class="btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow"
                data-amzs-gallery-modal
                data-bs-toggle="tooltip"
                title="Open Gallery"
            >
                <i class="ki-duotone ki-pencil fs-7">
                    <span class="path1"></span>
                    <span class="path2"></span>
                </i>
            </a>

        </div>
    </div>
    <div class="card-body text-center pt-0">
        <div
            class="image-input image-input-empty image-input-outline image-input-placeholder mb-3"
            style="background-image: url("your_logic_get_image");"
        >
            <!-- Preview: gallery_picker.js set backgroundImage vào đây -->
            <div class="image-input-wrapper w-150px h-150px"></div>

            <!-- Input: gallery_picker.js set value vào đây -->
            <input type="hidden" name="thumbnail">
        </div>
    </div>
</div>
```

---

###  2 — Nhiều picker trên cùng một trang

Mỗi cặp trigger + container hoàn toàn độc lập nhờ `closest("[data-gallery-target]")`.
Không cần đặt tên event hay ID riêng.

```html
<!-- Picker A -->
<div class="card" data-gallery-target>
    <a data-amzs-gallery-modal ...>Chọn thumbnail</a>
    <div class="image-input-wrapper"></div>
    <input type="hidden" name="thumbnail">
</div>

<!-- Picker B — hoàn toàn độc lập với Picker A -->
<div class="card" data-gallery-target>
    <a data-amzs-gallery-modal ...>Chọn ảnh Facebook</a>
    <img src="" alt="preview">
    <input type="hidden" name="facebookThumbnail">
</div>
```

---

## 3. Luồng hoạt động

```
Click [data-amzs-gallery-modal]
        ↓
gallery_modal.js mở modal, lưu lại trigger
        ↓
Người dùng chọn ảnh → bấm "Áp dụng"
        ↓
gallery_modal.js dispatch CustomEvent("amzsGalleryPicked")
  detail: { pictures: [...], trigger: <element> }
        ↓
gallery_picker.js nhận event
        ↓
trigger.closest("[data-gallery-target]") → tìm container
        ↓
Tìm preview + input trong container → cập nhật
```