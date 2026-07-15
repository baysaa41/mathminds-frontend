import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MathJaxContext } from 'better-react-mathjax'
import { mathJaxConfig } from '../mathjax.config.js'
import apiClient from '../api/axiosConfig.js'
import LivePreview from '../components/LivePreview.jsx'
import { stripPSTricks } from '../utils/stripPSTricks.js'
import { formatDate } from '../utils/dateFormatter'
import LoadingState from '../components/common/LoadingState.jsx'
import UserName from '../components/UserName.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_ENDPOINTS } from '../constants/api.js'
import usePaginatedFetch from '../hooks/usePagenatedFetch.js'
import useInfiniteScroll from '../hooks/useInfiniteScroll.js'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Spinner from 'react-bootstrap/Spinner'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import ListGroup from 'react-bootstrap/ListGroup'
import AppHeader from '../components/AppHeader'
import Breadcrumb from 'react-bootstrap/Breadcrumb'

const CONTENT_TYPES = {
  articles: {
    label: 'Өгүүлэл',
    icon: 'bi-journal-text',
    color: 'primary',
    endpoint: API_ENDPOINTS.INTEGRAL.ARTICLES,
    getPath: (item) => `/article/${item.uuid}`,
    getEditPath: (item) => `/article/${item.uuid}/edit`,
    getTitle: (item) => item.title || `Өгүүлэл #${item.id}`,
    getBody: (item) => item.abstract || 'Хураангуй байхгүй',
    getDate: (item) => item.published,
    emptyText: 'Өгүүлэл олдсонгүй',
    countLabel: 'өгүүлэл',
    createLabel: 'Шинэ өгүүлэл',
    createPayload: { title: 'Шинэ өгүүлэл (Гарчиггүй)', content: 'Өгүүллийн агуулга...', abstract: 'Товч хураангуй...' },
    createEditPath: (uuid) => `/article/${uuid}/edit`,
  },
  problems: {
    label: 'Бодлого',
    icon: 'bi-puzzle-fill',
    color: 'danger',
    endpoint: API_ENDPOINTS.INTEGRAL.PROBLEMS,
    getPath: (item) => `/problem/${item.uuid}`,
    getEditPath: (item) => `/problem/${item.uuid}/edit`,
    getTitle: (item) => item.title || `Бодлого #${item.id}`,
    getBody: (item) => item.statement || 'Агуулга байхгүй',
    getDate: (item) => item.last_edited,
    emptyText: 'Бодлого олдсонгүй',
    countLabel: 'бодлого',
    createLabel: 'Шинэ бодлого',
    createPayload: { title: 'Шинэ бодлого (Гарчиггүй)', statement: 'Бодлогын өгүүлбэр...', type: 0, is_public: false },
    createEditPath: (uuid) => `/problem/${uuid}/edit`,
  },
  formulas: {
    label: 'Томьёо',
    icon: 'bi-infinity',
    color: 'success',
    endpoint: API_ENDPOINTS.INTEGRAL.FORMULAS,
    getPath: (item) => `/formula/${item.uuid}`,
    getEditPath: (item) => `/formula/${item.uuid}/edit`,
    getTitle: (item) => item.title || `Томьёо #${item.id}`,
    getBody: (item) => item.content || 'Агуулга байхгүй',
    getDate: (item) => item.updated_at,
    emptyText: 'Томьёо олдсонгүй',
    countLabel: 'томьёо',
    createLabel: 'Шинэ томьёо',
    createPayload: { title: 'Шинэ томьёо (Гарчиггүй)', content: 'Томьёоны агуулга...' },
    createEditPath: (uuid) => `/formula/${uuid}/edit`,
  },
  quizzes: {
    label: 'Тест',
    icon: 'bi-patch-check',
    color: 'warning',
    endpoint: API_ENDPOINTS.INTEGRAL.QUIZZES,
    getPath: (item) => `/quiz/${item.uuid}`,
    getEditPath: (item) => `/quiz/${item.uuid}/edit`,
    getTitle: (item) => item.title || `Тест #${item.id}`,
    getBody: (item) => item.description || 'Тайлбар байхгүй',
    getDate: (item) => item.updated_at,
    emptyText: 'Тест олдсонгүй',
    countLabel: 'тест',
    createLabel: 'Шинэ тест',
    createPayload: { title: 'Шинэ тест (Гарчиггүй)', description: '' },
    createEditPath: (uuid) => `/quiz/${uuid}/edit`,
  },
}

