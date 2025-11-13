<script setup>
import { watchEffect } from 'vue';
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'warning', // warning, danger, info
        validator: (value) => ['warning', 'danger', 'info'].includes(value)
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    confirmText: {
        type: String,
        default: 'Подтвердить'
    },
    cancelText: {
        type: String,
        default: 'Отмена'
    },
    confirmButtonClass: {
        type: String,
        default: 'btn--primary'
    }
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

const handleConfirm = () => {
    emit('confirm');
};

const handleCancel = () => {
    emit('cancel');
    emit('close');
};

const handleClose = () => {
    emit('close');
};

// Закрытие по клику на overlay
const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
        handleClose();
    }
};

// Закрытие по Escape
const handleKeydown = (event) => {
    if (event.key === 'Escape') {
        handleClose();
    }
};

// Добавляем/убираем обработчик клавиш
watchEffect(() => {
    if (props.show) {
        document.addEventListener('keydown', handleKeydown);
        // Предотвращаем скролл body
        document.body.style.overflow = 'hidden';
    } else {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = '';
    }

    return () => {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = '';
    };
});
</script>

<template>
    <Transition name="modal">
        <div v-if="show" class="modal modal--confirm" @click="handleOverlayClick">
            <div class="modal__overlay modal__overlay--confirm"></div>
            <div class="modal__container modal__container--confirm">
                <div class="modal__content modal__content--confirm">
                    <div class="confirm-modal">
                        <div class="confirm-modal__header">
                            <h2 class="confirm-modal__title" :class="`confirm-modal__title--${type}`">
                                {{ title }}
                            </h2>
                        </div>

                        <div class="confirm-modal__body">
                            <p class="confirm-modal__message">{{ message }}</p>
                        </div>

                        <div class="confirm-modal__footer">
                            <button
                                class="btn btn--secondary"
                                @click="handleCancel"
                            >
                                {{ cancelText }}
                            </button>
                            <button
                                class="btn"
                                :class="confirmButtonClass"
                                @click="handleConfirm"
                            >
                                {{ confirmText }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.confirm-modal {
    text-align: center;

    &__header {
        margin-bottom: $spacing-large;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 24px;
        font-weight: 600;
        margin: 0;
        color: $color-white;

        &--warning {
            color: #ff9800;
        }

        &--danger {
            color: #f44336;
        }

        &--info {
            color: #2196f3;
        }
    }

    &__body {
        margin-bottom: $spacing-large;
    }

    &__message {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: $color-white;
        margin: 0;
        white-space: pre-line;
    }

    &__footer {
        display: flex;
        gap: $spacing-middle;
        justify-content: center;

        @media (max-width: 480px) {
            flex-direction: column;

            .btn {
                width: 100%;
            }
        }
    }
}

// Модификаторы для ConfirmModal
.modal {
    &--confirm {
        padding: 0; // Убираем padding от базового modal
    }

    &__overlay--confirm {
        background-color: rgba(0, 0, 0, 0.6); // Более мягкое затемнение
        backdrop-filter: none; // Убираем blur
    }

    &__container--confirm {
        width: auto; // Убираем width: 100%
        max-width: 500px;
        min-width: 320px;
    }

    &__content--confirm {
        background-image: none; // Убираем картинку на фоне
        background-color: $color-bg-dark; // Темный фон
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        border-radius: 12px;
        padding: $spacing-large; // Паддинг по контенту
    }
}

// Стили кнопок для ConfirmModal
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: $spacing-middle $spacing-large;
    font-family: "DM Sans", Sans-serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--primary {
        color: $color-white;
        background-color: $color-gold;
        box-shadow: 0px 4px 12px 0px rgba(176, 132, 80, 0.3);

        &:hover:not(:disabled) {
            background-color: darken($color-gold, 10%);
            transform: translateY(-1px);
            box-shadow: 0px 6px 16px 0px rgba(176, 132, 80, 0.4);
        }
    }

    &--secondary {
        color: $color-white;
        background-color: transparent;
        border: 2px solid $color-grey;

        &:hover:not(:disabled) {
            border-color: $color-white;
            background-color: rgba(255, 255, 255, 0.05);
        }
    }

    &--warning {
        color: $color-white;
        background-color: #ff9800;

        &:hover:not(:disabled) {
            background-color: darken(#ff9800, 10%);
        }
    }

    &--danger {
        color: $color-white;
        background-color: #f44336;
        box-shadow: 0px 4px 12px 0px rgba(244, 67, 54, 0.3);

        &:hover:not(:disabled) {
            background-color: darken(#f44336, 10%);
            transform: translateY(-1px);
            box-shadow: 0px 6px 16px 0px rgba(244, 67, 54, 0.4);
        }
    }
}

// Анимации
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .modal__container,
.modal-leave-active .modal__container {
    transition: transform 0.3s ease;
}

.modal-enter-from .modal__container,
.modal-leave-to .modal__container {
    transform: scale(0.95) translateY(-10px);
}
</style>
