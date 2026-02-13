(function () {
    'use strict';

    const CONFIG = {
        SELECTORS: {
            TURN: 'article[data-testid^="conversation-turn-"]',
            USER_MESSAGE: '[data-message-author-role="user"]',
            USER_CONTENT: '.whitespace-pre-wrap',
            SCROLL_CONTAINER: '[data-scroll-root]',
        },
        SUMMARY_MAX_LENGTH: 30,
        TOOLTIP_MAX_LENGTH: 150,
        RENAME_MAX_LENGTH: 50,
        DEBOUNCE_DELAY: 200,
        THROTTLE_DELAY: 100,
        TOOLTIP_DELAY: 500,
    };

    const renameMap = {};

    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function throttle(fn, delay) {
        let lastTime = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    }

    function generateId() {
        return 'ca-' + Math.random().toString(36).slice(2, 11);
    }

    function extractText(element, maxLength) {
        const text = element?.textContent?.trim() || '';
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text || '(无内容)';
    }

    class TocManager {
        constructor() {
            this.items = [];
            this.activeItemId = null;
        }

        scan() {
            const turns = document.querySelectorAll(CONFIG.SELECTORS.TURN);
            const items = [];
            let qaIndex = 0;

            for (const turn of turns) {
                const isUser = turn.getAttribute('data-turn') === 'user' || turn.querySelector(CONFIG.SELECTORS.USER_MESSAGE);
                if (!isUser) continue;

                qaIndex += 1;
                const id = turn.getAttribute('data-testid') || generateId();
                const content = turn.querySelector(CONFIG.SELECTORS.USER_CONTENT);
                items.push({
                    id,
                    index: qaIndex,
                    summary: extractText(content, CONFIG.SUMMARY_MAX_LENGTH),
                    fullText: extractText(content, CONFIG.TOOLTIP_MAX_LENGTH),
                    element: turn,
                });
            }

            this.items = items;
            return items;
        }
    }

    class TocPanel {
        constructor(tocManager) {
            this.tocManager = tocManager;
            this.searchTerm = '';
            this.editingItemId = null;
            this.jumpTargetId = null;
            this.isScrolling = false;
            this.layoutWrap = null;
        }

        getDisplayName(item) {
            return renameMap[item.id] || item.summary;
        }

        create() {
            if (document.getElementById('chatanchor-panel')) return;

            this.panel = document.createElement('div');
            this.panel.id = 'chatanchor-panel';
            this.panel.innerHTML = `
              <div class="ca-header">
                <div class="ca-title"><span>对话目录</span></div>
                <div class="ca-header-actions"><button class="ca-btn ca-btn-collapse" title="折叠面板">×</button></div>
              </div>
              <div class="ca-search"><div class="ca-search-wrap"><input type="text" class="ca-search-input" placeholder="搜索消息..."></div></div>
              <div class="ca-list"></div>
            `;

            this.listContainer = this.panel.querySelector('.ca-list');
            this.searchInput = this.panel.querySelector('.ca-search-input');

            const main = document.querySelector('main');
            if (main?.parentElement) {
                const existingWrap = document.getElementById('chatanchor-layout-wrap');
                this.layoutWrap = existingWrap || document.createElement('div');
                this.layoutWrap.id = 'chatanchor-layout-wrap';

                if (!existingWrap) {
                    main.parentElement.insertBefore(this.layoutWrap, main);
                    this.layoutWrap.appendChild(main);
                }

                this.layoutWrap.appendChild(this.panel);
            } else {
                document.body.appendChild(this.panel);
            }

            this.bindEvents();
        }

        bindEvents() {
            this.panel.querySelector('.ca-btn-collapse').addEventListener('click', () => {
                this.panel.classList.toggle('ca-collapsed');
            });

            this.searchInput.addEventListener('input', debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.render();
            }, CONFIG.DEBOUNCE_DELAY));

            this.listContainer.addEventListener('mousedown', (e) => {
                const item = e.target.closest('.ca-item');
                if (!item || e.target.closest('.ca-item-rename-btn') || e.target.closest('.ca-rename-input')) return;
                this.scrollToItem(item.dataset.id);
            });

            this.listContainer.addEventListener('click', (e) => {
                const renameBtn = e.target.closest('.ca-item-rename-btn');
                if (!renameBtn) return;
                const item = e.target.closest('.ca-item');
                if (!item) return;
                this.editingItemId = item.dataset.id;
                this.render();
            });

            this.listContainer.addEventListener('keydown', (e) => {
                if (!e.target.classList.contains('ca-rename-input')) return;
                if (e.key === 'Enter') {
                    const id = this.editingItemId;
                    if (id) renameMap[id] = e.target.value.trim().slice(0, CONFIG.RENAME_MAX_LENGTH);
                    this.editingItemId = null;
                    this.render();
                }
                if (e.key === 'Escape') {
                    this.editingItemId = null;
                    this.render();
                }
            });
        }

        render() {
            const activeId = this.tocManager.activeItemId;
            const items = this.tocManager.items.filter((item) => {
                if (!this.searchTerm) return true;
                const displayName = this.getDisplayName(item).toLowerCase();
                return displayName.includes(this.searchTerm) || item.summary.toLowerCase().includes(this.searchTerm);
            });

            this.listContainer.innerHTML = items.map((item) => {
                const isEditing = item.id === this.editingItemId;
                const displayName = this.getDisplayName(item);
                if (isEditing) {
                    return `<div class="ca-item ca-item-editing" data-id="${item.id}"><input class="ca-rename-input" maxlength="${CONFIG.RENAME_MAX_LENGTH}" value="${this.escape(displayName)}"></div>`;
                }
                return `<div class="ca-item ${item.id === activeId ? 'ca-item-active' : ''}" data-id="${item.id}" data-fulltext="${this.escape(item.fullText)}"><span class="ca-item-indicator ${item.id === this.jumpTargetId ? 'ca-indicator-active' : ''}"></span><span class="ca-item-type ca-type-user">Q${item.index}</span><span class="ca-item-summary">${this.escape(displayName)}</span><button class="ca-item-rename-btn" title="重命名">✎</button></div>`;
            }).join('') || '<div class="ca-empty">暂无消息</div>';
        }

        scrollToItem(id) {
            const item = this.tocManager.items.find((i) => i.id === id);
            if (!item?.element) return;
            const scrollContainer = document.querySelector(CONFIG.SELECTORS.SCROLL_CONTAINER);
            this.jumpTargetId = id;
            this.tocManager.activeItemId = id;
            this.render();

            if (!scrollContainer) {
                item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            this.isScrolling = true;
            const rect = item.element.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const targetTop = scrollContainer.scrollTop + rect.top - containerRect.top + 20;
            scrollContainer.scrollTo({ top: targetTop, behavior: 'smooth' });
            setTimeout(() => { this.isScrolling = false; }, 500);
        }

        updateActiveByScroll() {
            if (this.isScrolling) return;
            let active = null;
            for (const item of this.tocManager.items) {
                const rect = item.element.getBoundingClientRect();
                if (rect.top <= 150) active = item;
                else break;
            }
            if (active && this.tocManager.activeItemId !== active.id) {
                this.tocManager.activeItemId = active.id;
                this.render();
            }
        }

        escape(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }

        refresh() {
            this.tocManager.scan();
            this.render();
        }
    }

    class NavigatorApp {
        constructor() {
            this.tocManager = new TocManager();
            this.tocPanel = new TocPanel(this.tocManager);
        }

        init() {
            const setup = () => setTimeout(() => {
                this.tocPanel.create();
                this.tocPanel.refresh();
                this.observe();
                this.listenScroll();
            }, 800);
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
            else setup();
        }

        observe() {
            this.observer = new MutationObserver(debounce(() => this.tocPanel.refresh(), CONFIG.DEBOUNCE_DELAY * 2));
            this.observer.observe(document.body, { childList: true, subtree: true });
        }

        listenScroll() {
            const scrollContainer = document.querySelector(CONFIG.SELECTORS.SCROLL_CONTAINER) || window;
            const handler = throttle(() => this.tocPanel.updateActiveByScroll(), CONFIG.THROTTLE_DELAY);
            scrollContainer.addEventListener('scroll', handler, { passive: true });
        }
    }

    new NavigatorApp().init();
})();
