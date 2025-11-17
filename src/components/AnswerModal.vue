<script setup>
import { watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useModalStore } from '@/stores/modal.store';
import { useCardSelector } from '@/stores/cardSelector.store';

const router = useRouter();
const modalStore = useModalStore();
const cardStore = useCardSelector();

// Блокировка скролла body при открытии модалки
watchEffect(() => {
    if (modalStore.isAnswerModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
});

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
    <div class="modal modal--large modal--answer">
        <div class="modal__overlay"></div>
        <div class="modal__container">
            <div class="modal__content">
                <div class="answer">
                    <div class="answer__header">
                        <p class="answer__label">ОТВЕТ НА ТВОЙ ВОПРОС</p>
                    </div>

                    <h1 class="answer__question">{{ modalStore.userQuestion }}</h1>

                    <div class="answer__content">
                        <div class="answer__text" v-html="modalStore.fullReadingText"></div>
                    </div>

                    <button class="btn btn--primary btn--medium btn--full-width" @click="startOver">
                        Еще раз
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.answer {
    display: flex;
    flex-direction: column;
    gap: $spacing-small;

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
        color: $color-pastel-gold;
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
        margin-bottom: $spacing-small;
    }

    &__content {
        flex: 1;
        margin-bottom: $spacing-middle;
    }

    &__text {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.8;
        // color: $color-white;

        // Стили для HTML элементов (deep для v-html контента)
        :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
            font-family: "Playfair Display", Sans-serif;
            text-transform: uppercase;
        }

        :deep(h1) {
            font-size: 28px;
            font-weight: 600;
            border-bottom: 2px solid $color-pastel-gold;
            padding-bottom: $spacing-small;
        }

        :deep(h2) {
            margin-bottom: $spacing-small;
            font-size: 18px;
            font-weight: 600;
            
        }

        :deep(h3) {
            font-size: 20px;
            font-weight: 500;
            color: $color-pastel-gold;
        }

        :deep(p) {
            margin-bottom: $spacing-middle;
            text-align: justify;
            line-height: 1.3;
        }

        :deep(ul), :deep(ol) {
            margin-bottom: $spacing-middle;
            padding-left: $spacing-large;
        }

        :deep(li) {
            margin-bottom: $spacing-x-smal;
        }

        :deep(strong), :deep(b) {
            font-weight: 600;
            color: $color-pastel-gold;
        }

        :deep(em), :deep(i) {
            font-style: italic;
            color: $color-grey;
        }

        :deep(blockquote) {
            border-left: 4px solid $color-pastel-gold;
            padding-left: $spacing-middle;
            margin: $spacing-middle 0;
            font-style: italic;
            color: $color-grey;
        }

        :deep(hr) {
            border: none;
            border-top: 1px solid rgba($color-grey, 0.3);
            margin: $spacing-large 0;
        }
    }
}
</style>

