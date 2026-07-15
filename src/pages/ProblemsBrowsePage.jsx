import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
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
import Navbar from 'react-bootstrap/Navbar'
import ListGroup from 'react-bootstrap/ListGroup'
import Breadcrumb from 'react-bootstrap/Breadcrumb'

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

const getProblemTypeLabel = (type) => {
  const types = { 0: 'Уламжлалт', 1: 'Сонгох тест', 4: 'Нөхөх тест' }
  return types[type] || 'Тодорхойгүй'
}

function ProblemsBrowsePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const mainColRef = useRef(null)

  // Categories & Topics
  const [categories, setCategories] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)

  // Filters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedLevels, setSelectedLevels] = useState([])
  const [myOnly, setMyOnly] = useState(false)

  const {
    data: problems, loading, loadingMore, hasMore,
    fetchData, loadMore,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.PROBLEMS)

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainColRef)

  const buildParams = useCallback(() => {
    const params = {}
    if (myOnly && user?.id) params.author = user.id
    if (selectedTopic) params.topic = selectedTopic.id
    else if (selectedCategory) params.category = selectedCategory.id
    if (searchInput) params.search = searchInput
    if (selectedTypes.length > 0) params.type = selectedTypes.join(',')
    if (selectedLevels.length > 0) params.level = selectedLevels.join(',')
    return params
  }, [myOnly, user?.id, selectedTopic, selectedCategory, searchInput, selectedTypes, selectedLevels])

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const topicParam = searchParams.get('topic')
    const typeParam = searchParams.get('type')
    const levelParam = searchParams.get('level')

    if (typeParam) setSelectedTypes(typeParam.split(','))
    if (levelParam) setSelectedLevels(levelParam.split(','))

    fetchCategories().then((cats) => {
      if (categoryParam) {
        const catId = parseInt(categoryParam)
        const cat = cats.find((c) => c.id === catId)
        if (cat) {
          setSelectedCategory(cat)
          fetchTopics(catId).then((loadedTopics) => {
            if (topicParam) {
              const topicId = parseInt(topicParam)
              const topic = loadedTopics.find((t) => t.id === topicId)
              if (topic) setSelectedTopic(topic)
            }
          })
        }
      } else {
        fetchData({})
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when filters change
  useEffect(() => {
    const params = buildParams()
    const urlParams = {}
    if (selectedCategory) urlParams.category = selectedCategory.id
    if (selectedTopic) urlParams.topic = selectedTopic.id
    if (searchInput) urlParams.search = searchInput
    if (selectedTypes.length > 0) urlParams.type = selectedTypes.join(',')
    if (selectedLevels.length > 0) urlParams.level = selectedLevels.join(',')
    setSearchParams(urlParams, { replace: true })
    fetchData(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTopic, selectedTypes, selectedLevels, myOnly])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      // Зөвхөн бодит Problems-той ангиллыг харуулна (жишээ нь 'Мэдээ' зэрэг Article-ийн
      // агуулгын төрлийн ангиллыг хасна — бодлого тэдгээрт байхгүй тул шүүлтүүрт хэрэггүй)
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.CATEGORIES, {
        params: { has_problems: true },
      })
      setCategories(res.data)
      return res.data
    } catch {
      return []
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
      return res.data
    } catch {
      return []
    } finally {
      setTopicsLoading(false)
    }
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

  const handleTypeChange = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue) ? prev.filter((t) => t !== typeValue) : [...prev, typeValue],
    )
  }

  const handleLevelChange = (levelValue) => {
    setSelectedLevels((prev) =>
      prev.includes(levelValue) ? prev.filter((l) => l !== levelValue) : [...prev, levelValue],
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
    setSelectedTypes([])
    setSelectedLevels([])
    setSearchInput('')
    setMyOnly(false)
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters = selectedCategory || selectedTypes.length > 0 || selectedLevels.length > 0 || searchInput || myOnly

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="d-flex flex-column vh-100">
        {/* Top Navbar */}
        <Navbar bg="white" className="border-bottom shadow-sm px-3" style={{ zIndex: 10 }}>
          <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
            <i className="bi bi-puzzle-fill text-primary me-2 fs-4"></i>
            <span className="fw-bold">Бодлогын сан</span>
          </Navbar.Brand>

          <Form onSubmit={handleSearch} className="d-flex mx-auto" style={{ maxWidth: 500, flex: 1 }}>
            <InputGroup>
              <Form.Control
                type="text" placeholder="Бодлого хайх..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)} size="sm"
              />
              <Button variant="outline-primary" type="submit" size="sm">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>

          <Link to="/content/browse?type=problems" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i>Бодлогууд
          </Link>
        </Navbar>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-hidden">
          <Row className="g-0 h-100">
            {/* Left Sidebar */}
            <Col lg={3} md={4} className="border-end bg-light h-100 overflow-auto d-none d-md-block">
              <div className="p-3">
                {user && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <i className="bi bi-person me-1"></i>Шүүлтүүр
                    </h6>
                    <Form.Check
                      type="checkbox" id="my-only"
                      label="Зөвхөн миний"
                      checked={myOnly}
                      onChange={(e) => setMyOnly(e.target.checked)}
                      className="mb-3 small"
                    />
                    <hr className="my-2" />
                  </>
                )}

                <h6 className="text-uppercase text-muted small fw-bold mb-2">
                  <i className="bi bi-folder me-1"></i>Ангилал
                </h6>

                {categoriesLoading ? (
                  <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                ) : (
                  <ListGroup variant="flush" className="mb-3">
                    <ListGroup.Item action active={!selectedCategory} onClick={() => handleCategoryClick(null)} className="py-2 px-3 small">
                      <i className="bi bi-grid-3x3-gap me-2"></i>Бүгд
                    </ListGroup.Item>
                    {categories.map((cat) => (
                      <ListGroup.Item key={cat.id} action active={selectedCategory?.id === cat.id} onClick={() => handleCategoryClick(cat)} className="py-2 px-3 small">
                        <i className="bi bi-folder2 me-2"></i>{cat.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}

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
                          <ListGroup.Item key={topic.id} action active={selectedTopic?.id === topic.id} onClick={() => handleTopicClick(topic)} className="py-2 px-3 small">
                            <i className="bi bi-hash me-1"></i>{topic.name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </>
                )}

                <h6 className="text-uppercase text-muted small fw-bold mb-2 mt-3">
                  <i className="bi bi-bar-chart me-1"></i>Түвшин
                </h6>
                {PROBLEM_LEVELS.map((level) => (
                  <Form.Check
                    key={level.value} type="checkbox"
                    id={`browse-level-${level.value}`} label={level.label}
                    checked={selectedLevels.includes(level.value)}
                    onChange={() => handleLevelChange(level.value)}
                    className="mb-1 small"
                  />
                ))}

                <h6 className="text-uppercase text-muted small fw-bold mb-2 mt-3">
                  <i className="bi bi-funnel me-1"></i>Төрөл
                </h6>
                {PROBLEM_TYPES.map((type) => (
                  <Form.Check
                    key={type.value} type="checkbox"
                    id={`browse-type-${type.value}`} label={type.label}
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeChange(type.value)}
                    className="mb-1 small"
                  />
                ))}

                {hasActiveFilters && (
                  <Button variant="outline-secondary" size="sm" className="w-100 mt-3" onClick={handleClearAll}>
                    <i className="bi bi-x-circle me-1"></i>Шүүлтүүр цэвэрлэх
                  </Button>
                )}
              </div>
            </Col>

            {/* Main Problem List */}
            <Col lg={9} md={8} className="h-100 overflow-auto" ref={mainColRef}>
              <Container fluid className="py-3 px-4">
                {/* Breadcrumb */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item onClick={handleClearAll} active={!selectedCategory} linkProps={{ style: { cursor: 'pointer' } }}>Бүгд</Breadcrumb.Item>
                    {selectedCategory && (
                      <Breadcrumb.Item onClick={() => setSelectedTopic(null)} active={!selectedTopic} linkProps={{ style: { cursor: 'pointer' } }}>
                        {selectedCategory.name}
                      </Breadcrumb.Item>
                    )}
                    {selectedTopic && <Breadcrumb.Item active>{selectedTopic.name}</Breadcrumb.Item>}
                  </Breadcrumb>
                  <Badge bg="secondary" className="ms-2">{problems.length} бодлого</Badge>
                </div>

                {/* Mobile Filters */}
                <div className="d-md-none mb-3">
                  {user && (
                    <Form.Check type="checkbox" id="my-only-mobile" label="Зөвхөн миний" checked={myOnly} onChange={(e) => setMyOnly(e.target.checked)} className="mb-2 small" />
                  )}
                  <div className="d-flex gap-2 overflow-auto pb-2">
                    <Button variant={!selectedCategory ? 'primary' : 'outline-primary'} size="sm" onClick={() => handleCategoryClick(null)} className="text-nowrap">Бүгд</Button>
                    {categories.map((cat) => (
                      <Button key={cat.id} variant={selectedCategory?.id === cat.id ? 'primary' : 'outline-primary'} size="sm" onClick={() => handleCategoryClick(cat)} className="text-nowrap">{cat.name}</Button>
                    ))}
                  </div>
                  {selectedCategory && topics.length > 0 && (
                    <div className="d-flex gap-2 overflow-auto pb-2 mt-2">
                      {topics.map((topic) => (
                        <Button key={topic.id} variant={selectedTopic?.id === topic.id ? 'info' : 'outline-info'} size="sm" onClick={() => handleTopicClick(topic)} className="text-nowrap">{topic.name}</Button>
                      ))}
                    </div>
                  )}
                  <div className="d-flex gap-2 overflow-auto pb-2 mt-2">
                    {PROBLEM_LEVELS.map((level) => (
                      <Button key={level.value} variant={selectedLevels.includes(level.value) ? 'warning' : 'outline-warning'} size="sm" onClick={() => handleLevelChange(level.value)} className="text-nowrap">{level.label}</Button>
                    ))}
                  </div>
                </div>

                {/* Problem Cards */}
                {loading && problems.length === 0 ? (
                  <LoadingState message="Бодлогуудыг ачааллаж байна..." />
                ) : problems.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-search fs-1 text-muted"></i>
                    <p className="text-muted mt-3">Бодлого олдсонгүй</p>
                    {hasActiveFilters && (
                      <Button variant="outline-primary" size="sm" onClick={handleClearAll}>Шүүлтүүр цэвэрлэх</Button>
                    )}
                  </div>
                ) : (
                  <Row className="g-3">
                    {problems.map((problem) => (
                      <Col key={problem.id} lg={6} xl={4}>
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/problem/${problem.uuid}`)}>
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex gap-1 flex-wrap mb-2">
                              {problem.level_name && <Badge bg="secondary" className="small">{problem.level_name}</Badge>}
                              {problem.type !== undefined && <Badge bg="info" className="small">{getProblemTypeLabel(problem.type)}</Badge>}
                              {problem.is_public ? (
                                <Badge bg="success" className="small">Нийтэд харагдана</Badge>
                              ) : (
                                <Badge bg="secondary" className="small">Хувийн</Badge>
                              )}
                            </div>
                            <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                              <LivePreview content={stripPSTricks(problem.title || `Бодлого #${problem.id}`, 80)} />
                            </div>
                            <div className="text-muted small flex-grow-1" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              <LivePreview content={stripPSTricks(problem.statement || 'Агуулга байхгүй', 150)} />
                            </div>
                            <div className="text-muted small mt-2 pt-2 border-top">
                              <i className="bi bi-person me-1"></i>
                              <UserName user={problem.author} />
                              {problem.last_edited && (
                                <><span className="mx-1">·</span><span>{formatDate(problem.last_edited)}</span></>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}

                {/* Infinite scroll trigger */}
                <div ref={triggerRef} style={{ height: '1px', marginTop: '16px' }} />

                {loadingMore && (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2 text-muted small">Ачааллаж байна...</span>
                  </div>
                )}

                {problems.length > 0 && !hasMore && (
                  <div className="text-center text-muted small mt-3 mb-4">
                    Нийт {problems.length} бодлого харагдаж байна
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

export default ProblemsBrowsePage
