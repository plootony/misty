<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { useModalStore } from '@/stores/modal.store';
import { validateTarotQuestion } from '@/services/mistral.service';
import NotificationToast from '@/components/NotificationToast.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();
const modalStore = useModalStore();
const question = ref('Что делать, если не к чему стремиться?');
const isLoading = ref(false);

const notification = ref({
    show: false,
    type: 'error',
    message: ''
});

// Базовая клиентская валидация (быстрая проверка перед AI)
const basicValidation = (text) => {
    // Проверка на пустой вопрос
    if (!text.trim()) {
        return {
            valid: false,
            message: 'Пожалуйста, задайте вопрос'
        };
    }

    // Проверка минимальной длины
    if (text.trim().length < 10) {
        return {
            valid: false,
            message: 'Вопрос слишком короткий. Минимум 10 символов'
        };
    }

    // Проверка на чрезмерное использование заглавных букв (CAPS LOCK)
    const uppercaseCount = (text.match(/[A-ZА-Я]/g) || []).length;
    const totalLetters = (text.match(/[a-zA-Zа-яА-Я]/g) || []).length;
    if (totalLetters > 0 && uppercaseCount / totalLetters > 0.7) {
        return {
            valid: false,
            message: 'Пожалуйста, не используйте CAPS LOCK'
        };
    }

    return { valid: true };
};

const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message
    };

    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        notification.value.show = false;
    }, 5000);
};

const closeNotification = () => {
    notification.value.show = false;
};

const goBack = () => {
    // Очищаем вопрос при возврате к выбору расклада
    modalStore.userQuestion = '';
    router.push('/');
};

const submitQuestion = async () => {
    // Сначала базовая валидация
    const basicCheck = basicValidation(question.value);
    
    if (!basicCheck.valid) {
        showNotification('error', basicCheck.message);
        return;
    }

    // Затем AI валидация
    isLoading.value = true;

    try {
        const aiValidation = await validateTarotQuestion(question.value);

        if (!aiValidation.isValid) {
            isLoading.value = false;

            // Формируем сообщение с причиной и предложением
            let errorMessage = aiValidation.reason || 'Вопрос не подходит для гадания на Таро';
            if (aiValidation.suggestion) {
                errorMessage += `\n\nПопробуйте переформулировать: ${aiValidation.suggestion}`;
            }

            showNotification('warning', errorMessage);
            return;
        }

        // Если есть ошибка API, но валидация прошла (fallback)
        if (aiValidation.error) {
            console.warn('AI валидация недоступна, используем fallback');
        }

        // Вопрос валиден, переходим к выбору карт
        isLoading.value = false;
        modalStore.userQuestion = question.value;
        router.push('/card-selection');

    } catch (error) {
        console.error('Ошибка при валидации вопроса:', error);
        isLoading.value = false;
        showNotification('error', 'Произошла ошибка. Попробуйте еще раз.');
    }
};
</script>

<template>
    <div class="question">
        <NotificationToast 
            :show="notification.show"
            :type="notification.type"
            :message="notification.message"
            @close="closeNotification"
        />

        <div class="question__header">
            <p class="question__greeting">ПРИВЕТСТВУЮ ТЕБЯ, {{ userStore.userData?.name?.toUpperCase() || 'ГОСТЬ' }}</p>
            <h1 class="question__title">Задай свой вопрос</h1>
            <p class="question__subtitle">Спроси не тогда, когда хочется знать, а когда готова душа</p>
        </div>

        <div class="question__content">
            <textarea 
                v-model="question"
                class="question__textarea" 
                name="spreadText" 
                placeholder="Что делать, если не к чему стремиться?"
                :disabled="isLoading"
            ></textarea>
            
            
            <div class="question__actions">
                <button 
                    class="btn btn--secondary" 
                    @click="goBack"
                    :disabled="isLoading"
                >
                    ← Назад
                </button>
                
                <button
                    class="btn btn--primary"
                    @click="submitQuestion"
                    :disabled="isLoading"
                >
                    <ButtonSpinner v-if="isLoading" />
                    <span>{{ isLoading ? 'Проверка вопроса' : 'Задать вопрос' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.question {
    
    padding: $spacing-large $spacing-middle;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-large;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-small;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__greeting {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-orange;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 46px;
        font-weight: 600;
        line-height: 1.3em;
        color: $color-white;
    }

    &__subtitle {
        font-family: "Inter", Sans-serif;
         font-size: 16px;
        color: #b2abb5;
    }

    &__content {
        max-width: 920px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: $spacing-middle;
    }

    &__textarea {
        font-family: "Playfair Display", Sans-serif;
        font-size: 18px;
        padding: $spacing-middle;
        width: 100%;
        min-height: 290px;
        background-color: $color-bg-light;
        color: $color-white;
        border: none;
        outline: none;
        resize: none;
        transition: opacity 0.3s;

        &::placeholder {
            color: $color-grey;
        }

        &:focus {
            outline: 2px solid $color-pastel-orange;
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__validation-status {
        display: flex;
        align-items: center;
        gap: $spacing-small;
        padding: $spacing-small;
        background-color: rgba($color-pastel-orange, 0.1);
        border-left: 3px solid $color-pastel-orange;
        animation: fadeIn 0.3s ease-in;
    }

    &__validation-text {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-pastel-orange;
        font-style: italic;
    }

    &__actions {
        display: flex;
        gap: $spacing-middle;
        width: 100%;
        align-items: center;
        justify-content: space-between;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// Стили для кнопки с disabled состоянием
.btn {
    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}
</style>

