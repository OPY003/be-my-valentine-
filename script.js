/**
 * Valentine's Day Interactive Page
 * Moving "No" button + Angry cat + Audio + Success celebration
 */

class ValentineApp {
    constructor() {
        // ===== STATE =====
        this.noHoverCount = 0;
        this.noClickCount = 0;
        this.isAngryMode = false;
        this.isAccepted = false;
        this.maxAttemptsBeforeAngry = 10;
        this.angryScreenDuration = 6000;
        this.lastProximityTrigger = 0;
        this.lastTouchTime = 0;
        this.idleInterval = null;
        this.angryTimeouts = [];

        // ===== DOM =====
        this.mainScreen = document.getElementById('mainScreen');
        this.angryScreen = document.getElementById('angryScreen');
        this.successScreen = document.getElementById('successScreen');
        this.yesBtn = document.getElementById('yesBtn');
        this.noBtn = document.getElementById('noBtn');
        this.heartsContainer = document.getElementById('heartsContainer');
        this.catContainer = document.getElementById('catContainer') || this.createCatContainer();
        this.musicToggle = document.getElementById('musicToggle');

        this.noOriginalStyle = {};

        // ===== AUDIO =====
        this.isMuted = false;
        this.audioUnlocked = false;
        this.sounds = {
            welcome: this.createAudio('welcome_theme'),
            angry: this.createAudio('angry_cat_alert'),
            success: this.createAudio('love_success')
        };
        this.setupAudio();

        this.init();
    }

    createAudio(name) {
        const audio = new Audio(`Audio/${name}.mp3.mp3`);
        audio.addEventListener('error', () => {
            if (!audio.src.endsWith(`${name}.mp3`)) {
                audio.src = `Audio/${name}.mp3`;
            }
        }, { once: true });
        return audio;
    }

