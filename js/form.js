// Проверка формы и отправка заявки на сервер.

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#signupForm");
    const phoneInput = document.querySelector("#phone");
    const courseSelect = document.querySelector("#course");
    const consentInput = document.querySelector("#consent");
    const successMessage = document.querySelector("#formSuccess");
    const successText = document.querySelector("#formSuccessText");
    const errorMessage = document.querySelector("#formError");
    const submitButton = form?.querySelector('button[type="submit"]');

    if (!form || !phoneInput || !courseSelect || !consentInput || !submitButton) {
        return;
    }

    // Подставляем курс, если посетитель пришёл со страницы курсов.
    const params = new URLSearchParams(window.location.search);
    const selectedCourse = params.get("course");

    if (selectedCourse && courseSelect.querySelector(`option[value="${selectedCourse}"]`)) {
        courseSelect.value = selectedCourse;
    }

    // Форматируем телефон по шаблону +7(XXX)-XXX-XX-XX.
    function formatPhone(value) {
        let digits = value.replace(/\D/g, "");

        if (digits.length === 0) return "";

        if (digits.startsWith("7") || digits.startsWith("8")) {
            digits = digits.slice(1);
        }

        digits = digits.slice(0, 10);

        let result = "+7";

        if (digits.length > 0) result += "(" + digits.slice(0, 3);
        if (digits.length >= 3) result += ")";
        if (digits.length > 3) result += "-" + digits.slice(3, 6);
        if (digits.length > 6) result += "-" + digits.slice(6, 8);
        if (digits.length > 8) result += "-" + digits.slice(8, 10);

        return result;
    }

    function hideMessages() {
        successMessage?.classList.add("d-none");
        errorMessage?.classList.add("d-none");
    }

    function showError(message) {
        if (!errorMessage) {
            window.alert(message);
            return;
        }

        errorMessage.textContent = message;
        errorMessage.classList.remove("d-none");
        errorMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    phoneInput.addEventListener("input", function () {
        phoneInput.value = formatPhone(phoneInput.value);
        phoneInput.setCustomValidity("");
        hideMessages();
    });

    form.addEventListener("input", hideMessages);
    form.addEventListener("change", hideMessages);

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        event.stopPropagation();
        hideMessages();

        const phonePattern = /^\+7\([0-9]{3}\)-[0-9]{3}-[0-9]{2}-[0-9]{2}$/;

        if (!phonePattern.test(phoneInput.value)) {
            phoneInput.setCustomValidity("Укажи полный номер телефона в нужном формате.");
        } else {
            phoneInput.setCustomValidity("");
        }

        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            form.reportValidity();
            return;
        }

        const formData = {
            fullName: form.elements.fullName.value.trim(),
            phone: phoneInput.value.trim(),
            email: form.elements.email.value.trim(),
            course: courseSelect.value,
            consent: consentInput.checked
        };

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Отправка...";

        try {
            const response = await fetch("/api/applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(result.message || "Не удалось отправить заявку.");
            }

            if (successText) {
                successText.textContent = `${result.message} Номер заявки: ${result.applicationId}.`;
            }

            successMessage?.classList.remove("d-none");
            successMessage?.scrollIntoView({ behavior: "smooth", block: "nearest" });

            form.reset();
            form.classList.remove("was-validated");
        } catch (error) {
            showError(error.message || "Не удалось связаться с сервером. Проверь, запущен ли сайт через Node.js.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});
