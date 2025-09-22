 // Game symbols and their corresponding keys
        const symbols = {
            '⭐': '1', // Star
            '💎': '2', // Diamond
            '❤️': '3', // Heart
            '▲': '4', // Triangle
            '⭕': '5'  // Circle
        };

        // Symbol names for CSV export
        const symbolNames = {
            '⭐': 'Star',
            '💎': 'Diamond', 
            '❤️': 'Heart',
            '▲': 'Triangle',
            '⭕': 'Circle'
        };

        // Function to get readable symbol name
        function getSymbolName(symbol) {
            return symbolNames[symbol] || symbol;
        }

        let gameActive = false;
        let currentSymbol = '';
        let correctCount = 0;
        let incorrectCount = 0;
        let gameStartTime = 0;
        let gameTimer = null;
        let gameDuration = 180; // 5 minutes (300 seconds)
        let timeRemaining = gameDuration;
        let symbolStartTime = 0;
        let gameData = [];
        let reactionTimes = [];
        let consecutiveCorrect = 0;
        let allGameSessions = []; // Store all completed game sessions

        // Load previous sessions from localStorage
        function loadGameSessions() {
            const stored = localStorage.getItem('symbolGameSessions');
            if (stored) {
                try {
                    allGameSessions = JSON.parse(stored);
                } catch (e) {
                    console.log('Error loading stored sessions:', e);
                    allGameSessions = [];
                }
            }
        }

        // Save sessions to localStorage
        function saveGameSessions() {
            try {
                localStorage.setItem('symbolGameSessions', JSON.stringify(allGameSessions));
            } catch (e) {
                console.log('Error saving sessions:', e);
            }
        }

        // Initialize sessions on page load
        loadGameSessions();

        // Display session info if there are previous sessions
        function displaySessionInfo() {
            if (allGameSessions.length > 0) {
                const sessionInfoDiv = document.createElement('div');
                sessionInfoDiv.className = 'session-info';
                sessionInfoDiv.innerHTML = `
                    <strong>Game History:</strong> ${allGameSessions.length} session${allGameSessions.length !== 1 ? 's' : ''} played
                    ${allGameSessions.length > 0 ? `<br><strong>Best Accuracy:</strong> ${Math.max(...allGameSessions.map(s => s.accuracy))}%` : ''}
                    ${allGameSessions.length > 0 ? `<br><strong>Best Speed:</strong> ${Math.max(...allGameSessions.map(s => s.wpm))} symbols/min` : ''}
                `;
                
                const gameContainer = document.querySelector('.game-container');
                const statsDiv = document.querySelector('.stats');
                gameContainer.insertBefore(sessionInfoDiv, statsDiv.nextSibling);
            }
        }

        // Call displaySessionInfo on page load
        displaySessionInfo();

        const symbolDisplay = document.getElementById('symbolDisplay');
        const timerDisplay = document.getElementById('timer');
        const correctDisplay = document.getElementById('correct');
        const incorrectDisplay = document.getElementById('incorrect');
        const accuracyDisplay = document.getElementById('accuracy');
        const lastKeyDisplay = document.getElementById('lastKey');
        const startBtn = document.getElementById('startBtn');
        const gameOverDiv = document.getElementById('gameOver');
        const finalStatsDiv = document.getElementById('finalStats');
        const progressBar = document.getElementById('progress');

        function getRandomSymbol() {
            const symbolKeys = Object.keys(symbols);
            return symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
        }

        function displayNewSymbol() {
            currentSymbol = getRandomSymbol();
            symbolDisplay.textContent = currentSymbol;
            symbolDisplay.className = 'symbol-display';
            symbolStartTime = Date.now(); // Record when symbol was displayed
        }

        function updateStats() {
            const total = correctCount + incorrectCount;
            const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 100;
            
            // Calculate average reaction time
            const avgReaction = reactionTimes.length > 0 ? 
                Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;
            
            correctDisplay.textContent = correctCount;
            incorrectDisplay.textContent = incorrectCount;
            accuracyDisplay.textContent = accuracy + '%';
            document.getElementById('avgReaction').textContent = avgReaction + 'ms';
        }

        function updateTimer() {
            timeRemaining--;
            timerDisplay.textContent = timeRemaining + 's'; // Show remaining time (countdown)
            
            const progress = (timeRemaining / gameDuration) * 100; // Reverse progress bar
            progressBar.style.width = progress + '%';
            
            if (timeRemaining <= 0) {
                endGame();
            }
        }

        // Audio for sound effects
        let celebrationAudio = null;

        // Initialize audio
        function initializeAudio() {
            try {
                celebrationAudio = new Audio();
                
                // TO ADD YOUR OWN MP3 FILE:
                // 1. Put your MP3 file in the same folder as this HTML file
                // 2. Replace the filename below with your MP3 filename
                // Example: celebrationAudio.src = 'celebration.mp3';
                //         celebrationAudio.src = 'sounds/party.mp3';
                //         celebrationAudio.src = 'hooray.mp3';
                
                // For now, using a simple beep sound (replace with your MP3)
                celebrationAudio.src = 'sound-effect.m4a'; // <- CHANGE THIS TO YOUR MP3 FILE
                
                // If the file doesn't exist, this will create a fallback beep
                celebrationAudio.onerror = function() {
                    console.log('MP3 file not found, using fallback sound');
                    // Fallback to a simple beep sound
                    celebrationAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzaUy+LFeSsFLYTO8tiJOAgsf8Pq2oY3ByV+y+LSgyEGfaTV8MR1KAMyjs8AAAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAAAAAAACgAAAAQAAAAEAAAACAAAAAgAAAAQAAAAEAAAABAAAAAQAAAABgAAAAAQ=';
                };
                
                celebrationAudio.volume = 0.5; // Adjust volume (0.0 to 1.0)
                celebrationAudio.preload = 'auto';
            } catch (error) {
                console.log('Audio initialization failed:', error);
                celebrationAudio = null;
            }
        }

        // Call audio initialization when page loads
        initializeAudio();

        function showGoodJobPopup() {
            const popup = document.createElement('div');
            popup.className = 'good-job-popup';
            popup.textContent = '🎉 Good Job! 🎉';
            document.body.appendChild(popup);
            
            // Play celebration sound
            playCelebrationSound();
            
            // Create confetti effect
            createConfetti();
            
            // Debug log to check if function is called
            console.log('Good job popup triggered with confetti and sound!');
            
            setTimeout(() => {
                if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                }
                // Clean up confetti pieces
                const confettiPieces = document.querySelectorAll('.confetti-piece');
                confettiPieces.forEach(piece => {
                    if (document.body.contains(piece)) {
                        document.body.removeChild(piece);
                    }
                });
            }, 3000);
        }

        function playCelebrationSound() {
            try {
                if (celebrationAudio) {
                    celebrationAudio.currentTime = 0; // Reset to beginning
                    const playPromise = celebrationAudio.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log('Audio play failed:', error);
                            // Audio play failed, possibly due to browser autoplay policy
                        });
                    }
                }
            } catch (error) {
                console.log('Error playing celebration sound:', error);
            }
        }

        function createConfetti() {
            const confettiEmojis = ['🎉', '🎊', '✨', '🌟', '⭐', '🎈', '🎁', '💎', '🏆', '🔥'];
            const gameContainer = document.querySelector('.game-container');
            const containerRect = gameContainer.getBoundingClientRect();
            
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-piece';
                confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
                
                // Random horizontal position within game container
                const leftPosition = Math.random() * containerRect.width;
                confetti.style.left = leftPosition + 'px';
                confetti.style.top = '-50px';
                
                // Random animation delay for staggered effect
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                
                gameContainer.appendChild(confetti);
            }
        }

        // Popup functions
        function showInstructions() {
            document.getElementById('instructionPopup').style.display = 'flex';
        }

        function closeInstructions() {
            document.getElementById('instructionPopup').style.display = 'none';
        }

        function startGameFromPopup() {
            closeInstructions();
            startGame();
        }

        function startGame() {
            gameActive = true;
            correctCount = 0;
            incorrectCount = 0;
            timeRemaining = gameDuration;
            gameStartTime = Date.now();
            gameData = [];
            reactionTimes = [];
            consecutiveCorrect = 0;
            
            // Enable audio context (required for browsers)
            if (celebrationAudio) {
                celebrationAudio.load(); // Prepare the audio
            }
            
            startBtn.style.display = 'none';
            gameOverDiv.style.display = 'none';
            
            displayNewSymbol();
            updateStats();
            
            gameTimer = setInterval(updateTimer, 1000); // Update every 1 second (1000ms)
            
            // Focus on the window to capture key events
            window.focus();
        }

        function endGame() {
            gameActive = false;
            clearInterval(gameTimer);
            
            const total = correctCount + incorrectCount;
            const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 100;
            const wpm = Math.round(correctCount / (gameDuration / 60)); // Symbols per minute
            const avgReaction = reactionTimes.length > 0 ? 
                Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;
            
            // Create session summary
            const sessionSummary = {
                date: new Date().toISOString(),
                duration: gameDuration,
                totalSymbols: total,
                correct: correctCount,
                incorrect: incorrectCount,
                accuracy: accuracy,
                wpm: wpm,
                avgReactionTime: avgReaction,
                gameData: [...gameData] // Copy the game data
            };
            
            // Save session to allGameSessions
            allGameSessions.push(sessionSummary);
            saveGameSessions();
            
            symbolDisplay.textContent = '🎯 Game Complete!';
            symbolDisplay.className = 'symbol-display';
            
            finalStatsDiv.innerHTML = `
                <div><span>Total Symbols:</span><span>${total}</span></div>
                <div><span>Correct:</span><span>${correctCount}</span></div>
                <div><span>Incorrect:</span><span>${incorrectCount}</span></div>
                <div><span>Accuracy:</span><span>${accuracy}%</span></div>
                <div><span>Speed:</span><span>${wpm} symbols/minute</span></div>
                <div><span>Avg Reaction Time:</span><span>${avgReaction}ms</span></div>
                <div><span>Sessions Played:</span><span>${allGameSessions.length}</span></div>
            `;
            
            // Display detailed data summary
            displayDataSummary();
            
            // Generate and offer CSV download
            generateCSVDownload();
            
            gameOverDiv.style.display = 'block';
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'PLAY AGAIN';
        }

        function generateCSVDownload() {
            // Remove any existing download buttons
            const existingDownloadBtns = gameOverDiv.querySelectorAll('button[data-download]');
            existingDownloadBtns.forEach(btn => btn.remove());
            
            // Create current session CSV with readable symbols
            let currentCSV = "Symbol,Symbol Name,Key Pressed,Expected Key,Correct,Reaction Time (ms),Game Time (s)\n";
            gameData.forEach(entry => {
                const gameTimeSeconds = (entry.timestamp / 1000).toFixed(2);
                const symbolName = getSymbolName(entry.symbol);
                currentCSV += `"${entry.symbol}","${symbolName}",${entry.keyPressed},${entry.expectedKey},${entry.correct},${entry.reactionTime},${gameTimeSeconds}\n`;
            });
            
            // Create all sessions CSV with readable symbols
            let allSessionsCSV = "Session Date,Session #,Symbol,Symbol Name,Key Pressed,Expected Key,Correct,Reaction Time (ms),Game Time (s),Session Accuracy,Session Total\n";
            allGameSessions.forEach((session, sessionIndex) => {
                session.gameData.forEach(entry => {
                    const gameTimeSeconds = (entry.timestamp / 1000).toFixed(2);
                    const symbolName = getSymbolName(entry.symbol);
                    allSessionsCSV += `"${session.date}",${sessionIndex + 1},"${entry.symbol}","${symbolName}",${entry.keyPressed},${entry.expectedKey},${entry.correct},${entry.reactionTime},${gameTimeSeconds},${session.accuracy}%,${session.totalSymbols}\n`;
                });
            });
            
            // Create session summary CSV
            let summaryCSV = "Session,Date,Duration(s),Total Symbols,Correct,Incorrect,Accuracy(%),WPM,Avg Reaction Time(ms)\n";
            allGameSessions.forEach((session, index) => {
                const date = new Date(session.date).toLocaleString();
                summaryCSV += `${index + 1},"${date}",${session.duration},${session.totalSymbols},${session.correct},${session.incorrect},${session.accuracy},${session.wpm},${session.avgReactionTime}\n`;
            });
            
            // Download current session button
            const downloadCurrentBtn = document.createElement('button');
            downloadCurrentBtn.className = 'start-btn';
            downloadCurrentBtn.style.backgroundColor = '#4CAF50';
            downloadCurrentBtn.style.margin = '5px';
            downloadCurrentBtn.setAttribute('data-download', 'current');
            downloadCurrentBtn.textContent = ' Download Current Session';
            downloadCurrentBtn.onclick = function() {
                downloadCSV(currentCSV, `current_session_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
            };
            
            // Download all sessions button (only show if there are multiple sessions)
            if (allGameSessions.length > 1) {
                const downloadAllBtn = document.createElement('button');
                downloadAllBtn.className = 'start-btn';
                downloadAllBtn.style.backgroundColor = '#2196F3';
                downloadAllBtn.style.margin = '5px';
                downloadAllBtn.setAttribute('data-download', 'all');
                downloadAllBtn.textContent = 'Download All Sessions';
                downloadAllBtn.onclick = function() {
                    downloadCSV(allSessionsCSV, `all_sessions_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
                };
                
                const downloadSummaryBtn = document.createElement('button');
                downloadSummaryBtn.className = 'start-btn';
                downloadSummaryBtn.style.backgroundColor = '#FF9800';
                downloadSummaryBtn.style.margin = '5px';
                downloadSummaryBtn.setAttribute('data-download', 'summary');
                downloadSummaryBtn.textContent = 'Download Summary';
                downloadSummaryBtn.onclick = function() {
                    downloadCSV(summaryCSV, `session_summary_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
                };
                
                gameOverDiv.appendChild(downloadAllBtn);
                gameOverDiv.appendChild(downloadSummaryBtn);
            }
            
            gameOverDiv.appendChild(downloadCurrentBtn);
            
            // Add clear history button
            const clearHistoryBtn = document.createElement('button');
            clearHistoryBtn.className = 'start-btn';
            clearHistoryBtn.style.backgroundColor = '#f44336';
            clearHistoryBtn.style.margin = '5px';
            clearHistoryBtn.setAttribute('data-download', 'clear');
            clearHistoryBtn.textContent = 'Clear History';
            clearHistoryBtn.onclick = function() {
                if (confirm('Are you sure you want to clear all game history? This cannot be undone.')) {
                    allGameSessions = [];
                    saveGameSessions();
                    alert('Game history cleared successfully!');
                    generateCSVDownload(); // Refresh buttons
                }
            };
            
            gameOverDiv.appendChild(clearHistoryBtn);
        }
        
        function downloadCSV(csvContent, filename) {
            // Add UTF-8 BOM to ensure proper encoding of Unicode symbols
            const BOM = '\uFEFF';
            const csvWithBOM = BOM + csvContent;
            
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function displayDataSummary() {
            const existingSummary = document.getElementById('dataSummary');
            if (existingSummary) {
                existingSummary.remove();
            }
            
            const existingDownloadBtns = gameOverDiv.querySelectorAll('button[data-download]');
            existingDownloadBtns.forEach(btn => btn.remove());

            const summaryDiv = document.createElement('div');
            summaryDiv.id = 'dataSummary';
            summaryDiv.className = 'data-summary';
            
            let summaryHTML = '<h3>📊 Current Session Results</h3>';
            summaryHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px 15px; margin: 8px 0; background: linear-gradient(45deg, #c76aab, #8f0b61); color: white; font-weight: bold; border-radius: 10px; border: none; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(199, 106, 171, 0.3);"><span>Symbol</span><span>Pressed</span><span>Expected</span><span>Result</span><span>Time</span></div>';
            
            gameData.forEach((entry, index) => {
                const entryClass = entry.correct ? 'correct-entry' : 'incorrect-entry';
                const result = entry.correct ? '✓' : '✗';
                summaryHTML += `
                    <div class="data-entry ${entryClass}">
                        <span>${entry.symbol}</span>
                        <span>${entry.keyPressed}</span>
                        <span>${entry.expectedKey}</span>
                        <span>${result}</span>
                        <span>${entry.reactionTime}ms</span>
                    </div>
                `;
            });
            
            // Add session history summary if there are previous sessions
            if (allGameSessions.length > 1) {
                summaryHTML += '<h3 style="margin-top: 20px;">📈 Recent Session History</h3>';
                summaryHTML += '<div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px 15px; margin: 8px 0; background: linear-gradient(45deg, #c76aab, #8f0b61); color: white; font-weight: bold; border-radius: 10px; border: none; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(199, 106, 171, 0.3);"><span>Session</span><span>Date & Time</span><span>Accuracy</span><span>Total</span><span>Avg Time</span></div>';
                
                allGameSessions.slice(-5).forEach((session, index) => {
                    const sessionNumber = allGameSessions.length - 4 + index;
                    const date = new Date(session.date).toLocaleDateString();
                    const time = new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    summaryHTML += `
                        <div class="data-entry" style="grid-template-columns: 1fr 2fr 1fr 1fr 1fr; font-size: 0.95em;">
                            <span>#${sessionNumber}</span>
                            <span>${date} ${time}</span>
                            <span>${session.accuracy}%</span>
                            <span>${session.totalSymbols}</span>
                            <span>${session.avgReactionTime}ms</span>
                        </div>
                    `;
                });
                
                if (allGameSessions.length > 5) {
                    summaryHTML += `<div style="text-align: center; margin-top: 15px; font-style: italic; color: #666; background: rgba(199, 106, 171, 0.1); padding: 10px; border-radius: 10px;">... and ${allGameSessions.length - 5} more sessions available in downloads</div>`;
                }
            }
            
            summaryDiv.innerHTML = summaryHTML;
            gameOverDiv.appendChild(summaryDiv);
        }

        function handleKeyPress(event) {
            // Handle Escape key to close popup
            if (event.key === 'Escape') {
                const popup = document.getElementById('instructionPopup');
                if (popup.style.display === 'flex') {
                    closeInstructions();
                    return;
                }
            }
            
            if (!gameActive) return;
            
            const keyPressed = event.key;
            
            // Only accept keys 1-5
            if (!['1', '2', '3', '4', '5'].includes(keyPressed)) {
                return;
            }
            
            const reactionTime = Date.now() - symbolStartTime;
            lastKeyDisplay.textContent = keyPressed;
            document.getElementById('lastReaction').textContent = reactionTime + 'ms';
            
            // Check if the pressed key matches the expected key for the current symbol
            const expectedKey = symbols[currentSymbol];
            const isCorrect = keyPressed === expectedKey;
            
            // Record the data
            const dataEntry = {
                symbol: currentSymbol,
                keyPressed: keyPressed,
                expectedKey: expectedKey,
                correct: isCorrect,
                reactionTime: reactionTime,
                timestamp: Date.now() - gameStartTime
            };
            
            gameData.push(dataEntry);
            reactionTimes.push(reactionTime);
            
            if (isCorrect) {
                correctCount++;
                consecutiveCorrect++;
                symbolDisplay.className = 'symbol-display correct';
                
                // Show popup every 5 correct answers
                if (consecutiveCorrect % 5 === 0) {
                    showGoodJobPopup();
                }
                
                setTimeout(() => {
                    displayNewSymbol();
                }, 300);
            } else {
                incorrectCount++;
                consecutiveCorrect = 0; // Reset consecutive counter on incorrect answer
                symbolDisplay.className = 'symbol-display incorrect';
                
                // Display new symbol immediately after showing incorrect feedback
                setTimeout(() => {
                    displayNewSymbol();
                }, 500);
            }
            
            updateStats();
        }

        // Add event listener for keypress
        document.addEventListener('keydown', handleKeyPress);

        // Prevent default behavior for certain keys
        document.addEventListener('keydown', function(event) {
            if (gameActive && ['1', '2', '3', '4', '5'].includes(event.key)) {
                event.preventDefault();
            }
        });

        // Initial setup
        updateStats();
        
        // Set initial timer display to show countdown
        timerDisplay.textContent = timeRemaining + 's';
        
        // Set initial progress bar to full (100%)
        progressBar.style.width = '100%';