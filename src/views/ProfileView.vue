<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { getReadings, deleteReading, deleteReadings, deleteAllReadings } from '@/services/supabase.service';
import SpreadPreview from '@/components/SpreadPreview.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();

const isEditMode = ref(false);
const name = ref(userStore.userData?.name || '');
const birthDate = ref(userStore.userData?.birth || '');

// История гаданий из БД
const historyItems = ref([]);
const isLoadingHistory = ref(false);
const isLoadingMore = ref(false);

// Пагинация
const itemsPerPage = 5;
const hasMore = ref(true);

// Удаление записей
const selectedReadings = ref([]);
const isDeleting = ref(false);

// Проверка, выбраны ли все записи
const allSelected = computed({
    get: () => historyItems.value.length > 0 && selectedReadings.value.length === historyItems.value.length,
    set: (value) => {
        if (value) {
            selectedReadings.value = historyItems.value.map(item => item.id);
        } else {
            selectedReadings.value = [];
        }
    }
});

// Загружаем историю при монтировании компонента
onMounted(async () => {
    await loadHistory();
});

const loadHistory = async (append = false) => {
    if (!userStore.userData?.id) return;

    if (append) {
        isLoadingMore.value = true;
    } else {
        isLoadingHistory.value = true;
    }

    try {
        const offset = append ? historyItems.value.length : 0;
        const readings = await getReadings(userStore.userData.id, itemsPerPage, offset);
        
        // Преобразуем данные из БД в формат для отображения
        const formattedReadings = readings.map(reading => ({
            id: reading.id,
            date: formatDate(reading.created_at),
            question: reading.question,
            spread: {
                id: reading.spread_type,
                name: reading.spread_name,
                cardsCount: reading.cards.length
            },
            cards: reading.cards.map(card => ({
                name: card.name,
                position: card.isReversed ? 'Перевернутое' : 'Прямое',
                description: card.meaning
            })),
            finalReading: reading.interpretation
        }));

        if (append) {
            historyItems.value = [...historyItems.value, ...formattedReadings];
        } else {
            historyItems.value = formattedReadings;
        }

        // Проверяем, есть ли еще записи
        hasMore.value = readings.length === itemsPerPage;
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    } finally {
        isLoadingHistory.value = false;
        isLoadingMore.value = false;
    }
};

