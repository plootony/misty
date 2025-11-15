<script setup>
import { ref, watchEffect } from 'vue';
import { useUserStore } from '@/stores/user.store';
import { validateUserName, validateUserAge } from '@/services/mistral.service';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['complete']);

const userStore = useUserStore();

// Блокировка скролла body при открытии модалки
watchEffect(() => {
    if (props.show) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
});
const name = ref(userStore.userData?.name || '');
const birthDate = ref('');
const isLoading = ref(false);
const error = ref('');

const validateForm = async () => {
    // Проверка имени
    if (!name.value.trim()) {
        error.value = 'Пожалуйста, укажите ваше имя';
        return false;
    }

    // ИИ-валидация имени
    try {
        const nameValidation = await validateUserName(name.value.trim());
        if (!nameValidation.isValid) {
            error.value = nameValidation.reason || 'Указано некорректное имя';
            return false;
        }
    } catch (err) {
        console.warn('Ошибка валидации имени через ИИ, продолжаем с базовой проверкой:', err);
        // В случае ошибки ИИ продолжаем без блокировки
    }

    // Проверка даты рождения
    if (!birthDate.value) {
        error.value = 'Пожалуйста, укажите дату рождения';
        return false;
    }

    // Проверка формата даты DD.MM.YYYY
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!dateRegex.test(birthDate.value)) {
        error.value = 'Неверный формат даты. Используйте ДД.ММ.ГГГГ';
        return false;
    }

    // Проверка валидности даты
    const [, day, month, year] = birthDate.value.match(dateRegex);
    const date = new Date(year, month - 1, day);

    if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
        error.value = 'Указана некорректная дата';
        return false;
    }

    // Проверка, что дата не в будущем
    if (date > new Date()) {
        error.value = 'Дата рождения не может быть в будущем';
        return false;
    }

    // Проверка минимального возраста (13 лет)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 13);
    if (date > minDate) {
        error.value = 'Вам должно быть не менее 13 лет';
        return false;
    }

    // ИИ-валидация возраста
    try {
        const ageValidation = await validateUserAge(birthDate.value);
        if (!ageValidation.isValid) {
            error.value = ageValidation.reason || 'Указана нереалистичная дата рождения';
            return false;
        }
    } catch (err) {
        console.warn('Ошибка валидации возраста через ИИ, продолжаем без блокировки:', err);
        // В случае ошибки ИИ продолжаем без блокировки
    }

    return true;
};

const handleSubmit = async (event) => {
    event.preventDefault();
    error.value = '';

    if (!(await validateForm())) {
        return;
    }

    isLoading.value = true;

    try {
        await userStore.updateProfile({
            name: name.value.trim(),
            birth: birthDate.value
        });

        emit('complete');
    } catch (err) {
        console.error('Ошибка сохранения профиля:', err);
        error.value = 'Не удалось сохранить данные. Попробуйте еще раз.';
    } finally {
        isLoading.value = false;
    }
};

// Автоматическое форматирование даты при вводе
const formatBirthDate = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.slice(0, 2) + '.' + value.slice(2);
    }
    if (value.length >= 5) {
        value = value.slice(0, 5) + '.' + value.slice(5, 9);
    }
    
    birthDate.value = value;
};
</script>

<template>
    <Transition name="modal">
        <div v-if="show" class="modal modal--small modal--profile-setup modal--required">
            <div class="modal__overlay"></div>
            <div class="modal__container">
                <div class="modal__content">
                    <div class="profile-setup">
                        <div class="profile-setup__header">
                            <h1 class="profile-setup__title">Завершите настройку профиля</h1>
                            <p class="profile-setup__subtitle">
                                Для точного гадания нам нужны ваши настоящие данные
                            </p>
                        </div>

                        <div v-if="error" class="profile-setup__error">
                            {{ error }}
                        </div>

                        <form class="profile-setup__form" @submit="handleSubmit">
                            <div class="profile-setup__field">
                                <label class="profile-setup__label" for="setup-name">
                                    Ваше настоящее имя *
                                </label>
                                <input 
                                    v-model="name"
                                    type="text" 
                                    id="setup-name"
                                    class="profile-setup__input" 
                                    placeholder="Например: Антон"
                                    :disabled="isLoading"
                                    required
                                >
                            </div>

                            <div class="profile-setup__field">
                                <label class="profile-setup__label" for="setup-birth">
                                    Дата рождения *
                                </label>
                                <input 
                                    v-model="birthDate"
                                    @input="formatBirthDate"
                                    type="text" 
                                    id="setup-birth"
                                    class="profile-setup__input" 
                                    placeholder="ДД.ММ.ГГГГ"
                                    maxlength="10"
                                    :disabled="isLoading"
                                    required
                                >
                                <span class="profile-setup__hint">
                                    Формат: 03.06.1991
                                </span>
                            </div>

                            <button 
                                type="submit" 
                                class="btn btn--primary profile-setup__submit"
                                :disabled="isLoading"
                            >
                                <ButtonSpinner v-if="isLoading" />
                                <span>{{ isLoading ? 'Сохранение...' : 'Продолжить' }}</span>
                            </button>
                        </form>

                        <p class="profile-setup__note">
                            * Эти данные необходимы для астрологического анализа и точности предсказаний
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.profile-setup {
    display: flex;
    flex-direction: column;
    gap: $spacing-large;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-small;
    }

    &__icon {
        width: 48px;
        height: auto;
        animation: pulse 2s ease-in-out infinite;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 32px;
        font-weight: 600;
        color: $color-white;
        line-height: 1.2;
    }

    &__subtitle {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        color: $color-grey;
        line-height: 1.5;
    }

    &__error {
        padding: $spacing-middle;
        background-color: rgba(255, 84, 84, 0.1);
        border-left: 3px solid $color-gold;
        color: $color-gold;
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        animation: shake 0.3s ease-in-out;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $color-white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__input {
        font-family: "Playfair Display", Sans-serif;
        font-size: 18px;
        padding: $spacing-middle;
        background-color: $color-bg-dark;
        color: $color-white;
        border: 2px solid transparent;
        outline: none;
        transition: border-color 0.3s;

        &::placeholder {
            color: $color-grey;
        }

        &:focus {
            border-color: $color-pastel-gold;
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__hint {
        font-family: "Inter", Sans-serif;
        font-size: 12px;
        color: $color-grey;
        font-style: italic;
    }

    &__submit {
        margin-top: $spacing-small;
        width: 100%;
    }

    &__note {
        font-family: "Inter", Sans-serif;
        font-size: 12px;
        color: $color-grey;
        text-align: center;
        line-height: 1.5;
        padding-top: $spacing-small;
        border-top: 1px solid rgba($color-grey, 0.2);
    }
}

// Анимации
@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }
}

@keyframes shake {
    0%, 100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-10px);
    }
    75% {
        transform: translateX(10px);
    }
}

// Transition для модалки
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
    
    .modal__content {
        transition: transform 0.3s ease;
    }
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    
    .modal__content {
        transform: scale(0.9) translateY(-20px);
    }
}
</style>

