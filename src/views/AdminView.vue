<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { searchUsers, updateUserTariff, toggleUserActive, deleteUser } from '@/services/supabase.service';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();

// Состояния компонента
const searchQuery = ref('');
const users = ref([]);
const isLoading = ref(false);
const editingUser = ref(null);
const selectedTariff = ref('');
const isUpdatingTariff = ref(false);
const isTogglingActive = ref(false);
const isDeletingUser = ref(false);

// Пагинация
const currentPage = ref(1);
const pageSize = 20;
const totalUsers = ref(0);
const hasMorePages = computed(() => (currentPage.value * pageSize) < totalUsers.value);

// Статистика по тарифам
const tariffStats = computed(() => {
    const stats = {
        'neophyte': { name: 'Неофит', count: 0 },
        'initiated': { name: 'Посвящённый', count: 0 },
        'adept': { name: 'Адепт', count: 0 },
        'oracle': { name: 'Оракул', count: 0 },
        'master': { name: 'Мастер', count: 0 },
        'archmage': { name: 'Архимаг', count: 0 },
        'supreme-arcana': { name: 'Верховный Аркан', count: 0 }
    };

    // Подсчитываем пользователей по тарифам
    users.value.forEach(user => {
        if (stats[user.tariff]) {
            stats[user.tariff].count++;
        }
    });

    return stats;
});

// Debounced поиск
let searchTimeout = null;
const debouncedSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        handleSearch();
    }, 500);
};

// Асинхронная проверка прав доступа
const checkAdminAccess = async () => {
    // Ждем инициализации аутентификации
    if (userStore.isAuthChecking) {
        await new Promise(resolve => {
            const unwatch = userStore.$subscribe(() => {
                if (!userStore.isAuthChecking) {
                    unwatch();
                    resolve();
                }
            });
        });
    }

    if (!userStore.isAdmin) {
        router.push('/');
        return false;
    }
    return true;
};

// Загружаем пользователей при монтировании
onMounted(async () => {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        await loadUsers();
    }
});

const loadUsers = async (page = 1, append = false) => {
    isLoading.value = true;
    try {
        const offset = (page - 1) * pageSize;
        const result = await searchUsers('', pageSize, offset);

        if (append) {
            users.value = [...users.value, ...result.users];
        } else {
            users.value = result.users;
        }

        totalUsers.value = result.total;
        currentPage.value = page;
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        showError('Не удалось загрузить пользователей', error);
    } finally {
        isLoading.value = false;
    }
};

const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        await loadUsers(1, false);
        return;
    }

    // Обрабатываем специальные фильтры по тарифу
    if (searchQuery.value.startsWith('__tariff:')) {
        const tariffKey = searchQuery.value.replace('__tariff:', '');
        try {
            // Получаем всех пользователей и фильтруем на клиенте по тарифу
            const result = await searchUsers('', 1000, 0); // Получаем много пользователей для фильтрации
            const filteredUsers = result.users.filter(user => user.tariff === tariffKey);

            users.value = filteredUsers.slice(0, pageSize);
            totalUsers.value = filteredUsers.length;
            currentPage.value = 1;
        } catch (error) {
            console.error('Ошибка фильтрации по тарифу:', error);
            showError('Ошибка фильтрации пользователей', error);
        }
        return;
    }

    // Обычный поиск
    try {
        const result = await searchUsers(searchQuery.value.trim(), pageSize, 0);
        users.value = result.users;
        totalUsers.value = result.total;
        currentPage.value = 1;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showError('Ошибка поиска пользователей', error);
    }
};

const loadMoreUsers = async () => {
    if (isLoading.value || !hasMorePages.value) return;
    await loadUsers(currentPage.value + 1, true);
};

const clearSearch = async () => {
    searchQuery.value = '';
    await loadUsers(1, false);
};

// Сбросить фильтр по тарифу
const clearTariffFilter = async () => {
    searchQuery.value = '';
    await loadUsers(1, false);
};

// Применить фильтр по тарифу
const applyTariffFilter = (tariffKey) => {
    // Устанавливаем специальный поисковый запрос для фильтрации по тарифу
    searchQuery.value = `__tariff:${tariffKey}`;
    handleSearch();
};

