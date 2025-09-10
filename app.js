(() => {
    const STORAGE_KEY = 'big-todo-v1';

    /** @typedef {{id:string, text:string, completed:boolean, created:number}} Todo */
    /** @type {Todo[]} */
    let todos = load();
    let filter = 'all'; // 'all' | 'active' | 'done'

    // DOM
    const $list = document.getElementById('list');
    const $count = document.getElementById('count');
    const $form = document.getElementById('addForm');
    const $input = document.getElementById('newTodo');
    const $filters = document.querySelectorAll('.chip[data-filter]');
    const $clearDone = document.getElementById('clearDone');

    // 初期表示
    render();

    // 追加
    $form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = $input.value.trim();
        if (!text) return;
        addTodo(text);
        $input.value = '';
        $input.focus();
    });

    // フィルタ切替
    $filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filter = btn.dataset.filter;
            $filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
            render();
        });
    });

    // 完了一括削除
    $clearDone.addEventListener('click', () => {
        const before = todos.length;
        todos = todos.filter(t => !t.completed);
        if (todos.length !== before) {
            save();
            render();
        }
    });

    // リスト内のイベント委譲
    $list.addEventListener('click', (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const li = target.closest('li.item');
        if (!li) return;
        const id = li.dataset.id;

        if (target.matches('input.check')) {
            toggle(id);
            return;
        }
        if (target.matches('button[data-action="more"]')) {
            openEditor(li, id);
            return;
        }
        if (target.matches('button[data-action="del"]')) {
            remove(id);
            return;
        }
    });

    // --- CRUD ---
    function addTodo(text) {
        const todo = {
            id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
            text, completed: false, created: Date.now()
        };
        todos.unshift(todo); // 新しいものを上に
        save();
        render();
    }

    function toggle(id) {
        const t = todos.find(t => t.id === id);
        if (!t) return;
        t.completed = !t.completed;
        save();
        render();
    }

    function update(id, newText) {
        const t = todos.find(t => t.id === id);
        if (!t) return;
        t.text = newText;
        save();
        render();
    }

    function remove(id) {
        const before = todos.length;
        todos = todos.filter(t => t.id !== id);
        if (todos.length !== before) {
            save();
            render();
        }
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    // --- 描画 ---
    function render() {
        const filtered = todos.filter(t => {
            if (filter === 'active') return !t.completed;
            if (filter === 'done') return !!t.completed;
            return true;
        });

        const activeCount = todos.filter(t => !t.completed).length;
        $count.textContent = `${activeCount} 件`;

        if (filtered.length === 0) {
            $list.innerHTML = `
        <li class="item" aria-live="polite">
          <div class="check-wrap"></div>
          <div class="text" style="color:var(--muted)">
            タスクはまだありません。上の入力欄から追加してください。
          </div>
          <div class="actions"></div>
        </li>`;
            return;
        }

        const html = filtered.map(t => {
            const created = new Date(t.created);
            const dateStr = created.toLocaleString([], {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            return `
        <li class="item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
          <div class="check-wrap">
            <input class="check" type="checkbox" ${t.completed ? 'checked' : ''} aria-label="完了切替">
          </div>
          <div>
            <div class="text">${escapeHtml(t.text)}</div>
            <div class="meta">作成: ${dateStr}</div>
          </div>
          <div class="actions">
            <button class="icon-btn" data-action="more" aria-label="編集">…</button>
            <button class="icon-btn icon-danger" data-action="del" aria-label="削除">×</button>
          </div>
        </li>
      `;
        }).join('');
        $list.innerHTML = html;
    }

    // --- インライン編集 ---
    function openEditor(li, id) {
        const t = todos.find(t => t.id === id);
        if (!t) return;

        const textDiv = li.querySelector('.text');
        const actions = li.querySelector('.actions');

        const current = textDiv.textContent || '';
        textDiv.innerHTML = `
      <div class="edit-row">
        <input class="edit-input" type="text" value="${escapeAttr(current)}" maxlength="120" aria-label="テキストを編集">
        <button class="edit-save" type="button">保存</button>
        <button class="edit-cancel" type="button">キャンセル</button>
      </div>
    `;
        const input = textDiv.querySelector('.edit-input');
        const saveBtn = textDiv.querySelector('.edit-save');
        const cancelBtn = textDiv.querySelector('.edit-cancel');

        input.focus();
        input.setSelectionRange(current.length, current.length);

        const endEdit = (doSave) => {
            if (doSave) {
                const newText = input.value.trim();
                if (newText && newText !== t.text) update(id, newText);
                else render();
            } else {
                render();
            }
        };

        saveBtn.addEventListener('click', () => endEdit(true));
        cancelBtn.addEventListener('click', () => endEdit(false));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') endEdit(true);
            if (e.key === 'Escape') endEdit(false);
        });

        // 編集中は右端のボタンを無効化
        actions.querySelectorAll('button').forEach(b => b.disabled = true);
    }

    // --- サニタイズ ---
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }
    function escapeAttr(s) { return escapeHtml(s); }
})();
