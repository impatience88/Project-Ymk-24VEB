// Цены взяты из файла "данные для расчета стоимости курса.txt"
// Значения указаны за одно занятие.

const coursePrices = {
    english: {
        economy: 500,
        comfort: 550,
        intensive: 650
    },
    chinese: {
        economy: 700,
        comfort: 760,
        intensive: 820
    },
    italian: {
        economy: 650,
        comfort: 720,
        intensive: 800
    },
    spanish: {
        economy: 600,
        comfort: 700,
        intensive: 780
    }
};

const courseNames = {
    english: "Английский язык",
    chinese: "Китайский язык",
    italian: "Итальянский язык",
    spanish: "Испанский язык"
};

const currencyFormatter = new Intl.NumberFormat("ru-RU");

const courseSelect = document.getElementById("calcCourse");
const tariffSelect = document.getElementById("calcTariff");
const durationSelect = document.getElementById("calcDuration");
const lessonsRange = document.getElementById("calcLessons");
const lessonsValue = document.getElementById("lessonsValue");
const pricePerLesson = document.getElementById("pricePerLesson");
const totalPrice = document.getElementById("totalPrice");
const calculationFormula = document.getElementById("calculationFormula");
const calculatorSignup = document.getElementById("calculatorSignup");

function formatPrice(value) {
    return `${currencyFormatter.format(value)} ₽`;
}

function updateCalculator() {
    if (!courseSelect || !tariffSelect || !lessonsRange) {
        return;
    }

    const course = courseSelect.value;
    const tariff = tariffSelect.value;
    const lessons = Number(lessonsRange.value);
    const duration = durationSelect.value;

    const price = coursePrices[course][tariff];
    const total = price * lessons;

    lessonsValue.textContent = lessons;
    pricePerLesson.textContent = formatPrice(price);
    totalPrice.textContent = formatPrice(total);
    calculationFormula.textContent = `${formatPrice(price)} × ${lessons} занятий`;

    calculatorSignup.href = `signup.html?course=${course}`;

    // Продолжительность показываем в выборе, но не меняем цену:
    // в приложении преподавателя нет коэффициентов для разных длительностей.
    durationSelect.setAttribute("aria-label", `Продолжительность занятия: ${duration} минут`);
}

[courseSelect, tariffSelect, durationSelect, lessonsRange].forEach((element) => {
    if (element) {
        element.addEventListener("input", updateCalculator);
        element.addEventListener("change", updateCalculator);
    }
});

// Поиск по карточкам курсов
const courseSearch = document.getElementById("courseSearch");
const courseItems = document.querySelectorAll(".course-item");
const noCoursesMessage = document.getElementById("noCoursesMessage");

if (courseSearch) {
    courseSearch.addEventListener("input", () => {
        const searchText = courseSearch.value.trim().toLowerCase();
        let visibleCount = 0;

        courseItems.forEach((item) => {
            const courseName = item.dataset.courseName.toLowerCase();
            const isVisible = courseName.includes(searchText);

            item.classList.toggle("d-none", !isVisible);

            if (isVisible) {
                visibleCount++;
            }
        });

        noCoursesMessage.classList.toggle("d-none", visibleCount > 0);
    });
}

// Сразу показываем расчёт при открытии страницы
updateCalculator();
