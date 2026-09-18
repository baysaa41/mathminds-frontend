// hooks/usePaginatedFetch.js
// ✅ САЙЖРУУЛСАН хувилбар - Error callback дэмжсэн
// (!!! ШИНЭЧИЛСЭН: loadMore үед шүүлтүүрийг хадгалдаг болсон)
// (!!! ШИНЭЧИЛСЭН: 1-р хуудсыг кэшээс шууд харуулж, фон дээр шинэчилнэ)

import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import apiCache from '../api/apiCache';

const usePaginatedFetch = (endpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  // DRF pagination-ийн нийт бичлогийн тоо (results биш)
  const [totalCount, setTotalCount] = useState(null);

  // (!!!) 1. Шүүлтүүрийг хадгалах state нэмэх
  const [currentParams, setCurrentParams] = useState({});

  // Хэдэн хуудас татсаныг санана. Хэрэглэгч 1-ээс олон хуудас үзсэн бол
  // фон шинэчлэлт 1-р хуудсаар бүх жагсаалтыг дарж бичих ёсгүй.
  const pagesLoadedRef = useRef(1);

  const { onError } = options;

  const applyPage = useCallback((payload) => {
    setData(payload.results || payload);
    setNextPage(payload.next);
    setHasMore(!!payload.next);
    setTotalCount(payload.count ?? null);
  }, []);

  const fetchData = useCallback(
    async (params = {}, reset = true) => {
      if (reset) {
        // (!!!) 2. Шинэ шүүлтүүрийг state-д хадгалах
        setCurrentParams(params);
        pagesLoadedRef.current = 1;

        // Кэш байвал шууд харуулна — spinner гарахгүй. Дараах
        // apiClient.get нь кэшээс тэр даруй буцаж, фон дээр шинэчилнэ.
        const cached = apiCache.peek(
          apiCache.cacheKey(endpoint, { params: { ...params, page: 1 } })
        );
        if (cached) {
          applyPage(cached.data);
          setLoading(false);
        } else {
          setLoading(true);
          setData([]);
          setNextPage(null);
          setHasMore(true);
        }
      }

      setError(null);

      try {
        const response = await apiClient.get(endpoint, {
          // (!!!) 3. 'params'-г энд ашиглах
          params: { ...params, page: 1 },
        });

        applyPage(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Алдаа гарлаа';
        setError(errorMessage);
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onError, applyPage]
  );

  // Фон дээрх шинэчлэлт (revalidate) ирвэл жагсаалтыг солино
  useEffect(() => {
    const key = apiCache.cacheKey(endpoint, {
      params: { ...currentParams, page: 1 },
    });
    return apiCache.subscribe(key, (payload) => {
      if (pagesLoadedRef.current > 1) return;
      applyPage(payload);
    });
  }, [endpoint, currentParams, applyPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextPage) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const urlParams = new URLSearchParams(nextPage.split('?')[1]);
      const pageNum = urlParams.get('page');

      const response = await apiClient.get(endpoint, {
        // (!!!) 4. Хадгалсан шүүлтүүр дээр 'page' дугаарыг нэмэх
        params: { ...currentParams, page: pageNum },
      });

      setData((prev) => [...prev, ...(response.data.results || response.data)]);
      setNextPage(response.data.next);
      setHasMore(!!response.data.next);
      pagesLoadedRef.current += 1;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Алдаа гарлаа';
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
    totalCount,
    fetchData,
    loadMore,
    refresh,
    setData,
  };
};

export default usePaginatedFetch;
