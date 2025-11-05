<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { useModalStore } from '@/stores/modal.store';
import { generateFullReading } from '@/services/mistral.service';
import { saveReading } from '@/services/supabase.service';
import { getZodiacSign } from '@/utils/zodiac';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();
const modalStore = useModalStore();

const fullReading = ref('');
const isLoading = ref(false);
const error = ref('');

const zodiacSign = getZodiacSign(userStore.userData?.birth || '01.01.2000');

onMounted(async () => {
    await loadFullReading();
});

const loadFullReading = async () => {
    isLoading.value = true;
    error.value = '';

    try {
        const reading = await generateFullReading(
            userStore.userData || { name: 'Гость', birth: '01.01.2000' },
            zodiacSign,
            modalStore.userQuestion,
            modalStore.selectedSpread,
            modalStore.selectedCards
        );
        
        fullReading.value = reading;

        // Сохраняем гадание в историю
        if (userStore.isAuthenticated && userStore.userData?.id) {
            try {
                await saveReading(userStore.userData.id, {
                    question: modalStore.userQuestion,
                    spreadType: modalStore.selectedSpread.id,
                    spreadName: modalStore.selectedSpread.name,
                    cards: modalStore.selectedCards.map(card => ({
                        name: card.name,
                        arcana: card.arcana,
                        isReversed: card.isReversed,
                        position: card.position,
                        positionInfo: card.positionInfo,
                        interpretation: card.interpretation,
                        meaning: card.meaning
                    })),
                    interpretation: reading
                });
            } catch (saveError) {
                console.error('Ошибка сохранения гадания:', saveError);
                // Не показываем ошибку пользователю, так как толкование уже получено
            }
        }
    } catch (err) {
        console.error('Ошибка получения финального толкования:', err);
        error.value = 'Не удалось получить толкование. Попробуйте ещё раз.';
    } finally {
        isLoading.value = false;
    }
};

const startOver = () => {
    modalStore.resetSelection();
    router.push('/');
};

const closeModal = () => {
    modalStore.closeAnswerModal();
};
</script>

