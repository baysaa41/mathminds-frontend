// hooks/usePaginatedFetch.js
// ✅ САЙЖРУУЛСАН хувилбар - Error callback дэмжсэн
// (!!! ШИНЭЧИЛСЭН: loadMore үед шүүлтүүрийг хадгалдаг болсон)

import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';

const usePaginatedFetch = (endpoint, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [nextPage, setNextPage] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // (!!!) 1. Шүүлтүүрийг хадгалах state нэмэх
    const [currentParams, setCurrentParams] = useState({});

    const { onError } = options;

    const fetchData = useCallback(async (params = {}, reset = true) => {
        if (reset) {
            setLoading(true);
            setData([]);
            setNextPage(null);
            setHasMore(true);
            // (!!!) 2. Шинэ шүүлтүүрийг state-д хадгалах
            setCurrentParams(params);
        }

        setError(null);

        try {
            const response = await apiClient.get(endpoint, {
                // (!!!) 3. 'params'-г энд ашиглах
                params: { ...params, page: 1 }
            });

            setData(response.data.results || response.data);
            setNextPage(response.data.next);
            setHasMore(!!response.data.next);
        } catch (err) {
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Алдаа гарлаа';
            setError(errorMessage);
            if (onError) onError(err);
        } finally {
            setLoading(false);
        }
    }, [endpoint, onError]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !nextPage) return;

        setLoadingMore(true);
        setError(null);

        try {
            const urlParams = new URLSearchParams(nextPage.split('?')[1]);
            const pageNum = urlParams.get('page');

            const response = await apiClient.get(endpoint, {
                // (!!!) 4. Хадгалсан шүүлтүүр дээр 'page' дугаарыг нэмэх
                params: { ...currentParams, page: pageNum }
            });

            setData(prev => [...prev, ...(response.data.results || response.data)]);
            setNextPage(response.data.next);
            setHasMore(!!response.data.next);
        } catch (err) {
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Алдаа гарлаа';
            setError(errorMessage);
            if (onError) onError(err);
            throw err;
        } finally {
            setLoadingMore(false);
        }
        // (!!!) 5. 'currentParams'-г dependency-д нэмэх
    }, [endpoint, nextPage, hasMore, loadingMore, onError, currentParams]);

    const refresh = useCallback(() => {
        // (!!!) 6. Refresh хийхдээ хадгалсан шүүлтүүрийг ашиглах
        fetchData(currentParams);
    }, [fetchData, currentParams]);

    return {
        data,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh,
        setData
    };
};

export default usePaginatedFetch;