const loadMoreHistory = async () => {
    if (!hasMore.value || isLoadingMore.value) return;
    await loadHistory(true);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const activeAccordion = ref(null);

const toggleAccordion = (id) => {
    activeAccordion.value = activeAccordion.value === id ? null : id;
};

const enableEditMode = () => {
    isEditMode.value = true;
};

const saveChanges = async (event) => {
    event.preventDefault();
    try {
        // Сохраняем изменения через Supabase
        await userStore.updateProfile({
            name: name.value,
            birth: birthDate.value
        });
        isEditMode.value = false;
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Не удалось сохранить изменения');
    }
};

const cancelEdit = () => {
    // Отменяем изменения
    name.value = userStore.userData?.name || '';
    birthDate.value = userStore.userData?.birth || '';
    isEditMode.value = false;
};

// Удаление выбранных записей
const deleteSelectedReadings = async () => {
    if (selectedReadings.value.length === 0) return;
    
    const confirmMessage = selectedReadings.value.length === 1
        ? 'Вы уверены, что хотите удалить эту запись?'
        : `Вы уверены, что хотите удалить выбранные записи (${selectedReadings.value.length})?`;
    
    if (!confirm(confirmMessage)) return;
    
    isDeleting.value = true;
    try {
        await deleteReadings(selectedReadings.value);
        
        // Удаляем из локального массива
        historyItems.value = historyItems.value.filter(
            item => !selectedReadings.value.includes(item.id)
        );
        
        // Очищаем выбор
        selectedReadings.value = [];
        
        // Если записей стало мало, подгружаем еще
        if (historyItems.value.length < itemsPerPage && hasMore.value) {
            await loadHistory(true);
        }
    } catch (error) {
        console.error('Ошибка удаления записей:', error);
        alert('Не удалось удалить записи');
    } finally {
        isDeleting.value = false;
    }
};

// Удаление всех записей
const deleteAllHistory = async () => {
    if (historyItems.value.length === 0) return;
    
    if (!confirm('Вы уверены, что хотите удалить ВСЮ историю гаданий? Это действие необратимо!')) return;
    
    isDeleting.value = true;
    try {
        await deleteAllReadings(userStore.userData.id);
        
        // Очищаем локальные данные
        historyItems.value = [];
        selectedReadings.value = [];
        hasMore.value = false;
    } catch (error) {
        console.error('Ошибка удаления всей истории:', error);
        alert('Не удалось удалить историю');
    } finally {
        isDeleting.value = false;
    }
};

const handleSignOut = async () => {
    try {
        await userStore.signOut();
        router.push('/auth');
    } catch (error) {
        console.error('Ошибка выхода:', error);
        alert('Не удалось выйти из системы');
    }
};
</script>

<template>
    <div class="profile">
        <div class="profile__container">
            <h1 class="profile__main-title">Личный кабинет</h1>

            <div class="profile__content">
                <!-- Блок профиля -->
                <section class="profile__section">
                    <h2 class="profile__section-title">Мой профиль</h2>
                    
                    <!-- Режим просмотра -->
                    <div v-if="!isEditMode" class="profile__view">
                        <div class="profile__info">
                            <div class="profile__info-item">
                                <span class="profile__info-label">Имя</span>
                                <div class="profile__info-value-wrapper">
                                    <span class="profile__info-value">{{ userStore.userData?.name || 'Не указано' }}</span>
                                    <span class="profile__tariff-badge">{{ userStore.currentTariff.name }}</span>
                                </div>
                            </div>

                            <div class="profile__info-item">
                                <span class="profile__info-label">Дата рождения</span>
                                <span class="profile__info-value">{{ userStore.userData?.birth || 'Не указано' }}</span>
                            </div>

                            <div class="profile__info-item">
                                <span class="profile__info-label">Ваш уникальный номер</span>
                                <span class="profile__info-value">{{ userStore.userData?.user_number || '------' }}</span>
                            </div>
                        </div>

                        <div class="profile__actions">
                            <button 
                                v-if="userStore.isAdmin"
                                type="button" 
                                class="btn btn--admin profile__admin-btn"
                                @click="router.push('/admin')"
                            >
                                👑 Админ панель
                            </button>
                            
                            <button 
                                type="button" 
                                class="btn btn--primary profile__edit-btn"
                                @click="enableEditMode"
                            >
                                Редактировать
                            </button>
                            
                            <button 
                                type="button" 
                                class="btn btn--secondary profile__signout-btn"
                                @click="handleSignOut"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>

                    <!-- Режим редактирования -->
                    <form v-else class="profile__form" @submit="saveChanges">
                        <div class="profile__field">
                            <label class="profile__label" for="name">Имя</label>
                            <input 
                                v-model="name"
                                type="text" 
                                id="name"
                                class="profile__input"
                            >
                        </div>

                        <div class="profile__field">
                            <label class="profile__label" for="birth-date">Дата рождения</label>
                            <input 
                                v-model="birthDate"
                                type="date" 
                                id="birth-date"
                                class="profile__input"
                            >
                        </div>

                        <div class="profile__actions">
                            <button type="submit" class="btn btn--primary">
                                Сохранить изменения
                            </button>
                            <button 
                                type="button" 
                                class="btn btn--secondary"
                                @click="cancelEdit"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </section>

                <!-- История запросов -->
                <section class="profile__section">
                    <div class="profile__history-header">
                        <h2 class="profile__section-title">История гаданий</h2>
                        
                        <!-- Панель управления удалением -->
                        <div v-if="historyItems.length > 0" class="profile__history-controls">
                            <label class="profile__checkbox-label">
                                <input 
                                    type="checkbox" 
                                    v-model="allSelected"
                                    class="profile__checkbox"
                                >
                                <span>Выбрать все</span>
                            </label>
                            
                            <button 
                                v-if="selectedReadings.length > 0"
                                type="button"
                                class="btn btn--danger btn--small"
                                @click="deleteSelectedReadings"
                                :disabled="isDeleting"
                            >
                                <ButtonSpinner v-if="isDeleting" />
                                <span v-else>Удалить выбранные ({{ selectedReadings.length }})</span>
                            </button>
                            
                            <button 
                                type="button"
                                class="btn btn--danger btn--small"
                                @click="deleteAllHistory"
                                :disabled="isDeleting"
                            >
                                Удалить всё
                            </button>
                        </div>
                    </div>
                    
                    <!-- Состояние загрузки -->
                    <div v-if="isLoadingHistory" class="profile__history-loading">
                        <ButtonSpinner />
                        <p>Загружаю историю...</p>
                    </div>

                    <!-- Пустое состояние -->
                    <div v-else-if="historyItems.length === 0" class="profile__history-empty">
                        <p>У вас пока нет сохраненных гаданий</p>
                        <button class="btn btn--primary" @click="router.push('/')">
                            Начать гадание
                        </button>
                    </div>

                    <!-- История гаданий -->
                    <div v-else class="profile__history">
                        <div 
                            v-for="item in historyItems" 
                            :key="item.id"
                            class="history-item"
                            :class="{ 'history-item--active': activeAccordion === item.id }"
                        >
                            <input 
                                type="checkbox" 
                                :value="item.id"
                                v-model="selectedReadings"
                                class="history-item__checkbox"
                                @click.stop
                            >
                            
                            <button 
                                type="button"
                                class="history-item__header"
                                @click="toggleAccordion(item.id)"
                            >
                                <div class="history-item__preview">
                                    <SpreadPreview 
                                        :spread-id="item.spread.id" 
                                        :cards-count="item.spread.cardsCount"
                                    />
                                </div>
                                <div class="history-item__info">
                                    <span class="history-item__date">{{ item.date }}</span>
                                    <h3 class="history-item__question">{{ item.question }}</h3>
                                    <span class="history-item__spread">{{ item.spread.name }}</span>
                                </div>
                                <span class="history-item__icon">
                                    {{ activeAccordion === item.id ? '−' : '+' }}
                                </span>
                            </button>

                            <div 
                                v-if="activeAccordion === item.id"
                                class="history-item__content"
                            >
                                <div class="history-item__cards">
                                    <h4 class="history-item__subtitle">Выпавшие карты:</h4>
                                    <div 
                                        v-for="(card, index) in item.cards" 
                                        :key="index"
                                        class="card-detail"
                                    >
                                        <div class="card-detail__header">
                                            <div class="card-detail__card">
                                                <img 
                                                    class="card-detail__card-image" 
                                                    src="@/assets/images/card-back.png" 
                                                    alt="Карта Таро"
                                                >
                                            </div>
                                            <div class="card-detail__summary">
                                                <span class="card-detail__name">{{ card.name }}</span>
                                                <span class="card-detail__position">{{ card.position }}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="card-detail__description-wrapper">
                                            <p class="card-detail__description">{{ card.description }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="history-item__final">
                                    <h4 class="history-item__subtitle">Итоговое толкование:</h4>
                                    <p class="history-item__reading">{{ item.finalReading }}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Кнопка "Загрузить еще" -->
                    <div v-if="!isLoadingHistory && historyItems.length > 0 && hasMore" class="profile__load-more">
                        <button 
                            class="btn btn--secondary" 
                            @click="loadMoreHistory"
                            :disabled="isLoadingMore"
                        >
                            <ButtonSpinner v-if="isLoadingMore" />
                            <span>{{ isLoadingMore ? 'Загрузка...' : 'Загрузить еще' }}</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.profile {
    min-height: 100vh;
    padding: $spacing-middle;

    &__container {
        max-width: 1200px;
        margin: 0 auto;
    }

    &__main-title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 48px;
        font-weight: 600;
        color: $color-white;
        text-align: center;
        margin-bottom: $spacing-large;
    }

    &__content {
        display: flex;
        gap: $spacing-middle;
    }

    &__section {
        background-color: $color-bg-light;
        padding: $spacing-large;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);

        &:first-child {
            flex: 0 0 350px;
        }

        &:last-child {
            flex: 1;
        }
    }

    &__section-title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 28px;
        font-weight: 600;
        color: $color-white;
        margin-bottom: $spacing-large;
    }

    &__history-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: $spacing-middle;
        margin-bottom: $spacing-large;
        flex-wrap: wrap;
    }

    &__history-controls {
        display: flex;
        align-items: center;
        gap: $spacing-middle;
        flex-wrap: wrap;
    }

    &__checkbox-label {
        display: flex;
        align-items: center;
        gap: $spacing-x-smal;
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-white;
        cursor: pointer;
        user-select: none;

        &:hover {
            color: $color-pastel-orange;
        }
    }

    &__checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: $color-orange;
    }

    &__view {
        display: flex;
        flex-direction: column;
        gap: $spacing-large;
        padding: $spacing-middle 0;
    }

    &__info {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
    }

    &__info-item {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
        padding-bottom: $spacing-middle;
        border-bottom: 1px solid rgba($color-grey, 0.2);

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
    }

    &__info-label {
        font-family: "Inter", Sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: $color-grey;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__info-value-wrapper {
        display: flex;
        align-items: center;
        gap: $spacing-small;
        flex-wrap: wrap;
    }

    &__info-value {
        font-family: "Playfair Display", Sans-serif;
        font-size: 20px;
        font-weight: 500;
        color: $color-white;
    }

    &__tariff-badge {
        display: inline-flex;
        padding: 4px $spacing-small;
        background-color: $color-pastel-orange;
        color: $color-bg-dark;
        font-family: "Inter", Sans-serif;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 4px;
    }

    &__actions {
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
        width: 100%;
    }

    &__edit-btn,
    &__signout-btn {
        width: 100%;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
        padding: $spacing-middle 0;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: $color-white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__input {
        font-family: "Playfair Display", Sans-serif;
        font-size: 16px;
        padding: $spacing-small $spacing-middle;
        background-color: $color-bg-dark;
        color: $color-white;
        border: 2px solid transparent;
        outline: none;
        transition: border-color 0.3s;

        &:focus {
            border-color: $color-pastel-orange;
        }

        &[type="date"] {
            color-scheme: dark;
        }
    }

    &__actions {
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
        margin-top: $spacing-small;
    }

    &__history {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
        margin-bottom: $spacing-large;
    }

    &__history-loading,
    &__history-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: $spacing-middle;
        padding: $spacing-large;
        text-align: center;
        color: $color-grey;
        font-family: "Inter", Sans-serif;
        font-size: 15px;
    }

    &__history-empty {
        button {
            margin-top: $spacing-small;
        }
    }

    &__load-more {
        display: flex;
        justify-content: center;
        padding-top: $spacing-middle;
        margin-top: $spacing-middle;
        border-top: 1px solid rgba($color-grey, 0.2);

        button {
            min-width: 200px;
        }
    }

    &__empty {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        color: $color-grey;
        text-align: center;
        padding: $spacing-large;
    }
}


