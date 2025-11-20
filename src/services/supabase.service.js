import { createClient } from '@supabase/supabase-js'

/**
 * SUPABASE SERVICE
 *
 * ВАЖНО: Все административные функции защищены через:
 * 1. Row Level Security (RLS) политики на уровне БД
 * 2. Серверные функции (PostgreSQL functions) с проверкой прав
 *
 * Перед использованием необходимо применить миграцию:
 * supabase/migrations/20250105_security_policies.sql
 */

/**
 * Простая хэш-функция для генерации детерминированных номеров
 * @param {string} str - Строка для хэширования
 * @returns {number} - Хэш-значение
 */
function simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Преобразуем в 32-битное число
    }
    return Math.abs(hash)
}

// Инициализация Supabase клиента
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL или Anon Key не установлены в переменных окружения')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Регистрация через Email/Password
 */
export async function signUpWithEmail(email, password, captchaToken = null) {
    const options = {
        emailRedirectTo: `${window.location.origin}/auth/callback`
    }
    
    // Передаём hCaptcha токен, если он есть
    if (captchaToken) {
        options.captchaToken = captchaToken
    }
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
    })
    
    if (error) {
        console.error('Ошибка регистрации:', error)
        throw error
    }
    
    return data
}

/**
 * Вход через Email/Password
 */
export async function signInWithEmail(email, password, captchaToken = null) {
    const options = {}
    
    // Передаём hCaptcha токен, если он есть
    if (captchaToken) {
        options.captchaToken = captchaToken
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options
    })
    
    if (error) {
        console.error('Ошибка входа:', error)
        throw error
    }
    
    return data
}

/**
 * Авторизация через Google
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    })
    
    if (error) {
        console.error('Ошибка авторизации через Google:', error)
        throw error
    }
    
    return data
}

/**
 * Выход из системы
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        console.error('Ошибка выхода:', error)
        throw error
    }
}

/**
 * Получение текущей сессии
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
        console.error('Ошибка получения сессии:', error)
        return null
    }
    
    return session
}


// ============================================
// DATABASE FUNCTIONS
// ============================================

/**
 * Получение профиля пользователя
 */
export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    
    if (error) {
        console.error('Ошибка получения профиля:', error)
        return null
    }
    
    return data
}

/**
 * Генерация уникального 6-значного номера пользователя
 */
export async function generateUserNumber() {
    const { data, error } = await supabase.rpc('generate_unique_user_number')
    
    if (error) {
        console.error('Ошибка генерации номера пользователя:', error)
        throw error
    }
    
    return data
}

/**
 * Создание или обновление профиля
 */
export async function upsertProfile(userId, profileData) {
    // Получаем email пользователя, если он не передан
    if (!profileData.email) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
            profileData.email = user.email
        }
    }

    // Если user_number не передан, генерируем его
    // (для новых профилей RLS позволит вставку, для существующих - обновление)
    if (!profileData.user_number) {
        try {
            profileData.user_number = await generateUserNumber()
        } catch (error) {
            console.error('Не удалось сгенерировать номер пользователя:', error)
            // Fallback: генерируем на клиенте детерминированным способом
            const timestamp = Date.now()
            const hash = simpleHash(userId + timestamp.toString())
            profileData.user_number = (hash % 1000000).toString().padStart(6, '0')
        }
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            ...profileData,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Ошибка обновления профиля:', error)
        throw error
    }

    return data
}

/**
 * Сохранение истории гадания
 */
export async function saveReading(userId, readingData) {
    const { data, error } = await supabase
        .from('readings')
        .insert({
            user_id: userId,
            question: readingData.question,
            spread_type: readingData.spreadType,
            spread_name: readingData.spreadName,
            cards: readingData.cards,
            interpretation: readingData.interpretation,
            created_at: new Date().toISOString()
        })
        .select()
        .single()
    
    if (error) {
        console.error('Ошибка сохранения гадания:', error)
        throw error
    }
    
    return data
}

/**
 * Получение истории гаданий пользователя
 */
export async function getReadings(userId, limit = 10, offset = 0) {
    const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('Ошибка получения истории гаданий:', error)
        return []
    }

    return data
}

/**
 * Получение общего количества записей гаданий пользователя
 */
export async function getReadingsCount(userId) {
    const { count, error } = await supabase
        .from('readings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if (error) {
        console.error('Ошибка получения количества записей:', error)
        return 0
    }

    return count || 0
}

/**
 * Удаление одной записи гадания
 */
export async function deleteReading(readingId) {
    const { error } = await supabase
        .from('readings')
        .delete()
        .eq('id', readingId)
    
    if (error) {
        console.error('Ошибка удаления гадания:', error)
        throw error
    }
}

/**
 * Удаление нескольких записей гаданий
 */
export async function deleteReadings(readingIds) {
    const { error } = await supabase
        .from('readings')
        .delete()
        .in('id', readingIds)

    if (error) {
        console.error('Ошибка удаления гаданий:', error)
        throw error
    }
}

