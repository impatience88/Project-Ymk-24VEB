// Проверка формы записи на бесплатный урок

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#signupForm");
    const phoneInput = document.querySelector("#phone");
    const courseSelect = document.querySelector("#course");
    const successMessage = document.querySelector("#formSuccess");

    if (!form || !phoneInput || !courseSelect || !successMessage) {
        return;
    }

    // Подставляем курс, если посетитель пришёл со страницы курсов.
    const params = new URLSearchParams(window.location.search);
    const selectedCourse = params.get("course");

    if (selectedCourse && courseSelect.querySelector(`option[value="${selectedCourse}"]`)) {
        courseSelect.value = selectedCourse;
    }

    // Форматируем номер телефона по шаблону +7(XXX)-XXX-XX-XX.
    function formatPhone(value) {
        let digits = value.replace(/\D/g, "");

        if (digits.length === 0) {
            return "";
        }

        // Убираем код страны, если пользователь ввёл его самостоятельно.
        if (digits.startsWith("7") || digits.startsWith("8")) {
            digits = digits.slice(1);
        }

        digits = digits.slice(0, 10);

        let result = "+7";

        if (digits.length > 0) {
            result += "(" + digits.slice(0, 3);
        }

        if (digits.length >= 3) {
            result += ")";
        }

        if (digits.length > 3) {
            result += "-" + digits.slice(3, 6);
        }

        if (digits.length > 6) {
            result += "-" + digits.slice(6, 8);
        }

        if (digits.length > 8) {
            result += "-" + digits.slice(8, 10);
        }

        return result;
    }

    phoneInput.addEventListener("input", function () {
        phoneInput.value = formatPhone(phoneInput.value);
        phoneInput.setCustomValidity("");
        successMessage.classList.add("d-none");
    });

    // При изменении любого поля скрываем старое сообщение об успехе.
    form.addEventListener("input", function () {
        successMessage.classList.add("d-none");
    });

    form.addEventListener("change", function () {
        successMessage.classList.add("d-none");
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Дополнительно проверяем формат телефона.
        const phonePattern = /^\+7\([0-9]{3}\)-[0-9]{3}-[0-9]{2}-[0-9]{2}$/;

        if (!phonePattern.test(phoneInput.value)) {
            phoneInput.setCustomValidity("Укажи полный номер телефона в нужном формате.");
        } else {
            phoneInput.setCustomValidity("");
        }

        // Браузер и Bootstrap покажут ошибки рядом с полями.
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            form.reportValidity();
            return;
        }

        form.classList.add("was-validated");
        successMessage.classList.remove("d-none");
        successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
});
