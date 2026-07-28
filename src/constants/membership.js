// frontend/src/constants/membership.js
// Гишүүнчлэлийн түвшин болон давуу эрхүүд
// Backend-тэй нийцүүлэн site_role + membership_tier систем

export const SITE_ROLES = {
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  OTHER: 'OTHER',
};

export const MEMBERSHIP_TIERS = {
  FREE: 'FREE',
  MEMBER: 'MEMBER',
  PRO: 'PRO',  // Backend-д PRO, харин багшид VIP гэж харуулна
  VIP: 'PRO',  // Alias: VIP = PRO
};

/**
 * Сайт дахь үүргийн тайлбар
 */
export const SITE_ROLE_CONFIG = {
  TEACHER: {
    label: 'Багш',
    description: 'Контент үүсгэх, клуб удирдах эрхтэй',
  },
  STUDENT: {
    label: 'Сурагч',
    description: 'Клубт элсэх, пост бичих эрхтэй',
  },
  PARENT: {
    label: 'Эцэг эх',
    description: 'Хүүхдийнхээ явцыг зөвхөн уншиж хянах эрхтэй',
  },
  OTHER: {
    label: 'Бусад',
    description: 'Хязгаарлагдмал эрхтэй',
  },
};

/**
 * Гишүүнчлэлийн түвшин бүрийн өнгө, тэмдэг, тайлбар
 */
export const MEMBERSHIP_CONFIG = {
  FREE: {
    color: '#6c757d', // Саарал
    badge: null,
    label: 'Үнэгүй',
  },
  MEMBER: {
    color: '#1DA1F2', // Twitter blue (баталгаажсан badge-тай ижил)
    badge: 'bi-gem',
    label: 'Гишүүн',
  },
  PRO: {
    color: '#FFD700', // Алт
    badge: 'bi-star-fill',
    label: 'VIP',  // Багшид VIP гэж харуулна
    shine: true,
  },
  VIP: {  // Alias
    color: '#FFD700',
    badge: 'bi-star-fill',
    label: 'VIP',
    shine: true,
  },
};

/**
 * site_role + membership_tier хослолын түлхүүр үүсгэх
 */
export function getMembershipKey(siteRole, membershipTier) {
  return `${siteRole}:${membershipTier}`;
}

/**
 * Эрхийн матриц - backend-тэй яг адилхан
 */
