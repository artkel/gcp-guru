// Main application logic and event handlers

// Updated: 2025-09-18 16:43 - Fixed session start bug
class GCPGuruApp {
    constructor() {
        this.currentTags = null;
        this.availableTags = [];
        this.selectedDomains = [];
        this.init();
    }

    async init() {
        // Initialize theme
        ui.initializeTheme();

        // Load available tags
        try {
            const tagsData = await api.getAvailableTags();
            this.availableTags = tagsData.tags;
            this.populateTagFilter();
        } catch (error) {
            console.error('Failed to load tags:', error);
        }

        // Set up event listeners
        this.setupEventListeners();

        // Show start screen
        ui.showScreen('start-screen');
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            ui.toggleTheme();
        });

        // Start screen buttons
        document.getElementById('start-training').addEventListener('click', () => {
            this.showDomainSelection();
        });

        document.getElementById('view-progress').addEventListener('click', () => {
            this.showProgress();
        });

        document.getElementById('browse-questions').addEventListener('click', () => {
            this.showBrowseQuestions();
        });

        // Back buttons
        document.getElementById('back-to-start').addEventListener('click', () => {
            this.handleBackToStart();
        });

        document.getElementById('back-to-start-progress').addEventListener('click', () => {
            ui.showScreen('start-screen');
        });

        document.getElementById('back-to-start-browse').addEventListener('click', () => {
            ui.showScreen('start-screen');
        });

        // Training controls
        document.getElementById('submit-answer').addEventListener('click', () => {
            this.submitAnswer();
        });

        document.getElementById('get-explanation').addEventListener('click', () => {
            this.showExplanation();
        });

        document.getElementById('next-question').addEventListener('click', () => {
            this.loadNextQuestion();
        });

        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('star-btn').addEventListener('click', () => {
            this.toggleStar();
        });

        document.getElementById('note-btn').addEventListener('click', () => {
            this.showNote();
        });

        // Progress controls
        document.getElementById('reset-progress').addEventListener('click', () => {
            this.resetProgress();
        });

        document.getElementById('clear-explanations').addEventListener('click', () => {
            this.clearExplanations();
        });

        document.getElementById('clear-hints').addEventListener('click', () => {
            this.clearHints();
        });

        // Browse controls
        document.getElementById('search-input').addEventListener('input', () => {
            this.searchQuestions();
        });

        document.getElementById('tag-filter').addEventListener('change', () => {
            this.filterQuestions();
        });

        document.getElementById('starred-only').addEventListener('change', () => {
            this.filterQuestions();
        });

        document.getElementById('sort-filter').addEventListener('change', () => {
            this.filterQuestions();
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            ui.hideModal();
        });

        // Close modal on background click
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                ui.hideModal();
            }
        });

        document.getElementById('question-detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'question-detail-modal') {
                ui.hideModal();
            }
        });

        document.getElementById('close-question-detail').addEventListener('click', () => {
            ui.hideModal();
        });

        // Domain selection controls
        document.getElementById('back-to-start-domain').addEventListener('click', () => {
            ui.showScreen('start-screen');
        });

        document.getElementById('start-domain-training').addEventListener('click', () => {
            this.startTrainingWithDomains();
        });

        document.getElementById('all-domains').addEventListener('change', (e) => {
            this.toggleAllDomains(e.target.checked);
        });

        // End session control
        document.getElementById('end-session').addEventListener('click', () => {
            this.endSession();
        });
    }

    showDomainSelection() {
        ui.showScreen('domain-selection-screen');
        this.populateDomainList();
    }

    populateDomainList() {
        const domainList = document.getElementById('domain-list');
        domainList.innerHTML = this.availableTags.map(tag => `
            <label class="domain-checkbox">
                <input type="checkbox" value="${tag}" class="domain-checkbox-input">
                <span class="checkmark"></span>
                <span class="domain-name">${tag}</span>
            </label>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.domain-checkbox-input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDomainSelection();
            });
        });
    }

    toggleAllDomains(checked) {
        document.querySelectorAll('.domain-checkbox-input').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateDomainSelection();
    }

    updateDomainSelection() {
        const selectedDomains = Array.from(document.querySelectorAll('.domain-checkbox-input:checked'))
            .map(checkbox => checkbox.value);

        const allDomainsCheckbox = document.getElementById('all-domains');
        const isAllSelected = allDomainsCheckbox.checked;

        this.selectedDomains = isAllSelected ? null : selectedDomains;

        // Update submit button state
        const submitBtn = document.getElementById('start-domain-training');
        submitBtn.disabled = !isAllSelected && selectedDomains.length === 0;
    }

    async startTrainingWithDomains() {
        console.log('DEBUG: startTrainingWithDomains called, selectedDomains:', this.selectedDomains);
        ui.showLoading();
        try {
            // Start new session on backend to reset question tracking
            console.log('DEBUG: Calling api.startNewSession()');
            await api.startNewSession();
            console.log('DEBUG: Session started, adding delay');
            // Small delay to ensure session reset is fully processed
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('DEBUG: Setting currentTags to', this.selectedDomains);
            this.currentTags = this.selectedDomains;
            ui.showScreen('training-screen');
            ui.startSessionTimer(); // Start the session timer
            console.log('DEBUG: About to call loadNextQuestion');
            await this.loadNextQuestion();
            console.log('DEBUG: loadNextQuestion completed');
        } catch (error) {
            ui.showError('Failed to start training session');
            console.error('Training start error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async startTraining() {
        ui.showLoading();
        try {
            // Start new session on backend to reset question tracking
            await api.startNewSession();
            // Small delay to ensure session reset is fully processed
            await new Promise(resolve => setTimeout(resolve, 100));
            ui.showScreen('training-screen');
            ui.startSessionTimer(); // Start the session timer
            await this.loadNextQuestion();
        } catch (error) {
            ui.showError('Failed to start training session');
            console.error('Training start error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async loadNextQuestion() {
        ui.showLoading();
        try {
            const question = await api.getRandomQuestion(this.currentTags);
            ui.displayQuestion(question);
        } catch (error) {
            // Check if this is a session complete error (410)
            if (error.status === 410) {
                // Session is complete - automatically end session and show summary
                ui.hideLoading();
                await this.endSessionAutomatically(error.message);
                return;
            }
            ui.showError('Failed to load question');
            console.error('Question load error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async endSessionAutomatically(message = null) {
        try {
            // Stop timer first
            ui.stopSessionTimer();

            // Get current session stats from backend to ensure accuracy
            const backendSessionStats = await api.getSessionSummary();

            // Fallback to UI stats if backend call fails
            const sessionStats = backendSessionStats || ui.sessionStats;

            // Calculate session duration
            const sessionStart = new Date(sessionStats.sessionStart || Date.now());
            const sessionEnd = new Date();
            const durationMs = sessionEnd - sessionStart;
            const durationMinutes = Math.round(durationMs / 60000);

            // Show session complete modal
            const summary = `
                <div class="session-summary">
                    <h3>🎉 Session Complete!</h3>
                    <p style="margin-bottom: 1rem;">${message || "You've completed all available questions for this session!"}</p>
                    <div class="session-metrics">
                        <div class="metric">
                            <span class="metric-label">Questions Completed:</span>
                            <span class="metric-value">${sessionStats.questions_answered || sessionStats.total || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Correct Answers:</span>
                            <span class="metric-value">${sessionStats.correct_answers || sessionStats.correct || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Incorrect Answers:</span>
                            <span class="metric-value">${sessionStats.incorrect_answers || ((sessionStats.total || sessionStats.questions_answered || 0) - (sessionStats.correct_answers || sessionStats.correct || 0))}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Accuracy:</span>
                            <span class="metric-value">${(sessionStats.accuracy_percentage || sessionStats.accuracy || 0).toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Time Spent:</span>
                            <span class="metric-value">${durationMinutes} minutes</span>
                        </div>
                    </div>
                </div>
            `;

            ui.showModal('Session Complete', summary);

            // Save session - this will save the current session with correct stats
            await api.startNewSession();

            // Reset session stats and go to start screen after modal is closed
            setTimeout(() => {
                ui.sessionStats = { total: 0, correct: 0, accuracy: 0, sessionStart: Date.now() };
                ui.showScreen('start-screen');
            }, 100);

        } catch (error) {
            console.error('Error ending session automatically:', error);
            ui.showError('Session completed, but failed to save results');
        }
    }

    async submitAnswer() {
        if (ui.selectedAnswers.size === 0) return;

        ui.showLoading();
        try {
            const selectedAnswers = Array.from(ui.selectedAnswers);
            const result = await api.submitAnswer(
                ui.currentQuestion.question_number,
                selectedAnswers,
                false // Don't request explanation initially for faster response
            );

            ui.showAnswerFeedback(result);
        } catch (error) {
            ui.showError('Failed to submit answer');
            console.error('Answer submission error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async showExplanation() {
        ui.showLoading();
        try {
            const result = await api.getExplanation(ui.currentQuestion.question_number);
            ui.showExplanationInline(result.explanation);
        } catch (error) {
            ui.showError('Failed to load explanation');
            console.error('Explanation error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async showHint() {
        ui.showLoading();
        try {
            const result = await api.getHint(ui.currentQuestion.question_number);
            ui.showModal('Hint', result.hint);
        } catch (error) {
            ui.showError('Failed to load hint');
            console.error('Hint error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async toggleStar() {
        try {
            const currentStarred = ui.currentQuestion.starred;
            const newStarred = !currentStarred;

            await api.toggleStar(ui.currentQuestion.question_number, newStarred);

            // Update UI
            ui.currentQuestion.starred = newStarred;
            const starBtn = document.getElementById('star-btn');
            starBtn.classList.toggle('starred', newStarred);

            ui.showSuccess(newStarred ? 'Question starred' : 'Question unstarred');
        } catch (error) {
            ui.showError('Failed to update star status');
            console.error('Star toggle error:', error);
        }
    }

    async showProgress() {
        ui.showLoading();
        try {
            const progressData = await api.getProgress();
            ui.showScreen('progress-screen');
            ui.displayProgress(progressData);
        } catch (error) {
            ui.showError('Failed to load progress data');
            console.error('Progress error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async resetProgress() {
        if (!ui.confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
            return;
        }

        ui.showLoading();
        try {
            await api.resetProgress();
            ui.showSuccess('Progress has been reset');

            // Refresh progress display if currently viewing
            if (ui.currentScreen === 'progress-screen') {
                const progressData = await api.getProgress();
                ui.displayProgress(progressData);
            }
        } catch (error) {
            ui.showError('Failed to reset progress');
            console.error('Reset progress error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async clearExplanations() {
        if (!ui.confirm('Are you sure you want to delete all explanations? This action cannot be undone.')) {
            return;
        }

        ui.showLoading();
        try {
            await api.clearExplanations();
            ui.showSuccess('All explanations have been cleared');
        } catch (error) {
            ui.showError('Failed to clear explanations');
            console.error('Clear explanations error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async clearHints() {
        if (!ui.confirm('Are you sure you want to delete all hints? This action cannot be undone.')) {
            return;
        }

        ui.showLoading();
        try {
            await api.clearHints();
            ui.showSuccess('All hints have been cleared');
        } catch (error) {
            ui.showError('Failed to clear hints');
            console.error('Clear hints error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async showBrowseQuestions() {
        ui.showLoading();
        try {
            ui.showScreen('browse-screen');
            await this.loadQuestionsList();
        } catch (error) {
            ui.showError('Failed to load questions');
            console.error('Browse questions error:', error);
        } finally {
            ui.hideLoading();
        }
    }

    async loadQuestionsList(filters = {}) {
        try {
            const questions = await api.getQuestions(filters);
            ui.currentQuestions = questions; // Store for detail view
            const sortBy = document.getElementById('sort-filter')?.value || 'question_number';
            ui.displayQuestionsList(questions, sortBy);
        } catch (error) {
            ui.showError('Failed to load questions list');
            console.error('Questions list error:', error);
        }
    }

    async searchQuestions() {
        const searchTerm = document.getElementById('search-input').value;
        const filters = this.getBrowseFilters();
        filters.search = searchTerm;
        await this.loadQuestionsList(filters);
    }

    async filterQuestions() {
        const filters = this.getBrowseFilters();
        await this.loadQuestionsList(filters);
    }

    getBrowseFilters() {
        const tagFilter = document.getElementById('tag-filter').value;
        const starredOnly = document.getElementById('starred-only').checked;
        const searchTerm = document.getElementById('search-input').value;

        const filters = {};

        if (tagFilter) {
            filters.tags = [tagFilter];
        }
        if (starredOnly) {
            filters.starred_only = true;
        }
        if (searchTerm) {
            filters.search = searchTerm;
        }

        return filters;
    }

    async showNote() {
        const currentNote = ui.currentQuestion?.note || '';
        ui.showNoteModal(currentNote);

        // Set up note modal event listeners (need to be added each time)
        setTimeout(() => {
            document.getElementById('save-note')?.addEventListener('click', async () => {
                await this.saveNote();
            });

            document.getElementById('cancel-note')?.addEventListener('click', () => {
                ui.hideModal();
            });

            // Save on Enter key
            document.getElementById('note-input')?.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.saveNote();
                }
            });
        }, 100);
    }

    async saveNote() {
        const noteInput = document.getElementById('note-input');
        const note = noteInput?.value || '';

        try {
            await api.updateNote(ui.currentQuestion.question_number, note);

            // Update the current question
            ui.currentQuestion.note = note;

            // Update note button appearance
            const noteBtn = document.getElementById('note-btn');
            noteBtn.classList.toggle('has-note', note.trim() !== '');

            ui.hideModal();
            ui.showSuccess('Note saved successfully');
        } catch (error) {
            ui.showError('Failed to save note');
            console.error('Save note error:', error);
        }
    }

    populateTagFilter() {
        const tagSelect = document.getElementById('tag-filter');
        tagSelect.innerHTML = '<option value="">All Topics</option>' +
            this.availableTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    }

    async endSession() {
        if (!ui.confirm('Are you sure you want to end your current session? Your progress will be saved and you will see your session metrics.')) {
            return;
        }

        ui.stopSessionTimer(); // Stop the session timer

        try {
            // Get current session stats
            const sessionStats = ui.sessionStats;

            // Calculate session duration
            const sessionStart = new Date(sessionStats.sessionStart || Date.now());
            const sessionEnd = new Date();
            const durationMs = sessionEnd - sessionStart;
            const durationMinutes = Math.round(durationMs / 60000);

            // Calculate tag breakdown
            const tagBreakdown = this.getSessionTagBreakdown();

            // Show session summary modal
            const summary = `
                <div class="session-summary">
                    <h3>🎯 Session Complete!</h3>
                    <div class="session-metrics">
                        <div class="metric">
                            <span class="metric-label">Questions Exercised:</span>
                            <span class="metric-value">${sessionStats.total}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Correct Answers:</span>
                            <span class="metric-value">${sessionStats.correct}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Incorrect Answers:</span>
                            <span class="metric-value">${sessionStats.total - sessionStats.correct}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Accuracy:</span>
                            <span class="metric-value">${sessionStats.accuracy}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Time Spent:</span>
                            <span class="metric-value">${durationMinutes} minutes</span>
                        </div>
                    </div>
                    ${tagBreakdown ? `
                        <div class="tag-breakdown">
                            <h4>Performance by Topic:</h4>
                            ${tagBreakdown}
                        </div>
                    ` : ''}
                </div>
            `;

            ui.showModal('Session Summary', summary);

            // Save session to daily history by starting a new session (which saves the current one)
            await api.startNewSession();

            // Reset session stats and go to start screen after modal is closed
            setTimeout(() => {
                ui.sessionStats = { total: 0, correct: 0, accuracy: 0, sessionStart: Date.now() };
                ui.showScreen('start-screen');
            }, 100);

        } catch (error) {
            console.error('Error ending session:', error);
            ui.showError('Failed to end session');
        }
    }

    getSessionTagBreakdown() {
        // This would require tracking questions asked during the session
        // For now, return null as we don't have this data structure
        // Could be enhanced to track tags during the session
        return null;
    }

    async handleBackToStart() {
        // Check if there's an active session (questions answered)
        if (ui.sessionStats.total > 0) {
            if (ui.confirm('End your session? Your progress will be saved but no session metrics will be shown.')) {
                ui.stopSessionTimer(); // Stop the session timer

                // Save session to daily history
                await api.startNewSession();

                // Reset session stats and go to start screen
                ui.sessionStats = { total: 0, correct: 0, accuracy: 0, sessionStart: Date.now() };
                ui.showScreen('start-screen');
            }
        } else {
            ui.stopSessionTimer(); // Stop the session timer
            // No active session, just go back
            ui.showScreen('start-screen');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GCPGuruApp();
});