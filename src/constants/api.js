// frontend/src/constants/api.js

export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/users/api/login/',
        LOGOUT: '/users/api/logout/',
        REFRESH: '/users/api/token/refresh/',
        CURRENT_USER: '/users/api/current-user/',
        EXCHANGE_CODE: '/users/api/exchange-code/'
    },

    // Minds (Social)
    MINDS: {
        POSTS: '/api/minds/posts/',
        POST_DETAIL: (id) => `/api/minds/posts/${id}/`,
        POST_FAVORITE: (id) => `/api/minds/posts/${id}/favorite/`,
        POST_BOOKMARK: (id) => `/api/minds/posts/${id}/bookmark/`,
        POST_VIEW: (id) => `/api/minds/posts/${id}/view/`,
        BOOKMARKED_POSTS: '/api/minds/posts/bookmarked/',
        TRENDING_POSTS: '/api/minds/posts/trending/',
        COMMENTS: '/api/minds/comments/',
        COMMENT_DETAIL: (id) => `/api/minds/comments/${id}/`,
        CREATE_FROM_ARTICLE: '/api/minds/posts/create-from-article/',
        CREATE_FROM_PROBLEM: '/api/minds/posts/create-from-problem/',
        CREATE_FROM_FORMULA: '/api/minds/posts/create-from-formula/'
    },

    // Integral (Content)
    INTEGRAL: {
        // Articles
        ARTICLES: '/api/integral/articles/',
        ARTICLE_DETAIL: (id) => `/api/integral/articles/${id}/`,

        // Problems
        PROBLEMS: '/api/integral/problems/',
        PROBLEM_DETAIL: (id) => `/api/integral/problems/${id}/`,
        PROBLEM_CLONE: (id) => `/api/integral/problems/${id}/clone/`,
        PROBLEM_KEYWORDS_ADD: (id) => `/api/integral/problems/${id}/keywords/add/`,
        PROBLEM_KEYWORDS_REMOVE: (id) => `/api/integral/problems/${id}/keywords/remove/`,

        // Solutions
        SOLUTIONS: '/api/integral/solutions/',
        SOLUTION_DETAIL: (id) => `/api/integral/solutions/${id}/`,

        // Formulas
        FORMULAS: '/api/integral/formulas/',
        FORMULA_DETAIL: (id) => `/api/integral/formulas/${id}/`,
        FORMULA_CLONE: (id) => `/api/integral/formulas/${id}/clone/`,
        FORMULA_KEYWORDS_ADD: (id) => `/api/integral/formulas/${id}/keywords/add/`,
        FORMULA_KEYWORDS_REMOVE: (id) => `/api/integral/formulas/${id}/keywords/remove/`,

        // Quizzes
        QUIZZES: '/api/integral/quizzes/',
        QUIZ_DETAIL: (id) => `/api/integral/quizzes/${id}/`,

        // Keywords & Topics
        KEYWORDS: '/api/integral/keywords/',
        KEYWORD_SEARCH: '/api/integral/keywords/search/',
        TOPICS: '/api/integral/topics/',
        TOPIC_DETAIL: (id) => `/api/integral/topics/${id}/`
    }
};

export default API_ENDPOINTS;