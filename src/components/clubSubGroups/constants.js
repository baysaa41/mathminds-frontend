// src/components/clubSubGroups/constants.js
// ClubSubGroupsPage-ийн тогтмолууд

export const RESOURCE_TYPE_LABELS = {
  article: 'Өгүүлэл', problem: 'Бодлого', pdf: 'PDF',
  link: 'Линк', video: 'Видео', quiz: 'Quiz',
};
export const RESOURCE_TYPE_COLORS = {
  problem: 'secondary', formula: 'info', article: 'danger',
  quiz: 'success', pdf: 'dark', video: 'primary', link: 'warning',
};

export const COLOR_OPTIONS = [
  { value: 'primary',   label: 'Цэнхэр'  },
  { value: 'success',   label: 'Ногоон'   },
  { value: 'danger',    label: 'Улаан'    },
  { value: 'warning',   label: 'Шар'      },
  { value: 'info',      label: 'Цайвар'   },
  { value: 'secondary', label: 'Саарал'   },
];

export const METHOD_OPTIONS = [
  {
    value: 'answer',
    label: 'Хариултын ижил төстэй байдлаар (LCA)',
    desc: 'Latent Class Analysis — хариултын хэлбэрт тулгуурлан ойролцоо хариулт өгсөн сурагчдыг нэг бүлэгт хуваана. Тус бүлгийн сул тал болон санал болгосон дасгалыг харуулна.',
  },
  {
    value: 'score',
    label: 'Оноогоор',
    desc: 'Дүнгээр нь эрэмбэлж тэнцүү тооны сурагчдыг бүлэгт хуваана.',
  },
];