/**
 * Удаляет все записи гаданий пользователя
 * @param {string} userId - ID пользователя
 */
export async function deleteReadingsByUserId(userId) {
    const { error } = await supabase
        .from('readings')
        .delete()
        .eq('user_id', userId)

    if (error) {
        console.error('Ошибка удаления гаданий пользователя:', error)
        throw error
    }
}


// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Поиск пользователей (только для админа)
 */
export async function searchUsers(query, limit = 20, offset = 0, tariffFilter = null) {
    try {
        // Проверяем права администратора
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Пользователь не авторизован')
        }

        const profile = await getProfile(user.id)
        if (!profile?.is_admin) {
            throw new Error('У вас нет прав администратора')
        }
        // Получаем пользователей напрямую из таблицы profiles
        let usersQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        // Добавляем условие поиска только если есть запрос
        if (query && query.trim()) {
            const searchTerm = query.trim()
            usersQuery = usersQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_number.ilike.%${searchTerm}%`)
        }

        // Добавляем фильтр по тарифу, если указан
        if (tariffFilter) {
            usersQuery = usersQuery.eq('tariff', tariffFilter)
        }

        // Применяем пагинацию
        usersQuery = usersQuery.range(offset, offset + limit - 1)

        const { data: users, error: usersError, count } = await usersQuery

        if (usersError) {
            console.error('Ошибка получения пользователей:', usersError)
            throw usersError
        }

        return {
            users: users || [],
            total: count || 0
        }
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error)
        throw error
    }
}

/**
 * Обновление тарифа пользователя (только для админа)
 * Использует серверную функцию для безопасности
 */
export async function updateUserTariff(userId, tariff) {
    try {
        // Проверяем права администратора
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Пользователь не авторизован')
        }

        const profile = await getProfile(user.id)
        if (!profile?.is_admin) {
            throw new Error('У вас нет прав администратора')
        }
        // Обновляем тариф пользователя напрямую в таблице profiles
        const { data, error } = await supabase
            .from('profiles')
            .update({
                tariff: tariff,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Ошибка обновления тарифа:', error)
            throw error
        }

        return data
    } catch (error) {
        console.error('Ошибка обновления тарифа:', error)

        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied') || error.code === 'PGRST301') {
            throw new Error('У вас нет прав для выполнения этого действия')
        }

        throw error
    }
}

/**
 * Блокировка/разблокировка пользователя (только для админа)
 * Использует серверную функцию для безопасности
 */
export async function toggleUserActive(userId, isActive) {
    try {
        // Проверяем права администратора
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Пользователь не авторизован')
        }

        const profile = await getProfile(user.id)
        if (!profile?.is_admin) {
            throw new Error('У вас нет прав администратора')
        }
        // Обновляем статус активности пользователя напрямую в таблице profiles
        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Ошибка изменения статуса пользователя:', error)
            throw error
        }

        return data
    } catch (error) {
        console.error('Ошибка изменения статуса пользователя:', error)

        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied') || error.code === 'PGRST301') {
            throw new Error('У вас нет прав для выполнения этого действия')
        }

        throw error
    }
}

/**
 * Самодеактивация аккаунта пользователем
 * Пользователь может деактивировать только свой собственный аккаунт
 */
export async function selfDeactivateAccount(userId) {
    // Получаем текущего пользователя для проверки
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
        console.error('Ошибка получения текущего пользователя:', userError)
        throw new Error('Не удалось проверить авторизацию')
    }

    if (!user || user.id !== userId) {
        throw new Error('Нельзя деактивировать чужой аккаунт')
    }

    // Сначала удаляем все записи гаданий пользователя
    const { error: deleteError } = await supabase
        .from('readings')
        .delete()
        .eq('user_id', userId)

    if (deleteError) {
        console.error('Ошибка удаления истории гаданий:', deleteError)
        throw new Error('Не удалось очистить историю гаданий')
    }

    // Затем деактивируем профиль пользователя
    const { data, error } = await supabase
        .from('profiles')
        .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        console.error('Ошибка деактивации аккаунта:', error)
        throw new Error('Не удалось деактивировать аккаунт')
    }

    return data
}

/**
 * Удаление пользователя (только для админа)
 * Использует серверную функцию для безопасности
 */
export async function deleteUser(userId) {
    try {
        // Проверяем права администратора
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Пользователь не авторизован')
        }

        const profile = await getProfile(user.id)
        if (!profile?.is_admin) {
            throw new Error('У вас нет прав администратора')
        }

        // Защита от самоудаления
        if (user.id === userId) {
            throw new Error('Администратор не может удалить свой собственный аккаунт')
        }

        // Удаляем пользователя из таблицы profiles
        const { data, error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Ошибка удаления пользователя:', error)
            throw error
        }

        return data
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error)

        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied') || error.code === 'PGRST301') {
            throw new Error('У вас нет прав для выполнения этого действия')
        }

        throw error
    }
}

