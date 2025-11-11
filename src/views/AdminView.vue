<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { searchUsers, updateUserTariff, toggleUserActive, deleteUser } from '@/services/supabase.service';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();

// Проверка прав доступа
if (!userStore.isAdmin) {
    router.push('/');
}

const searchQuery = ref('');
const users = ref([]);
const isLoading = ref(false);
const isSearching = ref(false);
const editingUser = ref(null);
const selectedTariff = ref('');

// Загружаем всех пользователей при монтировании
onMounted(async () => {
    await loadUsers();
});

const loadUsers = async () => {
    isLoading.value = true;
    try {
        users.value = await searchUsers('', 50);
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        alert('Не удалось загрузить пользователей');
    } finally {
        isLoading.value = false;
    }
};

const handleSearch = async () => {
    isSearching.value = true;
    try {
        users.value = await searchUsers(searchQuery.value, 50);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        alert('Ошибка поиска пользователей');
    } finally {
        isSearching.value = false;
    }
};

const startEdit = (user) => {
    editingUser.value = user;
    selectedTariff.value = user.tariff;
};

const cancelEdit = () => {
    editingUser.value = null;
    selectedTariff.value = '';
};

const saveTariff = async () => {
    if (!editingUser.value) return;
    
    try {
        await updateUserTariff(editingUser.value.id, selectedTariff.value);
        // Обновляем локально
        const user = users.value.find(u => u.id === editingUser.value.id);
        if (user) {
            user.tariff = selectedTariff.value;
        }
        editingUser.value = null;
        alert('Тариф обновлен');
    } catch (error) {
        console.error('Ошибка обновления тарифа:', error);
        alert('Не удалось обновить тариф');
    }
};

const toggleActive = async (user) => {
    const newStatus = !user.is_active;
    const confirmMessage = newStatus 
        ? `Разблокировать пользователя ${user.name}?`
        : `Заблокировать пользователя ${user.name}?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
        await toggleUserActive(user.id, newStatus);
        user.is_active = newStatus;
        alert(newStatus ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        alert('Не удалось изменить статус пользователя');
    }
};

const handleDelete = async (user) => {
    if (!confirm(`Удалить пользователя ${user.name}? Это действие необратимо!`)) return;
    
    try {
        await deleteUser(user.id);
        users.value = users.value.filter(u => u.id !== user.id);
        alert('Пользователь удален');
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить пользователя');
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
            
            <!-- Поиск -->
            <div class="admin__search">
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Поиск по имени, email или номеру..."
                    class="admin__search-input"
                    @keyup.enter="handleSearch"
                >
                <button 
                    class="btn btn--primary admin__search-btn"
                    @click="handleSearch"
                    :disabled="isSearching"
                >
                    <ButtonSpinner v-if="isSearching" />
                    <span>{{ isSearching ? 'Поиск...' : 'Найти' }}</span>
                </button>
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
                                    <button class="btn btn--primary" @click="saveTariff">
                                        Сохранить
                                    </button>
                                    <button class="btn btn--secondary" @click="cancelEdit">
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
                            >
                                {{ user.is_active ? 'Заблокировать' : 'Разблокировать' }}
                            </button>
                            <button 
                                class="btn btn--danger admin__action-btn"
                                @click="handleDelete(user)"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
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

