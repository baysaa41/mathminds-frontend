// src/pages/DocImportPage.jsx
// Баримт бичгээс бодлогуудыг AI-аар таньж импортлох хуудас

import { useState } from 'react';

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

import AiImportTab from '../components/docImport/AiImportTab.jsx';
import JsonImportTab from '../components/docImport/JsonImportTab.jsx';

export default function DocImportPage() {
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'json'

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <AppBreadcrumb items={[{ label: 'Admin', to: '/admin' }, { label: 'Баримт импорт' }]} />
        <div>
          <h3 className="mb-0 fw-bold">📥 Баримт бичгийг импортлох</h3>
          <small className="text-muted">PDF, зураг, Word, Excel эсвэл JSON файлаас бодлогуудыг оруулна</small>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="d-flex gap-2 mb-4">
        <Button
          variant={activeTab === 'ai' ? 'primary' : 'outline-secondary'}
          size="sm"
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI баримт импорт
        </Button>
        <Button
          variant={activeTab === 'json' ? 'primary' : 'outline-secondary'}
          size="sm"
          onClick={() => setActiveTab('json')}
        >
          📋 JSON тест импорт
        </Button>
      </div>

      {/* Хоёр табыг аль аль нь mount хийсэн хэвээр үлдээж, CSS-ээр л нуух —
          ингэснээр таб сэлгэхэд тухайн табын state (сонгосон файл, задалсан
          бодлого, засвар г.м.) алдагдахгүй (өмнө нь ганц компонент дотор нэг
          state байсныг санагдуулна). */}
      <div style={{ display: activeTab === 'json' ? 'block' : 'none' }}>
        <JsonImportTab />
      </div>
      <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}>
        <AiImportTab />
      </div>
    </Container>
  );
}
