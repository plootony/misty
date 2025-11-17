<script setup>
import { watchEffect } from 'vue';
import { useModalStore } from '@/stores/modal.store';

const modalStore = useModalStore();

// Блокировка скролла body при открытии модалки
watchEffect(() => {
    if (modalStore.isCalculationDetailsModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
});

const closeModal = () => {
    modalStore.closeCalculationDetailsModal();
};
</script>

<template>
    <div v-if="modalStore.isCalculationDetailsModalOpen" class="modal modal--large modal--calculation-details">
        <div class="modal__overlay" @click="closeModal"></div>
        <div class="modal__container">
            <div class="modal__content">
                <div class="calculation-details">
                    <div class="calculation-details__header">
                        <h2 class="calculation-details__title">Система получения натальных карт</h2>
                        <button class="modal__close" @click="closeModal">
                            <span class="modal__close-icon">×</span>
                        </button>
                    </div>

                    <div class="calculation-details__content">
                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">🔭 Астрономический движок</h3>
                            <p class="calculation-details__text">
                                Натальные карты рассчитываются с использованием современной астрономической библиотеки
                                <a href="https://github.com/cosinekitty/astronomy-engine" target="_blank" rel="noopener noreferrer" class="calculation-details__link">
                                    Astronomy Engine
                                </a>
                                — высокоточной системы для вычисления положений небесных тел.
                            </p>
                            <p class="calculation-details__text">
                                Эта библиотека обеспечивает точность расчетов до долей угловой секунды и используется
                                профессиональными астрономами и астрологами по всему миру.
                            </p>
                        </section>

                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">🪐 Расчет положений планет</h3>
                            <p class="calculation-details__text">
                                Положения всех планет рассчитываются на основе:
                            </p>
                            <ul class="calculation-details__list">
                                <li><strong>Геоцентрических координат</strong> — положения относительно центра Земли</li>
                                <li><strong>Эклиптической долготы и широты</strong> — координат в плоскости эклиптики</li>
                                <li><strong>Истинного времени</strong> — с учетом часовых поясов и UTC</li>
                                <li><strong>Юлианского дня</strong> — стандартной астрономической шкалы времени</li>
                            </ul>
                        </section>

                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">🏠 Системы домов</h3>
                            <p class="calculation-details__text">
                                Доступны 9 различных систем домов — математических методов деления эклиптики на 12 секторов,
                                каждый из которых соответствует определенной сфере жизни:
                            </p>
                            <ul class="calculation-details__list">
                                <li><strong>Placidus (Плацидус)</strong> — наиболее популярная система, учитывает широту</li>
                                <li><strong>Koch (Кох)</strong> — современная геометрическая система</li>
                                <li><strong>Equal House (Равнодомная)</strong> — простая система с равными домами</li>
                                <li><strong>Whole Sign (Целый знак)</strong> — традиционная ведическая система</li>
                                <li><strong>Porphyry (Порфирий)</strong> — среднее между Placidus и Equal</li>
                                <li><strong>Regiomontanus (Региомонтан)</strong> — комбинированная система</li>
                                <li><strong>Campanus (Кампанус)</strong> — сферическая система</li>
                                <li><strong>Alcabitius (Алькабитиус)</strong> — среднее арифметическое</li>
                                <li><strong>Morinus (Моринус)</strong> — широтно-геометрическая система</li>
                            </ul>
                        </section>

                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">⭐ Расчет аспектов</h3>
                            <p class="calculation-details__text">
                                Аспекты рассчитываются между всеми парами планет с учетом индивидуальных орбисов:
                            </p>
                            <ul class="calculation-details__list">
                                <li><strong>Соединение (0°)</strong> — планеты в одном знаке</li>
                                <li><strong>Секстиль (60°)</strong> — гармоничный аспект</li>
                                <li><strong>Квадратура (90°)</strong> — напряженный аспект</li>
                                <li><strong>Тригон (120°)</strong> — гармоничный аспект</li>
                                <li><strong>Оппозиция (180°)</strong> — напряженный аспект</li>
                                <li><strong>Минорные аспекты</strong> — полусекстиль, семиквадрат, квинтиль и др.</li>
                            </ul>
                            <p class="calculation-details__text">
                                Орбисы зависят от природы планет: внешние планеты (Юпитер, Сатурн, Уран, Нептун, Плутон)
                                имеют больший допуск точности.
                            </p>
                        </section>

                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">📊 Точность и надежность</h3>
                            <p class="calculation-details__text">
                                Система обеспечивает:
                            </p>
                            <ul class="calculation-details__list">
                                <li><strong>Астрономическую точность</strong> — данные соответствуют официальным эфемеридам</li>
                                <li><strong>Математическую корректность</strong> — все расчеты проверены и протестированы</li>
                                <li><strong>Современные алгоритмы</strong> — использование новейших астрономических методов</li>
                                <li><strong>Географическую точность</strong> — корректная обработка часовых поясов и координат</li>
                            </ul>
                        </section>

                        <section class="calculation-details__section">
                            <h3 class="calculation-details__section-title">🎯 Совместимость с традициями</h3>
                            <p class="calculation-details__text">
                                Несмотря на использование современных технологий, система полностью совместима
                                с традиционными астрологическими методами и обеспечивает точность,
                                недостижимую при ручных расчетах.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.calculation-details {
    max-width: 100%;
}

.calculation-details__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
}

.calculation-details__title {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
}

.calculation-details__content {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 16px;
}

.calculation-details__section {
    margin-bottom: 32px;
}

.calculation-details__section-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-primary);
    margin: 0 0 16px 0;
}

.calculation-details__text {
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0 0 16px 0;
}

.calculation-details__list {
    margin: 16px 0;
    padding-left: 24px;
}

.calculation-details__list li {
    margin-bottom: 8px;
    color: var(--color-text-secondary);
}

.calculation-details__link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
}

.calculation-details__link:hover {
    border-bottom-color: var(--color-primary);
}
</style>
