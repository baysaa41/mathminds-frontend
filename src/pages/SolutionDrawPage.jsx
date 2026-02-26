// src/pages/SolutionDrawPage.jsx
// Fullscreen Excalidraw editor for page drawings

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import apiClient from '../api/axiosConfig.js';
import { Save, ArrowLeft, PenLine } from 'lucide-react';

export default function SolutionDrawPage() {
  const { uuid: problemUuid } = useParams();
  const navigate = useNavigate();

  const pageUrl = `/problem/${problemUuid}`;

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [problem, setProblem] = useState(null);
  const [drawing, setDrawing] = useState(null); // PageDrawing object
  const [initialData, setInitialData] = useState(null);
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
      if (existing) {
        setDrawing(existing);
        if (existing.drawing_data) {
          setInitialData({
            elements: existing.drawing_data.elements || [],
            appState: existing.drawing_data.appState || {},
            files: existing.drawing_data.files || null,
          });
        }
      }
    } catch (err) {
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

  const handleBack = () => {
    navigate(`/problem/${problemUuid}`);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Ачааллаж байна...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #dee2e6',
          flexShrink: 0,
          zIndex: 10,
          minHeight: '52px',
        }}
      >
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={handleBack}
          disabled={saving}
        >
          <ArrowLeft size={15} />
          Буцах
        </button>

        <PenLine size={18} className="text-primary" />
        <span
          className="fw-semibold text-truncate"
          style={{ flex: 1, minWidth: 0, maxWidth: '600px' }}
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
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          langCode="en"
        />
      </div>
    </div>
  );
}
