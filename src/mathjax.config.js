// src/mathjax.config.js (ШИНЭЧИЛСЭН)
// "window.MathJax =" гэснийг "export const mathJaxConfig =" болгож өөрчлөв.

export const mathJaxConfig = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    macros: {
      tg: '\\operatorname{tg}',
      ctg: '\\operatorname{ctg}',
      arctg: '\\operatorname{arctg}',
      arcctg: '\\operatorname{arcctg}',
      cosec: '\\operatorname{cosec}',
      sgn: '\\operatorname{sgn}',
      lt: '\\,<\\,',
      geo: '\\div\\kern{-0.5em}\\div',
    },
    packages: { '[+]': ['ams', 'cancel', 'color'] },
  },
  svg: {
    scale: 1.05,
  },
};