// Получить активный тариф из поискового запроса
const activeTariffFilter = computed(() => {
    if (searchQuery.value?.startsWith('__tariff:')) {
        return searchQuery.value.replace('__tariff:', '');
    }
    return null;
});

// Улучшенная обработка ошибок
const showError = (message, error = null) => {
    let fullMessage = message;

    if (error) {
        if (error.message?.includes('Access denied') || error.message?.includes('permission')) {
            fullMessage = 'У вас нет прав для выполнения этого действия';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            fullMessage = 'Ошибка сети. Проверьте подключение к интернету';
        } else if (error.message?.includes('timeout')) {
            fullMessage = 'Превышено время ожидания ответа сервера';
        }
    }

    alert(fullMessage);
    console.error('Admin error:', error);
};

const startEdit = (user) => {
    // Защита от редактирования самого себя
    if (user.id === userStore.userData?.id) {
        alert('Вы не можете редактировать свой собственный профиль');
        return;
    }

    editingUser.value = user;
    selectedTariff.value = user.tariff;
};

const cancelEdit = () => {
    editingUser.value = null;
    selectedTariff.value = '';
};

const saveTariff = async () => {
    if (!editingUser.value || !selectedTariff.value) return;

    isUpdatingTariff.value = true;
    try {
        // Логируем действие
        console.log(`Admin ${userStore.userData?.name} изменяет тариф пользователя ${editingUser.value.name} с ${editingUser.value.tariff} на ${selectedTariff.value}`);

        await updateUserTariff(editingUser.value.id, selectedTariff.value);

        // Обновляем локально только после успешного сохранения на сервере
        const user = users.value.find(u => u.id === editingUser.value.id);
        if (user) {
            user.tariff = selectedTariff.value;
        }

        editingUser.value = null;
        selectedTariff.value = '';
        alert('Тариф успешно обновлен');

    } catch (error) {
        console.error('Ошибка обновления тарифа:', error);
        showError('Не удалось обновить тариф', error);
    } finally {
        isUpdatingTariff.value = false;
    }
};

const toggleActive = async (user) => {
    // Защита от блокировки самого себя
    if (user.id === userStore.userData?.id) {
        alert('Вы не можете заблокировать свой собственный аккаунт');
        return;
    }

    const newStatus = !user.is_active;
    const confirmMessage = newStatus
        ? `Разблокировать пользователя ${user.name}?`
        : `Заблокировать пользователя ${user.name}? Это ограничит доступ к системе.`;

    if (!confirm(confirmMessage)) return;

    isTogglingActive.value = true;
    try {
        // Логируем действие
        console.log(`Admin ${userStore.userData?.name} ${newStatus ? 'разблокирует' : 'блокирует'} пользователя ${user.name}`);

        await toggleUserActive(user.id, newStatus);

        // Обновляем локально только после успешного сохранения на сервере
        user.is_active = newStatus;
        alert(newStatus ? 'Пользователь успешно разблокирован' : 'Пользователь успешно заблокирован');

    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        showError('Не удалось изменить статус пользователя', error);
    } finally {
        isTogglingActive.value = false;
    }
};

const handleDelete = async (user) => {
    // Защита от удаления самого себя
    if (user.id === userStore.userData?.id) {
        alert('Вы не можете удалить свой собственный аккаунт');
        return;
    }

    // Дополнительная проверка для администраторов
    if (user.is_admin) {
        if (!confirm(`ВНИМАНИЕ! Вы собираетесь удалить администратора ${user.name}!\n\nЭто может нарушить работу системы. Убедитесь, что есть другие администраторы.\n\nДействительно удалить?`)) {
            return;
        }
    }

    const confirmMessage = `Удалить пользователя ${user.name}?\n\nЭто действие необратимо! Будут удалены все данные пользователя, включая историю гаданий.`;

    if (!confirm(confirmMessage)) return;

    isDeletingUser.value = true;
    try {
        // Логируем критическое действие
        console.warn(`Admin ${userStore.userData?.name} УДАЛЯЕТ пользователя ${user.name} (ID: ${user.id})`);

        await deleteUser(user.id);

        // Удаляем из локального массива только после успешного удаления на сервере
        users.value = users.value.filter(u => u.id !== user.id);
        totalUsers.value = Math.max(0, totalUsers.value - 1);

        alert('Пользователь успешно удален');

    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        showError('Не удалось удалить пользователя', error);
    } finally {
        isDeletingUser.value = false;
    }
};

