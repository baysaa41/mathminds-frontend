// src/components/DrawingPanel.jsx
// Right-side Offcanvas panel with Excalidraw canvas

import { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Save, X, PenLine, Trash2 } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';

const MIN_WIDTH = 320;
const MAX_WIDTH = window.innerWidth - 60;

export default function DrawingPanel({ show, onHide, pageUrl, problemTitle, onSaved }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [initialData, setInitialData] = useState({ appState: { currentItemStrokeWidth: 1 } });
  const [drawing, setDrawing] = useState(null); // PageDrawing object
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [panelWidth, setPanelWidth] = useState(Math.round(window.innerWidth * 0.6));
  const [panelReady, setPanelReady] = useState(false);
  const draggingRef = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (me) => {
      if (!draggingRef.current) return;
      const newWidth = window.innerWidth - me.clientX;
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    if (show && pageUrl) {
      setExcalidrawAPI(null);
      setInitialData(null);
      setDrawing(null);
      setError(null);
      setSaved(false);
      setPanelReady(false);
      setLoadKey((k) => k + 1);
      loadDrawingData();
    }
  }, [show, pageUrl]);

  const loadDrawingData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/api/integral/page-drawings/?page_url=${encodeURIComponent(pageUrl)}`
      );
      const list = res.data.results ?? res.data ?? [];
      const existing = list[0];
      if (existing) {
        setDrawing(existing);
        if (existing.drawing_data) {
          setInitialData({
            elements: existing.drawing_data.elements || [],
            appState: {
              currentItemStrokeWidth: 1,
              ...(existing.drawing_data.appState || {}),
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
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();

    const drawing_data = {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemFontFamily: appState.currentItemFontFamily,
        gridSize: appState.gridSize,
      },
      files,
    };

    try {
      setSaving(true);
      setError(null);

      if (drawing) {
        await apiClient.patch(`/api/integral/page-drawings/${drawing.id}/`, { drawing_data });
      } else {
        const res = await apiClient.post('/api/integral/page-drawings/', {
          page_url: pageUrl,
          drawing_data,
        });
        setDrawing(res.data);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Drag handle — Offcanvas-н гадна, fixed position.
          Offcanvas дотор байвал Excalidraw-н pointer event блоклодог. */}
      {show && (
        <div
          onMouseDown={onMouseDown}
          style={{
            position: 'fixed',
            right: panelWidth - 3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'ew-resize',
            zIndex: 1056,
          }}
          title="Чирж өргөтгөх"
        />
      )}
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      onEntered={() => setPanelReady(true)}
      style={{ width: panelWidth, minWidth: MIN_WIDTH }}
    >
      <Offcanvas.Header
        style={{
          borderBottom: '1px solid #dee2e6',
          padding: '8px 12px',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <PenLine size={17} style={{ color: '#6f42c1', flexShrink: 0 }} />
        <span
          className="fw-semibold text-truncate flex-grow-1"
          style={{ fontSize: '0.9rem', minWidth: 0 }}
        >
          {problemTitle || 'Самбар'}
        </span>

        {error && (
          <span className="text-danger small flex-shrink-0">{error}</span>
        )}
        {saved && (
          <span className="text-success small fw-semibold flex-shrink-0">Хадгалагдлаа!</span>
        )}

        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => {
            if (excalidrawAPI && window.confirm('Бүх зургийг устгах уу?')) {
              excalidrawAPI.resetScene();
            }
          }}
          title="Бүгдийг устгах"
          disabled={!excalidrawAPI}
          className="flex-shrink-0"
          style={{ padding: '4px 8px' }}
        >
          <Trash2 size={15} />
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || !excalidrawAPI}
          className="flex-shrink-0 d-flex align-items-center gap-1"
        >
          {saving ? (
            <><Spinner animation="border" size="sm" />Хадгалж байна...</>
          ) : (
            <><Save size={14} />Хадгалах</>
          )}
        </Button>

        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onHide}
          className="flex-shrink-0"
          style={{ padding: '4px 8px' }}
        >
          <X size={16} />
        </Button>
      </Offcanvas.Header>

      <Offcanvas.Body style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {!panelReady || loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" />
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0 }}>
            <Excalidraw
              key={`draw-${loadKey}`}
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={initialData}
              langCode="en"
            />
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
    </>
  );
}