export const MEMBERSHIP_PERMISSIONS = {
  // БАГШИЙН ЭРХ
  'TEACHER:FREE': {
    maxClubs: 1,
    maxClubMembers: 10,
    boostedPostsPerMonth: 0,
    showAds: true,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    canCreateContent: false,
    canJoinClubs: true,
    canCreateClubs: true,
    canPurchaseAddons: false,
    canUseAi: false,
    roleType: 'teacher',
    label: 'Үнэгүй багш',
    description: '1 клуб, 10 сурагч, контент үүсгэхгүй, зартай',
  },
  'TEACHER:MEMBER': {
    maxClubs: 5,
    maxClubMembers: 25,  // Клуб бүрт 25
    boostedPostsPerMonth: 5,
    showAds: false,
    maxImagesPerPost: 10,
    maxVideoSize: 200 * 1024 * 1024, // 200MB
    canCreateContent: true,
    canJoinClubs: true,
    canCreateClubs: true,
    canPurchaseAddons: true,  // Нэмэлт худалдаж авах боломжтой
    canUseAi: true,
    teachersPerClubBonus: 10,  // 1 багш = +10 сурагч
    roleType: 'teacher',
    label: 'Энгийн багш',
    description: '5 клуб, клуб бүрт 25 сурагч, нэмэлт худалдаж авах боломжтой',
  },
  'TEACHER:PRO': {
    maxClubs: Infinity,
    maxClubMembers: Infinity,
    boostedPostsPerMonth: Infinity,
    showAds: false,
    maxImagesPerPost: 20,
    maxVideoSize: 1024 * 1024 * 1024, // 1GB
    canCreateContent: true,
    canJoinClubs: true,
    canCreateClubs: true,
    canPurchaseAddons: false,  // Хязгааргүй тул шаардлагагүй
    canUseAi: true,
    roleType: 'teacher',
    label: 'VIP багш',
    description: 'Хязгааргүй клуб, хязгааргүй сурагч (админ олгоно)',
  },
  'TEACHER:VIP': {  // Alias for PRO
    maxClubs: Infinity,
    maxClubMembers: Infinity,
    boostedPostsPerMonth: Infinity,
    showAds: false,
    maxImagesPerPost: 20,
    maxVideoSize: 1024 * 1024 * 1024, // 1GB
    canCreateContent: true,
    canJoinClubs: true,
    canCreateClubs: true,
    canPurchaseAddons: false,
    roleType: 'teacher',
    label: 'VIP багш',
    description: 'Хязгааргүй клуб, хязгааргүй сурагч (админ олгоно)',
  },

  // СУРАГЧИЙН ЭРХ
  'STUDENT:FREE': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    canCreateContent: false,
    canJoinClubs: false,  // FREE сурагч клубд элсэх боломжгүй!
    canCreateClubs: false,
    canUseAi: false,
    roleType: 'student',
    label: 'Үнэгүй сурагч',
    description: 'Үзэх, пост бичих, клубд элсэхгүй',
  },
  'STUDENT:MEMBER': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 10,
    maxVideoSize: 200 * 1024 * 1024, // 200MB
    canCreateContent: false,
    canJoinClubs: true,  // MEMBER сурагч клубд элсэх боломжтой
    canCreateClubs: false,
    canUseAi: true,
    roleType: 'student',
    label: 'Гишүүн сурагч',
    description: 'Клубт элсэх, пост бичих, илүү олон зураг',
  },
  'STUDENT:PRO': {  // Endowment-ээ бүрмөсөн хандивласан сурагч (backend: convert_to_permanent)
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 10,
    maxVideoSize: 200 * 1024 * 1024, // 200MB
    canCreateContent: false,
    canJoinClubs: true,
    canCreateClubs: false,
    canUseAi: true,
    roleType: 'student',
    label: 'VIP сурагч',
    description: 'Хугацаагүй VIP эрх, тэргүүн ээлжийн боломж',
  },

  // ЭЦЭГ ЭХИЙН ЭРХ
  'PARENT:FREE': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: true,
    maxImagesPerPost: 3,
    maxVideoSize: 50 * 1024 * 1024, // 50MB
    canCreateContent: false,
    canJoinClubs: false,
    canCreateClubs: false,
    canPurchaseAddons: false,
    canUseAi: false,
    roleType: 'parent',
    label: 'Үнэгүй эцэг эх',
    description: 'Хүүхдийнхээ явцыг хянах, хязгаарлагдмал',
  },
  'PARENT:MEMBER': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    canCreateContent: false,
    canJoinClubs: false,
    canCreateClubs: false,
    canPurchaseAddons: false,
    canUseAi: true,
    roleType: 'parent',
    label: 'Гишүүн эцэг эх',
    description: 'Хүүхдийнхээ явцыг хянах, AI боломж ашиглах',
  },
  'PARENT:PRO': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    canCreateContent: false,
    canJoinClubs: false,
    canCreateClubs: false,
    canPurchaseAddons: false,
    canUseAi: true,
    roleType: 'parent',
    label: 'VIP эцэг эх',
    description: 'Хүүхдийнхээ явцыг хянах, тэргүүн ээлжийн эрх',
  },

  // БУСАД/ЗОЧИН
  'OTHER:FREE': {
    maxClubs: 0,
    maxClubMembers: 0,
    boostedPostsPerMonth: 0,
    showAds: true,
    maxImagesPerPost: 3,
    maxVideoSize: 50 * 1024 * 1024, // 50MB
    canCreateContent: false,
    canJoinClubs: false,
    canCreateClubs: false,
    canUseAi: false,
    roleType: 'other',
    label: 'Зочин',
    description: 'Үзэх эрхтэй, хязгаарлагдмал',
  },
  'OTHER:MEMBER': {
    maxClubs: 1,
    maxClubMembers: 10,
    boostedPostsPerMonth: 0,
    showAds: false,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    canCreateContent: false,
    canJoinClubs: true,
    canCreateClubs: false,
    canUseAi: true,
    roleType: 'other',
    label: 'Гишүүн',
    description: 'Клубт элсэх, пост бичих',
  },
  'OTHER:PRO': {
    maxClubs: 3,
    maxClubMembers: 30,
    boostedPostsPerMonth: 5,
    showAds: false,
    maxImagesPerPost: 10,
    maxVideoSize: 200 * 1024 * 1024, // 200MB
    canCreateContent: false,
    canJoinClubs: true,
    canCreateClubs: true,
    canUseAi: true,
    roleType: 'other',
    label: 'Мэргэжлийн гишүүн',
    description: 'Клуб үүсгэх, илүү олон боломж',
  },
};

/**
 * Хэрэглэгчийн эрхүүдийг авах
 * @param {string} siteRole - Сайт дахь үүрэг (TEACHER, STUDENT, OTHER)
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин (FREE, MEMBER, PRO)
 * @returns {Object} Эрхүүдийн объект
 */
