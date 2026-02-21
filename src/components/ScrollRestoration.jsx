// src/components/ScrollRestoration.jsx
// Хуудас хооронд шилжихэд scroll position хадгалж, буцаж ирэхэд сэргээнэ

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollRestoration = ({ scrollRef }) => {
  const location = useLocation();
  // Одоогийн pathname-г ref-д хадгалах (closure-д зөв утга байхын тулд)
  const currentPathRef = useRef(location.pathname);
  // Сүүлийн scroll position хадгалах
  const lastScrollRef = useRef(0);

  // pathname өөрчлөгдөхөд ref-г шинэчлэх
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  // Scroll event handler - debounce хийсэн
  const saveScrollPosition = useCallback(() => {
    const scrollElement = scrollRef?.current;
    if (!scrollElement) return;

    const path = currentPathRef.current;
    const scrollTop = scrollElement.scrollTop;
    lastScrollRef.current = scrollTop;

    const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    scrollPositions[path] = scrollTop;
    sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
  }, [scrollRef]);

  // Scroll event listener
  useEffect(() => {
    const scrollElement = scrollRef?.current;
    if (!scrollElement) return;

    let timeoutId;
    const handleScroll = () => {
      // Debounce - 100ms дотор олон удаа хадгалахгүй
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScrollPosition, 100);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, saveScrollPosition]);

  // Хуудас бүрийн scroll position-г тусад нь хадгалах ref
  const scrollPositionsRef = useRef({});

  // Scroll хийх бүрт ref-д хадгалах (sessionStorage-с гадна)
  useEffect(() => {
    const scrollElement = scrollRef?.current;
    if (!scrollElement) return;

    const trackScroll = () => {
      const path = currentPathRef.current;
      const scrollTop = scrollElement.scrollTop;
      scrollPositionsRef.current[path] = scrollTop;

      // sessionStorage-д бас хадгалах
      const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      scrollPositions[path] = scrollTop;
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
    };

    scrollElement.addEventListener('scroll', trackScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', trackScroll);
  }, [scrollRef]);

  // Хуудас солигдохын ӨМНӨ scroll position хадгалах
  useEffect(() => {
    const pathAtMount = location.pathname;

    // Mount болоход одоогийн scroll-г ref-д хадгалах
    const scrollElement = scrollRef?.current;
    if (scrollElement) {
      scrollPositionsRef.current[pathAtMount] = scrollElement.scrollTop;
    }

    return () => {
      // Cleanup: ref-д хадгалсан утгыг sessionStorage-д хадгалах
      // Note: scrollPositionsRef is intentionally captured at cleanup time
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const savedScroll = scrollPositionsRef.current[pathAtMount];
      if (savedScroll !== undefined && savedScroll > 0) {
        const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        scrollPositions[pathAtMount] = savedScroll;
        sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
      }
    };
  }, [location.pathname, scrollRef]);

  // Хуудас солигдоход scroll position сэргээх
  useEffect(() => {
    const scrollElement = scrollRef?.current;
    if (!scrollElement) return;

    const currentPath = location.pathname;
    const scrollPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
    const savedPosition = scrollPositions[currentPath];

    if (savedPosition !== undefined && savedPosition > 0) {
      // DOM бэлэн болтол хүлээх
      const timeoutId = setTimeout(() => {
        scrollElement.scrollTo(0, savedPosition);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, scrollRef]);

  return null;
};

export default ScrollRestoration;
