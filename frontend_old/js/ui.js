// UI utility functions and components

class UIManager {
    constructor() {
        this.currentScreen = 'start-screen';
        this.currentQuestion = null;
        this.selectedAnswers = new Set();
        this.selectedAnswersOrder = []; // Track selection order for readjustment
        this.questionAnswered = false;
        this.maxSelectableAnswers = 1; // Default to 1, updated per question
        this.sessionStats = {
            total: 0,
            correct: 0,
            accuracy: 0,
            sessionStart: Date.now()
        };
        this.sessionTimerInterval = null;
    }

    // Screen management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.classList.add('fade-in');
            this.currentScreen = screenId;
        }
    }

    // Loading management
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    // Modal management
    showModal(title, content, showFooter = false, footerContent = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;

        const modalFooter = document.getElementById('modal-footer');
        if (showFooter) {
            modalFooter.innerHTML = footerContent;
            modalFooter.style.display = 'flex';
        } else {
            modalFooter.style.display = 'none';
        }

        document.getElementById('modal').classList.add('active');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('active');
        document.getElementById('question-detail-modal').classList.remove('active');
    }

    showNoteModal(currentNote = '') {
        const footerContent = `
            <textarea id="note-input" placeholder="Add your note..." rows="4" style="width: 100%; resize: vertical; min-height: 80px; max-height: 200px;">${currentNote}</textarea>
            <div style="margin-top: 10px;">
                <button id="save-note" class="save-note-btn">Save</button>
                <button id="cancel-note" class="cancel-note-btn">Cancel</button>
            </div>
        `;

        this.showModal('Add Note', 'Add a personal note for this question:', true, footerContent);

        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('note-input');
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
    }

    // Theme management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);

        // Update theme button
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';

        // Save preference
        localStorage.setItem('theme', newTheme);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    // Question display
    displayQuestion(question) {
        this.currentQuestion = question;
        this.selectedAnswers.clear();
        this.selectedAnswersOrder = [];
        this.questionAnswered = false;
        this.explanationShown = false;

        // Update question header
        document.getElementById('question-number').textContent = `Question #${question.question_number}`;
        document.getElementById('question-text').textContent = question.question_text;

        // Update star button
        const starBtn = document.getElementById('star-btn');
        starBtn.classList.toggle('starred', question.starred);

        // Update note button
        const noteBtn = document.getElementById('note-btn');
        noteBtn.classList.toggle('has-note', question.note && question.note.trim() !== '');

        // Display tags
        const tagsContainer = document.getElementById('question-tags');
        tagsContainer.innerHTML = question.tag.map(tag =>
            `<span class="tag">${tag}</span>`
        ).join('');

        // Determine if this is a single or multiple answer question
        const correctAnswers = Object.entries(question.answers).filter(([key, answer]) => answer.status === 'correct');
        const isSingleAnswer = correctAnswers.length === 1;
        this.maxSelectableAnswers = correctAnswers.length; // Store max selectable count

        // Display answers
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = Object.entries(question.answers).map(([key, answer]) => `
            <div class="answer-option" data-answer="${key}" data-single-answer="${isSingleAnswer}">
                <span class="answer-letter">${key.toUpperCase()})</span>
                <span class="answer-text">${answer.answer_text}</span>
            </div>
        `).join('');

        // Reset controls
        const submitBtn = document.getElementById('submit-answer');
        submitBtn.disabled = true;
        submitBtn.style.display = 'inline-block';
        const explainBtn = document.getElementById('get-explanation');
        explainBtn.style.display = 'none';
        explainBtn.textContent = 'Get Explanation';
        explainBtn.disabled = false;
        document.getElementById('next-question').style.display = 'none';
        document.getElementById('feedback-container').style.display = 'none';

        // Add answer selection listeners
        this.setupAnswerSelection();
    }

    setupAnswerSelection() {
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => {
                if (this.questionAnswered) return;

                const answer = option.dataset.answer;
                const isSingleAnswer = option.dataset.singleAnswer === 'true';

                if (isSingleAnswer) {
                    // For single answer questions, clear other selections
                    document.querySelectorAll('.answer-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.selectedAnswers.clear();
                    this.selectedAnswersOrder = [];

                    // Select this option
                    this.selectedAnswers.add(answer);
                    this.selectedAnswersOrder.push(answer);
                    option.classList.add('selected');
                } else {
                    // For multiple answer questions, toggle selection with limit
                    if (this.selectedAnswers.has(answer)) {
                        // Deselect the answer
                        this.selectedAnswers.delete(answer);
                        this.selectedAnswersOrder = this.selectedAnswersOrder.filter(a => a !== answer);
                        option.classList.remove('selected');
                    } else {
                        // Check if we can select more answers
                        if (this.selectedAnswers.size < this.maxSelectableAnswers) {
                            // Add new selection
                            this.selectedAnswers.add(answer);
                            this.selectedAnswersOrder.push(answer);
                            option.classList.add('selected');
                        } else {
                            // Remove oldest selection and add new one
                            const oldestAnswer = this.selectedAnswersOrder.shift();
                            this.selectedAnswers.delete(oldestAnswer);

                            // Find and deselect the oldest option in UI
                            document.querySelectorAll('.answer-option').forEach(opt => {
                                if (opt.dataset.answer === oldestAnswer) {
                                    opt.classList.remove('selected');
                                }
                            });

                            // Add new selection
                            this.selectedAnswers.add(answer);
                            this.selectedAnswersOrder.push(answer);
                            option.classList.add('selected');
                        }
                    }
                }

                // Enable/disable submit button
                document.getElementById('submit-answer').disabled = this.selectedAnswers.size === 0;
            });
        });
    }

    showAnswerFeedback(result) {
        this.questionAnswered = true;

        // Disable answer options
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.add('disabled');

            const answer = option.dataset.answer;
            if (result.correct_answers.includes(answer)) {
                option.classList.add('correct');
            } else if (this.selectedAnswers.has(answer)) {
                option.classList.add('incorrect');
            }
        });

        // Show feedback
        const feedbackContainer = document.getElementById('feedback-container');
        feedbackContainer.style.display = 'block';
        feedbackContainer.className = `feedback-container ${result.is_correct ? 'correct' : 'incorrect'}`;

        const feedbackText = result.is_correct ?
            '✅ Correct! Well done!' :
            '❌ Incorrect. Review the correct answer and explanation.';

        feedbackContainer.innerHTML = `
            <h4>${feedbackText}</h4>
            <div id="explanation-section" style="display: none;">
                <div class="explanation">
                    <h5>📝 Explanation:</h5>
                    <div id="explanation-content"></div>
                </div>
            </div>
        `;

        // Update session stats
        this.sessionStats.total++;
        if (result.is_correct) {
            this.sessionStats.correct++;
        }
        this.sessionStats.accuracy = (this.sessionStats.correct / this.sessionStats.total * 100).toFixed(1);
        this.updateSessionDisplay();

        // Show controls
        document.getElementById('submit-answer').style.display = 'none';
        if (!result.explanation) {
            document.getElementById('get-explanation').style.display = 'inline-block';
        }
        document.getElementById('next-question').style.display = 'inline-block';
    }

    updateSessionDisplay() {
        const statsElement = document.getElementById('session-stats');
        if (statsElement) {
            statsElement.textContent =
                `Questions: ${this.sessionStats.total} | ` +
                `Correct: ${this.sessionStats.correct} | ` +
                `Accuracy: ${this.sessionStats.accuracy}%`;
        }
        this.updateSessionTimer();
    }

    updateSessionTimer() {
        const timerElement = document.getElementById('session-timer');
        if (timerElement && this.sessionStats.sessionStart) {
            const elapsed = Date.now() - this.sessionStats.sessionStart;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    startSessionTimer() {
        this.sessionStats.sessionStart = Date.now();
        this.sessionTimerInterval = setInterval(() => {
            this.updateSessionTimer();
        }, 1000);
    }

    stopSessionTimer() {
        if (this.sessionTimerInterval) {
            clearInterval(this.sessionTimerInterval);
            this.sessionTimerInterval = null;
        }
    }

    // Progress display
    displayProgress(progressData) {
        // Last session
        const lastSessionContainer = document.getElementById('last-session-progress');
        const lastSession = progressData.last_session;

        if (lastSession) {
            const sessionDate = new Date(lastSession.date).toLocaleDateString();
            const durationText = this.formatDuration(lastSession.duration_minutes);
            const tagsText = lastSession.tags && lastSession.tags.length > 0
                ? lastSession.tags.slice(0, 4).join(', ') + (lastSession.tags.length > 4 ? ` (+${lastSession.tags.length - 4} more)` : '')
                : 'No topics';

            lastSessionContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Date:</span>
                    <span class="stat-value">${sessionDate}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Questions Answered:</span>
                    <span class="stat-value">${lastSession.total_questions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Correctly Answered:</span>
                    <span class="stat-value">${lastSession.correct_answers}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Accuracy:</span>
                    <span class="stat-value">${lastSession.accuracy.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Time:</span>
                    <span class="stat-value">${durationText}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Most Frequent Topics:</span>
                    <span class="stat-value" style="text-align: right;">${tagsText}</span>
                </div>
            `;
        } else {
            lastSessionContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">No sessions completed yet</span>
                </div>
            `;
        }

        // Overall progress with new categories
        const overallContainer = document.getElementById('overall-progress');
        const overall = progressData.overall;
        const totalTrainingTime = this.formatTrainingTime(overall.total_training_time_minutes);

        overallContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Questions:</span>
                <span class="stat-value">${overall.total_questions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Mistakes:</span>
                <span class="stat-value category-mistakes">${overall.mistakes_count}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Learning:</span>
                <span class="stat-value category-learning">${overall.learning_count}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Mastered:</span>
                <span class="stat-value category-mastered">${overall.mastered_count}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Perfected:</span>
                <span class="stat-value category-perfected">${overall.perfected_count}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Starred Questions:</span>
                <span class="stat-value">${overall.starred_questions}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Questions with Notes:</span>
                <span class="stat-value">${overall.questions_with_notes}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Training Time:</span>
                <span class="stat-value">${totalTrainingTime}</span>
            </div>
        `;

        // Enhanced tag progress with new categories
        const tagContainer = document.getElementById('tag-progress-container');
        tagContainer.innerHTML = `
            <div class="tag-progress-table">
                <div class="tag-progress-header">
                    <div class="tag-header-cell">Topic</div>
                    <div class="tag-header-cell">Total</div>
                    <div class="tag-header-cell">Mistakes</div>
                    <div class="tag-header-cell">Learning</div>
                    <div class="tag-header-cell">Mastered</div>
                    <div class="tag-header-cell">Perfected</div>
                    <div class="tag-header-cell">Mastery %</div>
                </div>
                ${overall.tag_progress.map(tag => {
                    const masteryClass = this.getMasteryClass(tag.mastery_percentage);
                    return `
                        <div class="tag-progress-row">
                            <div class="tag-cell topic-name">${tag.tag}</div>
                            <div class="tag-cell">${tag.total_questions}</div>
                            <div class="tag-cell category-mistakes">${tag.mistakes_count}</div>
                            <div class="tag-cell category-learning">${tag.learning_count}</div>
                            <div class="tag-cell category-mastered">${tag.mastered_count}</div>
                            <div class="tag-cell category-perfected">${tag.perfected_count}</div>
                            <div class="tag-cell ${masteryClass}">${tag.mastery_percentage.toFixed(1)}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Draw session history chart
        this.drawSessionHistoryChart(progressData.session_history);
    }

    // Helper function to get mastery percentage CSS class
    getMasteryClass(percentage) {
        if (percentage >= 95) return 'mastery-excellent';
        if (percentage >= 70) return 'mastery-high';
        return '';
    }

    // Helper function to format duration in minutes to readable format
    formatDuration(minutes) {
        if (!minutes || minutes < 1) return '< 1 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}min`;
    }

    // Helper function to format total training time in hours and minutes
    formatTrainingTime(totalMinutes) {
        if (!totalMinutes || totalMinutes < 1) return '0 min';
        if (totalMinutes < 60) return `${Math.round(totalMinutes)} min`;

        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = Math.round(totalMinutes % 60);
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h${remainingMinutes}min`;
    }

    // Fill in empty days in session history to show gaps
    fillEmptyDays(sessionHistory) {
        if (!sessionHistory || sessionHistory.length === 0) return [];

        const sessions = [...sessionHistory];
        const startDate = new Date(sessions[0].date);
        const endDate = new Date(sessions[sessions.length - 1].date);

        // Create a map of existing sessions by date
        const sessionMap = new Map();
        sessions.forEach(session => {
            sessionMap.set(session.date, session);
        });

        // Fill in complete date range
        const completeData = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            if (sessionMap.has(dateStr)) {
                // Use existing session data
                completeData.push(sessionMap.get(dateStr));
            } else {
                // Create empty day
                completeData.push({
                    date: dateStr,
                    total_questions: 0,
                    correct_answers: 0,
                    incorrect_answers: 0,
                    accuracy: 0
                });
            }

            current.setDate(current.getDate() + 1);
        }

        return completeData;
    }

    // Draw session history chart
    drawSessionHistoryChart(sessionHistory) {
        const canvas = document.getElementById('session-chart');
        const ctx = canvas.getContext('2d');

        if (!sessionHistory || sessionHistory.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No session data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Create complete date range with empty days filled in
        const completeSessionData = this.fillEmptyDays(sessionHistory);

        // Dynamic canvas sizing based on data points
        const minWidth = 400;
        const barWidth = 30; // Fixed bar width for consistency
        const minBarsForExpansion = 7;
        const dynamicWidth = Math.max(minWidth, completeSessionData.length * (barWidth + 10) + 100);

        // Update canvas size if needed
        if (completeSessionData.length > minBarsForExpansion) {
            canvas.width = dynamicWidth;
        } else {
            canvas.width = minWidth;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 40;
        const bottomPadding = 110; // Extra space for rotated labels and legend
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - padding - bottomPadding;
        const maxQuestions = Math.max(...completeSessionData.map(s => s.total_questions), 1);

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();

        // Draw bars
        completeSessionData.forEach((session, index) => {
            const x = padding + index * (barWidth + 10) + 5; // Fixed spacing between bars
            const correctHeight = (session.correct_answers / maxQuestions) * chartHeight;
            const incorrectHeight = (session.incorrect_answers / maxQuestions) * chartHeight;
            const totalHeight = correctHeight + incorrectHeight;

            // Only draw bars if there are questions
            if (session.total_questions > 0) {
                // Draw incorrect answers (bottom, red)
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(x, padding + chartHeight - incorrectHeight, barWidth, incorrectHeight);

                // Draw correct answers (top, green)
                ctx.fillStyle = '#51cf66';
                ctx.fillRect(x, padding + chartHeight - incorrectHeight - correctHeight, barWidth, correctHeight);

                // Draw total count label on top of bar
                ctx.fillStyle = '#333';
                ctx.font = 'bold 12px Inter';
                ctx.textAlign = 'center';
                const totalQuestions = session.total_questions;
                ctx.fillText(totalQuestions.toString(), x + barWidth / 2, padding + chartHeight - totalHeight - 8);
            }

            // Draw rotated date label (positioned below x-axis)
            ctx.save(); // Save current context state
            ctx.translate(x + barWidth / 2, padding + chartHeight + 35); // Move further down from x-axis
            ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise
            ctx.fillStyle = '#666';
            ctx.font = '10px Inter';
            ctx.textAlign = 'right'; // Align to the right so text grows downward from x-axis
            ctx.textBaseline = 'middle';
            const dateLabel = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            ctx.fillText(dateLabel, 0, 0);
            ctx.restore(); // Restore context state
        });

        // Draw legend at bottom
        const legendY = padding + chartHeight + 85;
        ctx.fillStyle = '#51cf66';
        ctx.fillRect(padding, legendY, 15, 15);
        ctx.fillStyle = '#666';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Correct', padding + 20, legendY + 12);

        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(padding + 80, legendY, 15, 15);
        ctx.fillText('Incorrect', padding + 100, legendY + 12);

        // Draw y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = padding + chartHeight - (i / 5) * chartHeight;
            const value = Math.round((i / 5) * maxQuestions);
            ctx.fillText(value.toString(), padding - 5, y + 3);
        }
    }

    // Questions list display
    displayQuestionsList(questions, sortBy = 'question_number') {
        const listContainer = document.getElementById('questions-list');

        if (questions.length === 0) {
            listContainer.innerHTML = '<p>No questions found matching your criteria.</p>';
            return;
        }

        // Sort questions
        const sortedQuestions = [...questions].sort((a, b) => {
            if (sortBy === 'score') {
                return a.score - b.score; // Ascending order for score (weakest first)
            } else {
                return a.question_number - b.question_number;
            }
        });

        listContainer.innerHTML = sortedQuestions.map(question => `
            <div class="question-item" data-question-id="${question.question_number}">
                <div class="question-item-header">
                    <div class="question-item-meta">
                        <strong>Question #${question.question_number}</strong>
                        <div class="question-tags">
                            ${question.tag.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="question-item-actions">
                        ${question.starred ? '<span>⭐</span>' : ''}
                        ${question.note && question.note.trim() ? '<span>📝</span>' : ''}
                        <span>Score: ${question.score}</span>
                    </div>
                </div>
                <div class="question-preview">
                    ${question.question_text.substring(0, 200)}${question.question_text.length > 200 ? '...' : ''}
                </div>
            </div>
        `).join('');

        // Add click listeners to question items
        document.querySelectorAll('.question-item').forEach(item => {
            item.addEventListener('click', () => {
                const questionId = parseInt(item.dataset.questionId);
                this.showQuestionDetail(questionId);
            });
        });
    }

    showQuestionDetail(questionId) {
        // Find the question
        const question = this.currentQuestions?.find(q => q.question_number === questionId);
        if (!question) return;

        // Create question detail content
        const correctAnswers = Object.entries(question.answers).filter(([key, answer]) => answer.status === 'correct');
        const answersHtml = Object.entries(question.answers).map(([key, answer]) => `
            <div class="answer-option ${answer.status === 'correct' ? 'correct' : ''}">
                <span class="answer-letter">${key.toUpperCase()})</span>
                <span class="answer-text">${answer.answer_text}</span>
                ${answer.status === 'correct' ? '<span style="margin-left: auto;">✓</span>' : ''}
            </div>
        `).join('');

        const content = `
            <div class="question-detail">
                <div class="question-meta" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Question #${question.question_number}</strong>
                            <div class="question-tags" style="margin-top: 0.5rem;">
                                ${question.tag.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${question.starred ? '<span>⭐ Starred</span><br>' : ''}
                            <span>Score: ${question.score}</span>
                        </div>
                    </div>
                </div>

                <div class="question-content" style="margin-bottom: 1.5rem;">
                    <h3>${question.question_text}</h3>
                </div>

                <div class="answers-container" style="margin-bottom: 1.5rem;">
                    ${answersHtml}
                </div>

                ${question.note && question.note.trim() ? `
                    <div class="note-section" style="margin-bottom: 1rem; padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">📝 Your Note:</h4>
                        <p>${question.note}</p>
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('question-detail-body').innerHTML = content;
        document.getElementById('question-detail-modal').classList.add('active');
    }

    // Markdown rendering utility
    renderMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    // Show explanation inline
    showExplanationInline(explanation) {
        const explanationSection = document.getElementById('explanation-section');
        const explanationContent = document.getElementById('explanation-content');

        if (explanationSection && explanationContent) {
            explanationContent.innerHTML = `<p>${this.renderMarkdown(explanation)}</p>`;
            explanationSection.style.display = 'block';

            // Disable the explanation button
            const explainBtn = document.getElementById('get-explanation');
            explainBtn.disabled = true;
            explainBtn.textContent = 'Explanation Shown';
            this.explanationShown = true;
        }
    }


    // Utility functions
    showError(message) {
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success notification - could be enhanced with a toast system
        console.log(`Success: ${message}`);
    }

    confirm(message) {
        return confirm(message);
    }
}

// Global UI manager instance
const ui = new UIManager();