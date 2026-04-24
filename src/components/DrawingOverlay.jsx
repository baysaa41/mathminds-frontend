// src/components/DrawingOverlay.jsx
// Fullscreen transparent annotation overlay with Excalidraw
// Triggered via: window.dispatchEvent(new CustomEvent('openDrawingOverlay', { detail: { pageUrl, problemUuid? } }))

import { useState, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Save, X, PenLine, Sun, SunDim, Trash2 } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';

const ISLAND_VISIBILITY_CSS = `
  .drawing-overlay-excalidraw .excalidraw .Island {
    box-shadow: 0 2px 10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08) !important;
  }
`;

const TRANSPARENT_CSS = ISLAND_VISIBILITY_CSS + `
  .drawing-overlay-excalidraw .excalidraw {
    background: transparent !important;
  }
`;

const TOOLBAR_HEIGHT = 48;

export default function DrawingOverlay() {
  const [show, setShow] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [pageUrl, setPageUrl] = useState(null);
  const [problemTitle, setProblemTitle] = useState('');
  const [drawing, setDrawing] = useState(null); // PageDrawing object
  const [initialData, setInitialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loadKey, setLoadKey] = useState(0);
  const [bgWhite, setBgWhite] = useState(true);

  // Listen for open event
  useEffect(() => {
    const handler = async (e) => {
      const { pageUrl: url, problemUuid } = e.detail || {};
      if (!url) return;

      setPageUrl(url);
      setDrawing(null);
      setInitialData(null);
      setExcalidrawAPI(null);
      setError(null);
      setSaved(false);
      setBgWhite(false);
      setLoadKey((k) => k + 1);

      // Fetch problem title if problemUuid provided
      if (problemUuid) {
        try {
          const res = await apiClient.get(`/api/integral/problems/${problemUuid}/`);
          setProblemTitle(res.data.title || '');
        } catch {
          setProblemTitle('');
        }
      } else {
        setProblemTitle('');
      }

      // Load existing drawing for this page_url
      try {
        const res = await apiClient.get(`/api/integral/page-drawings/?page_url=${encodeURIComponent(url)}`);
        const list = res.data.results ?? res.data ?? [];
        const existing = list[0];
        if (existing) {
          setDrawing(existing);
          if (existing.drawing_data) {
            const savedBg = existing.drawing_data.appState?.viewBackgroundColor;
            const isWhite = savedBg === '#ffffff';
            setBgWhite(isWhite);
            setInitialData({
              elements: existing.drawing_data.elements || [],
              appState: {
                ...(existing.drawing_data.appState || {}),
                viewBackgroundColor: isWhite ? '#ffffff' : 'transparent',
                zenModeEnabled: false,
                viewModeEnabled: false,
                openMenu: null,
                openDialog: null,
              },
              files: existing.drawing_data.files || null,
            });
          }
        }
      } catch {
        // ignore, start with empty canvas
      }

      setShow(true);
    };

    window.addEventListener('openDrawingOverlay', handler);
    return () => window.removeEventListener('openDrawingOverlay', handler);
  }, []);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && show) setShow(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  const handleClose = useCallback(() => setShow(false), []);

  const handleToggleBg = () => {
    const next = !bgWhite;
    setBgWhite(next);
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: { viewBackgroundColor: next ? '#ffffff' : 'transparent' },
      });
    }
  };

  const handleSave = async () => {
    if (!excalidrawAPI || !pageUrl) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();

    const drawing_data = {
      elements,
      appState: {
        viewBackgroundColor: bgWhite ? '#ffffff' : 'transparent',
        currentItemFontFamily: appState.currentItemFontFamily,
        gridSize: appState.gridSize,
      },
      files,
    };

    try {
      setSaving(true);
      setError(null);

      if (drawing) {
        // PATCH existing
        await apiClient.patch(`/api/integral/page-drawings/${drawing.id}/`, { drawing_data });
      } else {
        // POST — backend uses update_or_create so duplicates are handled
        const res = await apiClient.post('/api/integral/page-drawings/', {
          page_url: pageUrl,
          drawing_data,
        });
        setDrawing(res.data);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <style>{bgWhite ? ISLAND_VISIBILITY_CSS : TRANSPARENT_CSS}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
      >
        {/* Toolbar мөр — canvas-ийн ДЭЭР, Excalidraw UI-тай огт давхцахгүй */}
        <div
          style={{
            height: TOOLBAR_HEIGHT,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(110,66,193,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <PenLine size={16} style={{ color: '#6f42c1', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {problemTitle || 'Зургийн тэмдэглэл'}
          </span>

          {error && (
            <span style={{ fontSize: '0.78rem', color: '#dc3545', flexShrink: 0 }}>
              {error}
            </span>
          )}
          {saved && (
            <span style={{ fontSize: '0.78rem', color: '#198754', fontWeight: 700, flexShrink: 0 }}>
              Хадгалагдлаа!
            </span>
          )}

          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => {
              if (excalidrawAPI && window.confirm('Бүх зургийг устгах уу?')) {
                excalidrawAPI.resetScene();
              }
            }}
            title="Бүгдийг устгах"
            style={{ flexShrink: 0 }}
            disabled={!excalidrawAPI}
          >
            <Trash2 size={15} />
          </Button>

          <Button
            size="sm"
            variant="outline-secondary"
            onClick={handleToggleBg}
            title={bgWhite ? 'Тунгалаг болгох' : 'Цагаан дэвсгэр'}
            style={{ flexShrink: 0 }}
          >
            {bgWhite ? <SunDim size={15} /> : <Sun size={15} />}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            disabled={saving || !excalidrawAPI}
            className="d-flex align-items-center gap-1"
            style={{ flexShrink: 0 }}
          >
            {saving ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <><Save size={14} />Хадгалах</>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline-secondary"
            onClick={handleClose}
            style={{ flexShrink: 0 }}
            title="Хаах (Esc)"
          >
            <X size={15} />
          </Button>
        </div>

        {/* Excalidraw — toolbar-ийн доор, бүтэн өргөнөөр */}
        <div
          className="drawing-overlay-excalidraw"
          style={{ flex: 1, minHeight: 0 }}
        >
          <Excalidraw
            key={`overlay-${loadKey}`}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={initialData ?? {
              elements: [],
              appState: { viewBackgroundColor: bgWhite ? '#ffffff' : 'transparent' },
            }}
            langCode="en"
          />
        </div>
      </div>
    </>
  );
}
