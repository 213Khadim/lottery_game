/* =========================================================
   LotteryHub - Shared panel scripts (static demo)
   - Sidebar page switching (via #hash)
   - Mobile sidebar toggle
   - Table search + status filter tabs
   - Demo toast for form submits / actions
   ========================================================= */
(function () {
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('[data-page]');
    const heading = document.getElementById('pageHeading');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');

    function showPage(id) {
        const target = document.getElementById('page-' + id);
        if (!target) return;

        pages.forEach(p => p.classList.toggle('active', p === target));
        document.querySelectorAll('.sidebar-nav [data-page]').forEach(a => {
            a.classList.toggle('active', a.dataset.page === id);
        });

        if (heading) heading.textContent = target.dataset.title || '';
        document.title = (target.dataset.title || '') + ' | ' + document.body.dataset.appTitle;
        closeSidebar();
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.page;
            history.replaceState(null, '', '#' + id);
            showPage(id);
        });
    });

    function showFromHash() {
        const id = location.hash.replace('#', '') || 'dashboard';
        showPage(document.getElementById('page-' + id) ? id : 'dashboard');
    }

    showFromHash();
    window.addEventListener('hashchange', showFromHash);

    // ----- Mobile sidebar -----
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('show');
    }

    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', () => sidebar.classList.toggle('show'));
    });

    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    // ----- Table search: <input data-table-search="#tableId"> -----
    document.querySelectorAll('[data-table-search]').forEach(input => {
        input.addEventListener('input', () => filterTable(document.querySelector(input.dataset.tableSearch)));
    });

    // ----- Filter tabs -----
    // data-table="#tableId"      -> filters <tr data-status>
    // data-cards="#containerId"  -> filters direct children with data-status
    document.querySelectorAll('.filter-tabs').forEach(group => {
        group.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyGroup(group);
            });
        });
        applyGroup(group);
    });

    function applyGroup(group) {
        if (group.dataset.table) filterTable(document.querySelector(group.dataset.table));
        if (group.dataset.cards) {
            const active = group.querySelector('button.active');
            const status = active ? active.dataset.filter : 'all';
            document.querySelectorAll(group.dataset.cards + ' > [data-status]').forEach(card => {
                card.style.display = status === 'all' || card.dataset.status === status ? '' : 'none';
            });
        }
    }

    function filterTable(table) {
        if (!table) return;
        const id = '#' + table.id;
        const searchInput = document.querySelector('[data-table-search="' + id + '"]');
        const tabs = document.querySelector('.filter-tabs[data-table="' + id + '"] button.active');
        const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const status = tabs ? tabs.dataset.filter : 'all';

        table.querySelectorAll('tbody tr').forEach(row => {
            const matchText = !term || row.textContent.toLowerCase().includes(term);
            const matchStatus = status === 'all' || row.dataset.status === status;
            row.style.display = matchText && matchStatus ? '' : 'none';
        });
    }

    // ----- Demo toast -----
    const toastEl = document.getElementById('demoToast');
    const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 2500 }) : null;

    window.notify = function (message) {
        if (!toast) return;
        toastEl.querySelector('.toast-body').textContent = message;
        toast.show();
    };

    document.querySelectorAll('form[data-demo]').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const modal = form.closest('.modal');
            if (modal) bootstrap.Modal.getInstance(modal)?.hide();
            notify(form.dataset.demo);
        });
    });

    document.querySelectorAll('[data-notify]').forEach(btn => {
        btn.addEventListener('click', () => notify(btn.dataset.notify));
    });

    // ----- Participate modal: fill plan details from button -----
    const participateModal = document.getElementById('participateModal');
    if (participateModal) {
        participateModal.addEventListener('show.bs.modal', e => {
            const btn = e.relatedTarget;
            if (!btn) return;
            participateModal.querySelector('[data-fill="plan"]').textContent = btn.dataset.plan;
            participateModal.querySelector('[data-fill="investment"]').textContent = btn.dataset.investment;
            participateModal.querySelector('[data-fill="reward"]').textContent = btn.dataset.reward;
            participateModal.querySelector('[data-fill="draw"]').textContent = btn.dataset.draw;
            const odds = participateModal.querySelector('[data-fill="odds"]');
            if (odds) odds.textContent = btn.dataset.odds || '—';
        });
    }

    // ----- Enable Bootstrap tooltips -----
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
})();
