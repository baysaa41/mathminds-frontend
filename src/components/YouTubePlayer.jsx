// frontend/src/components/YouTubePlayer.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * YouTube Player with Resume Functionality
 * - YouTube IFrame API ашиглан видео үзэж байсан хэсгээсээ үргэлжлүүлэх
 * - Viewport-с гарахад автоматаар паузлах
 * - Хэрэглэгч бүрт тусдаа явц хадгална
 */
const YouTubePlayer = ({ videoId, postId }) => {
  const { user } = useAuth();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null); // Wrapper элемент observer-д хэрэгтэй
  const saveIntervalRef = useRef(null);
  const observerRef = useRef(null);
  const autoPausedRef = useRef(false); // Бид паузласан эсэхийг хадгална
  const [apiReady, setApiReady] = useState(false);

  // LocalStorage key - Хэрэглэгч бүрт тусдаа
  const getStorageKey = useCallback(() => {
    const userId = user?.id || 'guest';
    return `youtube_progress_${userId}_${postId}_${videoId}`;
  }, [user, postId, videoId]);

  // Player бэлэн болоход
  const onPlayerReady = useCallback(() => {
    // Явцыг хадгалах interval
    saveIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime > 0) {
            localStorage.setItem(getStorageKey(), currentTime.toString());
          }
        } catch (e) {
          console.error('Error saving progress:', e);
        }
      }
    }, 5000); // 5 секунд тутамд

    // Intersection Observer үүсгэх (Player бэлэн болсны дараа)
    if (wrapperRef.current && !observerRef.current) {
      console.log('Setting up Intersection Observer');
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            console.log('Intersection ratio:', entry.intersectionRatio);

            try {
              if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                const state = playerRef.current.getPlayerState();
                console.log('Player state:', state);

                // Харагдахгүй болсон бол (10%-с бага харагдаж байвал) - ПАУЗЛАХ
                if (entry.intersectionRatio < 0.1) {
                  // YouTube PlayerState: 1 = PLAYING
                  if (state === 1) {
                    playerRef.current.pauseVideo();
                    autoPausedRef.current = true; // Бид паузласан гэж тэмдэглэх
                    console.log('⏸️ Video paused - out of viewport');
                  }
                }
                // Буцаад харагдаж байвал (50%-с их харагдаж байвал) - ҮРГЭЛЖЛҮҮЛЭХ
                else if (entry.intersectionRatio >= 0.5) {
                  // Зөвхөн бид паузласан бол үргэлжлүүлнэ
                  // YouTube PlayerState: 2 = PAUSED
                  if (state === 2 && autoPausedRef.current) {
                    playerRef.current.playVideo();
                    autoPausedRef.current = false; // Reset
                    console.log('▶️ Video resumed - back in viewport');
                  }
                }
              }
            } catch (e) {
              console.error('Error in intersection observer:', e);
            }
          });
        },
        {
          threshold: [0, 0.1, 0.5, 1.0],
          rootMargin: '0px',
        }
      );

      observerRef.current.observe(wrapperRef.current);
      console.log('Observer is now watching wrapper element');
    }
  }, [getStorageKey]);

  // Player төлөв өөрчлөгдөхөд
  const onPlayerStateChange = useCallback((event) => {
    // Видео дууссан бол хадгалсан цагийг устгах
    if (event.data === window.YT.PlayerState.ENDED) {
      localStorage.removeItem(getStorageKey());
      autoPausedRef.current = false; // Reset
    }

    // Тоглож эхэлсэн бол (хэрэглэгч manual play дарсан байж болно)
    if (event.data === window.YT.PlayerState.PLAYING) {
      // Хэрэв бид паузласан байсан ч хэрэглэгч manual play дарвал reset хийх
      // (Observer автоматаар үргэлжлүүлэхээс өмнө хэрэглэгч өөрөө дарсан тохиолдол)
      if (autoPausedRef.current) {
        autoPausedRef.current = false;
        console.log('User manually played - resetting autoPause flag');
      }
    }

    // Паузлахад ч хадгална
    if (event.data === window.YT.PlayerState.PAUSED) {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          localStorage.setItem(getStorageKey(), currentTime.toString());
        } catch (e) {
          console.error('Error saving progress on pause:', e);
        }
      }
    }
  }, [getStorageKey]);

  // YouTube IFrame API script ачаалах
  useEffect(() => {
    // API аль хэдийн ачаалагдсан эсэхийг шалгах
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    // YouTube IFrame API script нэмэх
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // API бэлэн болсныг хүлээх
    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };

    // Хэрэв API аль хэдийн ачаалагдсан бол
    if (window.YT && window.YT.Player) {
      setApiReady(true);
    }
  }, []);

  // YouTube Player үүсгэх
  useEffect(() => {
    if (!apiReady || !containerRef.current) return;

    // Өмнө хадгалсан цагийг авах
    const savedTime = localStorage.getItem(getStorageKey());
    const startSeconds = savedTime ? parseFloat(savedTime) : 0;

    // Player үүсгэх
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        start: Math.floor(startSeconds), // Хадгалсан цагаас эхлэх
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    return () => {
      // Cleanup
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
    };
  }, [apiReady, videoId, getStorageKey, onPlayerReady, onPlayerStateChange]);

  return (
    <div
      ref={wrapperRef}
      className="ratio ratio-16x9 mt-2 rounded"
      style={{ width: '100%', overflow: 'hidden', border: '1px solid #dee2e6' }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default YouTubePlayer;
