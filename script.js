
        // Game Assets
        const THEMES = {
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🐵'],
            fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
            objects: ['🚀', '🚁', '🛸', '🛰', '🔭', '🪐', '🌙', '⭐', '⚡', '🔥', '🌈', '💎', '🎨', '🕹', '🏀', '🎸']
        };

        const DIFFICULTIES = {
            easy: { rows: 3, cols: 4, pairs: 6 },
            medium: { rows: 4, cols: 4, pairs: 8 },
            hard: { rows: 5, cols: 4, pairs: 10 }
        };

        // State
        let currentDifficulty = 'medium';
        let currentTheme = 'animals';
        let flippedCards = [];
        let matchedPairs = 0;
        let moves = 0;
        let timer = null;
        let seconds = 0;
        let isProcessing = false;
        let hintsUsed = 0;

        // UI Selectors
        const menuScreen = document.getElementById('menu-screen');
        const gameScreen = document.getElementById('game-screen');
        const gameGrid = document.getElementById('game-grid');
        const moveDisplay = document.getElementById('move-count');
        const timeDisplay = document.getElementById('timer');
        const victoryModal = document.getElementById('victory-modal');

        function setDifficulty(level) {
            currentDifficulty = level;
            document.querySelectorAll('.diff-btn').forEach(btn => {
                btn.classList.remove('border-blue-500', 'bg-blue-500/10');
                btn.classList.add('border-transparent', 'bg-slate-800');
            });
            document.getElementById(`btn-${level}`).classList.add('border-blue-500', 'bg-blue-500/10');
            document.getElementById(`btn-${level}`).classList.remove('border-transparent', 'bg-slate-800');
        }

        function setTheme(theme) {
            currentTheme = theme;
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('border-blue-500', 'bg-blue-500/10');
                btn.classList.add('border-transparent', 'bg-slate-800');
            });
            document.getElementById(`theme-${theme}`).classList.add('border-blue-500', 'bg-blue-500/10');
            document.getElementById(`theme-${theme}`).classList.remove('border-transparent', 'bg-slate-800');
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function formatTime(s) {
            const mins = Math.floor(s / 60);
            const secs = s % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function startGame() {
            // Reset state
            matchedPairs = 0;
            moves = 0;
            seconds = 0;
            flippedCards = [];
            isProcessing = false;
            hintsUsed = 0;
            document.getElementById('hint-btn').classList.remove('opacity-50', 'pointer-events-none');

            clearInterval(timer);
            moveDisplay.textContent = '0';
            timeDisplay.textContent = '00:00';
            victoryModal.classList.add('hidden');

            // Layout Setup
            const config = DIFFICULTIES[currentDifficulty];
            gameGrid.className = `grid gap-3 md:gap-4 mx-auto max-w-fit`;
            gameGrid.style.gridTemplateColumns = `repeat(${config.cols}, minmax(70px, 1fr))`;

            // Card Generation
            const isHard = currentDifficulty === 'hard';
            const cardSizeClass = isHard ? 'w-16 h-24 md:w-24 md:h-32' : 'w-20 h-28 md:w-24 md:h-32';
            const themeAssets = [...THEMES[currentTheme]];
            shuffle(themeAssets);
            const gameAssets = themeAssets.slice(0, config.pairs);
            const cards = shuffle([...gameAssets, ...gameAssets]);

            gameGrid.innerHTML = '';
            cards.forEach((symbol, index) => {
                const card = document.createElement('div');
                card.className = `perspective-1000 ${cardSizeClass}`;
                card.innerHTML = `
                    <div class="card-inner" onclick="handleCardClick(this)" data-symbol="${symbol}">
                        <div class="card-face card-front">
                            <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">?</div>
                        </div>
                        <div class="card-face card-back">${symbol}</div>
                    </div>
                `;
                gameGrid.appendChild(card);
            });

            menuScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');

            // Start Timer
            timer = setInterval(() => {
                seconds++;
                timeDisplay.textContent = formatTime(seconds);
            }, 1000);
        }

        function handleCardClick(cardInner) {
            if (isProcessing) return;
            const cardWrapper = cardInner.parentElement;
            if (cardWrapper.classList.contains('card-flipped') || cardWrapper.classList.contains('card-matched')) return;

            cardWrapper.classList.add('card-flipped');
            flippedCards.push(cardWrapper);

            if (flippedCards.length === 2) {
                moves++;
                moveDisplay.textContent = moves;
                checkMatch();
            }
        }

        function checkMatch() {
            isProcessing = true;
            const [card1, card2] = flippedCards;
            const symbol1 = card1.querySelector('.card-inner').dataset.symbol;
            const symbol2 = card2.querySelector('.card-inner').dataset.symbol;

            if (symbol1 === symbol2) {
                // Match
                setTimeout(() => {
                    card1.classList.add('card-matched', 'animate-success');
                    card2.classList.add('card-matched', 'animate-success');
                    matchedPairs++;
                    flippedCards = [];
                    isProcessing = false;

                    if (matchedPairs === DIFFICULTIES[currentDifficulty].pairs) {
                        endGame();
                    }
                }, 500);
            } else {
                // No Match
                setTimeout(() => {
                    card1.classList.add('animate-shake');
                    card2.classList.add('animate-shake');

                    setTimeout(() => {
                        card1.classList.remove('card-flipped', 'animate-shake');
                        card2.classList.remove('card-flipped', 'animate-shake');
                        flippedCards = [];
                        isProcessing = false;
                    }, 500);
                }, 500);
            }
        }

        function useHint() {
            if (isProcessing || hintsUsed >= 1) return;

            isProcessing = true;
            hintsUsed++;
            const hintBtn = document.getElementById('hint-btn');
            hintBtn.classList.add('opacity-50', 'pointer-events-none');

            const allCards = document.querySelectorAll('.perspective-1000:not(.card-matched)');
            allCards.forEach(c => c.classList.add('card-flipped'));

            setTimeout(() => {
                allCards.forEach(c => {
                    if (!c.classList.contains('card-matched')) {
                        c.classList.remove('card-flipped');
                    }
                });
                isProcessing = false;
            }, 1200);
        }

        function endGame() {
            clearInterval(timer);
            const finalTimeStr = formatTime(seconds);
            document.getElementById('final-moves').textContent = moves;
            document.getElementById('final-time').textContent = finalTimeStr;

            const isNewRecord = saveHighScore(currentDifficulty, moves, seconds);
            document.getElementById('new-record').classList.toggle('hidden', !isNewRecord);

            setTimeout(() => {
                victoryModal.classList.remove('hidden');
            }, 600);
        }

        function saveHighScore(diff, moves, secs) {
            const scores = JSON.parse(localStorage.getItem('memory_scores') || '{}');
            const currentBest = scores[diff];

            // Score = moves * seconds (lower is better)
            const currentScore = moves + (secs / 10);
            const prevScore = currentBest ? (currentBest.moves + (currentBest.seconds / 10)) : Infinity;

            if (currentScore < prevScore) {
                scores[diff] = { moves, seconds: secs, date: new Date().toLocaleDateString() };
                localStorage.setItem('memory_scores', JSON.stringify(scores));
                updateStatsDisplay();
                return true;
            }
            return false;
        }

        function updateStatsDisplay() {
            const scores = JSON.parse(localStorage.getItem('memory_scores') || '{}');
            const container = document.getElementById('stats-container');

            if (Object.keys(scores).length === 0) return;

            container.innerHTML = Object.entries(scores).map(([diff, data]) => `
                <div class="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span class="capitalize font-semibold text-blue-400">${diff}</span>
                    <span class="text-xs text-slate-300">${data.moves} moves • ${formatTime(data.seconds)}</span>
                </div>
            `).join('');
        }

        function backToMenu() {
            clearInterval(timer);
            gameScreen.classList.add('hidden');
            victoryModal.classList.add('hidden');
            menuScreen.classList.remove('hidden');
            updateStatsDisplay();
        }

        function resetGame() {
            startGame();
        }

        // Initialize
        updateStatsDisplay();
    
