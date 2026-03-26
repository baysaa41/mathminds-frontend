// frontend/src/components/UserName.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import { MEMBERSHIP_CONFIG } from '../constants/membership';

/**
 * UserName компонент
 * @param {Object} props
 * @param {Object} props.user - Хэрэглэгчийн объект
 * @param {boolean} props.showLink - Линк харуулах эсэх (default: true)
 * @param {string} props.className - Нэмэлт CSS класс
 * @param {boolean} props.showMembershipBadge - Гишүүнчлэлийн badge харуулах эсэх (default: true)
 */
function UserName({ user, showLink = true, className = '', showMembershipBadge = true }) {
  if (!user) return null;

  const displayName = user.ai_name_mn || user.first_name || user.email || user.username;
  const tier = user.membership_tier || 'FREE';
  const config = MEMBERSHIP_CONFIG[tier] || MEMBERSHIP_CONFIG.FREE;

  const nameContent = <span className={className}>{displayName}</span>;

  return (
    <span className="d-inline-flex align-items-center gap-1">
      {showLink ? (
        <Link
          to={`/profile/${user.username}`}
          className="text-decoration-none"
          style={{ color: 'inherit' }}
        >
          {nameContent}
        </Link>
      ) : (
        nameContent
      )}

      {/* Verified Badge */}
      <VerifiedBadge isVerified={user.is_verified} size="sm" />

      {/* Membership Badge */}
      {showMembershipBadge && config.badge && (
        <i
          className={`${config.badge}`}
          style={{
            color: config.color,
            fontSize: '15.4px', // 10% томруулсан (14px * 1.1)
            filter: config.shine ? 'drop-shadow(0 0 2px rgba(255,215,0,0.6))' : 'none',
          }}
          title={config.label}
        ></i>
      )}
    </span>
  );
}

export default UserName;
