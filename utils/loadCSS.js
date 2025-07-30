// loadCSS.js
let cssJaCarregado = false;

export default function loadCSS(url) {
  if (cssJaCarregado) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.prepend(link);
  cssJaCarregado = true;
}
