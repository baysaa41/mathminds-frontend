import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MathJaxContext } from 'better-react-mathjax'
import { mathJaxConfig } from '../mathjax.config.js'
import apiClient from '../api/axiosConfig.js'
import LivePreview from '../components/LivePreview.jsx'
import { stripPSTricks } from '../utils/stripPSTricks.js'
import { formatDate } from '../utils/dateFormatter'
import LoadingState from '../components/common/LoadingState.jsx'
import UserName from '../components/UserName.jsx'
import { API_ENDPOINTS } from '../constants/api.js'

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

const getProblemTypeLabel = (type) => {
  const types = { 0: 'Уламжлалт', 1: 'Сонгох тест', 4: 'Нөхөх тест' }
  return types[type] || 'Тодорхойгүй'
}

function ProblemsBrowsePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Categories & Topics
  const [categories, setCategories] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)

  // Problems
  const [problems, setProblems] = useState([])
  const [problemsLoading, setProblemsLoading] = useState(true)
  const [problemsLoadingMore, setProblemsLoadingMore] = useState(false)
  const [nextPage, setNextPage] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  // Search & Filters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [selectedTypes, setSelectedTypes] = useState([])

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const topicParam = searchParams.get('topic')
    const typeParam = searchParams.get('type')

    if (typeParam) {
      setSelectedTypes(typeParam.split(','))
    }

    // Fetch categories first, then set selections after
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
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch problems when filters change
  useEffect(() => {
    fetchProblems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTopic, selectedTypes])

  // Update URL params
  useEffect(() => {
    const params = {}
    if (selectedCategory) params.category = selectedCategory.id
    if (selectedTopic) params.topic = selectedTopic.id
    if (searchInput) params.search = searchInput
    if (selectedTypes.length > 0) params.type = selectedTypes.join(',')
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTopic, selectedTypes])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.CATEGORIES)
      setCategories(res.data)
      return res.data
    } catch {
      console.error('Failed to fetch categories')
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
      console.error('Failed to fetch topics')
      return []
    } finally {
      setTopicsLoading(false)
    }
  }

  const fetchProblems = useCallback(
    async (searchOverride) => {
      setProblemsLoading(true)
      try {
        const params = {}
        if (selectedTopic) {
          params.topic = selectedTopic.id
        } else if (selectedCategory) {
          params.category = selectedCategory.id
        }
        const search = searchOverride !== undefined ? searchOverride : searchInput
        if (search) params.search = search
        if (selectedTypes.length > 0) params.type = selectedTypes.join(',')

        const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.PROBLEMS, { params })
        setProblems(res.data.results || res.data)
        setNextPage(res.data.next || null)
        setTotalCount(res.data.count || (res.data.results || res.data).length)
      } catch {
        console.error('Failed to fetch problems')
      } finally {
        setProblemsLoading(false)
      }
    },
    [selectedCategory, selectedTopic, searchInput, selectedTypes],
  )

  const loadMore = async () => {
    if (!nextPage || problemsLoadingMore) return
    setProblemsLoadingMore(true)
    try {
      const res = await apiClient.get(nextPage)
      setProblems((prev) => [...prev, ...(res.data.results || res.data)])
      setNextPage(res.data.next || null)
    } catch {
      console.error('Failed to load more problems')
    } finally {
      setProblemsLoadingMore(false)
    }
  }

  const handleCategoryClick = (category) => {
    if (selectedCategory?.id === category?.id) return
    setSelectedCategory(category)
    setSelectedTopic(null)
    setTopics([])
    if (category) {
      fetchTopics(category.id)
    }
  }

  const handleTopicClick = (topic) => {
    if (selectedTopic?.id === topic?.id) {
      setSelectedTopic(null)
    } else {
      setSelectedTopic(topic)
    }
  }

  const handleTypeChange = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue) ? prev.filter((t) => t !== typeValue) : [...prev, typeValue],
    )
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(
      (prev) => {
        if (searchInput) prev.set('search', searchInput)
        else prev.delete('search')
        return prev
      },
      { replace: true },
    )
    fetchProblems(searchInput)
  }

  const handleClearAll = () => {
    setSelectedCategory(null)
    setSelectedTopic(null)
    setTopics([])
    setSelectedTypes([])
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="d-flex flex-column vh-100">
        {/* Top Navbar */}
        <Navbar bg="white" className="border-bottom shadow-sm px-3" style={{ zIndex: 10 }}>
          <Navbar.Brand
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
            className="d-flex align-items-center"
          >
            <i className="bi bi-puzzle-fill text-primary me-2 fs-4"></i>
            <span className="fw-bold">Бодлогын сан</span>
          </Navbar.Brand>

          <Form
            onSubmit={handleSearch}
            className="d-flex mx-auto"
            style={{ maxWidth: 500, flex: 1 }}
          >
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Бодлого хайх..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="sm"
              />
              <Button variant="outline-primary" type="submit" size="sm">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>

          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/problems')}>
            <i className="bi bi-arrow-left me-1"></i>
            Буцах
          </Button>
        </Navbar>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-hidden">
          <Row className="g-0 h-100">
            {/* Left Sidebar */}
            <Col
              lg={3}
              md={4}
              className="border-end bg-light h-100 overflow-auto d-none d-md-block"
            >
              <div className="p-3">
                {/* Categories */}
                <h6 className="text-uppercase text-muted small fw-bold mb-2">
                  <i className="bi bi-folder me-1"></i>
                  Ангилал
                </h6>

                {categoriesLoading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <ListGroup variant="flush" className="mb-3">
                    <ListGroup.Item
                      action
                      active={!selectedCategory}
                      onClick={() => handleCategoryClick(null)}
                      className="py-2 px-3 small"
                    >
                      <i className="bi bi-grid-3x3-gap me-2"></i>
                      Бүгд
                    </ListGroup.Item>
                    {categories.map((cat) => (
                      <ListGroup.Item
                        key={cat.id}
                        action
                        active={selectedCategory?.id === cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="py-2 px-3 small"
                      >
                        <i className="bi bi-folder2 me-2"></i>
                        {cat.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}

                {/* Topics */}
                {selectedCategory && (
                  <>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <i className="bi bi-tag me-1"></i>
                      Сэдэв
                    </h6>

                    {topicsLoading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : topics.length === 0 ? (
                      <p className="text-muted small px-3">Сэдэв байхгүй</p>
                    ) : (
                      <ListGroup variant="flush" className="mb-3">
                        {topics.map((topic) => (
                          <ListGroup.Item
                            key={topic.id}
                            action
                            active={selectedTopic?.id === topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className="py-2 px-3 small"
                          >
                            <i className="bi bi-hash me-1"></i>
                            {topic.name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </>
                )}

                {/* Type Filters */}
                <h6 className="text-uppercase text-muted small fw-bold mb-2 mt-3">
                  <i className="bi bi-funnel me-1"></i>
                  Төрөл
                </h6>
                {PROBLEM_TYPES.map((type) => (
                  <Form.Check
                    key={type.value}
                    type="checkbox"
                    id={`browse-type-${type.value}`}
                    label={type.label}
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeChange(type.value)}
                    className="mb-1 small"
                  />
                ))}

                {/* Clear Filters */}
                {(selectedCategory || selectedTypes.length > 0 || searchInput) && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="w-100 mt-3"
                    onClick={handleClearAll}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Шүүлтүүр цэвэрлэх
                  </Button>
                )}
              </div>
            </Col>

            {/* Main Problem List */}
            <Col lg={9} md={8} className="h-100 overflow-auto">
              <Container fluid className="py-3 px-4">
                {/* Breadcrumb */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <Breadcrumb className="mb-0">
                    <Breadcrumb.Item
                      onClick={() => handleClearAll()}
                      active={!selectedCategory}
                      linkProps={{ style: { cursor: 'pointer' } }}
                    >
                      Бүгд
                    </Breadcrumb.Item>
                    {selectedCategory && (
                      <Breadcrumb.Item
                        onClick={() => {
                          setSelectedTopic(null)
                        }}
                        active={!selectedTopic}
                        linkProps={{ style: { cursor: 'pointer' } }}
                      >
                        {selectedCategory.name}
                      </Breadcrumb.Item>
                    )}
                    {selectedTopic && (
                      <Breadcrumb.Item active>{selectedTopic.name}</Breadcrumb.Item>
                    )}
                  </Breadcrumb>

                  <Badge bg="secondary" className="ms-2">
                    {totalCount} бодлого
                  </Badge>
                </div>

                {/* Mobile Filters */}
                <div className="d-md-none mb-3">
                  <div className="d-flex gap-2 overflow-auto pb-2">
                    <Button
                      variant={!selectedCategory ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleCategoryClick(null)}
                      className="text-nowrap"
                    >
                      Бүгд
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory?.id === cat.id ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => handleCategoryClick(cat)}
                        className="text-nowrap"
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
                          size="sm"
                          onClick={() => handleTopicClick(topic)}
                          className="text-nowrap"
                        >
                          {topic.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Problem Cards */}
                {problemsLoading ? (
                  <LoadingState message="Бодлогуудыг ачааллаж байна..." />
                ) : problems.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-search fs-1 text-muted"></i>
                    <p className="text-muted mt-3">Бодлого олдсонгүй</p>
                    {(selectedCategory || selectedTypes.length > 0 || searchInput) && (
                      <Button variant="outline-primary" size="sm" onClick={handleClearAll}>
                        Шүүлтүүр цэвэрлэх
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Row className="g-3">
                      {problems.map((problem) => (
                        <Col key={problem.id} lg={6} xl={4}>
                          <Card
                            className="h-100 shadow-sm"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/problem/${problem.uuid}`)}
                          >
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex gap-1 flex-wrap mb-2">
                                {problem.level_name && (
                                  <Badge bg="secondary" className="small">
                                    {problem.level_name}
                                  </Badge>
                                )}
                                {problem.type !== undefined && (
                                  <Badge bg="info" className="small">
                                    {getProblemTypeLabel(problem.type)}
                                  </Badge>
                                )}
                              </div>

                              <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                                <LivePreview
                                  content={stripPSTricks(
                                    problem.title || `Бодлого #${problem.id}`,
                                    80,
                                  )}
                                />
                              </div>

                              <div
                                className="text-muted small flex-grow-1"
                                style={{
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                <LivePreview
                                  content={stripPSTricks(
                                    problem.statement || 'Агуулга байхгүй',
                                    150,
                                  )}
                                />
                              </div>

                              <div className="text-muted small mt-2 pt-2 border-top">
                                <i className="bi bi-person me-1"></i>
                                <UserName user={problem.author} />
                                {problem.last_edited && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <span>{formatDate(problem.last_edited)}</span>
                                  </>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Load More */}
                    {nextPage && (
                      <div className="text-center mt-4 mb-3">
                        <Button
                          variant="outline-primary"
                          onClick={loadMore}
                          disabled={problemsLoadingMore}
                        >
                          {problemsLoadingMore ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Ачааллаж байна...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-arrow-down-circle me-1"></i>
                              Цааш үзэх
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="text-center text-muted small mt-3 mb-4">
                      {problems.length} / {totalCount} бодлого харагдаж байна
                    </div>
                  </>
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
