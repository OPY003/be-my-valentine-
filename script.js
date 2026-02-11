/**
 * Valentine's Day Interactive Page
 * Moving "No" button + Angry cat + Success celebration
 */

class ValentineApp {
    constructor() {
        // ===== STATE =====
        this.noHoverCount = 0;
        this.noClickCount = 0;
        this.isAngryMode = false;
        this.maxAttemptsBeforeAngry = 10;
        this.angryScreenDuration = 6000;

        // ===== DOM =====
        this.mainScreen = document.getElementById('mainScreen');
        this.angryScreen = document.getElementById('angryScreen');
        this.successScreen = document.getElementById('successScreen');
        this.yesBtn = document.getElementById('yesBtn');
        this.noBtn = document.getElementById('noBtn');
        this.heartsContainer = document.getElementById('heartsContainer');
        this.catContainer = document.getElementById('catContainer') || this.createCatContainer();

        this.noOriginalStyle = {};
        this.init();
    }

    createCatContainer() {
        const container = document.createElement('div');
        container.id = 'catContainer';
        const angryScreen = document.getElementById('angryScreen');
        if (angryScreen) {
            const wrapper = angryScreen.querySelector('.content-wrapper');
            if (wrapper) {
                wrapper.appendChild(container);
            }
        }
        return container;
    }

    init() {
        if (!this.noBtn || !this.yesBtn) return;

        // Cache main card container so the button stays inside it
        this.cardWrapper = this.mainScreen?.querySelector('.content-wrapper') || this.mainScreen;

        // Save original button style
        ['position','left','top','zIndex','transform','filter','display']
            .forEach(p => this.noOriginalStyle[p] = this.noBtn.style[p] || '');

        // Events
        this.yesBtn.addEventListener('click', () => this.handleYes());
        this.noBtn.addEventListener('mouseenter', e => this.handleNoInteraction(e));
        this.noBtn.addEventListener('mouseover', e => this.handleNoInteraction(e));
        this.noBtn.addEventListener('click', e => this.handleNoClick(e));
        this.noBtn.addEventListener('touchstart', e => this.handleNoInteraction(e), { passive: true });

        document.addEventListener('mousemove', e => this.checkMouseProximity(e));
        window.addEventListener('resize', () => this.updateBoundaries());

        this.noBtn.style.transition =
            'left 0.45s cubic-bezier(0.22,1,0.36,1), top 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.2s ease';

        this.updateBoundaries();
        this.startIdleAnimation();
    }

    updateBoundaries() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    }

    startIdleAnimation() {
        setInterval(() => {
            if (!this.isAngryMode && this.noBtn.style.position !== 'fixed') {
                this.noBtn.style.transform =
                    `translateY(${Math.sin(Date.now()/500)*3}px)`;
            }
        }, 50);
    }

    checkMouseProximity(e) {
        if (this.isAngryMode) return;

        const r = this.noBtn.getBoundingClientRect();
        const d = Math.hypot(
            e.clientX - (r.left + r.width/2),
            e.clientY - (r.top + r.height/2)
        );

        if (d < 100 && d > 50) this.handleNoInteraction(e);
    }

    handleNoInteraction(e) {
        if (this.isAngryMode) return;
        this.noHoverCount++;
        this.moveNoButton(e);
        this.checkAngryTrigger();
    }

    handleNoClick(e) {
        if (this.isAngryMode) return;
        e.preventDefault();
        e.stopPropagation();
        this.noClickCount++;
        this.moveNoButton(e);
        this.checkAngryTrigger();
    }

    moveNoButton(e) {
        const padding = 20;
        const container = this.cardWrapper || this.mainScreen || document.body;
        const bounds = container.getBoundingClientRect();

        const bw = this.noBtn.offsetWidth || 130;
        const bh = this.noBtn.offsetHeight || 60;

        const minX = bounds.left + padding;
        const minY = bounds.top + padding;
        const maxX = bounds.right - bw - padding;
        const maxY = bounds.bottom - bh - padding;

        const rect = this.noBtn.getBoundingClientRect();
        const prevX = rect.left;
        const prevY = rect.top;

        // Current pointer position (fallback to center of card if missing)
        const mx = e?.clientX ?? e?.touches?.[0]?.clientX ?? (bounds.left + bounds.width / 2);
        const my = e?.clientY ?? e?.touches?.[0]?.clientY ?? (bounds.top + bounds.height / 2);

        let finalX, finalY;
        let attempts = 0;

        // Try to find a random spot that is:
        // - inside the card
        // - not too close to the cursor
        // - not almost the same as the previous position
        do {
            finalX = minX + Math.random() * Math.max(10, (maxX - minX));
            finalY = minY + Math.random() * Math.max(10, (maxY - minY));
            attempts++;
        } while (
            attempts < 25 &&
            (
                Math.hypot(finalX + bw/2 - mx, finalY + bh/2 - my) < 120 ||
                Math.hypot(finalX - prevX, finalY - prevY) < 30
            )
        );

        // Position relative to the card/container
        this.noBtn.style.position = 'absolute';
        this.noBtn.style.left = `${finalX - bounds.left}px`;
        this.noBtn.style.top = `${finalY - bounds.top}px`;
        this.noBtn.style.zIndex = '1000';
        this.noBtn.style.transform = `scale(1.05)`;
    }

checkAngryTrigger() {
    const totalAttempts = this.noHoverCount + this.noClickCount;

    if (totalAttempts >= this.maxAttemptsBeforeAngry) {
        this.triggerAngryMode();
    }
}

    triggerAngryMode() {
        if (this.isAngryMode) return;
        this.isAngryMode = true;

        this.noBtn.style.display = 'none';
        // document.body.style.animation = 'screen-shake 0.5s ease';

        setTimeout(() => {
            this.hideScreen(this.mainScreen);
            this.showScreen(this.angryScreen);
            setTimeout(() => this.loadAngryCat(), 400);
            setTimeout(() => this.resetFromAngryMode(), this.angryScreenDuration);
        }, 200);
    }

    resetFromAngryMode() {
        this.angryScreen.style.opacity = '0';

        setTimeout(() => {
            this.hideScreen(this.angryScreen);
            this.showScreen(this.mainScreen);

            this.noHoverCount = 0;
            this.noClickCount = 0;
            this.isAngryMode = false;

            Object.entries(this.noOriginalStyle)
                .forEach(([k,v]) => this.noBtn.style[k] = v);

            document.body.style.animation = '';
            this.updateBoundaries();
        }, 400);
    }

    loadAngryCat() {
        this.catContainer.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'angry-cat';
        img.style.opacity = '0';
        img.style.transition = 'opacity 2s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            console.error("Failed to load angry cat image");
            this.catContainer.innerText = "😾 (Image Error)";
        };

        img.src = 'images/angry-cat.jpg';
        this.catContainer.appendChild(img);
    }

    handleYes() {
        this.hideScreen(this.mainScreen);
        this.showScreen(this.successScreen);
        this.createHearts();
    }

    createHearts() {
        for (let i = 0; i < 40; i++) {
            const h = document.createElement('div');
            h.className = 'floating-heart';
            h.innerText = '💖';
            h.style.left = Math.random()*100 + '%';
            h.style.bottom = '0';
            document.body.appendChild(h);
            setTimeout(() => h.remove(), 3000);
        }
    }

    showScreen(el) {
        el.classList.remove('hidden');
        requestAnimationFrame(() => el.style.opacity = '1');
    }

    hideScreen(el) {
        el.style.opacity = '0';
        setTimeout(() => el.classList.add('hidden'), 400);
    }
}

document.addEventListener('DOMContentLoaded', () => new ValentineApp());