.history-item {
    background-color: $color-bg-dark;
    border: 2px solid transparent;
    transition: border-color 0.3s;
    position: relative;

    &--active {
        border-color: $color-pastel-orange;
    }

    &__checkbox {
        position: absolute;
        top: $spacing-small;
        left: $spacing-small;
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: $color-orange;
        z-index: 10;
        background-color: $color-bg-light;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    &__header {
        width: 100%;
        padding: $spacing-middle;
        background: none;
        border: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: $spacing-middle;
        cursor: pointer;
    }

    &__preview {
        width: 220px;
        min-height: 100px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $color-bg-light;
        border-radius: 4px;
        padding: $spacing-small;
    }

    &__info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-x-smal;
        text-align: left;
        flex: 1;
    }

    &__date {
        font-family: "Inter", Sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: $color-pastel-orange;
        text-transform: uppercase;
    }

    &__question {
        font-family: "Playfair Display", Sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: $color-white;
        margin: 0;
    }

    &__spread {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;
    }

    &__icon {
        font-size: 32px;
        color: $color-white;
        flex-shrink: 0;
        transition: transform 0.3s;
    }

    &--active &__icon {
        transform: rotate(180deg);
    }

    &__content {
        padding: 0 $spacing-middle $spacing-middle;
        display: flex;
        flex-direction: column;
        gap: $spacing-large;
    }

    &__subtitle {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: $color-pastel-orange;
        text-transform: uppercase;
        margin-bottom: $spacing-middle;
    }

    &__cards {
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
    }

    &__final {
        border-top: 1px solid rgba($color-grey, 0.2);
        padding-top: $spacing-middle;
    }

    &__reading {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: $color-white;
    }
}

