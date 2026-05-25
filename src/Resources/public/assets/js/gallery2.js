
document.addEventListener("click", async function (e) {


    const galleryItem = e.target.closest(".gallery-item");

    if (galleryItem) {

        galleryItem.classList.toggle("selected");

        updateSelectionCount();

        return;
    }

    const btnDeselectAll =
        e.target.closest("#btnDeselectAll");

    if (btnDeselectAll) {

        document
            .querySelectorAll(".gallery-item.selected")
            .forEach(el => {
                el.classList.remove("selected");
            });

        updateSelectionCount();

        return;
    }

    const btnUpload =
        e.target.closest("#btnUploadImg");

    if (btnUpload) {

        let hiddenInput =
            document.getElementById("spaHiddenFileInput");

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
});


document.addEventListener("change", async function (e) {

    if (e.target.id !== "spaHiddenFileInput") {
        return;
    }

    const hiddenInput = e.target;

    const files = Array.from(hiddenInput.files);

    if (!files.length) {
        return;
    }

    const frame =
        document.getElementById("media_library_spa");

    const currentFolderId =
        frame?.dataset.currentFolder || 0;

    const btnUpload =
        document.getElementById("btnUploadImg");

    const originalHtml =
        btnUpload.innerHTML;

    try {

        btnUpload.disabled = true;

        btnUpload.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
            Đang tải...
        `;

        const uploadPromises = files.map(file => {

            const formData = new FormData();

            formData.append("file", file);

            formData.append(
                "folderId",
                currentFolderId
            );

            return fetch("/cms/gallery/upload", {
                method: "POST",
                body: formData
            }).then(r => r.json());
        });

        await Promise.all(uploadPromises);

        hiddenInput.value = "";

        Turbo.visit(
            `/cms/gallery?folderId=${currentFolderId}`,
            {
                frame: "media_library_spa",
                action: "advance"
            }
        );

    } catch (err) {

        console.error(err);

        alert("Upload thất bại!");
    } finally {

        btnUpload.disabled = false;

        btnUpload.innerHTML = originalHtml;
    }
});

function updateSelectionCount() {

    const selectedCount =
        document.querySelectorAll(
            ".gallery-item.selected"
        ).length;

    const countBadge =
        document.getElementById("selectedCount");

    const btnDeselectAll =
        document.getElementById("btnDeselectAll");

    const btnDeleteSelected =
        document.getElementById("btnDeleteSelected");

    const btnConfirmSelect =
        document.getElementById("btnConfirmSelect");

    const hasSelected =
        selectedCount > 0;

    if (countBadge) {

        countBadge.innerText =
            `Đã chọn: ${selectedCount} ảnh`;
    }

    if (btnDeselectAll) {
        btnDeselectAll.disabled = !hasSelected;
    }

    if (btnDeleteSelected) {
        btnDeleteSelected.disabled = !hasSelected;
    }

    if (btnConfirmSelect) {

        btnConfirmSelect.disabled =
            !hasSelected;

        const countEl =
            btnConfirmSelect.querySelector(".count");

        if (countEl) {
            countEl.innerText =
                selectedCount;
        }
    }
}
document.addEventListener(
    "turbo:frame-load",
    function () {

        console.log("frame loaded");

        updateSelectionCount();
    }
);