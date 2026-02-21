// frontend/src/components/VimeoPlayer.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Vimeo Player with Resume Functionality
 * - Vimeo Player API ашиглан видео үзэж байсан хэсгээсээ үргэлжлүүлэх
 * - Viewport-с гарахад автоматаар паузлах
 * - Хэрэглэгч бүрт тусдаа явц хадгална
 */
const VimeoPlayer = ({ videoId, postId }) => {
  const { user } = useAuth();
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const wrapperRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const observerRef = useRef(null);
  const autoPausedRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);

  // LocalStorage key - Хэрэглэгч бүрт тусдаа
  const getStorageKey = useCallback(() => {
    const userId = user?.id || 'guest';
    return `vimeo_progress_${userId}_${postId}_${videoId}`;
  }, [user, postId, videoId]);

  // Vimeo Player API script ачаалах
  useEffect(() => {
    // Vimeo Player API аль хэдийн ачаалагдсан эсэхийг шалгах
    if (window.Vimeo) {
      return;
    }

    // Vimeo Player API script нэмэх
    if (!document.querySelector('script[src*="player.vimeo.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Vimeo Player үүсгэх
  useEffect(() => {
    // Vimeo API хүлээх
    const initPlayer = () => {
      if (!window.Vimeo || !iframeRef.current) {
        setTimeout(initPlayer, 100);
        return;
      }

      // Өмнө хадгалсан цагийг авах
      const savedTime = localStorage.getItem(getStorageKey());
      const startSeconds = savedTime ? parseFloat(savedTime) : 0;

      // Player үүсгэх
      playerRef.current = new window.Vimeo.Player(iframeRef.current);

      // Хадгалсан цагаас эхлэх
      if (startSeconds > 0) {
        playerRef.current.setCurrentTime(startSeconds).catch((error) => {
          console.error('Error setting start time:', error);
        });
      }

      // Progress хадгалах interval
      saveIntervalRef.current = setInterval(() => {
        if (playerRef.current) {
          playerRef.current.getCurrentTime().then((seconds) => {
            if (seconds > 0) {
              localStorage.setItem(getStorageKey(), seconds.toString());
            }
          }).catch(() => {
            // Ignore errors
          });
        }
      }, 5000); // 5 секунд тутамд

      // Intersection Observer үүсгэх
      if (wrapperRef.current && !observerRef.current) {
        console.log('Setting up Vimeo Intersection Observer');
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              console.log('Vimeo Intersection ratio:', entry.intersectionRatio);

              if (!playerRef.current) return;

              // Харагдахгүй болсон бол - ПАУЗЛАХ
              if (entry.intersectionRatio < 0.1) {
                playerRef.current.getPaused().then((paused) => {
                  if (!paused) {
                    playerRef.current.pause();
                    autoPausedRef.current = true;
                    console.log('⏸️ Vimeo paused - out of viewport');
                  }
                }).catch(() => {
                  // Ignore errors
                });
              }
              // Буцаад харагдаж байвал - ҮРГЭЛЖЛҮҮЛЭХ
              else if (entry.intersectionRatio >= 0.5) {
                playerRef.current.getPaused().then((paused) => {
                  if (paused && autoPausedRef.current) {
                    playerRef.current.play();
                    autoPausedRef.current = false;
                    console.log('▶️ Vimeo resumed - back in viewport');
                  }
                }).catch(() => {
                  // Ignore errors
                });
              }
            });
          },
          {
            threshold: [0, 0.1, 0.5, 1.0],
            rootMargin: '0px',
          }
        );

        observerRef.current.observe(wrapperRef.current);
        console.log('Vimeo Observer is now watching wrapper element');
      }

      // Player events
      playerRef.current.on('play', () => {
        if (autoPausedRef.current) {
          autoPausedRef.current = false;
          console.log('User manually played Vimeo - resetting autoPause flag');
        }
      });

      playerRef.current.on('pause', () => {
        // Явцыг хадгалах
        playerRef.current.getCurrentTime().then((seconds) => {
          localStorage.setItem(getStorageKey(), seconds.toString());
        }).catch(() => {
          // Ignore errors
        });
      });

      playerRef.current.on('ended', () => {
        // Дууссан бол хадгалсан цагийг устгах
        localStorage.removeItem(getStorageKey());
        autoPausedRef.current = false;
      });

      setPlayerReady(true);
    };

    initPlayer();

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
        playerRef.current.destroy().catch(() => {
          // Ignore errors
        });
      }
    };
  }, [getStorageKey]);

  return (
    <div
      ref={wrapperRef}
      className="ratio ratio-16x9 mt-2 rounded"
      style={{ width: '100%', overflow: 'hidden', border: '1px solid #dee2e6' }}
    >
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
        style={{ width: '100%', height: '100%' }}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo video player"
      ></iframe>
    </div>
  );
};

export default VimeoPlayer;
