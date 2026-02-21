// ./hooks/useInfiniteScroll.js

import { useRef, useEffect, useCallback } from 'react';

const useInfiniteScroll = (loadMore, hasMore, loadingMore, scrollRef = null) => {
  const triggerRef = useRef(null);
  const observerRef = useRef(null);

  const stableLoadMore = useCallback(loadMore, [loadMore]);

  useEffect(() => {
    if (loadingMore || !hasMore) {
      // Хэрэв ачаалж байгаа бол хуучин observer-г салгаж болно
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    const handleObserver = (entries) => {
      const target = entries[0];

      if (target.isIntersecting) {
        // Давхар дуудлагаас сэргийлэх: Шууд disconnect хий
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        stableLoadMore();
      }
    };

    const rootElement = scrollRef ? scrollRef.current : null;

    const options = {
      root: rootElement,
      rootMargin: '0px 0px 600px 0px',
      threshold: 0.01,
    };

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, options);

    const { current: observer } = observerRef;
    const { current: target } = triggerRef;

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
    // (!!!) "scrollRef" хамаарлыг нэмсэн (энэ нь ref.current биш ref object тул зүгээр)
  }, [stableLoadMore, hasMore, loadingMore, scrollRef]);

  return { triggerRef };
};

export default useInfiniteScroll;
