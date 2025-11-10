import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modalStore', () => {
    const isCardResultModalOpen = ref(false)
    const isAnswerModalOpen = ref(false)
    const isLoading = ref(false)
    const isFullReadingLoading = ref(false)
    const selectedCards = ref([])
    const selectedSpread = ref(null)
    const userQuestion = ref('')
    const fullReadingText = ref('')

    const openCardResultModal = () => {
        isCardResultModalOpen.value = true
    }

    const closeCardResultModal = () => {
        isCardResultModalOpen.value = false
    }

    const openAnswerModal = () => {
        isAnswerModalOpen.value = true
    }

    const closeAnswerModal = () => {
        isAnswerModalOpen.value = false
    }

    const addSelectedCard = (card) => {
        if (selectedCards.value.length < (selectedSpread.value?.cardsCount || 3)) {
            selectedCards.value.push(card)
        }
    }

    const startLoading = () => {
        isLoading.value = true
    }

    const stopLoading = () => {
        isLoading.value = false
    }

    const startFullReadingLoading = () => {
        isFullReadingLoading.value = true
    }

    const stopFullReadingLoading = () => {
        isFullReadingLoading.value = false
    }

    const setFullReadingText = (text) => {
        fullReadingText.value = text
    }

    const updateLastCard = (cardData) => {
        const lastIndex = selectedCards.value.length - 1;
        if (lastIndex >= 0) {
            selectedCards.value[lastIndex] = { ...selectedCards.value[lastIndex], ...cardData };
        }
    }

    const resetSelection = () => {
        selectedCards.value = []
        selectedSpread.value = null
        userQuestion.value = ''
        fullReadingText.value = ''
        isCardResultModalOpen.value = false
        isAnswerModalOpen.value = false
        isLoading.value = false
        isFullReadingLoading.value = false
    }

    return {
        isCardResultModalOpen,
        isAnswerModalOpen,
        isLoading,
        isFullReadingLoading,
        selectedCards,
        selectedSpread,
        userQuestion,
        fullReadingText,
        openCardResultModal,
        closeCardResultModal,
        openAnswerModal,
        closeAnswerModal,
        addSelectedCard,
        updateLastCard,
        startLoading,
        stopLoading,
        startFullReadingLoading,
        stopFullReadingLoading,
        setFullReadingText,
        resetSelection
    }
})

