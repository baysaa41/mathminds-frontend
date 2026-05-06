import React from 'react';
import { Link } from 'react-router-dom';

/**
 * items: [{ label, to? }]
 * Сүүлийн item нь идэвхтэй (link-гүй), бусад нь link.
 * Эхэнд "Нүүр" автоматаар нэмэгдэнэ.
 */
const AppBreadcrumb = ({ items = [], className = '' }) => {
  const all = [{ label: 'Нүүр', to: '/' }, ...items];
  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol className="breadcrumb mb-0" style={{ fontSize: '0.82rem' }}>
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <li key={i} className={`breadcrumb-item${isLast ? ' active' : ''}`}
              aria-current={isLast ? 'page' : undefined}>
              {isLast || !item.to
                ? item.label
                : <Link to={item.to} className="text-decoration-none">{item.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default AppBreadcrumb;
