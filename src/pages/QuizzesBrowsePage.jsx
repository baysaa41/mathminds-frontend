// frontend/src/pages/QuizzesBrowsePage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MathJaxContext } from 'better-react-mathjax'
import { mathJaxConfig } from '../mathjax.config.js'
import apiClient from '../api/axiosConfig.js'
import LivePreview from '../components/LivePreview.jsx'
import { stripPSTricks } from '../utils/stripPSTricks.js'
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

function QuizzesBrowsePage() {
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
  const [myOnly, setMyOnly] = useState(false)

  const {
    data: quizzes, loading, loadingMore, hasMore,
    fetchData, loadMore,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.QUIZZES)

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainColRef)

  const buildParams = useCallback(() => {
    const params = {}
    if (myOnly && user?.id) params.author = user.id
    if (selectedTopic) params.topic = selectedTopic.id
    else if (selectedCategory) params.category = selectedCategory.id
    if (searchInput) params.search = searchInput
    return params
  }, [myOnly, user?.id, selectedTopic, selectedCategory, searchInput])

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const topicParam = searchParams.get('topic')

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
    setSearchParams(urlParams, { replace: true })
    fetchData(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTopic, myOnly])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.CATEGORIES)
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
    setSearchInput('')
    setMyOnly(false)
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters = selectedCategory || searchInput || myOnly

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="d-flex flex-column vh-100">
        {/* Top Navbar */}
        <Navbar bg="white" className="border-bottom shadow-sm px-3" style={{ zIndex: 10 }}>
          <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
            <i className="bi bi-patch-check text-primary me-2 fs-4"></i>
            <span className="fw-bold">Тестийн сан</span>
          </Navbar.Brand>

          <Form onSubmit={handleSearch} className="d-flex mx-auto" style={{ maxWidth: 500, flex: 1 }}>
            <InputGroup>
              <Form.Control
                type="text" placeholder="Тест хайх..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)} size="sm"
              />
              <Button variant="outline-primary" type="submit" size="sm">
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>

          <Link to="/content/browse?type=quizzes" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i>Тестүүд
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

                {hasActiveFilters && (
                  <Button variant="outline-secondary" size="sm" className="w-100 mt-2" onClick={handleClearAll}>
                    <i className="bi bi-x-circle me-1"></i>Шүүлтүүр цэвэрлэх
                  </Button>
                )}
              </div>
            </Col>

            {/* Main Content */}
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
                  <Badge bg="secondary" className="ms-2">{quizzes.length} тест</Badge>
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
                </div>

                {/* Cards */}
                {loading && quizzes.length === 0 ? (
                  <LoadingState message="Тестүүдийг ачааллаж байна..." />
                ) : quizzes.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-search fs-1 text-muted"></i>
                    <p className="text-muted mt-3">Тест олдсонгүй</p>
                    {hasActiveFilters && <Button variant="outline-primary" size="sm" onClick={handleClearAll}>Шүүлтүүр цэвэрлэх</Button>}
                  </div>
                ) : (
                  <Row className="g-3">
                    {quizzes.map((quiz) => (
                      <Col key={quiz.id} lg={6} xl={4}>
                        <Card className="h-100 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/quiz/${quiz.uuid}`)}>
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex gap-1 flex-wrap mb-2">
                              {quiz.is_public ? (
                                <Badge bg="success" className="small">Нийтэд харагдана</Badge>
                              ) : (
                                <Badge bg="secondary" className="small">Хувийн</Badge>
                              )}
                              <Badge bg="light" text="dark" className="small border">
                                {quiz.problems_count || 0} бодлого
                              </Badge>
                            </div>
                            <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                              <LivePreview content={stripPSTricks(quiz.title || `Тест #${quiz.id}`, 80)} />
                            </div>
                            <div className="text-muted small flex-grow-1" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              <LivePreview content={stripPSTricks(quiz.description || 'Тайлбар байхгүй', 150)} />
                            </div>
                            <div className="text-muted small mt-2 pt-2 border-top">
                              <i className="bi bi-person me-1"></i>
                              <UserName user={quiz.author} />
                              {quiz.updated_at && (
                                <><span className="mx-1">·</span><span>{new Date(quiz.updated_at).toLocaleDateString('mn-MN')}</span></>
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

                {quizzes.length > 0 && !hasMore && (
                  <div className="text-center text-muted small mt-3 mb-4">
                    Нийт {quizzes.length} тест харагдаж байна
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

export default QuizzesBrowsePage
