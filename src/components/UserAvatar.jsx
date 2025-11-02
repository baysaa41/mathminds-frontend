// frontend/src/components/UserAvatar.jsx
// Хэрэглэгчийн профайл зургийг харуулах нэгдсэн компонент

import React from 'react';
import Image from 'react-bootstrap/Image';

/**
 * Текстээс тогтмол hash утга үүсгэх
 * @param {string} str - Hash хийх текст
 * @returns {number} Hash утга
 */
const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Нэрээс тогтмол hex өнгө үүсгэх
 * @param {string} name - Хэрэглэгчийн нэр
 * @returns {string} Hex өнгө (жишээ: "3498db")
 */
const getColorFromName = (name) => {
    if (!name) return '3498db'; // Default өнгө

    const hash = hashCode(name);

    // Гоо сайхан өнгөнүүдийн өргөтгөсөн палитр (32 өнгө)
    const colors = [
        // Цэнхэр өнгөнүүд
        '3498db', // Цэнхэр
        '5dade2', // Цайвар цэнхэр
        '2e86c1', // Хар цэнхэр
        '21618c', // Хар цэнхэр бараан

        // Улаан/Ягаан өнгөнүүд
        'e74c3c', // Улаан
        'ec7063', // Ягаан улаан
        'c0392b', // Хар улаан
        'a93226', // Бараан улаан

        // Ногоон өнгөнүүд
        '2ecc71', // Ногоон
        '58d68d', // Цайвар ногоон
        '27ae60', // Ногоон ногтон
        '1e8449', // Хар ногоон

        // Шар/Алт өнгөнүүд
        'f39c12', // Шар
        'f1c40f', // Алт шар
        'f8c471', // Цайвар шар
        'd68910', // Бараан шар

        // Нил ягаан өнгөнүүд
        '9b59b6', // Нил ягаан
        'af7ac5', // Цайвар нил ягаан
        '8e44ad', // Нил ягаан тод
        '7d3c98', // Бараан нил ягаан

        // Дарь/Усан өнгөнүүд
        '1abc9c', // Дарь өнгө
        '48c9b0', // Цайвар дарь
        '16a085', // Ногоон дарь
        '138d75', // Хар дарь

        // Улбар шар өнгөнүүд
        'e67e22', // Улбар шар
        'eb984e', // Цайвар улбар
        'd35400', // Улбар шар бараан
        'ba4a00', // Хар улбар

        // Саарал/Хар өнгөнүүд
        '34495e', // Хар саарал
        '5d6d7e', // Саарал
        '2c3e50', // Хар цэнхэр
        '1c2833', // Хар
    ];

    return colors[hash % colors.length];
};

/**
 * Хэрэглэгчийн avatar URL үүсгэх функц
 * @param {Object} user - Хэрэглэгчийн объект
 * @param {number} size - Зургийн хэмжээ (пикселээр)
 * @returns {string} Avatar-н URL
 */
const getAvatarUrl = (user, size = 96) => {
    if (!user) return '/default-avatar.png';

    // 1. ЭРЭМБЭ: Профайл зураг байвал ҮРГЭЛЖ түүнийг ашиглах
    const pictureUrl = user.picture_url || user.profile_pic_url;

    // Зураг хоосон биш бол шууд буцаах (whitespace ч тоологдохгүй)
    if (pictureUrl?.trim()) {
        return pictureUrl.trim();
    }

    // 2. Зураг байхгүй бол нэр/имэйлээс үүсгэх
    let nameForAvatar = user.first_name || user.username || user.email;

    if (!nameForAvatar) {
        return '/default-avatar.png';
    }

    // Имэйл бол @ -ийн өмнөх хэсгийг авах
    if (nameForAvatar.includes('@')) {
        nameForAvatar = nameForAvatar.split('@')[0];
    }

    // Цэвэрлэх
    nameForAvatar = nameForAvatar.trim();

    // Хоосон байвал default зураг
    if (!nameForAvatar) {
        return '/default-avatar.png';
    }

    // Нэр + ID-г ашиглан давтагдашгүй өнгө үүсгэх
    const uniqueKey = `${nameForAvatar}-${user.id || ''}`;
    const bgColor = getColorFromName(uniqueKey);

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&length=1&background=${bgColor}&color=fff&size=${size}`;
};

/**
 * UserAvatar компонент
 * @param {Object} props
 * @param {Object} props.user - Хэрэглэгчийн объект (first_name, username, email, picture_url гэх мэт)
 * @param {number} props.size - Зургийн өргөн/өндөр (пикселээр, default: 96)
 * @param {string} props.className - Нэмэлт CSS класс
 * @param {boolean} props.border - Хүрээ харуулах эсэх (default: false)
 * @param {string} props.borderClass - Хүрээний CSS класс (default: 'border border-2 border-white')
 */
function UserAvatar({
                        user,
                        size = 96,
                        className = '',
                        border = false,
                        borderClass = 'border border-2 border-white'
                    }) {
    const avatarUrl = getAvatarUrl(user, size);
    const fullClassName = `${border ? borderClass : ''} ${className}`.trim();

    // Alt текстийг цэвэрхэн болгох (имэйл бол @ өмнөх хэсгийг авах)
    let altText = user?.first_name || user?.username || user?.email || 'User';
    if (altText.includes('@')) {
        altText = altText.split('@')[0];
    }

    // Debug: Avatar URL-г шалгах (хөгжүүлэлтийн үед)
    if (process.env.NODE_ENV === 'development' && !user?.picture_url && !user?.profile_pic_url) {
        console.log('UserAvatar Debug:', {
            username: user?.username,
            first_name: user?.first_name,
            id: user?.id,
            generatedUrl: avatarUrl
        });
    }

    return (
        <Image
            src={avatarUrl}
            alt={altText}
            roundedCircle
            width={size}
            height={size}
            className={fullClassName}
        />
    );
}

export default UserAvatar;