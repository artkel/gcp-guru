// API configuration and functions
const API_BASE_URL = 'http://localhost:8000/api';

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.detail || 'API request failed');
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Question endpoints
    async getRandomQuestion(tags = null) {
        let params = '';
        if (tags && tags.length > 0) {
            const urlParams = new URLSearchParams();
            tags.forEach(tag => urlParams.append('tags', tag));
            params = `?${urlParams.toString()}`;
        }
        // Add cache busting parameter to prevent browser caching of 410 responses
        const cacheBuster = params ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
        return this.request(`/questions/random${params}${cacheBuster}`);
    }

    async getQuestions(filters = {}) {
        const params = new URLSearchParams();

        if (filters.tags && filters.tags.length > 0) {
            filters.tags.forEach(tag => params.append('tags', tag));
        }
        if (filters.search) {
            params.append('search', filters.search);
        }
        if (filters.starred_only) {
            params.append('starred_only', 'true');
        }

        return this.request(`/questions?${params.toString()}`);
    }

    async getQuestion(questionId) {
        return this.request(`/questions/${questionId}`);
    }

    async submitAnswer(questionId, selectedAnswers, requestExplanation = false) {
        return this.request(`/questions/${questionId}/answer`, {
            method: 'POST',
            body: JSON.stringify({
                selected_answers: selectedAnswers,
                request_explanation: requestExplanation
            }),
        });
    }

    async getHint(questionId) {
        return this.request(`/questions/${questionId}/hint`);
    }

    async getExplanation(questionId, regenerate = false) {
        const params = regenerate ? '?regenerate=true' : '';
        return this.request(`/questions/${questionId}/explanation${params}`);
    }

    async toggleStar(questionId, starred) {
        return this.request(`/questions/${questionId}/star?starred=${starred}`, {
            method: 'POST',
        });
    }

    async updateNote(questionId, note) {
        const encodedNote = encodeURIComponent(note);
        return this.request(`/questions/${questionId}/note?note=${encodedNote}`, {
            method: 'POST',
        });
    }

    async getAvailableTags() {
        return this.request('/tags');
    }

    // Progress endpoints
    async getProgress() {
        return this.request('/progress');
    }

    async getSessionSummary() {
        return this.request('/progress/session');
    }

    async startNewSession() {
        return this.request('/progress/session/start', {
            method: 'POST',
        });
    }

    async resetProgress() {
        return this.request('/progress/reset', {
            method: 'POST',
        });
    }

    async clearExplanations() {
        return this.request('/progress/clear-explanations', {
            method: 'POST',
        });
    }

    async clearHints() {
        return this.request('/progress/clear-hints', {
            method: 'POST',
        });
    }
}

// Global API client instance
const api = new APIClient();