// frontend/src/hooks/usePaginatedFetch.js
import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';

/**
 * Pagination бүхий өгөгдөл татах универсал hook
 *
 * @param {string} endpoint - API endpoint
 * @returns {Object} - { data, loading, error, hasMore, fetchData, loadMore, refresh }
 */
const usePaginatedFetch = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [nextPageUrl, setNextPageUrl] = useState(null);

    // Эхний ачаалалт эсвэл шинэ хайлт
    const fetchData = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            setNextPageUrl(null);

            const response = await apiClient.get(endpoint, { params });

            if (response.data && Array.isArray(response.data.results)) {
                setData(response.data.results);
                setNextPageUrl(response.data.next);
            } else if (Array.isArray(response.data)) {
                setData(response.data);
                setNextPageUrl(null);
            } else {
                console.warn("Unexpected API response format:", response.data);
                setData([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.detail || 'Өгөгдөл татахад алдаа гарлаа.');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    // Дараагийн хуудас ачаалах
    const loadMore = useCallback(async () => {
        if (!nextPageUrl || loadingMore) return;

        try {
            setLoadingMore(true);
            setError(null);

            const response = await apiClient.get(nextPageUrl);

            if (response.data && Array.isArray(response.data.results)) {
                if (response.data.results.length > 0) {
                    setData(prev => [...prev, ...response.data.results]);
                    setNextPageUrl(response.data.next);
                } else {
                    setNextPageUrl(null);
                }
            } else {
                setNextPageUrl(null);
            }
        } catch (err) {
            console.error('Load more error:', err);
            setError('Нэмэлт өгөгдөл татахад алдаа гарлаа.');
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageUrl, loadingMore]);

    // Бүх өгөгдлийг дахин ачаалах
    const refresh = useCallback((params = {}) => {
        return fetchData(params);
    }, [fetchData]);

    return {
        data,
        loading,
        loadingMore,
        error,
        hasMore: !!nextPageUrl,
        fetchData,
        loadMore,
        refresh
    };
};

export default usePaginatedFetch;