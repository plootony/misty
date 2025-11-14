<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { useCardSelector } from '@/stores/cardSelector.store';
import { getReadings, getReadingsCount, deleteReading, deleteReadings, deleteReadingsByUserId } from '@/services/supabase.service';
import { supabase } from '@/services/supabase.service';
import { getZodiacSign } from '@/utils/zodiac';
import SpreadPreview from '@/components/SpreadPreview.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const router = useRouter();
const userStore = useUserStore();
const cardStore = useCardSelector();


// История гаданий из БД
const historyItems = ref([]);
const isLoadingHistory = ref(false);
const isLoadingMore = ref(false);
const totalReadingsCount = ref(0);

// Пагинация
const itemsPerPage = 5;
const hasMore = ref(true);

// Удаление записей
const selectedReadings = ref([]);
const isDeleting = ref(false);
const selectAllMode = ref(false); // Флаг режима "выбрать все"

// Удаление аккаунта
const isDeletingAccount = ref(false);
const showDeleteConfirm = ref(false);
const deleteStep = ref(1); // 1 - первое предупреждение, 2 - второе, 3 - ввод текста

// Редактирование профиля
const isEditing = ref(false);
const editedName = ref('');
const editedBirthDate = ref('');
const isSavingProfile = ref(false);
const profileError = ref('');

// Вычисляемые свойства для модального окна
const confirmModalType = computed(() => deleteStep.value === 1 ? 'warning' : 'danger');
const confirmModalTitle = computed(() => {
    if (deleteStep.value === 1) return '⚠️ Удаление аккаунта';
    if (deleteStep.value === 2) return '🔴 Последнее предупреждение';
    return '🔒 Подтверждение удаления';
});
const confirmModalMessage = computed(() => {
    if (deleteStep.value === 1) {
        return 'Вы собираетесь УДАЛИТЬ СВОЙ АККАУНТ.\n\nЭто действие НЕОБРАТИМО! Будут удалены:\n• Все ваши данные\n• История гаданий\n• Настройки профиля\n\nВы действительно хотите продолжить?';
    }
    if (deleteStep.value === 2) {
        return 'После удаления аккаунта:\n• Вы не сможете восстановить данные\n• Все платежи и подписки будут отменены\n• Вы потеряете доступ к премиум-функциям';
    }
    return 'Для окончательного подтверждения нажмите "Удалить аккаунт".\n\nЭто действие нельзя отменить!';
});
const confirmModalConfirmText = computed(() => deleteStep.value === 3 ? 'Удалить аккаунт' : 'Продолжить');
const confirmModalButtonClass = computed(() => deleteStep.value === 3 ? 'btn--danger' : 'btn--warning');

// Проверка, выбраны ли все записи
const allSelected = computed({
    get: () => {
        if (selectAllMode.value) {
            return true; // В режиме "выбрать все" чекбокс всегда отмечен
        }
        // В обычном режиме проверяем, выбраны ли все видимые записи
        return historyItems.value.length > 0 && selectedReadings.value.length === historyItems.value.length && selectedReadings.value.length === totalReadingsCount.value;
    },
    set: async (value) => {
        if (value) {
            // Если записей мало, выбираем все видимые
            if (totalReadingsCount.value <= itemsPerPage) {
                selectedReadings.value = historyItems.value.map(item => item.id);
                selectAllMode.value = false;
            } else {
                // Если записей много, включаем режим "выбрать все"
                selectAllMode.value = true;
                selectedReadings.value = []; // Очищаем локальный выбор
            }
        } else {
            // Отключаем режим "выбрать все" и очищаем выбор
            selectAllMode.value = false;
            selectedReadings.value = [];
        }
    }
});

// Количество выбранных записей (учитывая режим "выбрать все")
const selectedCount = computed(() => {
    if (selectAllMode.value) {
        return totalReadingsCount.value;
    }
    return selectedReadings.value.length;
});

// Знак зодиака пользователя
const zodiacSign = computed(() => {
    return getZodiacSign(userStore.userData?.birth);
});

// Функции редактирования профиля
const startEditing = () => {
    isEditing.value = true;
    editedName.value = userStore.userData?.name || '';
    editedBirthDate.value = userStore.userData?.birth || '';
    profileError.value = '';
};

const cancelEditing = () => {
    isEditing.value = false;
    editedName.value = '';
    editedBirthDate.value = '';
    profileError.value = '';
};