const PROBLEM_TYPES = [
  { value: '0', label: 'Уламжлалт' },
  { value: '1', label: 'Сонгох тест' },
  { value: '4', label: 'Нөхөх тест' },
]

const PROBLEM_LEVELS = [
  { value: '1', label: 'Сэргээн санах' },
  { value: '2', label: 'Ойлгох' },
  { value: '3', label: 'Хэрэглэх' },
  { value: '4', label: 'Задлан шинжлэх' },
  { value: '5', label: 'Үнэлэх' },
  { value: '6', label: 'Бүтээх' },
]

const SUBJECTS = [
  { value: 'math', label: 'Математик', icon: 'bi-calculator', color: '#0d6efd' },
  { value: 'physics', label: 'Физик', icon: 'bi-lightning', color: '#fd7e14' },
  { value: 'chemistry', label: 'Хими', icon: 'bi-droplet-half', color: '#20c997' },
  { value: 'biology', label: 'Биологи', icon: 'bi-tree', color: '#198754' },
]

const getProblemTypeLabel = (type) => {
  const map = { 0: 'Уламжлалт', 1: 'Сонгох тест', 4: 'Нөхөх тест' }
  return map[type] || ''
}

const getSubjectLabel = (value) => {
  const found = SUBJECTS.find((s) => s.value === value)
  return found ? found.label : ''
}

function ContentBrowsePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const mainColRef = useRef(null)

  const [contentType, setContentType] = useState(
    searchParams.get('type') || 'problems'
  )
  const config = CONTENT_TYPES[contentType] || CONTENT_TYPES.problems

  // Categories & Topics
  const [categories, setCategories] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)

  // Filters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [myOnly, setMyOnly] = useState(false)
  const [selectedProblemTypes, setSelectedProblemTypes] = useState([])
  const [selectedProblemLevels, setSelectedProblemLevels] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [mathCategories, setMathCategories] = useState([])
  const [selectedMathCategory, setSelectedMathCategory] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const {
    data: items, loading, loadingMore, hasMore,
    fetchData, loadMore,
  } = usePaginatedFetch(config.endpoint)

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainColRef)

  const buildParams = useCallback(() => {
    const params = {}
    if (myOnly && user?.id) params.author = user.id
    if (selectedTopic) params.topic = selectedTopic.id
    else if (selectedCategory) params.category = selectedCategory.id
    if (searchInput) params.search = searchInput
    if (selectedSubject) params.subject = selectedSubject
    if (contentType === 'problems') {
      if (selectedProblemTypes.length > 0) params.type = selectedProblemTypes.join(',')
      if (selectedProblemLevels.length > 0) params.level = selectedProblemLevels.join(',')
      if (selectedMathCategory) params.math_category = selectedMathCategory.id
    }
    return params
  }, [myOnly, user?.id, selectedTopic, selectedCategory, searchInput, contentType, selectedProblemTypes, selectedProblemLevels, selectedSubject, selectedMathCategory])

  // Initialize categories on mount
  useEffect(() => {
    fetchCategories()
    fetchMathCategories()
    fetchData({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when content type changes — reset all filters
  useEffect(() => {
    setSelectedCategory(null)
    setSelectedTopic(null)
    setTopics([])
    setSelectedProblemTypes([])
    setSelectedProblemLevels([])
    setSelectedSubject(null)
    setSelectedMathCategory(null)
    setSearchInput('')
    setMyOnly(false)
    setSearchParams({ type: contentType }, { replace: true })
    fetchData({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType])

  // Re-fetch when filters change (not type)
  useEffect(() => {
    const params = buildParams()
    const urlParams = { type: contentType }
    if (selectedCategory) urlParams.category = selectedCategory.id
    if (selectedTopic) urlParams.topic = selectedTopic.id
    if (searchInput) urlParams.search = searchInput
    if (selectedProblemTypes.length > 0) urlParams.problemType = selectedProblemTypes.join(',')
    if (selectedProblemLevels.length > 0) urlParams.problemLevel = selectedProblemLevels.join(',')
    if (selectedSubject) urlParams.subject = selectedSubject
    if (selectedMathCategory) urlParams.mathCategory = selectedMathCategory.id
    setSearchParams(urlParams, { replace: true })
    fetchData(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTopic, myOnly, selectedProblemTypes, selectedProblemLevels, selectedSubject, selectedMathCategory])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      // Энэ sidebar зөвхөн Article-ийн агуулгын төрөл (Мэдээ/ЭЕШ/Олимпиад г.м)-д зориулагдсан —
      // математикийн Category-г холихгүйн тулд subject=content-оор шүүнэ.
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.CATEGORIES, {
        params: { subject: 'content' },
      })
      setCategories(res.data)
    } catch {
      /* ignore */
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchTopics = async (categoryId) => {
    setTopicsLoading(true)
    try {
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.TOPICS, {
        params: { category: categoryId },
      })
      setTopics(res.data)
    } catch {
      /* ignore */
    } finally {
      setTopicsLoading(false)
    }
  }

  const fetchMathCategories = async () => {
    try {
      // Зөвхөн бодит Problems-той ангиллыг харуулна (агуулгын төрлийн ангиллыг хасна)
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.MATH_CATEGORIES, {
        params: { has_problems: true },
      })
      setMathCategories(res.data)
    } catch {
      /* ignore */
    }
  }

  const handleContentTypeChange = (type) => {
    if (type === contentType) return
    setContentType(type)
  }

  const handleCategoryClick = (category) => {
    if (selectedCategory?.id === category?.id) return
    setSelectedCategory(category)
    setSelectedTopic(null)
    setTopics([])
    if (category) fetchTopics(category.id)
  }

  const handleTopicClick = (topic) => {
    setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)
  }

  const handleProblemTypeChange = (val) => {
    setSelectedProblemTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    )
  }

  const handleProblemLevelChange = (val) => {
    setSelectedProblemLevels((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]
    )
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchData(buildParams())
    setSearchParams((prev) => {
      if (searchInput) prev.set('search', searchInput)
      else prev.delete('search')
      return prev
    }, { replace: true })
  }

  const handleClearAll = () => {
    setSelectedCategory(null)
    setSelectedTopic(null)
    setTopics([])
    setSelectedProblemTypes([])
    setSelectedProblemLevels([])
    setSelectedSubject(null)
    setSelectedMathCategory(null)
    setSearchInput('')
    setMyOnly(false)
    setSearchParams({ type: contentType }, { replace: true })
    fetchData({})
  }

  const handleCreateNew = async () => {
    setIsCreating(true)
    try {
      const res = await apiClient.post(config.endpoint, config.createPayload)
      navigate(config.createEditPath(res.data.uuid))
    } catch {
      /* ignore */
    } finally {
      setIsCreating(false)
    }
  }

  const hasActiveFilters = selectedCategory || searchInput || myOnly || selectedProblemTypes.length > 0 || selectedProblemLevels.length > 0 || selectedSubject || selectedMathCategory

  const renderItemBadges = (item) => {
    const subjectBadge = item.subject && item.subject !== 'math' ? (
      <Badge
        className="small"
        style={{ backgroundColor: SUBJECTS.find((s) => s.value === item.subject)?.color || '#6c757d' }}
      >
        {getSubjectLabel(item.subject)}
      </Badge>
    ) : null

    if (contentType === 'problems') {
      return (
        <>
          {subjectBadge}
          {item.category && (
            <Badge className="small" style={{ backgroundColor: item.category.color || '#6c757d' }}>
              {item.category.name_mn}
            </Badge>
          )}
          {item.level_name && <Badge bg="secondary" className="small">{item.level_name}</Badge>}
          {item.type !== undefined && <Badge bg="info" text="dark" className="small">{getProblemTypeLabel(item.type)}</Badge>}
        </>
      )
    }
    if (contentType === 'quizzes' && item.problems_count != null) {
      return <Badge bg="info" text="dark" className="small">{item.problems_count} бодлого</Badge>
    }
    if (contentType === 'formulas') {
      return (
        <>
          {subjectBadge}
          {item.topic_name && <Badge bg="secondary" className="small">{item.topic_name}</Badge>}
        </>
      )
    }
    if (contentType === 'articles') {
      return (
        <>
          {subjectBadge}
          {item.category && (
            <Badge className="small" style={{ backgroundColor: item.category.color || '#6c757d' }}>
              {item.category.name_mn}
            </Badge>
          )}
        </>
      )
    }
    return null
  }

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="d-flex flex-column vh-100">

        <AppHeader />

        {/* Main */}
        <div className="flex-grow-1 overflow-hidden">
          <Row className="g-0 h-100">

            {/* Left Sidebar */}
            <Col lg={3} md={4} className="border-end bg-light h-100 overflow-auto d-none d-md-block">
              <div className="p-3">

                {/* Хайлт */}
                <Form onSubmit={handleSearch} className="mb-3">
                  <InputGroup size="sm">
                    <Form.Control
                      type="text"
                      placeholder={`${config.label} хайх...`}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <Button variant={`outline-${config.color}`} type="submit">
                      <i className="bi bi-search"></i>
                    </Button>
                  </InputGroup>
                </Form>

                {/* Content type switcher */}
                <h6 className="text-uppercase text-muted small fw-bold mb-2">
                  <i className="bi bi-collection me-1"></i>Контентийн төрөл
                </h6>
                <ListGroup variant="flush" className="mb-3">
                  {Object.entries(CONTENT_TYPES).map(([key, ct]) => (
                    <ListGroup.Item
                      key={key}
                      action
                      active={contentType === key}
                      onClick={() => handleContentTypeChange(key)}
                      className="py-2 px-3 small d-flex align-items-center gap-2"
                    >
                      <i className={`bi ${ct.icon}`}></i>
                      {ct.label}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <hr className="my-2" />

                {/* My Only */}
                {user && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <i className="bi bi-person me-1"></i>Шүүлтүүр
                    </h6>
                    <Form.Check
                      type="checkbox"
                      id="my-only"
                      label="Зөвхөн миний"
                      checked={myOnly}
                      onChange={(e) => setMyOnly(e.target.checked)}
                      className="mb-3 small"
                    />
                    <hr className="my-2" />
                  </>
                )}

                {/* Subject filter */}
                <h6 className="text-uppercase text-muted small fw-bold mb-2">
                  <i className="bi bi-book me-1"></i>Хичээл
                </h6>
                <div className="d-flex flex-wrap gap-1 mb-3">
                  <Button
                    variant={!selectedSubject ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => { setSelectedSubject(null); setSelectedMathCategory(null) }}
                    className="px-2 py-1"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Бүгд
                  </Button>
                  {SUBJECTS.map((s) => (
                    <Button
                      key={s.value}
                      variant={selectedSubject === s.value ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedSubject(selectedSubject === s.value ? null : s.value)
                        if (selectedSubject !== s.value && s.value !== 'math') setSelectedMathCategory(null)
                      }}
                      className="px-2 py-1"
                      style={{
                        fontSize: '0.78rem',
                        ...(selectedSubject === s.value ? { backgroundColor: s.color, borderColor: s.color } : {}),
                      }}
                    >
                      <i className={`bi ${s.icon} me-1`}></i>{s.label}
                    </Button>
                  ))}
                </div>

                {/* Math category filter (зөвхөн math сонгосон эсвэл бүгд үед) */}
                {contentType === 'problems' && (!selectedSubject || selectedSubject === 'math') && mathCategories.length > 0 && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <i className="bi bi-grid-3x3 me-1"></i>Математик ангилал
                    </h6>
                    <ListGroup variant="flush" className="mb-3">
                      <ListGroup.Item
                        action active={!selectedMathCategory}
                        onClick={() => setSelectedMathCategory(null)}
                        className="py-2 px-3 small"
                      >
                        Бүгд
                      </ListGroup.Item>
                      {mathCategories.map((mc) => (
                        <ListGroup.Item
                          key={mc.id} action
                          active={selectedMathCategory?.id === mc.id}
                          onClick={() => setSelectedMathCategory(selectedMathCategory?.id === mc.id ? null : mc)}
                          className="py-2 px-3 small d-flex align-items-center gap-2"
                        >
                          <span
                            className="rounded-circle d-inline-block"
                            style={{ width: 10, height: 10, backgroundColor: mc.color, flexShrink: 0 }}
                          />
                          {mc.name_mn || mc.name}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </>
                )}
                <hr className="my-2" />

                {/* Categories & Topics (articles, formulas зэрэгт) */}
                {contentType !== 'problems' && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <i className="bi bi-folder me-1"></i>Ангилал
                    </h6>
                    {categoriesLoading ? (
                      <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                    ) : (
                      <ListGroup variant="flush" className="mb-3">
                        <ListGroup.Item
                          action active={!selectedCategory}
                          onClick={() => handleCategoryClick(null)}
                          className="py-2 px-3 small"
                        >
                          <i className="bi bi-grid-3x3-gap me-2"></i>Бүгд
                        </ListGroup.Item>
                        {categories.map((cat) => (
                          <ListGroup.Item
                            key={cat.id} action
                            active={selectedCategory?.id === cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className="py-2 px-3 small"
                          >
                            <i className="bi bi-folder2 me-2"></i>{cat.name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}

                    {/* Topics */}
                    {selectedCategory && (
                      <>
                        <h6 className="text-uppercase text-muted small fw-bold mb-2">
                          <i className="bi bi-tag me-1"></i>Сэдэв
                        </h6>
                        {topicsLoading ? (
                          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                        ) : topics.length === 0 ? (
                          <p className="text-muted small px-3">Сэдэв байхгүй</p>
                        ) : (
                          <ListGroup variant="flush" className="mb-3">
                            {topics.map((topic) => (
                              <ListGroup.Item
                                key={topic.id} action
                                active={selectedTopic?.id === topic.id}
                                onClick={() => handleTopicClick(topic)}
                                className="py-2 px-3 small"
                              >
                                <i className="bi bi-hash me-1"></i>{topic.name}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Problem type filter */}
                {contentType === 'problems' && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2 mt-2">
                      <i className="bi bi-funnel me-1"></i>Бодлогын төрөл
                    </h6>
                    {PROBLEM_TYPES.map((pt) => (
                      <Form.Check
                        key={pt.value}
                        type="checkbox"
                        id={`ptype-${pt.value}`}
                        label={pt.label}
                        checked={selectedProblemTypes.includes(pt.value)}
                        onChange={() => handleProblemTypeChange(pt.value)}
                        className="mb-1 small"
                      />
                    ))}

                    <h6 className="text-uppercase text-muted small fw-bold mb-2 mt-3">
                      <i className="bi bi-bar-chart me-1"></i>Түвшин
                    </h6>
                    {PROBLEM_LEVELS.map((lv) => (
                      <Form.Check
                        key={lv.value}
                        type="checkbox"
                        id={`plevel-${lv.value}`}
                        label={lv.label}
                        checked={selectedProblemLevels.includes(lv.value)}
                        onChange={() => handleProblemLevelChange(lv.value)}
                        className="mb-1 small"
                      />
                    ))}
                  </>
                )}

                {user && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-100 mt-3"
                    onClick={handleCreateNew}
                    disabled={isCreating}
                  >
                    {isCreating
                      ? <Spinner animation="border" size="sm" />
                      : <><i className="bi bi-plus-lg me-1"></i>{config.createLabel}</>
                    }
                  </Button>
                )}

                {hasActiveFilters && (
                  <Button variant="outline-secondary" size="sm" className="w-100 mt-2" onClick={handleClearAll}>
                    <i className="bi bi-x-circle me-1"></i>Шүүлтүүр цэвэрлэх
                  </Button>
                )}

                <Button
                  variant="link"
                  size="sm"
                  className="w-100 mt-2 text-muted text-decoration-none"
                  onClick={() => navigate('/latex-examples')}
                >
                  <i className="bi bi-book me-1"></i>LaTeX заавар
                </Button>
              </div>
            </Col>

            {/* Main Content */}
            <Col lg={9} md={8} className="h-100 overflow-auto" ref={mainColRef}>
              <Container fluid className="py-3 px-4">

                {/* Breadcrumb + count */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      onClick={handleClearAll}
                      active={!selectedCategory}
                      linkProps={{ style: { cursor: 'pointer' } }}
                    >
                      {config.label}
                    </Breadcrumb.Item>
                    {selectedCategory && (
                      <Breadcrumb.Item
                        onClick={() => setSelectedTopic(null)}
                        active={!selectedTopic}
                        linkProps={{ style: { cursor: 'pointer' } }}
                      >
                        {selectedCategory.name}
                      </Breadcrumb.Item>
                    )}
                    {selectedTopic && <Breadcrumb.Item active>{selectedTopic.name}</Breadcrumb.Item>}
                  </Breadcrumb>
                  <Badge bg="secondary">{items.length} {config.countLabel}</Badge>
                </div>

                {/* Mobile filters */}
                <div className="d-md-none mb-3">
                  {/* Mobile хайлт */}
                  <Form onSubmit={handleSearch} className="mb-2">
                    <InputGroup size="sm">
                      <Form.Control
                        type="text"
                        placeholder={`${config.label} хайх...`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                      <Button variant={`outline-${config.color}`} type="submit">
                        <i className="bi bi-search"></i>
                      </Button>
                    </InputGroup>
                  </Form>

                  {/* Type switcher */}
                  <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                    {Object.entries(CONTENT_TYPES).map(([key, ct]) => (
                      <Button
                        key={key}
                        variant={contentType === key ? ct.color : `outline-${ct.color}`}
                        size="sm"
                        onClick={() => handleContentTypeChange(key)}
                        className="text-nowrap"
                      >
                        <i className={`bi ${ct.icon} me-1`}></i>{ct.label}
                      </Button>
                    ))}
                  </div>

                  {user && (
                    <Form.Check
                      type="checkbox" id="my-only-mobile"
                      label="Зөвхөн миний"
                      checked={myOnly}
                      onChange={(e) => setMyOnly(e.target.checked)}
                      className="mb-2 small"
                    />
                  )}

                  {/* Subject chips */}
                  <div className="d-flex gap-1 overflow-auto pb-2 mb-2">
                    {SUBJECTS.map((s) => (
                      <Button
                        key={s.value}
                        variant={selectedSubject === s.value ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(selectedSubject === s.value ? null : s.value)
                          if (selectedSubject !== s.value && s.value !== 'math') setSelectedMathCategory(null)
                        }}
                        className="text-nowrap"
                        style={selectedSubject === s.value ? { backgroundColor: s.color, borderColor: s.color } : {}}
                      >
                        <i className={`bi ${s.icon} me-1`}></i>{s.label}
                      </Button>
                    ))}
                  </div>

                  {/* Math category chips (mobile) */}
                  {contentType === 'problems' && (!selectedSubject || selectedSubject === 'math') && mathCategories.length > 0 && (
                    <div className="d-flex gap-1 overflow-auto pb-2 mb-2">
                      {mathCategories.map((mc) => (
                        <Button
                          key={mc.id}
                          variant={selectedMathCategory?.id === mc.id ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setSelectedMathCategory(selectedMathCategory?.id === mc.id ? null : mc)}
                          className="text-nowrap"
                          style={selectedMathCategory?.id === mc.id ? { backgroundColor: mc.color, borderColor: mc.color } : {}}
                        >
                          {mc.name_mn || mc.name}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Level chips (problems) */}
                  {contentType === 'problems' && (
                    <div className="d-flex gap-1 overflow-auto pb-2 mb-2">
                      {PROBLEM_LEVELS.map((lv) => (
                        <Button
                          key={lv.value}
                          variant={selectedProblemLevels.includes(lv.value) ? 'warning' : 'outline-warning'}
                          size="sm"
                          onClick={() => handleProblemLevelChange(lv.value)}
                          className="text-nowrap"
                        >
                          {lv.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Category chips (articles, formulas зэрэгт) */}
                  {contentType !== 'problems' && (
                    <>
                      <div className="d-flex gap-2 overflow-auto pb-2">
                        <Button
                          variant={!selectedCategory ? 'primary' : 'outline-primary'}
                          size="sm" onClick={() => handleCategoryClick(null)} className="text-nowrap"
                        >
                          Бүгд
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            variant={selectedCategory?.id === cat.id ? 'primary' : 'outline-primary'}
                            size="sm" onClick={() => handleCategoryClick(cat)} className="text-nowrap"
                          >
                            {cat.name}
                          </Button>
                        ))}
                      </div>

                      {selectedCategory && topics.length > 0 && (
                        <div className="d-flex gap-2 overflow-auto pb-2 mt-2">
                          {topics.map((topic) => (
                            <Button
                              key={topic.id}
                              variant={selectedTopic?.id === topic.id ? 'info' : 'outline-info'}
                              size="sm" onClick={() => handleTopicClick(topic)} className="text-nowrap"
                            >
                              {topic.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Cards */}
                {loading && items.length === 0 ? (
                  <LoadingState message={`${config.label} ачааллаж байна...`} />
                ) : items.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-search fs-1 text-muted"></i>
                    <p className="text-muted mt-3">{config.emptyText}</p>
                    {hasActiveFilters && (
                      <Button variant="outline-primary" size="sm" onClick={handleClearAll}>
                        Шүүлтүүр цэвэрлэх
                      </Button>
                    )}
                  </div>
                ) : (
                  <Row className="g-3">
                    {items.map((item) => (
                      <Col key={item.uuid || item.id} lg={6} xl={4}>
                        <Card
                          className="h-100 shadow-sm"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(config.getPath(item))}
                        >
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex gap-1 flex-wrap mb-2">
                              {renderItemBadges(item)}
                              {item.is_public ? (
                                <Badge bg="success" className="small">Нийтэд харагдана</Badge>
                              ) : (
                                <Badge bg="secondary" className="small">Хувийн</Badge>
                              )}
                            </div>
                            <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                              <LivePreview content={stripPSTricks(config.getTitle(item), 80)} />
                            </div>
                            <div
                              className="text-muted small flex-grow-1"
                              style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                            >
                              <LivePreview content={stripPSTricks(config.getBody(item), 150)} />
                            </div>
                            <div className="text-muted small mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                              <div>
                                <i className="bi bi-person me-1"></i>
                                <UserName user={item.author} />
                                {config.getDate(item) && (
                                  <><span className="mx-1">·</span><span>{formatDate(config.getDate(item))}</span></>
                                )}
                              </div>
                              {contentType === 'quizzes' && (
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>#{item.id}</span>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}

                <div ref={triggerRef} style={{ height: '1px', marginTop: '16px' }} />

                {loadingMore && (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2 text-muted small">Ачааллаж байна...</span>
                  </div>
                )}

                {items.length > 0 && !hasMore && (
                  <div className="text-center text-muted small mt-3 mb-4">
                    Нийт {items.length} {config.countLabel} харагдаж байна
                  </div>
                )}
              </Container>
            </Col>
          </Row>
        </div>
      </div>
    </MathJaxContext>
  )
}

export default ContentBrowsePage
