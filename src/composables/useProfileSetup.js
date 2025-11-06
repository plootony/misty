import { ref } from 'vue'
import { useUserStore } from '@/stores/user.store'

export function useProfileSetup() {
    const userStore = useUserStore()
    const showProfileSetup = ref(false)

    // Проверяем, нужно ли показывать модалку настройки профиля
    const checkProfileSetup = () => {
        // Добавляем небольшую задержку, чтобы избежать дублирования
        setTimeout(() => {
            showProfileSetup.value = userStore.needsProfileSetup
        }, 100)
        return userStore.needsProfileSetup
    }

    const handleProfileSetupComplete = () => {
        showProfileSetup.value = false
    }

    return {
        showProfileSetup,
        checkProfileSetup,
        handleProfileSetupComplete
    }
}