export function getMembershipPermissions(siteRole = 'OTHER', membershipTier = 'FREE') {
  const key = getMembershipKey(siteRole, membershipTier);
  return MEMBERSHIP_PERMISSIONS[key] || MEMBERSHIP_PERMISSIONS['OTHER:FREE'];
}

/**
 * Хэрэглэгч шинэ клуб үүсгэж болох эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @param {number} currentClubCount - Одоогийн клубын тоо
 * @returns {boolean}
 */
export function canCreateClub(siteRole, membershipTier, currentClubCount) {
  const perms = getMembershipPermissions(siteRole, membershipTier);

  if (!perms.canCreateClubs) {
    return false;
  }

  if (perms.maxClubs === Infinity) {
    return true;
  }

  return currentClubCount < perms.maxClubs;
}

/**
 * Хэрэглэгч boosted post үүсгэж болох эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @param {number} currentBoostedCount - Энэ сард үүсгэсэн boosted post-ын тоо
 * @returns {boolean}
 */
export function canCreateBoostedPost(siteRole, membershipTier, currentBoostedCount) {
  const perms = getMembershipPermissions(siteRole, membershipTier);

  if (perms.boostedPostsPerMonth === Infinity) {
    return true;
  }

  return currentBoostedCount < perms.boostedPostsPerMonth;
}

/**
 * Зар харуулах эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @returns {boolean}
 */
export function shouldShowAds(siteRole, membershipTier) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  return perms.showAds;
}

/**
 * Контент үүсгэх эрхтэй эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @returns {boolean}
 */
export function canCreateContent(siteRole, membershipTier) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  return perms.canCreateContent;
}

/**
 * Клубт элсэх эрхтэй эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @returns {boolean}
 */
export function canJoinClubs(siteRole, membershipTier) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  return perms.canJoinClubs;
}

/**
 * AI боломж ашиглах эрхтэй эсэхийг шалгах (FREE tier ашиглах боломжгүй)
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @returns {boolean}
 */
export function canUseAi(siteRole, membershipTier) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  return perms.canUseAi || false;
}

// Legacy support - хуучин кодтой нийцтэй байлгах
export const MEMBERSHIP_LIMITS = {
  FREE: {
    maxClubs: 1,
    maxClubMembers: 10,
    boostedPostsPerMonth: 0,
    showAds: true,
    maxImagesPerPost: 5,
    maxVideoSize: 100 * 1024 * 1024,
  },
  MEMBER: {
    maxClubs: 3,
    maxClubMembers: 30,
    boostedPostsPerMonth: 5,
    showAds: false,
    maxImagesPerPost: 10,
    maxVideoSize: 200 * 1024 * 1024,
  },
  PRO: {
    maxClubs: 10,
    maxClubMembers: 100,
    boostedPostsPerMonth: Infinity,
    showAds: false,
    maxImagesPerPost: 20,
    maxVideoSize: 1024 * 1024 * 1024,
  },
};

/**
 * Legacy function - хуучин кодтой нийцтэй байлгах
 */
export function getMembershipLimits(tier = 'FREE') {
  return MEMBERSHIP_LIMITS[tier] || MEMBERSHIP_LIMITS.FREE;
}

/**
 * Нийт клубын тоог тооцоолох (үндсэн + нэмэлт)
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @param {number} bonusClubSlots - Нэмэлт худалдаж авсан клубын тоо
 * @returns {number}
 */
export function getTotalMaxClubs(siteRole, membershipTier, bonusClubSlots = 0) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  const baseClubs = perms.maxClubs;

  if (baseClubs === Infinity) {
    return Infinity;
  }

  return baseClubs + bonusClubSlots;
}

/**
 * Клубын нийт сурагчдын тоог тооцоолох
 * @param {number} baseLimit - Үндсэн хязгаар
 * @param {number} bonusMemberSlots - Нэмэлт худалдаж авсан
 * @param {number} teachersCount - Багш нарын тоо
 * @returns {number}
 */
export function getClubMaxMembers(baseLimit, bonusMemberSlots = 0, teachersCount = 0) {
  const teacherBonus = teachersCount * 10; // 1 багш = +10 сурагч
  return baseLimit + bonusMemberSlots + teacherBonus;
}

/**
 * Нэмэлт худалдаж авах боломжтой эсэхийг шалгах
 * @param {string} siteRole - Сайт дахь үүрэг
 * @param {string} membershipTier - Гишүүнчлэлийн түвшин
 * @returns {boolean}
 */
export function canPurchaseAddons(siteRole, membershipTier) {
  const perms = getMembershipPermissions(siteRole, membershipTier);
  return perms.canPurchaseAddons || false;
}
