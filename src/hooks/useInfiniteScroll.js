// frontend/src/hooks/useInfiniteScroll.js
import { useRef, useEffect, useCallback } from 'react';

/**
 * Infinite scroll-ын функцийг хэрэгжүүлэх hook
 *
 * @param {Function} loadMore - Дараагийн хуудас ачаалах функц
 * @param {boolean} hasMore - Цааш өгөгдөл байгаа эсэх
 * @param {boolean} loadingMore - Одоо ачааллаж байгаа эсэх
 * @returns {Object} - { triggerRef } - Харагдах үед trigger хийх ref
 */
const useInfiniteScroll = (loadMore, hasMore, loadingMore) => {
    const triggerRef = useRef(null);
    const observerRef = useRef(null);

    const handleObserver = useCallback((entries) => {
        const [target] = entries;

        // Хэрэв элемент харагдаж байгаа бөгөөд цааш өгөгдөл байгаа бол ачаална
        if (target.isIntersecting && hasMore && !loadingMore) {
            loadMore();
        }
    }, [loadMore, hasMore, loadingMore]);

    useEffect(() => {
        const options = {
            root: null, // viewport
            rootMargin: '100px', // 100px өмнө нь ачаална
            threshold: 0.1 // 10% харагдвал
        };

        // IntersectionObserver үүсгэх
        observerRef.current = new IntersectionObserver(handleObserver, options);

        // Trigger элементийг ажиглаж эхлэх
        const currentTrigger = triggerRef.current;
        if (currentTrigger) {
            observerRef.current.observe(currentTrigger);
        }

        // Cleanup
        return () => {
            if (observerRef.current && currentTrigger) {
                observerRef.current.unobserve(currentTrigger);
            }
        };
    }, [handleObserver]);

    return { triggerRef };
};

export default useInfiniteScroll;