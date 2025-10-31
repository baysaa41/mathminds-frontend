// frontend/src/components/common/SearchBar.jsx
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { Search } from 'lucide-react';

const SearchBar = ({
                       onSearch,
                       placeholder = 'Хайх...',
                       filters = [],
                       loading = false
                   }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState(
        filters.reduce((acc, filter) => ({ ...acc, [filter.name]: filter.defaultValue || '' }), {})
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ search: searchQuery, ...filterValues });
    };

    const handleFilterChange = (filterName, value) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Row className="g-3 mb-4">
                {/* Хайлтын талбар */}
                <Col md={filters.length > 0 ? 8 : 9}>
                    <InputGroup>
                        <InputGroup.Text>
                            <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={loading}
                        />
                    </InputGroup>
                </Col>

                {/* Шүүлтүүр */}
                {filters.map((filter) => (
                    <Col key={filter.name} md={filter.colSize || 2}>
                        <Form.Select
                            value={filterValues[filter.name]}
                            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                            disabled={loading}
                        >
                            {filter.options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                ))}

                {/* Хайх товч */}
                <Col md={filters.length > 0 ? 2 : 3}>
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-100"
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner as="span" animation="border" size="sm" />
                        ) : (
                            'Хайх'
                        )}
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};

export default SearchBar;