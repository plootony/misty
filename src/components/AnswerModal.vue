<script setup>
import { useRouter } from 'vue-router';
import { useModalStore } from '@/stores/modal.store';
import { useCardSelector } from '@/stores/cardSelector.store';

const router = useRouter();
const modalStore = useModalStore();
const cardStore = useCardSelector();

const startOver = () => {
    modalStore.resetSelection();
    // Перемешиваем колоду при новом гадании
    cardStore.shuffleDeck();
    router.push('/');
};

const closeModal = () => {
    modalStore.closeAnswerModal();
};
</script>

<template>
    <div class="modal">
        <div class="modal__overlay"></div>
        <div class="modal__container">
            <div class="modal__content modal__content--answer">
                <div class="answer">
                    <div class="answer__header">
                        <img src="@/assets/images/stars-icon.png" alt="star icon" class="answer__icon">
                        <p class="answer__label">ОТВЕТ НА ТВОЙ ВОПРОС</p>
                    </div>

                    <h1 class="answer__question">{{ modalStore.userQuestion }}</h1>

                    <div class="answer__content">
                        <p class="answer__text">
                            {{ modalStore.fullReadingText }}
                        </p>
                    </div>

                    <button class="btn btn--primary" @click="startOver">
                        Еще раз
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.modal__content {
    max-width: 920px;
}

.answer {
    padding: $spacing-large;
    display: flex;
    flex-direction: column;
    gap: $spacing-middle;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-x-smal;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-orange;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    &__question {
        font-family: "Playfair Display", Sans-serif;
        font-size: 38px;
        font-weight: 600;
        line-height: 1.3em;
        color: $color-white;
        margin-bottom: $spacing-large;
    }

    &__content {
        flex: 1;
        margin-bottom: $spacing-middle;
    }

    &__text {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.8;
        color: $color-white;
        white-space: pre-line;
    }
}
</style>