    setupAudio() {
        this.sounds.welcome.loop = true;
        this.sounds.welcome.volume = 0.35;
        this.sounds.angry.volume = 0.6;
        this.sounds.success.volume = 0.6;

        // Auto unlock audio on first interaction due to browser autoplay policies
        const unlock = () => {
            if (this.audioUnlocked) return;
            this.audioUnlocked = true;
            if (!this.isMuted && !this.isAccepted && !this.isAngryMode) {
                this.playSound('welcome');
            }
            ['click', 'touchstart', 'keydown'].forEach(evt =>
                document.removeEventListener(evt, unlock)
            );
        };

        ['click', 'touchstart', 'keydown'].forEach(evt =>
            document.addEventListener(evt, unlock, { once: true })
        );

        if (this.musicToggle) {
            this.musicToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMute();
            });
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.musicToggle) {
            this.musicToggle.innerText = this.isMuted ? '🔇' : '🎵';
            this.musicToggle.classList.toggle('muted', this.isMuted);
        }

        if (this.isMuted) {
            Object.values(this.sounds).forEach(audio => audio.pause());
        } else {
            this.audioUnlocked = true;
            if (this.isAccepted) {
                this.playSound('success');
            } else if (this.isAngryMode) {
                this.playSound('angry');
            } else {
                this.playSound('welcome');
            }
        }
    }

    playSound(name) {
        if (this.isMuted) return;
        try {
            const sound = this.sounds[name];
            if (sound) {
                sound.currentTime = 0;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Browser prevented autoplay before interaction
                    });
                }
            }
        } catch (_) {}
    }

    stopSound(name) {
        try {
            const sound = this.sounds[name];
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        } catch (_) {}
    }

    createCatContainer() {
        const container = document.createElement('div');
        container.id = 'catContainer';
        container.className = 'cat-container';
        if (this.angryScreen) {
            const wrapper = this.angryScreen.querySelector('.content-wrapper');
            if (wrapper) {
                wrapper.appendChild(container);
            }
        }
        return container;
    }

    init() {
        if (!this.noBtn || !this.yesBtn) return;

        // Cache card wrapper
        this.cardWrapper = this.mainScreen?.querySelector('.content-wrapper') || this.mainScreen;

        // Save original button style
        ['position', 'left', 'top', 'zIndex', 'transform', 'filter', 'display']
            .forEach(p => this.noOriginalStyle[p] = this.noBtn.style[p] || '');

        // Events
        this.yesBtn.addEventListener('click', () => this.handleYes());

        this.noBtn.addEventListener('mouseenter', e => this.handleNoInteraction(e));
        this.noBtn.addEventListener('mouseover', e => this.handleNoInteraction(e));
        this.noBtn.addEventListener('click', e => this.handleNoClick(e));
        this.noBtn.addEventListener('touchstart', e => {
            this.lastTouchTime = Date.now();
            if (e.cancelable) e.preventDefault();
            this.handleNoInteraction(e);
        }, { passive: false });

        document.addEventListener('mousemove', e => this.checkMouseProximity(e));
        window.addEventListener('resize', () => this.updateBoundaries());

        this.noBtn.style.transition =
            'left 0.4s cubic-bezier(0.22, 1, 0.36, 1), top 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease';

        this.updateBoundaries();
        this.startIdleAnimation();
    }

    updateBoundaries() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    }

    startIdleAnimation() {
        let startTime = Date.now();
        this.idleInterval = setInterval(() => {
            if (this.isAngryMode || this.isAccepted) return;
            // Only gently hover if the button has not moved yet
            if (this.noBtn.style.position !== 'absolute') {
                const offset = Math.sin((Date.now() - startTime) / 500) * 3;
                this.noBtn.style.transform = `translateY(${offset}px)`;
            }
        }, 50);
    }

    checkMouseProximity(e) {
        if (this.isAngryMode || this.isAccepted) return;

        const now = Date.now();
        if (now - this.lastProximityTrigger < 300) return; // Prevent excessive rapid firing

        const r = this.noBtn.getBoundingClientRect();
        const d = Math.hypot(
            e.clientX - (r.left + r.width / 2),
            e.clientY - (r.top + r.height / 2)
        );

        // When mouse approaches within 80px, dodge away!
        if (d < 80) {
            this.lastProximityTrigger = now;
            this.handleNoInteraction(e);
        }
    }

    handleNoInteraction(e) {
        if (this.isAngryMode || this.isAccepted) return;
        this.noHoverCount++;
        this.moveNoButton(e);
        this.checkAngryTrigger();
    }

    handleNoClick(e) {
        if (this.isAngryMode || this.isAccepted) return;
        // Ignore synthetic click right after touchstart
        if (Date.now() - this.lastTouchTime < 350) return;

        e.preventDefault();
        e.stopPropagation();
        this.noClickCount++;
        this.moveNoButton(e);
        this.checkAngryTrigger();
    }

    moveNoButton(e) {
        const padding = 16;
        const container = this.cardWrapper || this.mainScreen || document.body;
        const bounds = container.getBoundingClientRect();

        const bw = this.noBtn.offsetWidth || 120;
        const bh = this.noBtn.offsetHeight || 50;

        const minX = bounds.left + padding;
        const minY = bounds.top + padding;
        const maxX = bounds.right - bw - padding;
        const maxY = bounds.bottom - bh - padding;

        const rect = this.noBtn.getBoundingClientRect();
        const prevX = rect.left;
        const prevY = rect.top;

        // Pointer location
        const mx = e?.clientX ?? e?.touches?.[0]?.clientX ?? (bounds.left + bounds.width / 2);
        const my = e?.clientY ?? e?.touches?.[0]?.clientY ?? (bounds.top + bounds.height / 2);

        // Yes Button and Title bounding boxes to avoid overlapping
        const yesRect = this.yesBtn.getBoundingClientRect();
        const titleEl = this.cardWrapper.querySelector('.title');
        const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

        let finalX = minX;
        let finalY = minY;
        let bestDistance = 0;
        let bestX = minX;
        let bestY = minY;

        // Try candidate positions that don't overlap the Yes button or Title
        for (let attempts = 0; attempts < 35; attempts++) {
            const candX = minX + Math.random() * Math.max(10, (maxX - minX));
            const candY = minY + Math.random() * Math.max(10, (maxY - minY));

            const candCenterDist = Math.hypot(candX + bw / 2 - mx, candY + bh / 2 - my);
            const moveDist = Math.hypot(candX - prevX, candY - prevY);

            // Check collision with Yes button (with 12px margin)
            const collidesWithYes = !(
                candX + bw < yesRect.left - 12 ||
                candX > yesRect.right + 12 ||
                candY + bh < yesRect.top - 12 ||
                candY > yesRect.bottom + 12
            );

            // Check collision with Title
            const collidesWithTitle = titleRect && !(
                candX + bw < titleRect.left - 8 ||
                candX > titleRect.right + 8 ||
                candY + bh < titleRect.top - 8 ||
                candY > titleRect.bottom + 8
            );

            if (candCenterDist > bestDistance && !collidesWithYes && !collidesWithTitle) {
                bestDistance = candCenterDist;
                bestX = candX;
                bestY = candY;
            }

            if (!collidesWithYes && !collidesWithTitle && candCenterDist >= 110 && moveDist >= 35) {
                finalX = candX;
                finalY = candY;
                break;
            }

            if (attempts === 34) {
                finalX = bestX;
                finalY = bestY;
            }
        }

        // Apply new position relative to the card container
        this.noBtn.style.position = 'absolute';
        this.noBtn.style.left = `${Math.round(finalX - bounds.left)}px`;
        this.noBtn.style.top = `${Math.round(finalY - bounds.top)}px`;
        this.noBtn.style.zIndex = '1000';
        this.noBtn.style.transform = 'scale(1.04)';

        // Slightly grow the "Yes" button each time No is dodged to make it irresistible!
        const scaleYes = Math.min(1 + (this.noHoverCount + this.noClickCount) * 0.04, 1.35);
        this.yesBtn.style.transform = `scale(${scaleYes})`;
    }

    checkAngryTrigger() {
        const totalAttempts = this.noHoverCount + this.noClickCount;
        if (totalAttempts >= this.maxAttemptsBeforeAngry) {
            this.triggerAngryMode();
        }
    }

    clearAngryTimeouts() {
        this.angryTimeouts.forEach(t => clearTimeout(t));
        this.angryTimeouts = [];
    }

    triggerAngryMode() {
        if (this.isAngryMode || this.isAccepted) return;
        this.isAngryMode = true;

        this.stopSound('welcome');
        this.playSound('angry');

        this.noBtn.style.display = 'none';

        // Shake the screen
        document.body.style.animation = 'screen-shake 0.5s ease';
        const t1 = setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
        this.angryTimeouts.push(t1);

        const t2 = setTimeout(() => {
            if (this.isAccepted) return;
            this.hideScreen(this.mainScreen);
            this.showScreen(this.angryScreen);
            this.loadAngryCat();

            const t3 = setTimeout(() => {
                if (!this.isAccepted) {
                    this.resetFromAngryMode();
                }
            }, this.angryScreenDuration);
            this.angryTimeouts.push(t3);
        }, 200);
        this.angryTimeouts.push(t2);
    }

    resetFromAngryMode() {
        if (this.isAccepted) return;

        this.hideScreen(this.angryScreen);
        this.showScreen(this.mainScreen);

        this.noHoverCount = 0;
        this.noClickCount = 0;
        this.isAngryMode = false;

        // Restore sounds
        this.stopSound('angry');
        if (!this.isAccepted && this.audioUnlocked) {
            this.playSound('welcome');
        }

        // Restore original button styles
        Object.entries(this.noOriginalStyle)
            .forEach(([k, v]) => this.noBtn.style[k] = v);

        // Reset Yes button scale
        this.yesBtn.style.transform = '';
        document.body.style.animation = '';
        this.updateBoundaries();
    }

    loadAngryCat() {
        this.catContainer.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'angry-cat';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.4s ease';

        img.onload = () => {
            img.style.opacity = '1';
        };

        img.onerror = () => {
            this.catContainer.innerHTML = '<div class="cat-placeholder">😾<span>(Cat is angry!)</span></div>';
        };

        img.src = 'images/angry-cat.jpg';
        this.catContainer.appendChild(img);
    }

    handleYes() {
        if (this.isAccepted) return;
        this.isAccepted = true;

        this.clearAngryTimeouts();
        if (this.idleInterval) clearInterval(this.idleInterval);

        // Audio celebration
        this.stopSound('welcome');
        this.stopSound('angry');
        this.playSound('success');

        this.hideScreen(this.mainScreen);
        this.hideScreen(this.angryScreen);
        this.showScreen(this.successScreen);

        this.createHearts();
        this.createConfetti();
    }

    createHearts() {
        const targetContainer = this.heartsContainer || document.body;
        for (let i = 0; i < 45; i++) {
            const h = document.createElement('div');
            h.className = 'floating-heart';
            const heartIcons = ['💖', '💕', '💘', '❤️', '💓', '💗'];
            h.innerText = heartIcons[Math.floor(Math.random() * heartIcons.length)];
            h.style.left = Math.random() * 95 + '%';
            h.style.bottom = '-20px';
            h.style.animationDelay = (Math.random() * 2) + 's';
            h.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 160}px`);

            targetContainer.appendChild(h);
            setTimeout(() => h.remove(), 5500);
        }
    }

    createConfetti() {
        const targetContainer = document.body;
        for (let i = 0; i < 60; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + '%';
            c.style.setProperty('--i', Math.random().toString());
            c.style.setProperty('--confetti-x', `${(Math.random() - 0.5) * 240}px`);
            c.style.animationDelay = (Math.random() * 1.5) + 's';
            c.style.animationDuration = (3.5 + Math.random() * 2) + 's';

            targetContainer.appendChild(c);
            setTimeout(() => c.remove(), 6000);
        }
    }

    showScreen(el) {
        if (!el) return;
        el.classList.remove('hidden');
        requestAnimationFrame(() => {
            el.style.opacity = '1';
        });
    }

    hideScreen(el) {
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
            el.classList.add('hidden');
        }, 400);
    }
}

document.addEventListener('DOMContentLoaded', () => new ValentineApp());
