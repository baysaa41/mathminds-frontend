// src/pages/DrawPage.jsx
// Тусдаа Excalidraw хуудас — аль ч хуудаснаас дуудагдах боломжтой
// navigate('/draw', { state: { pageUrl, pageTitle } }) гэж дуудна

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import apiClient from '../api/axiosConfig.js';
import { Save, PenLine, Trash2 } from 'lucide-react';

const TOOLBAR_H = 52;

export default function DrawPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { pageUrl, pageTitle } = location.state || {};

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [initialData, setInitialData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pageUrl) {
      setLoading(false);
      return;
    }
    loadDrawing();
  }, [pageUrl]);

  const loadDrawing = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/api/integral/page-drawings/?page_url=${encodeURIComponent(pageUrl)}`
      );
      const list = res.data.results ?? res.data ?? [];
      const existing = list[0];
      if (existing?.drawing_data) {
        setDrawing(existing);
        setInitialData({
          elements: existing.drawing_data.elements || [],
          appState: {
            zenModeEnabled: false,
            viewModeEnabled: false,
            viewBackgroundColor: existing.drawing_data.appState?.viewBackgroundColor || '#ffffff',
          },
          files: existing.drawing_data.files || null,
        });
      }
    } catch {
      // no saved drawing, start fresh
    } finally {
      setLoading(false);
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
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (excalidrawAPI && window.confirm('Бүх зургийг устгах уу?')) {
      excalidrawAPI.resetScene();
    }
  };

  const handleBack = () => {
    if (pageUrl) navigate(pageUrl);
    else navigate(-1);
  };

  return (
    // position:fixed + inset:0 → Bootstrap CSS-аас үл хамаарч viewport дүүрэн
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff' }}>
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: TOOLBAR_H,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #dee2e6',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={handleBack}
          disabled={saving}
        >
          ‹ Нүүр
        </button>

        <PenLine size={17} className="text-primary flex-shrink-0" />
        <span
          className="fw-semibold text-truncate flex-grow-1"
          style={{ fontSize: '0.9rem', minWidth: 0 }}
        >
          {pageTitle || pageUrl || 'Зургийн тэмдэглэл'}
        </span>

        {error && <span className="text-danger small flex-shrink-0">{error}</span>}
        {saved && <span className="text-success small fw-semibold flex-shrink-0">Хадгалагдлаа!</span>}

        <button
          className="btn btn-sm btn-outline-danger flex-shrink-0"
          onClick={handleClear}
          disabled={!excalidrawAPI}
          title="Бүгдийг устгах"
        >
          <Trash2 size={15} />
        </button>

        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-1 flex-shrink-0"
          onClick={handleSave}
          disabled={saving || !excalidrawAPI || !pageUrl}
        >
          {saving ? (
            <><span className="spinner-border spinner-border-sm" />Хадгалж байна...</>
          ) : (
            <><Save size={14} />Хадгалах</>
          )}
        </button>
      </div>

      {/* Excalidraw canvas */}
      <div
        style={{
          position: 'absolute',
          top: TOOLBAR_H,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={initialData}
            langCode="en"
          />
        )}
      </div>
    </div>
  );
}
