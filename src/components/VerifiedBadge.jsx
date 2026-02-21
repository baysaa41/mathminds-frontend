// frontend/src/components/VerifiedBadge.jsx
import React from 'react';

/**
 * Verified Badge компонент
 * @param {Object} props
 * @param {boolean} props.isVerified - Баталгаажсан эсэх
 * @param {string} props.size - Тэмдэгний хэмжээ (sm, md, lg)
 * @param {string} props.className - Нэмэлт CSS класс
 */
function VerifiedBadge({ isVerified, size = 'md', className = '' }) {
  if (!isVerified) return null;

  // 10% томруулсан хэмжээ
  const sizeMap = {
    sm: '15.4px', // 14 * 1.1
    md: '17.6px', // 16 * 1.1
    lg: '22px', // 20 * 1.1
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <i
      className={`bi bi-patch-check-fill ${className}`}
      style={{
        fontSize: iconSize,
        marginLeft: '4px',
        verticalAlign: 'middle',
        color: '#1DA1F2', // Номин цэнхэр өнгө
        filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15))', // Бага зэрэг сүүдэр
      }}
      title="Баталгаажсан хэрэглэгч"
    ></i>
  );
}

export default VerifiedBadge;
