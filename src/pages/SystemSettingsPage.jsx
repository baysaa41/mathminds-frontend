// src/pages/SystemSettingsPage.jsx
// Системийн тохиргоо: feature flag-ууд + удирдлагын түргэн холбоосууд

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import {
  Settings,
  ToggleLeft,
  ExternalLink,
  Users,
  Terminal,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../api/axiosConfig';

const QUICK_LINKS = [
  {
    key: 'django-admin',
    icon: ShieldAlert,
    color: '#dc3545',
    title: 'Django Admin панель',
    description: 'Хэрэглэгчийн бүрэн профайл, groups/permissions, бүх модель шууд DB түвшинд засах.',
    href: 'https://api.mathminds.club/admin/',
    external: true,
  },
  {
    key: 'all-users',
    icon: Users,
    color: '#0dcaf0',
    title: 'Хэрэглэгчийн эрх (SPA)',
    description: 'Хэрэглэгчийн жагсаалтаас үүрэг (сурагч/багш/эцэг эх) болон staff эрхийг шууд засах.',
    to: '/admin/all-users',
  },
  {
    key: 'ai-models',
    icon: Cpu,
    color: '#8b5cf6',
    title: 'AI Загварууд',
    description: 'AI provider (API key) тохиргоо .env файлаар удирддаг — энд зөвхөн тайлбар харагдана.',
    to: '/admin/ai-models',
  },
  {
    key: 'django-commands',
    icon: Terminal,
    color: '#20c997',
    title: 'Django Commands',
    description: 'Server дээр гар аргаар ажиллуулдаг management command-уудын заавар.',
    to: '/admin/commands',
  },
];

function FeatureFlagRow({ flag, onToggle, toggling }) {
  return (
    <div className="d-flex align-items-start justify-content-between py-3 border-bottom">
      <div className="pe-3">
        <div className="fw-semibold d-flex align-items-center gap-2">
          {flag.label}
          <code className="text-muted small">{flag.key}</code>
        </div>
        {flag.description && (
          <div className="text-muted small mt-1">{flag.description}</div>
        )}
        {flag.updated_by && (
          <div className="text-muted small mt-1">
            Сүүлд өөрчилсөн: {flag.updated_by}, {new Date(flag.updated_at).toLocaleString('mn-MN')}
          </div>
        )}
      </div>
      <Form.Check
        type="switch"
        id={`flag-${flag.key}`}
        checked={flag.is_enabled}
        disabled={toggling}
        onChange={() => onToggle(flag)}
        style={{ flexShrink: 0, marginTop: 4 }}
      />
    </div>
  );
}

function SystemSettingsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/users/api/feature-flags/');
      setFlags(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Feature flag-уудыг ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag) => {
    const nextValue = !flag.is_enabled;
    if (
      flag.key === 'maintenance_mode' &&
      nextValue &&
      !window.confirm('Засвар үйлчилгээний зурвас бүх хэрэглэгчид харагдах болно. Асаах уу?')
    ) {
      return;
    }
    try {
      setTogglingKey(flag.key);
      const res = await apiClient.patch(`/users/api/feature-flags/${flag.key}/`, {
        is_enabled: nextValue,
      });
      setFlags((prev) =>
        prev.map((f) =>
          f.key === flag.key
            ? { ...f, is_enabled: res.data.is_enabled, updated_at: res.data.updated_at, updated_by: res.data.updated_by }
            : f
        )
      );
    } catch {
      alert('Тохиргоо солиход алдаа гарлаа.');
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Settings size={28} style={{ color: '#6c757d' }} />
          <h1 className="mb-0 h4">Системийн Тохиргоо</h1>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary btn-sm">
          ‹ Admin
        </Link>
      </div>

      {/* Feature flags */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex align-items-center gap-2 mb-1">
            <ToggleLeft size={20} style={{ color: '#6366f1' }} />
            <h2 className="h6 mb-0">Feature Flag-ууд</h2>
          </div>
          <p className="text-muted small mb-3">
            Deploy хийхгүйгээр асаах/унтраах боломжтой сайт даяарх switch-үүд. Өөрчлөлт хамгийн
            ихдээ 30 секундын дараа бүх процесст (веб, Celery) нөлөөлнө.
          </p>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && flags.length === 0 && (
            <Alert variant="secondary">Feature flag олдсонгүй.</Alert>
          )}
          {!loading && !error && flags.map((flag) => (
            <FeatureFlagRow
              key={flag.key}
              flag={flag}
              onToggle={handleToggle}
              toggling={togglingKey === flag.key}
            />
          ))}
        </Card.Body>
      </Card>

      {/* Quick links */}
      <h2 className="h6 text-muted mb-2">Холбоотой удирдлага</h2>
      <div className="d-flex flex-column gap-2 mb-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          const body = (
            <Card.Body className="d-flex align-items-center gap-3">
              <Icon size={24} style={{ color: link.color, flexShrink: 0 }} />
              <div className="flex-grow-1">
                <div className="fw-semibold d-flex align-items-center gap-2">
                  {link.title}
                  {link.external && <ExternalLink size={14} className="text-muted" />}
                </div>
                <div className="text-muted small">{link.description}</div>
              </div>
            </Card.Body>
          );
          return link.external ? (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none text-body"
            >
              <Card className="shadow-sm">{body}</Card>
            </a>
          ) : (
            <Link key={link.key} to={link.to} className="text-decoration-none text-body">
              <Card className="shadow-sm">{body}</Card>
            </Link>
          );
        })}
      </div>

      <Badge bg="light" text="dark" className="border">
        Хэрэглэгчийн бусад мэдээлэл (нэр, имэйл, гишүүнчлэл) — /admin/all-users
      </Badge>
    </Container>
  );
}

export default SystemSettingsPage;
