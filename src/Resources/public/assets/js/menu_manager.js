"use strict";

var KTMenuManager = (function () {
    let dt;
    const tableSelector = '#kt_menu_table';
    const modalEl = document.getElementById('kt_modal_menu');
    const modalBody = document.getElementById('modal-body-content');
    let modalInstance;

    // Biến lưu trữ row đang thao tác để update UI sau khi ajax xong
    let currentEditRow = null;

    const initDatatable = () => {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        const ajaxUrl = table.getAttribute('data-cms-ajax');

        dt = $(table).DataTable({
            ajax: { url: ajaxUrl, type: 'GET' },
            processing: true,
            serverSide: false, // Client side để thao tác row.add/remove mượt
            autoWidth: false,
            ordering: true,
            order: [[4, 'asc']], // Cột Sort Order
            columnDefs: [{ orderable: false, targets: [0, 6] }],
            pageLength: 50,
            rowId: 'id', // CỰC KỲ QUAN TRỌNG: Backend phải trả về field 'id'

            createdRow: function(row, data, dataIndex) {
                $(row).addClass('border-bottom border-2 border-gray-300 align-middle');
                $(row).attr('data-id', data.id); // Gắn ID để dễ tìm
            },

            columns: [
                // 0. STT
                {
                    data: null,
                    width: '50px',
                    className: 'ps-4 text-center',
                    render: (data, type, row, meta) => `<span class="fw-bold text-gray-600 stt-cell">${meta.row + 1}</span>`
                },

                // 1. Title + Tree
                {
                    data: 'title',
                    render: function (data, type, row) {
                        let toggleBtn = '';
                        // Logic hiển thị nút +
                        if (row.menu === 'child' && (row.hasChildren || row.children_count > 0)) {
                            const treeUrl = row.urls.child + '?mode=tree';
                            toggleBtn = `
                                <button type="button" class="btn btn-sm btn-icon btn-active-color-primary w-15px h-15px me-2 js-tree-expand"
                                        data-id="${row.id}" data-url="${treeUrl}" data-loaded="false">
                                    <i class="fa-solid fa-plus fs-9"></i>
                                </button>`;
                        } else {
                            toggleBtn = `<span class="d-inline-block w-15px me-2"></span>`;
                        }

                        let treePathHtml = row.treePath
                            ? `<div class="text-gray-400 fs-8 mt-1 fst-italic"><i class="fa-solid fa-turn-up fa-rotate-90 me-1 fs-9"></i>${row.treePath}</div>`
                            : '';

                        return `
                            <div class="d-flex flex-column justify-content-center">
                                <div class="d-flex align-items-center">
                                    ${toggleBtn}
                                    <a href="${row.urls.edit}" class="ajax-modal-btn text-gray-800 fw-bold text-hover-primary fs-7 mb-0">
                                        ${data}
                                    </a>
                                </div>
                                ${treePathHtml || ''}
                            </div>
                        `;
                    }
                },

                // 2. URL
                {
                    data: 'url',
                    width: '200px',
                    render: (data) => `<span class="text-gray-500 d-block fs-7 text-truncate mw-200px" title="${data}">${data || ''}</span>`
                },

                // 3. Position
                {
                    data: 'position',
                    width: '100px',
                    className: 'text-center',
                    render: (data) => `<span class="badge badge-light fw-normal text-muted fs-8">${data || '—'}</span>`
                },

                // 4. Sort Order
                {
                    data: 'sortOrder',
                    width: '100px',
                    className: 'text-center',
                    render: (data, type, row) => type === 'display' ?
                        `<input type="number" class="form-control form-control-sm form-control-solid w-50px text-center mx-auto js-sort-input py-1 fs-8" value="${data}" min="0" route_update="${row.urls.update_sort}">` : data
                },

                // 5. Language
                {
                    data: 'language',
                    width: '80px',
                    className: 'text-center',
                    render: (data) => `<span class="fw-bold text-gray-400 fs-8">${data}</span>`
                },

                // 6. Actions
                {
                    data: null,
                    width: '120px',
                    className: 'text-end pe-3',
                    render: function (data, type, row) {
                        const navBtn = row['menu'] === 'parent'
                            ? `<a href="${row.urls.child}" class="btn btn-icon btn-bg-light btn-active-color-primary btn-sm w-20px h-20px" title="Xem danh sách con"><i class="fa-solid fa-list-ul fs-9"></i></a>`
                            : `<a href="${row.urls.create_child}" class="ajax-modal-btn btn btn-icon btn-bg-light btn-active-color-success btn-sm w-20px h-20px" title="Thêm cấp con"><i class="fa-solid fa-plus fs-9"></i></a>`;

                        return `
                            <div class="d-flex justify-content-end gap-1">
                                <a href="${row.urls.edit}" class="ajax-modal-btn btn btn-icon btn-bg-light btn-active-color-primary btn-sm w-20px h-20px" title="Sửa"><i class="fa-solid fa-pen fs-9"></i></a>
                                ${navBtn}
                                <a href="${row.urls.delete}" class="btn btn-icon btn-bg-light btn-active-color-danger btn-sm w-20px h-20px btn-delete" title="Xóa"><i class="fa-solid fa-trash fs-9"></i></a>
                            </div>`;
                    }
                },
            ],
        });

        // Sự kiện vẽ lại bảng: cập nhật lại index STT nếu cần
        dt.on('draw', function () {
            // Có thể thêm logic re-init tooltips ở đây nếu mất
        });
    };

    const handleTreeLogic = () => {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.js-tree-expand');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const menuId = btn.dataset.id;
            const url = btn.getAttribute('data-url');
            const icon = btn.querySelector('i');
            const tr = btn.closest('tr');

            const fetchOptions = { headers: { 'X-Requested-With': 'XMLHttpRequest' } };
            const mainTable = document.querySelector(tableSelector);
            const isInMainDataTable = (tr && mainTable && tr.closest('table') === mainTable);

            // LOGIC CÂY CHA (Main Table)
            if (isInMainDataTable) {
                const row = dt.row(tr);
                if (row.child.isShown()) {
                    row.child.hide();
                    tr.classList.remove('shown');
                    icon.classList.replace('fa-minus', 'fa-plus');
                } else {
                    icon.classList.remove('fa-plus');
                    icon.classList.add('fa-spinner', 'fa-spin');

                    fetch(url, fetchOptions)
                        .then(res => res.json())
                        .then(res => {
                            if (res.status === 'success') {
                                const content = `
                                    <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3 mb-0 w-100">
                                        <tbody>${res.html}</tbody>
                                    </table>`;
                                row.child(content).show();

                                // Reset padding cho child row của Datatable
                                const childTd = tr.nextElementSibling ? tr.nextElementSibling.querySelector('td') : null;
                                if (childTd) {
                                    childTd.classList.add('p-0');
                                    childTd.setAttribute('colspan', '100%');
                                }

                                tr.classList.add('shown');
                                icon.classList.remove('fa-spinner', 'fa-spin');
                                icon.classList.add('fa-minus');
                                btn.dataset.loaded = 'true';
                            }
                        })
                        .catch(err => {
                            icon.classList.remove('fa-spinner', 'fa-spin');
                            icon.classList.add('fa-plus');
                        });
                }
            }
            // LOGIC CÂY CON (Nested Rows)
            else {
                const childRowPlaceholder = document.querySelector(`.js-child-row-${menuId}`);
                if (!childRowPlaceholder) return;

                if (btn.dataset.loaded === 'true' && !btn.classList.contains('force-reload')) {
                    childRowPlaceholder.classList.toggle('d-none');
                    if (childRowPlaceholder.classList.contains('d-none')) {
                        icon.classList.replace('fa-minus', 'fa-plus');
                    } else {
                        icon.classList.replace('fa-plus', 'fa-minus');
                    }
                } else {
                    icon.classList.remove('fa-plus');
                    icon.classList.add('fa-spinner', 'fa-spin');
                    btn.classList.remove('force-reload'); // Reset cờ force reload

                    fetch(url, fetchOptions)
                        .then(res => res.json())
                        .then(res => {
                            if (res.status === 'success') {
                                const td = childRowPlaceholder.querySelector('td');
                                td.innerHTML = `
                                    <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3 mb-0 w-100">
                                        <tbody>${res.html}</tbody>
                                    </table>`;
                                childRowPlaceholder.classList.remove('d-none');
                                btn.dataset.loaded = 'true';
                                icon.classList.remove('fa-spinner', 'fa-spin');
                                icon.classList.add('fa-minus');
                            }
                        })
                        .catch(err => {
                            icon.classList.remove('fa-spinner', 'fa-spin');
                            icon.classList.add('fa-plus');
                        });
                }
            }
        });
    };

    const handleSearch = () => {
        const filterSearch = document.querySelector('[data-kt-menu-table-filter="search"]');
        if (filterSearch) filterSearch.addEventListener('keyup', (e) => {
            if (dt) dt.column(1).search(e.target.value).draw();
        });
    };

    const handleSortUpdate = () => {
        document.addEventListener('change', function(event) {
            if (!event.target.classList.contains('js-sort-input')) return;
            const input = event.target;
            const route = input.getAttribute('route_update');
            const formData = new FormData();
            formData.append('sort', input.value);
            fetch(route, { method: 'POST', body: formData })
                .then(res => res.json())
                .then(d => {
                    if(d.status === 'success') {
                        // Sort thì update thầm lặng, không cần reload to
                        toastr.success('Đã cập nhật thứ tự');
                    }
                });
        });
    };

    const handleDelete = () => {
        document.addEventListener('click', function (event) {
            const btn = event.target.closest('.btn-delete');
            if (!btn) return;
            event.preventDefault();
            if (!confirm('Bạn chắc chắn muốn xóa?')) return;

            const tr = btn.closest('tr');
            // Kiểm tra xem row thuộc Datatable chính hay row con
            const isMainRow = dt.row(tr).any();

            fetch(btn.getAttribute('href'), { method: 'POST' })
                .then(res => res.json())
                .then(d => {
                    if(d.status === 'success') {
                        if (isMainRow) {
                            // XÓA ROW CHÍNH: Dùng API DataTable
                            dt.row(tr).remove().draw(false);
                            toastr.success('Đã xóa menu cha');
                        } else {
                            // XÓA ROW CON: Xóa DOM thủ công
                            const menuId = tr.querySelector('.js-tree-expand')?.dataset.id;
                            if (menuId) {
                                const placeholderRow = document.querySelector(`.js-child-row-${menuId}`);
                                if (placeholderRow) placeholderRow.remove();
                            }
                            tr.remove();
                            toastr.success('Đã xóa menu con');
                        }
                    } else {
                        toastr.error(d.message || 'Lỗi xóa');
                    }
                });
        });
    };

    const handleModal = () => {
        if (!modalEl) return;
        modalInstance = new bootstrap.Modal(modalEl);

        document.body.addEventListener('click', function(e) {
            const btn = e.target.closest('.ajax-modal-btn');
            if (!btn) return;
            e.preventDefault();

            // Lưu row hiện tại để cập nhật sau khi submit
            currentEditRow = btn.closest('tr');

            modalInstance.show();

            fetch(btn.getAttribute('href'), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    modalBody.innerHTML = html;
                    bindFormSubmit(modalBody);
                });
        });
    };

    const bindFormSubmit = (container) => {
        const form = container.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            fetch(form.getAttribute('action'), {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        modalInstance.hide();
                        toastr.success(data.message || 'Thao tác thành công');

                        // --- XỬ LÝ CẬP NHẬT UI KHÔNG RELOAD ---

                        // Case 1: Menu Cha (Quản lý bởi DataTable)
                        // (Backend phải trả về 'menu_type'='parent' hoặc không có parent_id)
                        if (data.menu_type === 'parent') {
                            // Backend cần trả về object 'menu_data' khớp cấu trúc columns
                            const newRowData = data.menu_data;

                            if (data.action === 'update' && currentEditRow && dt.row(currentEditRow).any()) {
                                // UPDATE: Set data và vẽ lại
                                dt.row(currentEditRow).data(newRowData).draw(false);
                            } else {
                                // CREATE: Thêm mới vào bảng
                                dt.row.add(newRowData).draw(false);
                            }
                        }
                        // Case 2: Menu Con (HTML lồng nhau)
                        else {
                            // Cách đơn giản nhất: Trigger reload danh sách con của cha nó
                            const parentId = data.parent_id;
                            if(parentId) {
                                // Tìm nút mở rộng của cha
                                const parentExpandBtn = document.querySelector(`.js-tree-expand[data-id="${parentId}"]`);

                                if (parentExpandBtn) {
                                    // Đánh dấu cần reload
                                    parentExpandBtn.classList.add('force-reload');
                                    parentExpandBtn.dataset.loaded = 'false';

                                    // Nếu đang đóng -> Click mở (sẽ fetch mới)
                                    // Nếu đang mở -> Click đóng, rồi Click mở lại
                                    const icon = parentExpandBtn.querySelector('i');
                                    if (icon.classList.contains('fa-minus')) {
                                        // Đang mở: đóng rồi mở lại
                                        parentExpandBtn.click(); // Đóng
                                        setTimeout(() => parentExpandBtn.click(), 200); // Mở lại
                                    } else {
                                        // Đang đóng: mở ra
                                        parentExpandBtn.click();
                                    }
                                } else {
                                    // Trường hợp hiếm: Không tìm thấy cha trong view hiện tại
                                    // (ví dụ add con cấp 3 nhưng cha cấp 2 chưa expand)
                                    // -> Fallback reload trang hoặc bỏ qua
                                }
                            }
                        }

                        // Reset
                        currentEditRow = null;

                    } else {
                        alert(data.message || 'Lỗi xử lý');
                    }
                })
                .catch(err => console.error(err));
        });
    };

    return {
        init: function () {
            initDatatable();
            handleTreeLogic();
            handleSearch();
            handleSortUpdate();
            handleModal();
            handleDelete();
        }
    };
})();

KTUtil.onDOMContentLoaded(function () {
    KTMenuManager.init();
});