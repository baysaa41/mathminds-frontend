// src/mathjax.config.js (ШИНЭЧИЛСЭН)
// "window.MathJax =" гэснийг "export const mathJaxConfig =" болгож өөрчлөв.

export const mathJaxConfig = {
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    macros: {
      tg: '\\operatorname{tg}',
      ctg: '\\operatorname{ctg}',
      arctg: '\\operatorname{arctg}',
      arcctg: '\\operatorname{arcctg}',
      cosec: '\\operatorname{cosec}',
      sgn: '\\operatorname{sgn}',
      arsinh: '\\operatorname{arsinh}',
      arcosh: '\\operatorname{arcosh}',
      artanh: '\\operatorname{artanh}',
      arcoth: '\\operatorname{arcoth}',
      arccot: '\\operatorname{arccot}',
      lt: '\\,<\\,',
      geo: '\\div\\kern{-0.5em}\\div',
    },
    packages: { '[+]': ['ams', 'cancel', 'color'] },
  },
  svg: {
    scale: 1.05,
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
  },
};
