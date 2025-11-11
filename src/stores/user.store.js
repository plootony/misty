import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getProfile, upsertProfile, signOut as supabaseSignOut } from '@/services/supabase.service'

export const useUserStore = defineStore('userStore', () => {
    // Определение тарифов
    const tariffs = {
        'neophyte': {
            id: 'neophyte',
            name: 'Неофит',
            level: 1,
            allowedSpreads: ['one-card']
        },
        'initiated': {
            id: 'initiated',
            name: 'Посвящённый',
            level: 2,
            allowedSpreads: ['one-card', 'three-cards', 'decision-cross']
        },
        'adept': {
            id: 'adept',
            name: 'Адепт',
            level: 3,
            allowedSpreads: ['one-card', 'three-cards', 'horseshoe', 'star-of-david', 'love-spread']
        },
        'oracle': {
            id: 'oracle',
            name: 'Оракул',
            level: 4,
            allowedSpreads: ['one-card', 'three-cards', 'horseshoe', 'celtic-cross', 'career-path', 'wheel-of-fortune', 'fate-cross']
        },
        'supreme-arcana': {
            id: 'supreme-arcana',
            name: 'Верховный Аркан',
            level: 5,
            allowedSpreads: ['one-card', 'three-cards', 'horseshoe', 'celtic-cross', 'year-circle', 'star-of-david', 'love-spread', 'career-path', 'wheel-of-fortune', 'fate-cross', 'decision-cross', 'spiritual-journey']
        }
    }

    const userData = ref(null)
    const isAuthChecking = ref(true) // Проверяем сессию при загрузке
    const isAuthenticated = computed(() => userData.value !== null && userData.value.id !== null)
    const isAdmin = computed(() => userData.value?.is_admin === true)
    const needsProfileSetup = computed(() => {
        if (!isAuthenticated.value) return false
        return !userData.value?.birth || !userData.value?.name
    })

    const currentTariff = computed(() => {
        if (!userData.value || !userData.value.tariff) {
            return tariffs['neophyte'] // Дефолтный тариф
        }
        return tariffs[userData.value.tariff]
    })

    const canAccessSpread = (spreadId) => {
        // Админы имеют доступ ко всем раскладам
        if (isAdmin.value) {
            return true
        }
        return currentTariff.value.allowedSpreads.includes(spreadId)
    }

    const getRequiredTariffForSpread = (spreadId) => {
        for (const tariff of Object.values(tariffs)) {
            if (tariff.allowedSpreads.includes(spreadId)) {
                return tariff
            }
        }
        return null
    }

    /**
     * Загрузка данных пользователя из Supabase после авторизации
     */
    const loadUserFromSupabase = async (supabaseUser) => {
        try {
            // Получаем профиль из БД
            let profile = await getProfile(supabaseUser.id)

            // Если профиля нет, создаем его
            if (!profile) {
                const name = supabaseUser.user_metadata?.full_name || 
                            supabaseUser.user_metadata?.name || 
                            supabaseUser.email?.split('@')[0] || 
                            'Пользователь'

                profile = await upsertProfile(supabaseUser.id, {
                    name: name,
                    email: supabaseUser.email,
                    tariff: 'neophyte',
                    birth: null
                })
            }

            // Устанавливаем данные пользователя
            userData.value = {
                id: supabaseUser.id,
                name: profile.name,
                email: profile.email || supabaseUser.email,
                birth: profile.birth,
                user_number: profile.user_number,
                tariff: profile.tariff || 'neophyte',
                is_active: profile.is_active !== false,
                is_admin: profile.is_admin === true
            }

            return userData.value
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error)
            throw error
        }
    }

    /**
     * Обновление профиля пользователя
     */
    const updateProfile = async (profileData) => {
        if (!userData.value || !userData.value.id) {
            throw new Error('Пользователь не авторизован')
        }

        try {
            const updatedProfile = await upsertProfile(userData.value.id, profileData)
            
            // Обновляем локальные данные
            userData.value = {
                ...userData.value,
                ...profileData
            }

            return updatedProfile
        } catch (error) {
            console.error('Ошибка обновления профиля:', error)
            throw error
        }
    }

    /**
     * Выход из системы
     */
    const signOut = async () => {
        try {
            await supabaseSignOut()
        } catch (error) {
            // Игнорируем ошибку отсутствия сессии - это нормально при выходе
            if (error.message?.includes('Auth session missing') || error.message?.includes('session_not_found')) {
                console.log('Сессия уже отсутствует, продолжаем выход локально')
            } else {
                console.error('Ошибка выхода:', error)
                throw error
            }
        } finally {
            // Всегда очищаем локальные данные пользователя
            userData.value = null
        }
    }

    /**
     * Инициализация - проверка существующей сессии
     */
    const initAuth = async () => {
        try {
            const { getSession } = await import('@/services/supabase.service')
            const session = await getSession()
            
            if (session && session.user) {
                await loadUserFromSupabase(session.user)
            }
        } catch (error) {
            console.error('Ошибка инициализации авторизации:', error)
        } finally {
            isAuthChecking.value = false
        }
    }

    return { 
        userData,
        isAuthChecking,
        isAuthenticated,
        isAdmin,
        needsProfileSetup,
        tariffs, 
        currentTariff, 
        canAccessSpread,
        getRequiredTariffForSpread,
        loadUserFromSupabase,
        updateProfile,
        signOut,
        initAuth
    }
})
