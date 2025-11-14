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

/**
 * Получение текущего пользователя
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
        console.error('Ошибка получения пользователя:', error)
        return null
    }
    
    return user
}

/**
 * Подписка на изменения состояния авторизации
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session)
    })
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
            // Fallback: генерируем на клиенте
            profileData.user_number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
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
export async function searchUsers(query, limit = 20, offset = 0) {
    // Получаем пользователей (пагинация на клиенте)
    const { data: users, error: usersError } = await supabase.rpc('admin_search_users', {
        limit_count: limit * 2, // Запрашиваем больше для пагинации на клиенте
        search_query: query || ''
    })

    if (usersError) {
        console.error('Ошибка поиска пользователей:', usersError)
        throw usersError
    }

    // Пагинация на клиенте
    const paginatedUsers = users ? users.slice(offset, offset + limit) : [];

    // Получаем общее количество для пагинации
    let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // Добавляем условие поиска только если есть запрос
    if (query && query.trim()) {
        countQuery = countQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,user_number.ilike.%${query}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
        console.error('Ошибка получения количества пользователей:', countError)
        // Не выбрасываем ошибку, просто возвращаем null для count
    }

    return {
        users: paginatedUsers,
        total: count || 0
    }
}

/**
 * Обновление тарифа пользователя (только для админа)
 * Использует серверную функцию для безопасности
 */
export async function updateUserTariff(userId, tariff) {
    const { data, error } = await supabase.rpc('admin_update_user_tariff', {
        target_user_id: userId,
        new_tariff: tariff
    })
    
    if (error) {
        console.error('Ошибка обновления тарифа:', error)
        
        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied')) {
            throw new Error('У вас нет прав для выполнения этого действия')
        }
        if (error.message?.includes('Invalid tariff')) {
            throw new Error('Некорректное значение тарифа')
        }
        
        throw error
    }
    
    return data
}

/**
 * Блокировка/разблокировка пользователя (только для админа)
 * Использует серверную функцию для безопасности
 */
export async function toggleUserActive(userId, isActive) {
    const { data, error } = await supabase.rpc('admin_toggle_user_active', {
        target_user_id: userId,
        new_is_active: isActive
    })

    if (error) {
        console.error('Ошибка изменения статуса пользователя:', error)

        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied')) {
            throw new Error('У вас нет прав для выполнения этого действия')
        }
        if (error.message?.includes('Cannot change own')) {
            throw new Error('Нельзя изменить статус своего аккаунта')
        }

        throw error
    }

    return data
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
    const { data, error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
    })
    
    if (error) {
        console.error('Ошибка удаления пользователя:', error)
        
        // Обработка специфичных ошибок
        if (error.message?.includes('Access denied')) {
            throw new Error('У вас нет прав для выполнения этого действия')
        }
        if (error.message?.includes('Cannot delete own')) {
            throw new Error('Нельзя удалить свой аккаунт')
        }
        if (error.message?.includes('Cannot delete admin')) {
            throw new Error('Нельзя удалить аккаунт администратора')
        }
        
        throw error
    }
    
    return data
}

