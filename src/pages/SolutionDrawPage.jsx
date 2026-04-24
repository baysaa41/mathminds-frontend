// src/pages/SolutionDrawPage.jsx
// Fullscreen Excalidraw editor for page drawings

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import apiClient from '../api/axiosConfig.js';
import { Save, ArrowLeft, PenLine } from 'lucide-react';

const TOOLBAR_H = 52;

export default function SolutionDrawPage() {
  const { uuid: problemUuid } = useParams();
  const navigate = useNavigate();

  const pageUrl = `/problem/${problemUuid}`;

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [problem, setProblem] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [initialData, setInitialData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [problemUuid]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [probRes, drawRes] = await Promise.all([
        apiClient.get(`/api/integral/problems/${problemUuid}/`),
        apiClient.get(`/api/integral/page-drawings/?page_url=${encodeURIComponent(pageUrl)}`),
      ]);

      setProblem(probRes.data);

      const list = drawRes.data.results ?? drawRes.data ?? [];
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
    } catch (err) {
      setError(err.response?.data?.detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
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
          gap: 10,
          padding: '0 14px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #dee2e6',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => navigate(`/problem/${problemUuid}`)}
          disabled={saving}
        >
          <ArrowLeft size={15} />
          Буцах
        </button>

        <PenLine size={18} className="text-primary" style={{ flexShrink: 0 }} />
        <span
          className="fw-semibold text-truncate"
          style={{ flex: 1, minWidth: 0 }}
        >
          {problem?.title || 'Зурах'}
        </span>

        {error && (
          <span className="text-danger small" style={{ flexShrink: 0 }}>
            {error}
          </span>
        )}
        {saved && (
          <span className="text-success small fw-semibold" style={{ flexShrink: 0 }}>
            Хадгалагдлаа!
          </span>
        )}

        <button
          className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          onClick={handleSave}
          disabled={saving || !excalidrawAPI}
          style={{ flexShrink: 0 }}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Save size={15} />
              Хадгалах
            </>
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
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Ачааллаж байна...</span>
            </div>
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
