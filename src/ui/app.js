// State
const state = {
    chapters: [],
    currentChapter: null,
    cards: [],
    currentIndex: 0,
    isFlipped: false
};

// Utils
const $ = (selector) => document.querySelector(selector);

// Router
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

async function handleRoute() {
    const hash = window.location.hash;
    const app = $('#app');

    if (!hash || hash === '#/') {
        renderHome();
    } else if (hash.startsWith('#/chapter/')) {
        const slug = hash.replace('#/chapter/', '');
        await renderChapter(slug);
    } else {
        window.location.hash = '#/';
    }
}

// Views
async function renderHome() {
    const app = $('#app');
    const template = $('#home-template').content.cloneNode(true);
    app.innerHTML = '';
    app.appendChild(template);

    try {
        if (state.chapters.length === 0) {
            const res = await fetch('/data/chapters.json');
            state.chapters = await res.json();
        }

        const list = $('#chapter-list');
        state.chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.className = 'chapter-item';
            li.innerHTML = `
                <span class="chapter-title">${chapter.title}</span>
                <span class="chapter-count">${chapter.count} cards</span>
            `;
            li.onclick = () => window.location.hash = `#/chapter/${chapter.slug}`;
            list.appendChild(li);
        });
    } catch (e) {
        console.error('Failed to load chapters', e);
        $('#chapter-list').innerHTML = '<li>Error loading chapters. Please try again.</li>';
    }
}

async function renderChapter(slug) {
    const app = $('#app');
    const template = $('#study-template').content.cloneNode(true);
    app.innerHTML = '';
    app.appendChild(template);

    // Reset state for new chapter
    state.currentChapter = state.chapters.find(c => c.slug === slug);
    state.isFlipped = false;

    // Load progress
    const savedIndex = parseInt(localStorage.getItem(`progress_${slug}`) || '0');
    state.currentIndex = savedIndex;

    // Set Header
    if (state.currentChapter) {
        $('#chapter-title').textContent = state.currentChapter.title;
    }

    // Bind Controls
    $('#back-btn').onclick = () => window.location.hash = '#/';
    $('#prev-btn').onclick = prevCard;
    $('#next-btn').onclick = nextCard;
    $('#flashcard').onclick = (e) => {
        // Prevent flip if clicking explain button
        if (!e.target.closest('.explain-btn')) {
            flipCard();
        }
    };
    $('#explain-btn').onclick = explainCard;

    // Keyboard support
    document.onkeydown = (e) => {
        if (window.location.hash.startsWith('#/chapter/')) {
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === ' ' || e.key === 'Enter') flipCard();
        }
    };

    // Touch support (Swipe)
    let touchStartX = 0;
    const cardContainer = $('.study-main'); // Capture swipes on the main area

    cardContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    cardContainer.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        handleSwipe(touchStartX, touchEndX);
    }, { passive: true });

    try {
        const res = await fetch(`/data/${slug}.json`);
        state.cards = await res.json();

        // Validate index
        if (state.currentIndex >= state.cards.length) state.currentIndex = 0;

        updateCard();
    } catch (e) {
        console.error('Failed to load cards', e);
        alert('Failed to load cards.');
    }
}

function handleSwipe(startX, endX) {
    const threshold = 50;
    if (endX < startX - threshold) nextCard();
    if (endX > startX + threshold) prevCard();
}

// Logic
function updateCard() {
    if (!state.cards.length) return;

    const card = state.cards[state.currentIndex];
    const flashcard = $('#flashcard');

    // Reset flip state with no animation for instant content change
    flashcard.style.transition = 'none';
    flashcard.classList.remove('is-flipped');
    state.isFlipped = false;

    // Force reflow
    flashcard.offsetHeight;

    // Restore transition
    flashcard.style.transition = '';

    const frontEl = $('#card-front-content');
    const backEl = $('#card-back-content');

    frontEl.textContent = card.front;
    backEl.textContent = card.back;

    // Render LaTeX if KaTeX is loaded
    if (window.renderMathInElement) {
        const options = {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        };
        renderMathInElement(frontEl, options);
        renderMathInElement(backEl, options);
    }

    const total = state.cards.length;
    $('#progress-display').textContent = `${state.currentIndex + 1} / ${total}`;

    // Save progress
    if (state.currentChapter) {
        localStorage.setItem(`progress_${state.currentChapter.slug}`, state.currentIndex);
    }
}

function flipCard() {
    state.isFlipped = !state.isFlipped;
    $('#flashcard').classList.toggle('is-flipped', state.isFlipped);
}

function nextCard() {
    if (state.currentIndex < state.cards.length - 1) {
        state.currentIndex++;
        updateCard();
    } else {
        // Loop or stop? Let's loop for smoother UX or stop.
        // Requirement says "Next", usually stops at end or loops.
        // Let's stop at end to indicate completion.
        showToast("End of chapter");
    }
}

function prevCard() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        updateCard();
    }
}

function explainCard() {
    const card = state.cards[state.currentIndex];
    const text = `我正在基于来源材料复习一组 flashcards，想就其中一张进一步加深理解。
该卡片的正面问题是：「${card.front}」
该卡片的背面答案是：「${card.back}」
请围绕这个主题做更详细的讲解，要求：
1. 用清晰的逻辑结构解释答案背后的原因与机制（尽量贴合来源材料的表述）。
2. 给出关键术语/概念的简明定义，并指出它们之间的联系。
3. 补充1–2个典型例子帮助理解（可结合常见材料或工程场景）。
4. 最后用3–5条要点总结，便于记忆与复习。
请用中文回答。`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("已复制 Explain 提示词");
    }).catch(err => {
        console.error('Copy failed', err);
        showToast("复制失败");
    });
}

function showToast(msg) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Init
window.addEventListener('DOMContentLoaded', initRouter);