const validateProfileForm = () => {
    if (!editedName.value.trim()) {
        profileError.value = 'Пожалуйста, укажите ваше имя';
        return false;
    }

    if (!editedBirthDate.value) {
        profileError.value = 'Пожалуйста, укажите дату рождения';
        return false;
    }

    // Проверка формата даты DD.MM.YYYY
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!dateRegex.test(editedBirthDate.value)) {
        profileError.value = 'Неверный формат даты. Используйте ДД.ММ.ГГГГ';
        return false;
    }

    // Проверка валидности даты
    const [, day, month, year] = editedBirthDate.value.match(dateRegex);
    const date = new Date(year, month - 1, day);

    if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
        profileError.value = 'Указана некорректная дата';
        return false;
    }

    // Проверка, что дата не в будущем
    if (date > new Date()) {
        profileError.value = 'Дата рождения не может быть в будущем';
        return false;
    }

    // Проверка минимального возраста (13 лет)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 13);
    if (date > minDate) {
        profileError.value = 'Вам должно быть не менее 13 лет';
        return false;
    }

    return true;
};

const saveProfile = async () => {
    profileError.value = '';

    if (!validateProfileForm()) {
        return;
    }

    isSavingProfile.value = true;

    try {
        await userStore.updateProfile({
            name: editedName.value.trim(),
            birth: editedBirthDate.value
        });

        isEditing.value = false;
        editedName.value = '';
        editedBirthDate.value = '';
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        profileError.value = 'Не удалось сохранить изменения. Попробуйте еще раз.';
    } finally {
        isSavingProfile.value = false;
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

    editedBirthDate.value = value;
};

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

        // Загружаем общее количество записей только при первой загрузке
        if (!append) {
            totalReadingsCount.value = await getReadingsCount(userStore.userData.id);
        }

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
            cards: reading.cards.map(card => {
                // Находим карту в колоде по имени для получения изображения
                const cardData = cardStore.deck.find(deckCard => deckCard.name === card.name);
                return {
                    name: card.name,
                    position: card.isReversed ? 'Перевернутое' : 'Прямое',
                    description: card.meaning,
                    image: cardData?.image || '/images/card-back.png'
                };
            }),
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

// Обработчик изменения индивидуального выбора
const onIndividualSelectionChange = () => {
    // При изменении индивидуального выбора отключаем режим "выбрать все"
    selectAllMode.value = false;
};


// Удаление выбранных записей
const deleteSelectedReadings = async () => {
    if (selectedCount.value === 0) return;

    const confirmMessage = selectedCount.value === 1
        ? 'Вы уверены, что хотите удалить эту запись?'
        : `Вы уверены, что хотите удалить выбранные записи (${selectedCount.value})?`;

    if (!confirm(confirmMessage)) return;

    isDeleting.value = true;
    try {
        if (selectAllMode.value) {
            // В режиме "выбрать все" удаляем все записи пользователя
            // Получаем все ID записей пользователя
            const allReadings = await getReadings(userStore.userData.id, totalReadingsCount.value, 0);
            const allIds = allReadings.map(reading => reading.id);
            await deleteReadings(allIds);
        } else {
            // В обычном режиме удаляем только выбранные записи
            await deleteReadings(selectedReadings.value);
        }

        // Перезагружаем историю с начала
        await loadHistory();

        // Очищаем выбор
        selectedReadings.value = [];
        selectAllMode.value = false;

    } catch (error) {
        console.error('Ошибка удаления записей:', error);
        alert('Не удалось удалить записи');
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
        // Показываем ошибку только если это не ошибка отсутствия сессии
        if (!error.message?.includes('Auth session missing') && !error.message?.includes('session_not_found')) {
            alert('Не удалось выйти из системы');
        } else {
            // Если сессия отсутствует, просто переходим на страницу авторизации
            router.push('/auth');
        }
    }
};

const handleDeleteAccount = () => {
    deleteStep.value = 1;
    showDeleteConfirm.value = true;
};

const handleDeleteConfirm = () => {
    if (deleteStep.value === 1) {
        // Переходим ко второму шагу
        deleteStep.value = 2;
    } else if (deleteStep.value === 2) {
        // Переходим к третьему шагу
        deleteStep.value = 3;
    } else if (deleteStep.value === 3) {
        // Начинаем процесс удаления
        performAccountDeletion();
    }
};

const handleDeleteCancel = () => {
    showDeleteConfirm.value = false;
    deleteStep.value = 1;
};

const performAccountDeletion = async () => {
    showDeleteConfirm.value = false;
    isDeletingAccount.value = true;

    try {
        // Удаляем все записи пользователя
        if (totalReadingsCount.value > 0) {
            await deleteReadingsByUserId(userStore.userData.id);
        }

        // Удаляем аккаунт пользователя
        // Поскольку функция deleteUser требует админских прав,
        // используем прямой вызов Supabase для удаления профиля
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userStore.userData.id);

        if (error) throw error;

        // Выходим из системы
        await userStore.signOut();

        // Показываем сообщение и перенаправляем
        alert('Ваш аккаунт успешно удален. Спасибо за использование нашего сервиса!');
        router.push('/');

    } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);
        alert('Произошла ошибка при удалении аккаунта. Попробуйте еще раз или обратитесь в поддержку.');
    } finally {
        isDeletingAccount.value = false;
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
                    
                    <div class="profile__view">
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
                                <span class="profile__info-label">Знак зодиака</span>
                                <span class="profile__info-value">{{ zodiacSign }}</span>
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
                                class="btn btn--secondary profile__signout-btn"
                                @click="handleSignOut"
                            >
                                Выйти
                            </button>

                            <button
                                v-if="!userStore.isAdmin"
                                type="button"
                                class="btn btn--danger profile__delete-btn"
                                @click="handleDeleteAccount"
                                :disabled="isDeletingAccount"
                            >
                                <span v-if="isDeletingAccount">
                                    <ButtonSpinner />
                                    Удаление...
                                </span>
                                <span v-else>
                                    Удалить аккаунт
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- История запросов -->
                <section class="profile__section">
                    <div class="profile__history-header">
                        <h2 class="profile__section-title">История раскладов</h2>
                        
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
                                v-if="selectedCount > 0"
                                type="button"
                                class="btn btn--danger btn--small"
                                @click="deleteSelectedReadings"
                                :disabled="isDeleting"
                            >
                                <ButtonSpinner v-if="isDeleting" />
                                <span v-else>Удалить выбранные ({{ selectedCount }})</span>
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
                            Новый расклад
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
                                @change="onIndividualSelectionChange"
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
                                                    :src="card.image"
                                                    alt="Карта Таро"
                                                >
                                            </div>
                                            <div class="card-detail__summary">
                                                <span class="card-detail__name">{{ card.name }}</span>
                                                <span class="card-detail__position">{{ card.position }}</span>

                                                <p class="card-detail__description">{{ card.description }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="history-item__final">
                                    <h4 class="history-item__subtitle">Твой расклад:</h4>
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

    <!-- Модальное окно подтверждения удаления аккаунта -->
    <ConfirmModal
        :show="showDeleteConfirm"
        :type="confirmModalType"
        :title="confirmModalTitle"
        :message="confirmModalMessage"
        :confirm-text="confirmModalConfirmText"
        :cancel-text="'Отмена'"
        :confirm-button-class="confirmModalButtonClass"
        @confirm="handleDeleteConfirm"
        @cancel="handleDeleteCancel"
        @close="handleDeleteCancel"
    />
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.profile {
    
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
        margin-bottom: $spacing-middle;
    }

    &__content {
        display: flex;
        gap: $spacing-middle;

        // Адаптив для мобильных устройств
        @media (max-width: 768px) {
            flex-direction: column;
            gap: $spacing-small;
        }
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

        @media (max-width: 768px) {
            padding: $spacing-middle;

            &:first-child {
                flex: none;
            }
        }
    }

    &__section-title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 28px;
        font-weight: 600;
        color: $color-white;

        @media (max-width: 768px) {
            font-size: 20px;
        }
    }

    &__history-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: $spacing-middle;
        margin-bottom: $spacing-middle;
        flex-wrap: wrap;

        @media (max-width: 768px) {
            gap: $spacing-small;
            margin-bottom: $spacing-small;
        }
    }

    &__history-controls {
        display: flex;
        align-items: center;
        gap: $spacing-middle;
        flex-wrap: wrap;

        @media (max-width: 768px) {
            gap: $spacing-small;
        }
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
            color: $color-pastel-gold;
        }
    }

    &__checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: $color-gold;
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
        background-color: $color-pastel-gold;
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

    &__signout-btn {
        width: 100%;
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

        @media (max-width: 768px) {
            padding-top: $spacing-small;
            margin-top: $spacing-small;

            button {
                min-width: 150px;
                font-size: 14px;
                padding: $spacing-x-smal $spacing-small;
            }
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
        border-color: $color-pastel-gold;
    }

    &__checkbox {
        position: absolute;
        top: $spacing-small;
        left: $spacing-small;
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: $color-gold;
        z-index: 10;
        background-color: $color-bg-light;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        left: -35px;
        top: calc(50% - 10px);
        transform: translateY(-50%);
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
        width: 260px;
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
        color: $color-pastel-gold;
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
        color: $color-pastel-gold;
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
        background-color: $color-gold;
        color: $color-white;

        &:hover:not(:disabled) {
            background-color: $color-pastel-gold;
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
        background-color: $color-gold;
        color: $color-white;
        font-weight: 700;

        &:hover:not(:disabled) {
            opacity: 0.9;
        }
    }
}

// Специфичные стили для профиля
.profile {
    &__delete-btn {
        margin-top: $spacing-small;
    }
}
</style>

