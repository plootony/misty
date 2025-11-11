<script setup>
import { computed } from 'vue';

const props = defineProps({
    type: {
        type: String,
        default: 'error', // error, warning, success, info
        validator: (value) => ['error', 'warning', 'success', 'info'].includes(value)
    },
    message: {
        type: String,
        required: true
    },
    show: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const iconMap = {
    error: '⚠️',
    warning: '⚡',
    success: '✓',
    info: 'ℹ'
};

const icon = computed(() => iconMap[props.type]);

const close = () => {
    emit('close');
};
</script>

<template>
    <Transition name="toast">
        <div v-if="show" class="toast" :class="`toast--${type}`">
            <div class="toast__content">
                <span class="toast__icon">{{ icon }}</span>
                <p class="toast__message">{{ message }}</p>
            </div>
            <button class="toast__close" @click="close">✕</button>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.toast {
    position: fixed;
    top: $spacing-large;
    right: $spacing-large;
    max-width: 600px;
    min-width: 320px;
    background-color: $color-bg-light;
    border-left: 4px solid;
    box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-middle;
    padding: $spacing-middle;
    z-index: 9999;

    &--error {
        border-left-color: #f44336;
    }

    &--warning {
        border-left-color: $color-pastel-gold;
    }

    &--success {
        border-left-color: #4caf50;
    }

    &--info {
        border-left-color: #2196f3;
    }

    &__content {
        display: flex;
        align-items: center;
        gap: $spacing-middle;
        flex: 1;
    }

    &__icon {
        font-size: 24px;
        flex-shrink: 0;
    }

    &__message {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        line-height: 1.5;
        color: $color-white;
        margin: 0;
        white-space: pre-line; // Поддержка переносов строк
    }

    &__close {
        background: none;
        border: none;
        color: $color-grey;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s;
        flex-shrink: 0;

        &:hover {
            color: $color-white;
        }
    }
}

// Анимация появления/исчезновения
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100px);
}
</style>

