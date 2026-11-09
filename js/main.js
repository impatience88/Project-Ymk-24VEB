// Устанавливаем текущий год в подвале сайта.
const yearElement = document.querySelector('#currentYear');

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
