// frontend/src/hooks/useChatSocket.js
import { useEffect, useRef, useState } from 'react';
import authService from '../services/authService';

const MAX_BACKOFF_MS = 15000;
const INITIAL_BACKOFF_MS = 1000;

const wsBaseUrl = () => {
  const httpBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return httpBase.replace(/^http/, 'ws');
};

/**
 * Нэг conversation-ы realtime мессеж/typing/error эвентийг WebSocket-оор
 * дагана (хуучин `pollConversation`-г орлоно). Мессеж ИЛГЭЭХ хэвээр REST
 * `sendMessage()`-ээр л явна — сервер тал шинэ мессеж бүрийг post_save
 * сигналаар автоматаар энэ сокет руу broadcast хийдэг тул давхар илгээх
 * механизм энд хэрэггүй.
 *
 * onEvent(event) — {type:'message', message} | {type:'typing', typing} | {type:'error', message}
 *   | {type:'suggest_problem'} (сурагч шинэ бодлого хүссэн → ЭЕШ widget)
 */
export default function useChatSocket(conversationUuid, { active = true, onEvent } = {}) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!active || !conversationUuid) return undefined;

    let cancelled = false;
    let socket = null;
    let reconnectTimer = null;
    let backoff = INITIAL_BACKOFF_MS;
    let refreshedOnce = false;

    const connect = () => {
      if (cancelled) return;
      const token = authService.getToken();
      if (!token) return;

      socket = new WebSocket(`${wsBaseUrl()}/ws/chat/${conversationUuid}/?token=${token}`);

      socket.onopen = () => {
        backoff = INITIAL_BACKOFF_MS;
        refreshedOnce = false;
        setConnected(true);
      };

      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          onEventRef.current?.(data);
        } catch (err) {
          console.error('WS мессеж parse алдаа:', err);
        }
      };

      socket.onclose = async (evt) => {
        setConnected(false);
        if (cancelled) return;

        // Auth алдаа (4001: token байхгүй/буруу, 4003: гишүүн биш) — нэг удаа
        // токен сэргээгээд дахин холбогдож үзнэ.
        if ((evt.code === 4001 || evt.code === 4003) && !refreshedOnce) {
          refreshedOnce = true;
          try {
            await authService.refreshToken();
          } catch {
            return; // refreshToken өөрөө logout+redirect хийнэ
          }
        }

        reconnectTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [active, conversationUuid]);

  return { connected };
}