<template>
    <div class="modal">
        <div class="modal__overlay" @click="closeModal"></div>
        <div class="modal__container">
            <div class="modal__content modal__content--answer">
                <div class="answer">
                    <div class="answer__header">
                        <img src="@/assets/images/stars-icon.png" alt="star icon" class="answer__icon">
                        <p class="answer__label">ОТВЕТ НА ТВОЙ ВОПРОС</p>
                    </div>

                    <h1 class="answer__question">{{ modalStore.userQuestion }}</h1>

                    <!-- Визуализация выбранных карт -->
                    <div 
                        class="answer__cards"
                        :class="'answer__cards--' + (modalStore.selectedSpread?.id || 'three-cards')"
                    >
                        <div 
                            v-for="(card, index) in modalStore.selectedCards" 
                            :key="index"
                            class="answer__card"
                            :class="{ 'answer__card--reversed': card.isReversed }"
                        >
                            <img 
                                class="answer__card-image" 
                                src="@/assets/images/card-back.png" 
                                alt="Карта Таро"
                            >
                            <div class="answer__card-info">
                                <span class="answer__card-name">{{ card.name }}</span>
                                <span class="answer__card-position">{{ card.positionInfo?.name }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="answer__content">
                        <div v-if="isLoading" class="answer__loading">
                            <ButtonSpinner />
                            <p class="answer__loading-text">Составляю полное толкование расклада...</p>
                        </div>
                        
                        <p v-else-if="error" class="answer__error">
                            {{ error }}
                        </p>
                        
                        <p v-else class="answer__text">
                            {{ fullReading }}
                        </p>
                    </div>

                    <button class="btn btn--primary" @click="startOver" :disabled="isLoading">
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

    &__cards {
        display: flex;
        gap: $spacing-small;
        justify-content: center;
        align-items: center;
        margin-bottom: $spacing-large;
        min-height: 120px;
        position: relative;
        flex-wrap: wrap;

        // Одна карта
        &--one-card {
            .answer__card {
                position: relative;
            }
        }

        // Три карты - в линию
        &--three-cards {
            .answer__card {
                position: relative;
            }
        }

        // Кельтский крест - компактная версия
        &--celtic-cross {
            min-height: 200px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;

            .answer__card {
                position: absolute;
                
                &:nth-child(1) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
                &:nth-child(3) { left: calc(50% - 70px); top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(4) { left: calc(50% + 70px); top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(5) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
                &:nth-child(6) { left: 50%; top: calc(50% + 60px); transform: translate(-50%, -50%); }
                &:nth-child(7) { left: calc(50% + 140px); top: calc(50% - 90px); transform: translate(-50%, -50%); }
                &:nth-child(8) { left: calc(50% + 140px); top: calc(50% - 30px); transform: translate(-50%, -50%); }
                &:nth-child(9) { left: calc(50% + 140px); top: calc(50% + 30px); transform: translate(-50%, -50%); }
                &:nth-child(10) { left: calc(50% + 140px); top: calc(50% + 90px); transform: translate(-50%, -50%); }
            }
        }

        // Подкова - дуга
        &--horseshoe {
            min-height: 180px;

            .answer__card {
                position: absolute;

                &:nth-child(1) { left: calc(50% - 150px); top: 50%; transform: translate(-50%, -50%) rotate(-20deg); }
                &:nth-child(2) { left: calc(50% - 100px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(-10deg); }
                &:nth-child(3) { left: calc(50% - 50px); top: calc(50% - 55px); transform: translate(-50%, -50%) rotate(-5deg); }
                &:nth-child(4) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
                &:nth-child(5) { left: calc(50% + 50px); top: calc(50% - 55px); transform: translate(-50%, -50%) rotate(5deg); }
                &:nth-child(6) { left: calc(50% + 100px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(10deg); }
                &:nth-child(7) { left: calc(50% + 150px); top: 50%; transform: translate(-50%, -50%) rotate(20deg); }
            }
        }

        // Годовой круг - круг
        &--year-circle {
            min-height: 250px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;

            .answer__card {
                position: absolute;

                &:nth-child(1) { left: 50%; top: calc(50% - 100px); transform: translate(-50%, -50%); }
                &:nth-child(2) { left: calc(50% + 50px); top: calc(50% - 87px); transform: translate(-50%, -50%) rotate(30deg); }
                &:nth-child(3) { left: calc(50% + 87px); top: calc(50% - 50px); transform: translate(-50%, -50%) rotate(60deg); }
                &:nth-child(4) { left: calc(50% + 100px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
                &:nth-child(5) { left: calc(50% + 87px); top: calc(50% + 50px); transform: translate(-50%, -50%) rotate(120deg); }
                &:nth-child(6) { left: calc(50% + 50px); top: calc(50% + 87px); transform: translate(-50%, -50%) rotate(150deg); }
                &:nth-child(7) { left: 50%; top: calc(50% + 100px); transform: translate(-50%, -50%) rotate(180deg); }
                &:nth-child(8) { left: calc(50% - 50px); top: calc(50% + 87px); transform: translate(-50%, -50%) rotate(210deg); }
                &:nth-child(9) { left: calc(50% - 87px); top: calc(50% + 50px); transform: translate(-50%, -50%) rotate(240deg); }
                &:nth-child(10) { left: calc(50% - 100px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
                &:nth-child(11) { left: calc(50% - 87px); top: calc(50% - 50px); transform: translate(-50%, -50%) rotate(300deg); }
                &:nth-child(12) { left: calc(50% - 50px); top: calc(50% - 87px); transform: translate(-50%, -50%) rotate(330deg); }
            }
        }
    }

    &__card {
        width: 50px;
        height: 75px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s;
        cursor: pointer;

        &:hover {
            transform: scale(1.1) !important;
            z-index: 10;
        }

        &--reversed {
            .answer__card-image {
                transform: rotate(180deg);
            }
        }
    }

    &__card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__card-info {
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        background-color: rgba($color-bg-dark, 0.95);
        padding: $spacing-x-smal $spacing-small;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 20;
    }

    &__card:hover &__card-info {
        display: flex;
    }

    &__card-name {
        font-family: "Inter", Sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: $color-white;
    }

    &__card-position {
        font-family: "Inter", Sans-serif;
        font-size: 9px;
        color: $color-pastel-orange;
        text-transform: uppercase;
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

    &__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
        padding: $spacing-large 0;
    }

    &__loading-text {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        color: $color-pastel-orange;
        font-style: italic;
    }

    &__error {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.8;
        color: #f44336;
        text-align: center;
        padding: $spacing-large 0;
    }
}
</style>

