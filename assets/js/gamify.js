/* =========================================================
   LotteryHub - Engagement scripts (static demo)
   Load after panel.js (uses window.notify).
   - Live countdowns          [data-countdown]
   - Confetti + celebration   window.celebrate()
   - Claim buttons            [data-claim]
   - Lucky wheel              #luckyWheel
   - Scratch card             .scratch-card
   - Mystery box              .mystery-box
   - Ticket reveal            [data-reveal]
   - Live draw                [data-draw-stage]
   - Trivia / memory / reaction mini-games
   - Avatar builder, copy/share, ticket builder
   - Reality-check reminder + surprise drop
   All results here are demo-only; on the real platform the
   server decides every outcome and the page only animates it.
   ========================================================= */
(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const say = msg => window.notify && window.notify(msg);
    const pad = n => String(n).padStart(2, '0');

    // ----- Countdowns -----
    // data-countdown="93600" (seconds from now) or an ISO date.
    // Children with data-cd="d|h|m|s" are filled; otherwise text is replaced.
    const countdowns = [...document.querySelectorAll('[data-countdown]')].map(el => {
        const v = el.dataset.countdown;
        const end = /^\d+$/.test(v) ? Date.now() + Number(v) * 1000 : new Date(v).getTime();
        return { el, end };
    });

    function tickCountdowns() {
        countdowns.forEach(({ el, end }) => {
            let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
            const d = Math.floor(s / 86400); s %= 86400;
            const h = Math.floor(s / 3600); s %= 3600;
            const m = Math.floor(s / 60); s %= 60;
            const parts = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
            const slots = el.querySelectorAll('[data-cd]');
            if (slots.length) {
                slots.forEach(slot => { slot.textContent = parts[slot.dataset.cd]; });
            } else {
                el.textContent = (d ? d + 'd ' : '') + parts.h + 'h ' + parts.m + 'm ' + parts.s + 's';
            }
        });
    }

    if (countdowns.length) {
        tickCountdowns();
        setInterval(tickCountdowns, 1000);
    }

    // ----- Confetti -----
    let confettiCanvas, confettiCtx, particles = [], confettiRunning = false;

    function confetti(count) {
        if (reduceMotion) return;
        if (!confettiCanvas) {
            confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confettiCanvas';
            document.body.appendChild(confettiCanvas);
            confettiCtx = confettiCanvas.getContext('2d');
        }
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        const colors = ['#FF9900', '#232F3E', '#ffc266', '#198754', '#6f42c1', '#0d6efd', '#dc3545'];
        for (let i = 0; i < (count || 160); i++) {
            particles.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                y: window.innerHeight * 0.35,
                vx: (Math.random() - 0.5) * 16,
                vy: Math.random() * -14 - 4,
                size: Math.random() * 7 + 4,
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0
            });
        }
        if (!confettiRunning) {
            confettiRunning = true;
            requestAnimationFrame(drawConfetti);
        }
    }

    function drawConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        particles.forEach(p => {
            p.vy += 0.35;
            p.vx *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.life++;
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rot * Math.PI / 180);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            confettiCtx.restore();
        });
        particles = particles.filter(p => p.y < confettiCanvas.height + 20 && p.life < 400);
        if (particles.length) {
            requestAnimationFrame(drawConfetti);
        } else {
            confettiRunning = false;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    let popTimer;
    window.celebrate = function (title, text, icon) {
        confetti();
        document.querySelectorAll('.celebrate-pop').forEach(el => el.remove());
        const pop = document.createElement('div');
        pop.className = 'celebrate-pop';
        pop.setAttribute('role', 'status');
        pop.innerHTML = '<i class="fas ' + (icon || 'fa-trophy') + '"></i><h4></h4><div class="text-muted small"></div>';
        pop.querySelector('h4').textContent = title || 'Congratulations!';
        pop.querySelector('div').textContent = text || '';
        pop.addEventListener('click', () => pop.remove());
        document.body.appendChild(pop);
        clearTimeout(popTimer);
        popTimer = setTimeout(() => pop.remove(), 2800);
    };

    document.querySelectorAll('[data-celebrate]').forEach(btn => {
        btn.addEventListener('click', () => celebrate(btn.dataset.celebrate, btn.dataset.celebrateText, btn.dataset.celebrateIcon));
    });

    // ----- Claim buttons -----
    // <button data-claim="+20 Points added" data-claim-title="Day 5 claimed" data-claim-target="#day5">
    document.querySelectorAll('[data-claim]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            btn.disabled = true;
            btn.classList.remove('btn-orange');
            btn.classList.add('btn-outline-success');
            btn.innerHTML = '<i class="fas fa-check me-1"></i>Claimed';
            const target = btn.dataset.claimTarget && document.querySelector(btn.dataset.claimTarget);
            if (target) {
                target.classList.remove('today');
                target.classList.add('claimed');
            }
            const row = btn.closest('.mission');
            if (row) row.classList.add('done');
            celebrate(btn.dataset.claimTitle || 'Reward claimed!', btn.dataset.claim, 'fa-gift');
        });
    });

    // ----- Lucky wheel -----
    const wheel = document.getElementById('luckyWheel');
    if (wheel) {
        const segments = JSON.parse(wheel.dataset.segments);
        const slice = 360 / segments.length;
        wheel.style.background = 'conic-gradient(' + segments.map((s, i) =>
            s.color + ' ' + (i * slice) + 'deg ' + ((i + 1) * slice) + 'deg').join(',') + ')';
        segments.forEach((s, i) => {
            const label = document.createElement('div');
            label.className = 'seg-label';
            label.textContent = s.label;
            label.style.transform = 'rotate(' + (i * slice + slice / 2 - 90) + 'deg)';
            wheel.appendChild(label);
        });

        let rotation = 0;
        const spinBtn = document.getElementById('spinBtn');
        const result = document.getElementById('wheelResult');

        spinBtn.addEventListener('click', () => {
            spinBtn.disabled = true;
            // Weighted pick (the real platform picks server-side and sends the index).
            const total = segments.reduce((sum, s) => sum + s.w, 0);
            let r = Math.random() * total, index = 0;
            while (r > segments[index].w) { r -= segments[index].w; index++; }

            const mid = index * slice + slice / 2;
            const jitter = (Math.random() - 0.5) * (slice - 10);
            rotation += 360 * 6 + (360 - ((rotation + mid + jitter) % 360));
            wheel.style.transform = 'rotate(' + rotation + 'deg)';

            setTimeout(() => {
                const prize = segments[index].label;
                result.innerHTML = 'You won <strong style="color: var(--primary-orange);"></strong>';
                result.querySelector('strong').textContent = prize;
                spinBtn.innerHTML = '<i class="fas fa-clock me-1"></i>Next free spin tomorrow';
                celebrate('You won ' + prize + '!', 'Added to your rewards. Free spins never cost money.', 'fa-dharmachakra');
            }, reduceMotion ? 100 : 5100);
        });
    }

    // ----- Scratch cards -----
    document.querySelectorAll('.scratch-card').forEach(card => {
        const canvas = card.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        let drawing = false, moves = 0, done = false;

        function paint() {
            const ratio = window.devicePixelRatio || 1;
            canvas.width = card.clientWidth * ratio;
            canvas.height = card.clientHeight * ratio;
            ctx.scale(ratio, ratio);
            const g = ctx.createLinearGradient(0, 0, card.clientWidth, card.clientHeight);
            g.addColorStop(0, '#b8bfc7');
            g.addColorStop(0.5, '#e3e7ea');
            g.addColorStop(1, '#9aa3ae');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, card.clientWidth, card.clientHeight);
            ctx.fillStyle = '#5a6677';
            ctx.font = 'bold 16px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SCRATCH HERE', card.clientWidth / 2, card.clientHeight / 2 + 6);
            ctx.globalCompositeOperation = 'destination-out';
        }

        function scratch(e) {
            if (!drawing || done) return;
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 20, 0, Math.PI * 2);
            ctx.fill();
            if (++moves % 12 === 0) checkCleared();
        }

        function checkCleared() {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let clear = 0, total = 0;
            for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] === 0) clear++; }
            if (clear / total > 0.45) reveal();
        }

        function reveal() {
            done = true;
            canvas.style.opacity = '0';
            setTimeout(() => canvas.remove(), 500);
            celebrate(card.dataset.prize || 'Prize revealed!', 'Scratch cards are earned, never bought.', 'fa-ticket');
        }

        // Pages start hidden (size 0), so paint the first time the card gets a real size.
        let painted = false;
        new ResizeObserver(() => {
            if (!painted && !done && card.clientWidth > 0) {
                painted = true;
                paint();
            }
        }).observe(card);
        canvas.addEventListener('pointerdown', e => { drawing = true; canvas.setPointerCapture(e.pointerId); scratch(e); });
        canvas.addEventListener('pointermove', scratch);
        canvas.addEventListener('pointerup', () => { drawing = false; });
        const revealBtn = document.querySelector('[data-reveal-scratch="#' + card.id + '"]');
        if (revealBtn) revealBtn.addEventListener('click', () => { if (!done) reveal(); revealBtn.disabled = true; });
    });

    // ----- Mystery boxes -----
    document.querySelectorAll('.mystery-box').forEach(box => {
        box.addEventListener('click', () => {
            if (box.classList.contains('locked') || box.classList.contains('opened')) return;
            box.classList.add('shake', 'opened');
            const rewards = box.dataset.rewards.split('|');
            const prize = rewards[Math.floor(Math.random() * rewards.length)];
            setTimeout(() => {
                box.classList.remove('shake');
                box.classList.add('open');
                const out = document.querySelector(box.dataset.output);
                if (out) {
                    out.textContent = prize;
                    out.classList.add('show');
                }
                celebrate(prize, 'Mystery box opened', 'fa-box-open');
            }, reduceMotion ? 50 : 1000);
        });
    });

    // ----- Ticket number reveal -----
    // <div class="ticket-number" id="tn1" data-number="482719"></div> + <button data-reveal="#tn1">
    document.querySelectorAll('.ticket-number[data-number]').forEach(box => {
        box.innerHTML = box.dataset.number.split('').map(ch =>
            ch === '-' ? '<span class="sep">-</span>' : '<span class="digit">?</span>').join('');
        if (box.dataset.revealed !== undefined) revealTicket(box, true);
    });

    function revealTicket(box, instant) {
        const digits = [...box.querySelectorAll('.digit')];
        const target = box.dataset.number.replace(/-/g, '').split('');
        if (instant || reduceMotion) {
            digits.forEach((d, i) => { d.textContent = target[i]; });
            return;
        }
        digits.forEach((d, i) => {
            d.classList.add('rolling');
            const roll = setInterval(() => { d.textContent = Math.floor(Math.random() * 10); }, 60);
            setTimeout(() => {
                clearInterval(roll);
                d.classList.remove('rolling');
                d.classList.add('settled');
                d.textContent = target[i];
            }, 600 + i * 350);
        });
    }

    document.querySelectorAll('[data-reveal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const box = document.querySelector(btn.dataset.reveal);
            if (!box) return;
            btn.disabled = true;
            revealTicket(box);
            const count = box.querySelectorAll('.digit').length;
            setTimeout(() => { confetti(80); say('Ticket ' + box.dataset.number + ' is registered for the draw.'); }, reduceMotion ? 0 : 700 + count * 350);
        });
    });

    // ----- Live draw -----
    // <div data-draw-stage data-winners='[{"ticket":"418273","name":"A** R***","prize":"Rs. 5,000"}]'>
    document.querySelectorAll('[data-draw-stage]').forEach(stage => {
        const winners = JSON.parse(stage.dataset.winners);
        const reels = [...stage.querySelectorAll('.reel')];
        const btn = stage.querySelector('[data-start-draw]');
        const winnerBox = stage.querySelector('.draw-winner');
        const log = document.querySelector(stage.dataset.log);
        const counter = stage.querySelector('[data-draw-count]');
        let next = 0;

        btn.addEventListener('click', () => {
            if (next >= winners.length) return;
            const w = winners[next];
            btn.disabled = true;
            winnerBox.classList.remove('show');
            winnerBox.innerHTML = '<div class="small" style="color:#b0b0b0;">Drawing winner ' + (next + 1) + ' of ' + winners.length + '…</div>';
            reels.forEach(r => { r.classList.remove('stopped'); r.classList.add('rolling'); });
            const timers = reels.map(r => setInterval(() => { r.textContent = Math.floor(Math.random() * 10); }, 70));
            const step = reduceMotion ? 50 : 550;

            reels.forEach((r, i) => {
                setTimeout(() => {
                    clearInterval(timers[i]);
                    r.classList.remove('rolling');
                    r.classList.add('stopped');
                    r.textContent = w.ticket[i];
                    if (i === reels.length - 1) {
                        winnerBox.innerHTML = '<div class="small" style="color:#b0b0b0;">Ticket #' + w.ticket + '</div><div class="w-name"></div><div class="small">wins <strong style="color:#fff;"></strong></div>';
                        winnerBox.querySelector('.w-name').textContent = w.name;
                        winnerBox.querySelector('strong').textContent = w.prize;
                        winnerBox.classList.add('show');
                        confetti(120);
                        if (log) {
                            log.querySelectorAll('.placeholder-row').forEach(el => el.remove());
                            const li = document.createElement('li');
                            li.innerHTML = '<span class="mono"></span><span class="flex-grow-1"></span><strong style="color:var(--green);"></strong>';
                            li.children[0].textContent = '#' + w.ticket;
                            li.children[1].textContent = w.name;
                            li.children[2].textContent = w.prize;
                            log.prepend(li);
                        }
                        next++;
                        if (counter) counter.textContent = next;
                        btn.disabled = next >= winners.length;
                        btn.innerHTML = next >= winners.length
                            ? '<i class="fas fa-flag-checkered me-1"></i>Draw complete'
                            : '<i class="fas fa-play me-1"></i>Draw next winner';
                    }
                }, 1200 + i * step);
            });
        });
    });

    // ----- Trivia -----
    const trivia = document.getElementById('triviaGame');
    if (trivia) {
        const questions = [
            { q: 'What is the capital of Pakistan?', a: ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'], c: 2 },
            { q: 'How many players are on a cricket team on the field?', a: ['9', '10', '11', '12'], c: 2 },
            { q: 'Which is the highest mountain in Pakistan?', a: ['Nanga Parbat', 'K2', 'Rakaposhi', 'Tirich Mir'], c: 1 },
            { q: 'In which year did Pakistan win the Cricket World Cup?', a: ['1987', '1992', '1996', '1999'], c: 1 },
            { q: 'Which river is the longest in Pakistan?', a: ['Jhelum', 'Chenab', 'Ravi', 'Indus'], c: 3 }
        ];
        const qEl = trivia.querySelector('.trivia-q');
        const optsEl = trivia.querySelector('.trivia-opts');
        const bar = trivia.querySelector('.timer-bar span');
        const progress = trivia.querySelector('[data-trivia-progress]');
        const scoreEl = trivia.querySelector('[data-trivia-score]');
        const startBtn = trivia.querySelector('[data-trivia-start]');
        let idx, score, timer, left;

        function start() {
            idx = 0; score = 0;
            startBtn.classList.add('d-none');
            show();
        }

        function show() {
            if (idx >= questions.length) return finish();
            const item = questions[idx];
            progress.textContent = 'Question ' + (idx + 1) + ' / ' + questions.length;
            scoreEl.textContent = score;
            qEl.textContent = item.q;
            optsEl.innerHTML = '';
            item.a.forEach((text, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'trivia-opt';
                b.textContent = String.fromCharCode(65 + i) + '.  ' + text;
                b.addEventListener('click', () => answer(i));
                optsEl.appendChild(b);
            });
            left = 150;
            bar.style.width = '100%';
            clearInterval(timer);
            timer = setInterval(() => {
                left--;
                bar.style.width = (left / 1.5) + '%';
                if (left <= 0) answer(-1);
            }, 100);
        }

        function answer(i) {
            clearInterval(timer);
            const item = questions[idx];
            const buttons = optsEl.querySelectorAll('button');
            buttons.forEach(b => { b.disabled = true; });
            buttons[item.c].classList.add('correct');
            if (i === item.c) score += 10 + Math.ceil(left / 15);
            else if (i >= 0) buttons[i].classList.add('wrong');
            scoreEl.textContent = score;
            idx++;
            setTimeout(show, 900);
        }

        function finish() {
            progress.textContent = 'Finished!';
            qEl.textContent = 'You scored ' + score + ' points.';
            optsEl.innerHTML = '<p class="text-muted small mb-0">Score is based on correct answers and speed. Points are non-cash and non-withdrawable.</p>';
            bar.style.width = '0';
            startBtn.textContent = 'Play again';
            startBtn.classList.remove('d-none');
            if (score > 0) celebrate(score + ' Points earned', 'Daily Trivia complete', 'fa-brain');
        }

        startBtn.addEventListener('click', start);
    }

    // ----- Memory match -----
    const memory = document.getElementById('memoryGame');
    if (memory) {
        const icons = ['fa-star', 'fa-moon', 'fa-gem', 'fa-crown', 'fa-heart', 'fa-bolt', 'fa-leaf', 'fa-trophy'];
        const movesEl = document.querySelector('[data-memory-moves]');
        let open = [], moves = 0, matched = 0, lock = false;

        function build() {
            const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
            memory.innerHTML = '';
            open = []; moves = 0; matched = 0; lock = false;
            if (movesEl) movesEl.textContent = 0;
            deck.forEach(icon => {
                const tile = document.createElement('button');
                tile.type = 'button';
                tile.className = 'memory-tile';
                tile.dataset.icon = icon;
                tile.setAttribute('aria-label', 'Hidden card');
                tile.addEventListener('click', () => flip(tile));
                memory.appendChild(tile);
            });
        }

        function flip(tile) {
            if (lock || tile.classList.contains('flip') || tile.classList.contains('matched')) return;
            tile.classList.add('flip');
            tile.innerHTML = '<i class="fas ' + tile.dataset.icon + '"></i>';
            open.push(tile);
            if (open.length < 2) return;
            moves++;
            if (movesEl) movesEl.textContent = moves;
            const [a, b] = open;
            if (a.dataset.icon === b.dataset.icon) {
                a.classList.add('matched'); b.classList.add('matched');
                open = [];
                if (++matched === icons.length) {
                    const pts = Math.max(10, 60 - moves * 2);
                    celebrate('Solved in ' + moves + ' moves', '+' + pts + ' Points (fewer moves = more points)', 'fa-puzzle-piece');
                }
            } else {
                lock = true;
                setTimeout(() => {
                    [a, b].forEach(t => { t.classList.remove('flip'); t.innerHTML = ''; });
                    open = []; lock = false;
                }, 700);
            }
        }

        document.querySelectorAll('[data-memory-restart]').forEach(b => b.addEventListener('click', build));
        build();
    }

    // ----- Reaction test -----
    const pad2 = document.getElementById('reactionPad');
    if (pad2) {
        let state = 'idle', startAt = 0, waitTimer;
        const best = document.querySelector('[data-reaction-best]');
        pad2.addEventListener('click', () => {
            if (state === 'idle' || state === 'done') {
                state = 'wait';
                pad2.className = 'reaction-pad wait';
                pad2.textContent = 'Wait for green…';
                waitTimer = setTimeout(() => {
                    state = 'go';
                    pad2.className = 'reaction-pad go';
                    pad2.textContent = 'CLICK!';
                    startAt = performance.now();
                }, 1200 + Math.random() * 2500);
            } else if (state === 'wait') {
                clearTimeout(waitTimer);
                state = 'done';
                pad2.className = 'reaction-pad';
                pad2.textContent = 'Too early! Click to try again';
            } else if (state === 'go') {
                const ms = Math.round(performance.now() - startAt);
                state = 'done';
                pad2.className = 'reaction-pad';
                pad2.textContent = ms + ' ms · Click to try again';
                if (best && (best.textContent === '—' || ms < parseInt(best.textContent, 10))) best.textContent = ms + ' ms';
            }
        });
    }

    // ----- Avatar builder -----
    const builder = document.getElementById('avatarBuilder');
    if (builder) {
        const preview = document.getElementById('avPreview');
        const frame = preview.parentElement;
        const title = document.getElementById('avTitle');
        builder.querySelectorAll('.picker').forEach(group => {
            group.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const v = btn.dataset.value;
                    if (group.dataset.av === 'bg') preview.style.background = v;
                    if (group.dataset.av === 'icon') preview.innerHTML = v.startsWith('fa-') ? '<i class="fas ' + v + '"></i>' : v;
                    if (group.dataset.av === 'frame') frame.className = 'frame ' + v;
                    if (group.dataset.av === 'title') title.textContent = v;
                });
            });
        });
    }

    // ----- Copy & share -----
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            const src = btn.dataset.copy;
            const text = src.startsWith('#') ? document.querySelector(src).value : src;
            (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
                .then(() => say('Copied: ' + text))
                .catch(() => say('Copy this: ' + text));
        });
    });

    document.querySelectorAll('[data-share]').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.share;
            if (navigator.share) {
                navigator.share({ title: 'LotteryHub', text }).catch(() => {});
            } else {
                say('Share text ready: ' + text);
            }
        });
    });

    document.querySelectorAll('.f-react').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('on');
            const n = btn.querySelector('span');
            if (n) n.textContent = Number(n.textContent) + (btn.classList.contains('on') ? 1 : -1);
        });
    });

    // Store redeem modal: fill item + cost from the clicked button
    const redeemModal = document.getElementById('redeemModal');
    if (redeemModal) {
        redeemModal.addEventListener('show.bs.modal', e => {
            const btn = e.relatedTarget;
            if (!btn) return;
            redeemModal.querySelector('[data-fill="item"]').textContent = btn.dataset.item;
            redeemModal.querySelector('[data-fill="cost"]').textContent = btn.dataset.cost + ' pts';
        });
    }

    // Type-to-confirm: <input data-confirm-input="EXCLUDE" data-confirm-btn="#btnId">
    document.querySelectorAll('[data-confirm-input]').forEach(input => {
        const btn = document.querySelector(input.dataset.confirmBtn);
        input.addEventListener('input', () => {
            btn.disabled = input.value.trim().toUpperCase() !== input.dataset.confirmInput;
        });
    });

    // ----- Ticket builder (bundles, multi-category, custom value, coupons) -----
    const tb = document.getElementById('ticketBuilder');
    if (tb) {
        const money = n => 'Rs. ' + Math.round(n).toLocaleString('en-PK');
        const lines = tb.querySelector('[data-sum="lines"]');
        const totalEl = tb.querySelector('[data-sum="total"]');
        const warnEl = tb.querySelector('[data-sum="warn"]');
        const oddsEl = tb.querySelector('[data-sum="odds"]');
        const flexi = tb.querySelector('#flexiValue');
        const flexiOut = tb.querySelector('[data-flexi-out]');
        const couponInput = tb.querySelector('#couponCode');
        const limitLeft = Number(tb.dataset.limitLeft);
        let coupon = null;

        function row(label, value, cls) {
            return '<div class="s-row ' + (cls || '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
        }

        function update() {
            const bundle = tb.querySelector('input[name="bundle"]:checked');
            const qty = Number(bundle.value);
            const discount = Number(bundle.dataset.discount || 0);
            let subtotal = 0, html = '', odds = '';

            tb.querySelectorAll('input[name="cat"]:checked').forEach(c => {
                const price = Number(c.dataset.price);
                subtotal += price * qty;
                html += row(c.dataset.name + ' × ' + qty, money(price * qty));
                odds += '<div class="o-row"><span>' + c.dataset.name + '</span><span>' + c.dataset.odds + ' per ticket</span></div>';
            });

            const flexiOn = tb.querySelector('#catFlexi').checked;
            flexi.disabled = !flexiOn;
            const fv = Number(flexi.value);
            flexiOut.textContent = money(fv) + ' entry → ' + money(fv * 10) + ' prize';
            if (flexiOn) {
                subtotal += fv * qty;
                html += row('Flexi Draw (' + money(fv) + ') × ' + qty, money(fv * qty));
                odds += '<div class="o-row"><span>Flexi Draw</span><span>1 in 12 per ticket</span></div>';
            }

            const save = subtotal * discount / 100;
            if (save) html += row('Bundle discount (' + discount + '%)', '−' + money(save), 'text-success');
            if (coupon) html += row('Coupon ' + coupon, '+1 free ticket', 'text-success');

            const total = subtotal - save;
            lines.innerHTML = html || '<div class="text-muted small">Select at least one category.</div>';
            totalEl.textContent = money(total);
            oddsEl.innerHTML = odds || '<div class="text-muted">Odds appear here for each category you pick.</div>';

            const over = total > limitLeft;
            warnEl.classList.toggle('d-none', !over && total < limitLeft * 0.8);
            warnEl.classList.toggle('alert-danger', over);
            warnEl.classList.toggle('alert-warning', !over);
            warnEl.innerHTML = over
                ? '<i class="fas fa-hand me-1"></i>This is more than your remaining monthly limit (' + money(limitLeft) + '). Lower the amount or review your limit.'
                : '<i class="fas fa-bell me-1"></i>Heads up: this uses most of your remaining monthly limit (' + money(limitLeft) + ').';
            tb.querySelector('[type="submit"]').disabled = over || total <= 0;
        }

        tb.addEventListener('input', update);
        tb.addEventListener('change', update);
        const applyBtn = tb.querySelector('[data-apply-coupon]');
        applyBtn.addEventListener('click', () => {
            const code = couponInput.value.trim().toUpperCase();
            if (['EID2026', 'WELCOME1', 'LUCKY14'].includes(code)) {
                coupon = code;
                say('Coupon ' + code + ' applied: 1 bonus free ticket.');
            } else {
                coupon = null;
                say('Coupon not valid or expired.');
            }
            update();
        });
        update();
    }

    // ----- Reality check + surprise drop -----
    const body = document.body;
    const realityModalEl = document.getElementById('realityModal');
    const realityEvery = Number(body.dataset.realityCheck || 0);
    if (realityModalEl && realityEvery) {
        const started = Date.now();
        const modal = new bootstrap.Modal(realityModalEl);
        setInterval(() => {
            const mins = Math.round((Date.now() - started) / 60000);
            realityModalEl.querySelectorAll('[data-session-min]').forEach(el => { el.textContent = mins; });
            if (!realityModalEl.classList.contains('show')) modal.show();
        }, realityEvery * 1000);
    }

    if (body.dataset.surprise) {
        let seen = false;
        try { seen = sessionStorage.getItem('lhSurprise') === '1'; } catch (e) { /* storage blocked */ }
        if (!seen) {
            setTimeout(() => {
                celebrate('Surprise drop!', body.dataset.surprise, 'fa-gift');
                try { sessionStorage.setItem('lhSurprise', '1'); } catch (e) { /* storage blocked */ }
            }, 15000);
        }
    }
})();