const getTariffName = (tariffId) => {
    const tariffs = {
        'neophyte': 'Неофит',
        'initiated': 'Посвященный',
        'adept': 'Адепт',
        'oracle': 'Оракул',
        'supreme-arcana': 'Верховный Аркан'
    };
    return tariffs[tariffId] || tariffId;
};

const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
</script>

<template>
    <div class="admin">
        <div class="admin__container">
            <h1 class="admin__title">Панель администратора</h1>
            
            <!-- Поиск и статистика -->
            <div class="admin__search-section">
                <div class="admin__search">
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Поиск по имени, email или номеру..."
                        class="admin__search-input"
                        @input="debouncedSearch"
                    >
                    <button
                        v-if="searchQuery"
                        class="btn btn--secondary admin__clear-btn"
                        @click="clearSearch"
                        title="Очистить поиск"
                    >
                        ✕
                    </button>
                </div>

                <!-- Статистика -->
                <div class="admin__stats">
                    <div class="admin__stats-main">
                        <span class="admin__stats-text">
                            Показано {{ users.length }} из {{ totalUsers }} пользователей
                            <span v-if="currentPage > 1">(страница {{ currentPage }})</span>
                        </span>
                    </div>

                    <!-- Расширенная статистика по тарифам -->
                    <div class="admin__stats-tariffs">
                        <div class="admin__stats-tariff-header">
                            <h3 class="admin__stats-tariff-title">Пользователи по тарифам</h3>
                            <button
                                v-if="activeTariffFilter"
                                class="admin__stats-tariff-reset"
                                @click="clearTariffFilter"
                                title="Сбросить фильтр"
                            >
                                ✕
                            </button>
                        </div>

                        <div class="admin__stats-tariff-grid">
                            <div
                                class="admin__stats-tariff"
                                v-for="(tariff, key) in tariffStats"
                                :key="key"
                                :class="{ 'admin__stats-tariff--active': activeTariffFilter === key }"
                                @click="applyTariffFilter(key)"
                            >
                                <span class="admin__stats-tariff-name">{{ tariff.name }}</span>
                                <span class="admin__stats-tariff-count">{{ tariff.count }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Загрузка -->
            <div v-if="isLoading" class="admin__loading">
                <ButtonSpinner />
                <p>Загрузка пользователей...</p>
            </div>

            <!-- Список пользователей -->
            <div v-else-if="users.length > 0" class="admin__users">
                <div class="admin__users-header">
                    <span>Найдено пользователей: {{ users.length }}</span>
                </div>

                <div class="admin__users-list">
                    <div
                        v-for="user in users"
                        :key="user.id"
                        class="admin__user-card"
                        :class="{ 'admin__user-card--inactive': !user.is_active }"
                    >
                        <div class="admin__user-main">
                            <div class="admin__user-avatar">
                                <span class="admin__user-avatar-icon">👤</span>
                            </div>

                            <div class="admin__user-info">
                                <div class="admin__user-name-row">
                                    <h3 class="admin__user-name">{{ user.name }}</h3>
                                    <span
                                        v-if="user.is_admin"
                                        class="admin__user-badge admin__user-badge--admin"
                                    >
                                        Админ
                                    </span>
                                    <span
                                        v-if="!user.is_active"
                                        class="admin__user-badge admin__user-badge--blocked"
                                    >
                                        🚫 Заблокирован
                                    </span>
                                </div>

                                <div class="admin__user-details">
                                    <span class="admin__user-detail">
                                        <strong>Email:</strong> {{ user.email || 'Не указан' }}
                                    </span>
                                    <span class="admin__user-detail">
                                        <strong>Номер:</strong> {{ user.user_number }}
                                    </span>
                                    <span class="admin__user-detail">
                                        <strong>Дата рождения:</strong> {{ user.birth || 'Не указана' }}
                                    </span>
                                    <span class="admin__user-detail">
                                        <strong>Тариф:</strong> {{ getTariffName(user.tariff) }}
                                    </span>
                                    <span class="admin__user-detail">
                                        <strong>Регистрация:</strong> {{ formatDate(user.created_at) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Редактирование тарифа -->
                        <div v-if="editingUser?.id === user.id" class="admin__user-edit">
                            <div class="admin__edit-form">
                                <label class="admin__edit-label">Изменить тариф:</label>
                                <select v-model="selectedTariff" class="admin__edit-select">
                                    <option value="neophyte">Неофит</option>
                                    <option value="initiated">Посвященный</option>
                                    <option value="adept">Адепт</option>
                                    <option value="oracle">Оракул</option>
                                    <option value="supreme-arcana">Верховный Аркан</option>
                                </select>
                                <div class="admin__edit-actions">
                                    <button
                                        class="btn btn--primary"
                                        @click="saveTariff"
                                        :disabled="isUpdatingTariff || !selectedTariff"
                                    >
                                        <ButtonSpinner v-if="isUpdatingTariff" />
                                        <span>{{ isUpdatingTariff ? 'Сохранение...' : 'Сохранить' }}</span>
                                    </button>
                                    <button
                                        class="btn btn--secondary"
                                        @click="cancelEdit"
                                        :disabled="isUpdatingTariff"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Действия -->
                        <div v-if="!user.is_admin" class="admin__user-actions">
                            <button
                                class="btn btn--secondary admin__action-btn"
                                @click="startEdit(user)"
                                v-if="!editingUser || editingUser.id !== user.id"
                            >
                                Сменить тариф
                            </button>
                            <button
                                class="btn admin__action-btn"
                                :class="user.is_active ? 'btn--warning' : 'btn--primary'"
                                @click="toggleActive(user)"
                                :disabled="isTogglingActive"
                            >
                                <ButtonSpinner v-if="isTogglingActive" />
                                <span>{{ isTogglingActive ? 'Обработка...' : (user.is_active ? 'Заблокировать' : 'Разблокировать') }}</span>
                            </button>
                            <button
                                class="btn btn--danger admin__action-btn"
                                @click="handleDelete(user)"
                                :disabled="isDeletingUser"
                            >
                                <ButtonSpinner v-if="isDeletingUser" />
                                <span>{{ isDeletingUser ? 'Удаление...' : 'Удалить' }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Загрузить еще -->
                <div v-if="hasMorePages && !isLoading" class="admin__load-more">
                    <button
                        class="btn btn--secondary"
                        @click="loadMoreUsers"
                    >
                        Загрузить еще пользователей
                    </button>
                </div>
            </div>

            <!-- Пусто -->
            <div v-else class="admin__empty">
                <p>Пользователи не найдены</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.admin {
    
    padding: $spacing-large $spacing-middle;
    background-color: $color-bg-dark;

    &__container {
        max-width: 1200px;
        margin: 0 auto;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: $color-white;
        text-align: center;
        margin-bottom: $spacing-large;
    }

    &__search {
        display: flex;
        gap: $spacing-small;
        margin-bottom: $spacing-middle;
    }

    &__search-input {
        flex: 1;
        padding: $spacing-middle;
        background-color: $color-bg-light;
        border: 1px solid rgba($color-grey, 0.3);
        border-radius: 4px;
        color: $color-white;
        font-family: "Inter", Sans-serif;
        font-size: 16px;

        &::placeholder {
            color: $color-grey;
        }

        &:focus {
            outline: none;
            border-color: $color-pastel-gold;
        }
    }

    &__search-btn {
        flex-shrink: 0;
        min-width: 120px;
    }

    &__loading,
    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: $spacing-middle;
        padding: $spacing-large;
        color: $color-grey;
        font-family: "Inter", Sans-serif;
    }

    &__users-header {
        padding: $spacing-middle;
        background-color: $color-bg-light;
        border-radius: 4px;
        margin-bottom: $spacing-middle;
        color: $color-white;
        font-family: "Inter", Sans-serif;
        font-weight: 600;
    }

    &__users-list {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
    }

    &__user-card {
        background-color: $color-bg-light;
        border-radius: 8px;
        padding: $spacing-middle;
        border: 2px solid transparent;
        transition: border-color 0.3s;

        &--inactive {
            opacity: 0.7;
            border-color: rgba($color-gold, 0.5);
        }

        &:hover {
            border-color: $color-pastel-gold;
        }
    }

    &__user-main {
        display: flex;
        gap: $spacing-middle;
        margin-bottom: $spacing-middle;
    }

    &__user-avatar {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: $color-bg-dark;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__user-avatar-icon {
        font-size: 30px;
    }

    &__user-info {
        flex: 1;
    }

    &__user-name-row {
        display: flex;
        align-items: center;
        gap: $spacing-small;
        margin-bottom: $spacing-small;
        flex-wrap: wrap;
    }

    &__user-name {
        font-family: "Playfair Display", Sans-serif;
        font-size: 22px;
        font-weight: 600;
        color: $color-white;
        margin: 0;
    }

    &__user-badge {
        display: inline-flex;
        padding: 4px $spacing-small;
        font-family: "Inter", Sans-serif;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 4px;

        &--admin {
            background-color: $color-pastel-gold;
            color: $color-bg-dark;
        }

        &--blocked {
            background-color: $color-gold;
            color: $color-white;
        }
    }

    &__user-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    &__user-detail {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;

        strong {
            color: $color-white;
        }
    }

    &__user-edit {
        margin-bottom: $spacing-middle;
        padding: $spacing-middle;
        background-color: $color-bg-dark;
        border-radius: 4px;
    }

    &__edit-form {
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
    }

    &__edit-label {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $color-white;
    }

    &__edit-select {
        padding: $spacing-small $spacing-middle;
        background-color: $color-bg-light;
        border: 1px solid rgba($color-grey, 0.3);
        border-radius: 4px;
        color: $color-white;
        font-family: "Inter", Sans-serif;
        font-size: 14px;

        &:focus {
            outline: none;
            border-color: $color-pastel-gold;
        }
    }

    &__edit-actions {
        display: flex;
        gap: $spacing-small;
    }

    &__user-actions {
        min-height: 75px;
        display: flex;
        gap: $spacing-small;
        flex-wrap: wrap;
    }

    &__action-btn {
        flex: 1;
        min-width: 150px;
    }

    &__search-section {
        margin-bottom: $spacing-large;
    }

    &__stats {
        margin-top: $spacing-middle;
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
    }

    &__stats-main {
        text-align: center;
    }

    &__stats-text {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;
    }

    &__stats-tariffs {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
        padding: $spacing-middle;
        background-color: $color-bg-light;
        border-radius: 8px;
    }

    &__stats-tariff-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__stats-tariff-title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: $color-white;
        margin: 0;
    }

    &__stats-tariff-reset {
        background: none;
        border: 1px solid rgba($color-grey, 0.5);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $color-grey;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s;

        &:hover {
            border-color: $color-gold;
            color: $color-gold;
            background-color: rgba($color-gold, 0.1);
        }
    }

    &__stats-tariff-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: $spacing-small;
    }

    &__stats-tariff {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-x-smal $spacing-small;
        background-color: $color-bg-dark;
        border-radius: 4px;
        border: 1px solid rgba($color-grey, 0.3);
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            border-color: $color-pastel-gold;
            background-color: rgba($color-pastel-gold, 0.05);
        }

        &--active {
            border-color: $color-gold;
            background-color: rgba($color-gold, 0.1);

            .admin__stats-tariff-name {
                color: $color-pastel-gold;
            }

            .admin__stats-tariff-count {
                background-color: rgba($color-gold, 0.2);
                color: $color-gold;
            }
        }
    }

    &__stats-tariff-name {
        font-family: "Inter", Sans-serif;
        font-size: 12px;
        color: $color-grey;
        font-weight: 500;
    }

    &__stats-tariff-count {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: $color-pastel-gold;
        background-color: rgba($color-gold, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        min-width: 24px;
        text-align: center;
    }

    &__clear-btn {
        margin-right: $spacing-small;
        padding: $spacing-small $spacing-middle;
        min-width: auto;
    }

    &__load-more {
        margin-top: $spacing-large;
        text-align: center;
    }
}

.btn {
    &--warning {
        background-color: $color-gold;
        color: $color-white;

        &:hover {
            opacity: 0.9;
        }
    }

    &--danger {
        background-color: #dc3545;
        color: $color-white;

        &:hover {
            opacity: 0.9;
        }
    }
}
</style>

