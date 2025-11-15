import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modalStore', () => {
    const isCardResultModalOpen = ref(false)
    const isAnswerModalOpen = ref(false)
    const isNatalChartInterpretationModalOpen = ref(false)
    const isLoading = ref(false)
    const isFullReadingLoading = ref(false)
    const selectedCards = ref([])
    const selectedSpread = ref(null)
    const userQuestion = ref('')
    const fullReadingText = ref('')
    const natalChartInterpretationText = ref('')

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

    const openNatalChartInterpretationModal = () => {
        isNatalChartInterpretationModalOpen.value = true
    }

    const closeNatalChartInterpretationModal = () => {
        isNatalChartInterpretationModalOpen.value = false
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

    const setNatalChartInterpretationText = (text) => {
        natalChartInterpretationText.value = text
    }

    const updateLastCard = (cardData) => {
        const lastIndex = selectedCards.value.length - 1;
        if (lastIndex >= 0) {
            selectedCards.value[lastIndex] = { ...selectedCards.value[lastIndex], ...cardData };
        }
    }

    const retryCardInterpretation = (cardIndex) => {
        if (cardIndex >= 0 && cardIndex < selectedCards.value.length) {
            selectedCards.value[cardIndex] = {
                ...selectedCards.value[cardIndex],
                interpretation: 'Загружается толкование...',
                loading: true,
                hasError: false
            };
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
        isNatalChartInterpretationModalOpen,
        isLoading,
        isFullReadingLoading,
        selectedCards,
        selectedSpread,
        userQuestion,
        fullReadingText,
        natalChartInterpretationText,
        openCardResultModal,
        closeCardResultModal,
        openAnswerModal,
        closeAnswerModal,
        openNatalChartInterpretationModal,
        closeNatalChartInterpretationModal,
        addSelectedCard,
        updateLastCard,
        retryCardInterpretation,
        startLoading,
        stopLoading,
        startFullReadingLoading,
        stopFullReadingLoading,
        setFullReadingText,
        setNatalChartInterpretationText,
        resetSelection
    }
})