.card-detail {
    background-color: $color-bg-light;
    padding: $spacing-middle;
    display: flex;
    flex-direction: column;
    gap: $spacing-middle;

    &__header {
        display: flex;
        gap: $spacing-middle;
        align-items: center;
    }

    &__card {
        width: 60px;
        height: 90px;
        flex-shrink: 0;
        background-color: $color-bg-dark;
        border-radius: 4px;
        box-shadow: 0px 2px 8px 0px rgba(10, 10, 12, 0.5);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__summary {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-x-smal;
        text-align: left;
    }

    &__name {
        font-family: "Playfair Display", Sans-serif;
        font-size: 18px;
        font-weight: 600;
        color: $color-white;
    }

    &__position {
        font-family: "Inter", Sans-serif;
        font-size: 13px;
        color: $color-grey;
    }

    &__description-wrapper {
        padding-left: calc(60px + $spacing-middle);
    }

    &__description {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: $color-white;
        margin: 0;
    }
}

// Кнопки
.btn {
    font-family: "Inter", Sans-serif;
    font-size: 15px;
    font-weight: 600;
    padding: $spacing-small $spacing-middle;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-x-smal;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--primary {
        background-color: $color-orange;
        color: $color-white;

        &:hover:not(:disabled) {
            background-color: $color-pastel-orange;
        }
    }

    &--secondary {
        background-color: transparent;
        color: $color-white;
        border: 2px solid $color-grey;

        &:hover:not(:disabled) {
            border-color: $color-white;
        }
    }

    &--danger {
        background-color: #d32f2f;
        color: $color-white;

        &:hover:not(:disabled) {
            background-color: #b71c1c;
        }
    }

    &--small {
        font-size: 13px;
        padding: $spacing-x-smal $spacing-small;
    }

    &--admin {
        background-color: $color-pastel-orange;
        color: $color-bg-dark;
        font-weight: 700;

        &:hover:not(:disabled) {
            opacity: 0.9;
        }
    }
}
</style>

