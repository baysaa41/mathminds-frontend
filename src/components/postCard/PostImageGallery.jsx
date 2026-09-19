// src/components/postCard/PostImageGallery.jsx

import { useRef, useEffect } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

export const PostImageGallery = ({ images }) => {
  const galleryRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!galleryRef.current || !images || images.length === 0) return;

    viewerRef.current = new Viewer(galleryRef.current, {
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: images.length > 1 ? 1 : 0,
        play: 0,
        next: images.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 0,
        flipVertical: 0,
      },
      navbar: images.length > 1,
      title: false,
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  // 1. Нэг зураг байвал: Бүтнээр нь харуулах
  if (images.length === 1) {
    return (
      <div ref={galleryRef} className="my-2" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[0].image}
          className="img-fluid post-image"
          alt="Post attachment"
          style={{
            maxWidth: '100%',
            maxHeight: '600px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
            cursor: 'zoom-in',
          }}
        />
      </div>
    );
  }

  // 2. 2+ зураг байвал: Grid
  const visibleImages = images.slice(0, 4);
  const hiddenImages = images.slice(4);

  return (
    <div ref={galleryRef} className="my-2" onClick={(e) => e.stopPropagation()}>
      <div
        className="post-image-gallery"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {visibleImages.map((img, index) => (
          <div
            key={img.id}
            className="position-relative"
            style={{ paddingTop: '100%', overflow: 'hidden' }}
          >
            <img
              src={img.image}
              alt={`Post image ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'zoom-in',
              }}
            />
            {images.length > 4 && index === 3 && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                }}
              >
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Viewer-т зориулсан нуугдмал зургууд (5-с дээш зурагтай үед) */}
      {hiddenImages.map((img) => (
        <img key={img.id} src={img.image} alt="Post attachment" style={{ display: 'none' }} />
      ))}
    </div>
  );
};
