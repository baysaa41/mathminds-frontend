// ClubSubGroupsPage — клубын дэд бүлгүүд удирдах
import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import Nav from 'react-bootstrap/Nav';
import {
  Users, Plus, Pencil, Trash2, UserPlus, Wand2, FileDown, GraduationCap,
} from 'lucide-react';
import apiClient from '../api/axiosConfig';
import EmptyState from '../components/common/EmptyState';
import { SubGroupFormModal } from '../components/clubSubGroups/SubGroupFormModal.jsx';
import { AddMembersModal } from '../components/clubSubGroups/AddMembersModal.jsx';
import { AutoObjectivesModal } from '../components/clubSubGroups/AutoObjectivesModal.jsx';
import { AutoGroupModal } from '../components/clubSubGroups/AutoGroupModal.jsx';
import { MembersTabContent } from '../components/clubSubGroups/MembersTabContent.jsx';
import { CurriculumTabContent } from '../components/clubSubGroups/CurriculumTabContent.jsx';

// ── Үндсэн хуудас ───────────────────────────────────────────────
const ClubSubGroupsPage = () => {
  const { clubData, isTeacherOrAdmin, showToast } = useOutletContext();
  const navigate = useNavigate();
  const clubId = clubData?.id;

  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // идэвхтэй дэд бүлэг
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'curriculum'

  // Curriculum state
  const [weeklyTopics, setWeeklyTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [addingProgram, setAddingProgram] = useState(false);

  // Modals
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [addMembersModal, setAddMembersModal] = useState(false);
  const [autoGroupModal, setAutoGroupModal] = useState(false);
  const [autoObjectivesModal, setAutoObjectivesModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Клубын бүх гишүүд (нэмэх modal-д ашиглана)
  const clubMembers = clubData?.members || [];

  const handleExportSubgroup = async () => {
    if (!selected || !clubId || exporting) return;
    setExporting(true);
    try {
      const response = await apiClient.get(`/api/clubs/${clubId}/export_report/`, {
        params: { subgroup_id: selected.id },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubData?.name || 'club'}_${selected.name}_report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast?.('Excel татахад алдаа гарлаа.', 'danger');
    } finally {
      setExporting(false);
    }
  };

  const fetchSubgroups = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const params = { club: clubId };
      if (showInactive) params.include_inactive = '1';
      const res = await apiClient.get('/api/club-subgroups/', { params });
      const list = res.data.results || res.data || [];
      setSubgroups(list);
      // Сонгосон бүлгийг дахин татах
      if (selected) {
        const fresh = list.find(g => g.id === selected.id);
        setSelected(fresh || list[0] || null);
      } else if (list.length) {
        setSelected(list[0]);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, showInactive]);

  // Дэлгэрэнгүй (members-тэй) татах
  const fetchDetail = useCallback(async (id) => {
    try {
      const res = await apiClient.get(`/api/club-subgroups/${id}/`);
      setSelected(res.data);
      setSubgroups(prev => prev.map(g => g.id === id ? res.data : g));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSubgroups(); }, [fetchSubgroups]);

  // Сонгосон бүлгийн members татагдаагүй бол fetchDetail дуудах
  useEffect(() => {
    if (selected && !selected.members) {
      fetchDetail(selected.id);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Curriculum: бүх хөтөлбөрүүдийг татах (багшид)
  useEffect(() => {
    if (!isTeacherOrAdmin) return;
    apiClient.get('/api/curriculum/programs/')
      .then(r => setAllPrograms(r.data.results || r.data || []))
      .catch(() => {});
  }, [isTeacherOrAdmin]);

  // Curriculum: сонгосон дэд бүлгийн долоо хоногийн сэдвүүд
  const fetchWeeklyTopics = useCallback(async (sgId) => {
    if (!sgId) return;
    setTopicsLoading(true);
    try {
      const r = await apiClient.get(`/api/club-subgroups/${sgId}/weekly_topics/`);
      setWeeklyTopics(r.data || []);
    } catch { setWeeklyTopics([]); }
    finally { setTopicsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'curriculum' && selected?.id) {
      fetchWeeklyTopics(selected.id);
    }
  }, [activeTab, selected?.id, fetchWeeklyTopics]);

  // Tab солигдох үед curriculum татах
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
  };

  const programsInfo = selected?.curriculum_programs_info || [];
  const addablePrograms = allPrograms.filter(p => !programsInfo.some(pi => pi.id === p.id));

  const handleAddProgram = async () => {
    if (!selectedProgramId || !selected) return;
    try {
      setAddingProgram(true);
      await apiClient.post(`/api/club-subgroups/${selected.id}/add_program/`, {
        program_id: parseInt(selectedProgramId),
        ...(startDate ? { start_date: startDate } : {}),
      });
      showToast?.('Хөтөлбөр нэмэгдлээ', 'success');
      setSelectedProgramId('');
      setStartDate('');
      await fetchDetail(selected.id);
      fetchWeeklyTopics(selected.id);
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    } finally { setAddingProgram(false); }
  };

  const handleRemoveProgram = async (programId, programName) => {
    if (!window.confirm(`"${programName}" хөтөлбөрийг хасахдаа итгэлтэй байна уу?`)) return;
    try {
      await apiClient.post(`/api/club-subgroups/${selected.id}/remove_program/`, { program_id: programId });
      showToast?.('Хөтөлбөр хасагдлаа', 'success');
      await fetchDetail(selected.id);
      fetchWeeklyTopics(selected.id);
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    }
  };

  const handleSetWeek = async (programId, weekNum) => {
    try {
      await apiClient.post(`/api/club-subgroups/${selected.id}/set_week/`, {
        program_id: programId, current_week: weekNum,
      });
      await fetchDetail(selected.id);
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    }
  };

  const handleResetAutoWeek = async (programId) => {
    try {
      await apiClient.post(`/api/club-subgroups/${selected.id}/set_week/`, {
        program_id: programId, is_auto_week: true,
      });
      showToast?.('Автомат горимд шилжлээ', 'success');
      await fetchDetail(selected.id);
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    }
  };

  const handleSelectGroup = (g) => {
    setSelected(g);
    setActiveTab('members');
    setWeeklyTopics([]);
    if (!g.members) fetchDetail(g.id);
  };

  const handleSaved = (data) => {
    setSubgroups(prev => {
      const idx = prev.findIndex(g => g.id === data.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = data; return next;
      }
      return [...prev, data];
    });
    if (!selected || data.id === selected?.id) setSelected(data);
    showToast?.('Амжилттай хадгалагдлаа', 'success');
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`"${g.name}" дэд бүлгийг устгахдаа итгэлтэй байна уу?`)) return;
    try {
      await apiClient.delete(`/api/club-subgroups/${g.id}/`);
      const next = subgroups.filter(s => s.id !== g.id);
      setSubgroups(next);
      if (selected?.id === g.id) setSelected(next[0] || null);
      showToast?.('Устгагдлаа', 'success');
    } catch { showToast?.('Алдаа гарлаа', 'danger'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!selected) return;
    setRemovingId(userId);
    try {
      const res = await apiClient.post(
        `/api/club-subgroups/${selected.id}/remove_member/`,
        { user_id: userId }
      );
      setSelected(res.data);
      setSubgroups(prev => prev.map(g => g.id === res.data.id ? res.data : g));
    } catch { showToast?.('Алдаа гарлаа', 'danger'); }
    finally { setRemovingId(null); }
  };

  // Бүлэгт орогдоогүй гишүүдийн тоо
  // List API → member_ids, detail API → members. Аль нэгийг ашиглана.
  const ungroupedCount = (() => {
    const inGroup = new Set(subgroups.flatMap(g =>
      g.member_ids ?? (g.members || []).map(m => m.id)
    ));
    return clubMembers.filter(m => !inGroup.has(m.id)).length;
  })();

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <Users size={18} />
          Дэд бүлгүүд
          {ungroupedCount > 0 && (
            <Badge bg="light" text="secondary" className="border small fw-normal">
              {ungroupedCount} бүлэггүй гишүүн
            </Badge>
          )}
        </h5>
        <Stack direction="horizontal" gap={3}>
          <Form.Check type="switch" id="show-inactive-subgroups" label="Идэвхгүйг харуулах"
            className="small text-nowrap"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)} />
          {isTeacherOrAdmin && (
            <Stack direction="horizontal" gap={2}>
              <Button variant="outline-primary" size="sm"
                onClick={() => setAutoGroupModal(true)}>
                <Wand2 size={14} className="me-1" />Дүнгээр хуваах
              </Button>
              <Button variant="primary" size="sm"
                onClick={() => { setEditTarget(null); setFormModal(true); }}>
                <Plus size={14} className="me-1" />Бүлэг нэмэх
              </Button>
            </Stack>
          )}
        </Stack>
      </div>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
      ) : subgroups.length === 0 ? (
        <EmptyState icon={Users} title="Дэд бүлэг байхгүй"
          message={isTeacherOrAdmin ? '"Бүлэг нэмэх" товчоор шинэ бүлэг үүсгэнэ үү.' : 'Одоогоор дэд бүлэг байхгүй байна.'} />
      ) : (
        <div className="row g-3">
          {/* Зүүн: бүлгүүдийн жагсаалт */}
          <div className="col-12 col-md-4 col-lg-3">
            <ListGroup>
              {subgroups.map(g => (
                <ListGroup.Item key={g.id} action active={selected?.id === g.id}
                  onClick={() => handleSelectGroup(g)}
                  className="d-flex align-items-center justify-content-between gap-2 py-2">
                  <div className="d-flex align-items-center gap-2 flex-grow-1 min-width-0">
                    <span className={`badge bg-${g.color} flex-shrink-0`}
                      style={{ width: 10, height: 10, borderRadius: '50%', padding: 0 }}>&nbsp;</span>
                    <div className="text-truncate">
                      <div className="small fw-semibold">
                        {g.name}
                        {g.is_active === false && (
                          <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.6rem' }}>идэвхгүй</Badge>
                        )}
                      </div>
                      {g.description && (
                        <div className="text-truncate" style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                          {g.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge bg={selected?.id === g.id ? 'light' : g.color}
                    text={selected?.id === g.id ? 'dark' : undefined}
                    className="flex-shrink-0">
                    {g.member_count}
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          {/* Баруун: сонгосон бүлгийн дэлгэрэнгүй */}
          <div className="col-12 col-md-8 col-lg-9">
            {selected ? (
              <Card>
                {/* Гарчиг */}
                <Card.Header className="bg-white">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={selected.color} className="fs-6 px-3 py-1">{selected.name}</Badge>
                      {selected.is_active === false && (
                        <Badge bg="secondary">Идэвхгүй</Badge>
                      )}
                    </div>
                    {isTeacherOrAdmin && (
                      <Stack direction="horizontal" gap={1}>
                        <Button variant="outline-primary" size="sm"
                          onClick={() => navigate(`/clubs/${clubId}/group-report?subgroup_id=${selected.id}`)}
                          title="Веб тайлан харах">
                          Веб тайлан
                        </Button>
                        <Button variant="outline-success" size="sm"
                          onClick={handleExportSubgroup}
                          disabled={exporting}
                          title="Excel татах">
                          {exporting
                            ? <Spinner animation="border" size="sm" />
                            : <FileDown size={14} className="me-1" />}
                          Тайлан
                        </Button>
                        <Button variant="outline-primary" size="sm"
                          onClick={() => setAddMembersModal(true)}>
                          <UserPlus size={14} className="me-1" />Нэмэх
                        </Button>
                        <Button variant="outline-secondary" size="sm"
                          onClick={() => { setEditTarget(selected); setFormModal(true); }}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="outline-danger" size="sm"
                          onClick={() => handleDelete(selected)}>
                          <Trash2 size={14} />
                        </Button>
                      </Stack>
                    )}
                  </div>
                  {selected.description && (
                    <div className="text-muted small mt-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {selected.description}
                    </div>
                  )}
                </Card.Header>

                {/* Tab навигац */}
                <Nav variant="tabs" className="px-3 pt-2 border-bottom-0"
                  activeKey={activeTab} onSelect={handleTabSelect}>
                  <Nav.Item>
                    <Nav.Link eventKey="members" className="small py-1 px-2">
                      <Users size={13} className="me-1" />Гишүүд
                      <Badge bg="secondary" className="ms-1 small">{selected.member_count}</Badge>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="curriculum" className="small py-1 px-2">
                      <GraduationCap size={13} className="me-1" />Хөтөлбөр
                      {programsInfo.length > 0 && (
                        <Badge bg="primary" className="ms-1 small">{programsInfo.length}</Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {/* ── Гишүүд tab ── */}
                {activeTab === 'members' && (
                  <MembersTabContent
                    selected={selected}
                    isTeacherOrAdmin={isTeacherOrAdmin}
                    removingId={removingId}
                    onRemoveMember={handleRemoveMember}
                    onViewReport={(username) => navigate(`/clubs/${clubData.id}/report/${username}`)}
                  />
                )}

                {/* ── Хөтөлбөр tab ── */}
                {activeTab === 'curriculum' && (
                  <CurriculumTabContent
                    isTeacherOrAdmin={isTeacherOrAdmin}
                    programsInfo={programsInfo}
                    addablePrograms={addablePrograms}
                    weeklyTopics={weeklyTopics}
                    topicsLoading={topicsLoading}
                    selectedProgramId={selectedProgramId}
                    setSelectedProgramId={setSelectedProgramId}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    addingProgram={addingProgram}
                    onAddProgram={handleAddProgram}
                    onRemoveProgram={handleRemoveProgram}
                    onSetWeek={handleSetWeek}
                    onResetAutoWeek={handleResetAutoWeek}
                    onOpenAutoObjectives={() => setAutoObjectivesModal(true)}
                  />
                )}

              </Card>
            ) : (
              <div className="text-center text-muted py-5 small">Бүлэг сонгоно уу</div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <SubGroupFormModal
        show={formModal}
        onHide={() => setFormModal(false)}
        clubId={clubId}
        subgroup={editTarget}
        onSaved={handleSaved}
      />
      <AddMembersModal
        show={addMembersModal}
        onHide={() => setAddMembersModal(false)}
        subgroup={selected}
        clubMembers={clubMembers}
        onAdded={(updated) => {
          setSelected(updated);
          setSubgroups(prev => prev.map(g => g.id === updated.id ? updated : g));
        }}
      />
      <AutoGroupModal
        show={autoGroupModal}
        onHide={() => setAutoGroupModal(false)}
        clubId={clubId}
        onDone={() => { fetchSubgroups(); showToast?.('Дэд бүлгүүд үүсгэгдлээ', 'success'); }}
      />
      <AutoObjectivesModal
        show={autoObjectivesModal}
        onHide={() => setAutoObjectivesModal(false)}
        subgroup={selected}
        clubId={clubId}
        onDone={() => {
          if (selected) fetchWeeklyTopics(selected.id);
          showToast?.('Суралцахуйн зорилго нэмэгдлээ', 'success');
        }}
      />
    </div>
  );
};

export default ClubSubGroupsPage;
