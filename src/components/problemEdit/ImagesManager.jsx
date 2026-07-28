// src/components/problemEdit/ImagesManager.jsx
// ProblemEditPage-ийн зурагны хэсэг (state-гүй, зөвхөн props хүлээж авдаг)

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { X, ImagePlus, Image as ImageIcon } from 'lucide-react';

export function ImagesManager({ images, imageError, uploadingImage, onImageUpload, onImageDelete }) {
  return (
    <div id="images-section">
      <h4>
        <ImageIcon size={20} className="me-2" />
        Зурагнууд
      </h4>
      {imageError && (
        <Alert variant="danger" className="py-2 small mb-2">{imageError}</Alert>
      )}
      {images.length > 0 && (
        <Row className="g-2 mb-3">
          {images.map((img) => (
            <Col key={img.id} xs={6} sm={4} md={3}>
              <div className="position-relative border rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={img.image}
                  alt=""
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-1 p-1 lh-1"
                  onClick={() => onImageDelete(img.id)}
                  title="Зураг устгах"
                >
                  <X size={14} />
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
      <Form.Group>
        <Form.Label
          htmlFor="image-upload-input"
          className="btn btn-outline-secondary btn-sm mb-0"
          style={{ cursor: 'pointer' }}
        >
          {uploadingImage ? (
            <><Spinner as="span" animation="border" size="sm" className="me-1" />Оруулж байна...</>
          ) : (
            <><ImagePlus size={16} className="me-1" />Зураг нэмэх</>
          )}
        </Form.Label>
        <Form.Control
          id="image-upload-input"
          type="file"
          accept="image/*"
          className="d-none"
          onChange={onImageUpload}
          disabled={uploadingImage}
        />
      </Form.Group>
    </div>
  );
}
