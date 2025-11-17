<script setup>
import { watchEffect } from 'vue';
import { useModalStore } from '@/stores/modal.store';

const modalStore = useModalStore();

// Блокировка скролла body при открытии модалки
watchEffect(() => {
    if (modalStore.isAstrologyHelpModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
});

const closeModal = () => {
    modalStore.closeAstrologyHelpModal();
};
</script>

<template>
    <div v-if="modalStore.isAstrologyHelpModalOpen" class="modal modal--large modal--astrology-help">
        <div class="modal__overlay" @click="closeModal"></div>
        <div class="modal__container">
            <div class="modal__content">
                <div class="astrology-help">
                    <div class="astrology-help__header">
                        <h2 class="astrology-help__title">Астрологическая справка</h2>
                        <button class="modal__close" @click="closeModal">
                            <span class="modal__close-icon">×</span>
                        </button>
                    </div>

                    <div class="astrology-help__content">
                        <section class="astrology-help__section">
                            <h3 class="astrology-help__section-title">🌌 Что такое натальная карта?</h3>
                            <p class="astrology-help__text">
                                Натальная карта (или гороскоп) — это астрономическая карта неба на момент рождения человека.
                                Она показывает точное положение всех планет Солнечной системы относительно Земли в момент вашего рождения.
                                Эта карта является "космическим портретом" человека и описывает его потенциал, характер, таланты и жизненный путь.
                            </p>
                            <p class="astrology-help__text">
                                Круг натальной карты разделен на 12 секторов (домов), каждый из которых отвечает за определенную сферу жизни.
                                Планеты, находящиеся в этих секторах, показывают, как проявляется их энергия в различных областях вашей жизни.
                            </p>
                        </section>

                        <section class="astrology-help__section">
                            <h3 class="astrology-help__section-title">🪐 Планеты в астрологии</h3>
                            <p class="astrology-help__text">
                                В астрологии планеты представляют различные энергии и архетипы, влияющие на характер и судьбу человека:
                            </p>
                            <div class="astrology-help__planets-grid">
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">☉ Солнце</h4>
                                    <p class="astrology-help__planet-desc">Эго, жизненная сила, творчество, лидерство</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">☽ Луна</h4>
                                    <p class="astrology-help__planet-desc">Эмоции, интуиция, привычки, подсознание</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">☿ Меркурий</h4>
                                    <p class="astrology-help__planet-desc">Коммуникация, мышление, обучение, логика</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♀ Венера</h4>
                                    <p class="astrology-help__planet-desc">Любовь, красота, гармония, ценности</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♂ Марс</h4>
                                    <p class="astrology-help__planet-desc">Энергия, действие, страсть, инициатива</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♃ Юпитер</h4>
                                    <p class="astrology-help__planet-desc">Рост, удача, мудрость, расширение</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♄ Сатурн</h4>
                                    <p class="astrology-help__planet-desc">Дисциплина, ответственность, карма, ограничения</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">⛢ Уран</h4>
                                    <p class="astrology-help__planet-desc">Свобода, инновации, революции, неожиданности</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♆ Нептун</h4>
                                    <p class="astrology-help__planet-desc">Духовность, мечты, иллюзии, сострадание</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">♇ Плутон</h4>
                                    <p class="astrology-help__planet-desc">Трансформация, власть, смерть и возрождение</p>
                                </div>
                                <div class="astrology-help__planet">
                                    <h4 class="astrology-help__planet-name">☊ Северный узел</h4>
                                    <p class="astrology-help__planet-desc">Жизненная цель, karmic направление</p>
                                </div>
                            </div>
                        </section>

                        <section class="astrology-help__section">
                            <h3 class="astrology-help__section-title">🏠 Астрологические дома</h3>
                            <p class="astrology-help__text">
                                Натальная карта разделена на 12 домов — сфер жизни, каждая из которых отвечает за определенные области:
                            </p>
                            <div class="astrology-help__houses-grid">
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">1-й дом (ASC)</h4>
                                    <p class="astrology-help__house-desc">Личность, внешность, самовыражение</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">2-й дом</h4>
                                    <p class="astrology-help__house-desc">Финансы, материальные ценности, самооценка</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">3-й дом</h4>
                                    <p class="astrology-help__house-desc">Общение, обучение, близкие родственники</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">4-й дом (IC)</h4>
                                    <p class="astrology-help__house-desc">Дом, семья, корни, подсознание</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">5-й дом</h4>
                                    <p class="astrology-help__house-desc">Творчество, дети, романтика, риск</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">6-й дом</h4>
                                    <p class="astrology-help__house-desc">Здоровье, работа, повседневная рутина</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">7-й дом (DESC)</h4>
                                    <p class="astrology-help__house-desc">Партнерство, брак, открытые враги</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">8-й дом</h4>
                                    <p class="astrology-help__house-desc">Трансформация, интимность, чужие деньги</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">9-й дом</h4>
                                    <p class="astrology-help__house-desc">Путешествия, образование, философия</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">10-й дом (MC)</h4>
                                    <p class="astrology-help__house-desc">Карьера, репутация, социальный статус</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">11-й дом</h4>
                                    <p class="astrology-help__house-desc">Друзья, группы, надежды и желания</p>
                                </div>
                                <div class="astrology-help__house">
                                    <h4 class="astrology-help__house-name">12-й дом</h4>
                                    <p class="astrology-help__house-desc">Подсознание, духовность, тайные враги</p>
                                </div>
                            </div>
                        </section>

                        <section class="astrology-help__section">
                            <h3 class="astrology-help__section-title">⭐ Аспекты между планетами</h3>
                            <p class="astrology-help__text">
                                Аспекты — это угловые отношения между планетами, которые показывают, как планеты взаимодействуют друг с другом:
                            </p>
                            <div class="astrology-help__aspects-grid">
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">☌ Соединение (0°)</h4>
                                    <p class="astrology-help__aspect-desc">Слияние энергий, усиление качеств</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">⚺ Полусекстиль (30°)</h4>
                                    <p class="astrology-help__aspect-desc">Легкое взаимодействие, малозаметное</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">∠ Семиквадрат (45°)</h4>
                                    <p class="astrology-help__aspect-desc">Незначительное напряжение, раздражение</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">⚹ Секстиль (60°)</h4>
                                    <p class="astrology-help__aspect-desc">Гармоничное взаимодействие, возможности</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">∟ Квинтиль (72°)</h4>
                                    <p class="astrology-help__aspect-desc">Творческий талант, необычные способности</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">□ Квадратура (90°)</h4>
                                    <p class="astrology-help__aspect-desc">Напряжение, вызовы, активность</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">∴ Тридециль (108°)</h4>
                                    <p class="astrology-help__aspect-desc">Гармония через напряжение</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">△ Трион (120°)</h4>
                                    <p class="astrology-help__aspect-desc">Гармония, легкость, поддержка</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">⊕ Бинонагон (135°)</h4>
                                    <p class="astrology-help__aspect-desc">Скрытые таланты, внутренние конфликты</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">⚻ Квинкункс (150°)</h4>
                                    <p class="astrology-help__aspect-desc">Адаптация, корректировка, дискомфорт</p>
                                </div>
                                <div class="astrology-help__aspect">
                                    <h4 class="astrology-help__aspect-name">☍ Оппозиция (180°)</h4>
                                    <p class="astrology-help__aspect-desc">Противостояние, баланс, интеграция</p>
                                </div>
                            </div>
                        </section>

                        <section class="astrology-help__section">
                            <h3 class="astrology-help__section-title">🎨 Цветовое кодирование</h3>
                            <p class="astrology-help__text">
                                В нашей системе используется цветовое кодирование для быстрого понимания аспектов:
                            </p>
                            <div class="astrology-help__colors">
                                <div class="astrology-help__color-item">
                                    <div class="astrology-help__color-sample" style="background-color: rgba(76, 175, 80, 0.5); border: 1px solid #4CAF50;"></div>
                                    <span>Гармоничные аспекты (sextile, trine)</span>
                                </div>
                                <div class="astrology-help__color-item">
                                    <div class="astrology-help__color-sample" style="background-color: rgba(244, 67, 54, 0.5); border: 1px solid #F44336;"></div>
                                    <span>Напряженные аспекты (square, opposition)</span>
                                </div>
                                <div class="astrology-help__color-item">
                                    <div class="astrology-help__color-sample" style="background-color: rgba(255, 152, 0, 0.5); border: 1px solid #FF9800;"></div>
                                    <span>Минорные аспекты (quintile, semisextile)</span>
                                </div>
                                <div class="astrology-help__color-item">
                                    <div class="astrology-help__color-sample" style="background-color: rgba(212, 132, 80, 0.5); border: 1px solid #D48450;"></div>
                                    <span>Нейтральные аспекты (conjunction)</span>
                                </div>
                            </div>
                            <p class="astrology-help__text">
                                Фон текста аспекта показывает его точность: <strong style="color: #4CAF50;">зеленый</strong> для точных,
                                <strong style="color: #FF9800;">оранжевый</strong> для средних, <strong style="color: #F44336;">красный</strong> для слабых аспектов.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/vars.scss' as *;

.astrology-help {
    padding: $spacing-middle;
    max-width: 100%;
}

.astrology-help__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
}

.astrology-help__title {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
}

.astrology-help__content {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 16px;
}

.astrology-help__section {
    margin-bottom: 32px;
}

.astrology-help__section-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-primary);
    margin: 0 0 16px 0;
}

.astrology-help__text {
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0 0 16px 0;
}

.astrology-help__planets-grid,
.astrology-help__houses-grid,
.astrology-help__aspects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin: 16px 0;
}

.astrology-help__planet,
.astrology-help__house,
.astrology-help__aspect {
    background-color: var(--color-bg-dark);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.astrology-help__planet-name,
.astrology-help__house-name,
.astrology-help__aspect-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-primary);
    margin: 0 0 8px 0;
}

.astrology-help__planet-desc,
.astrology-help__house-desc,
.astrology-help__aspect-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.4;
}

.astrology-help__colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
    margin: 16px 0;
}

.astrology-help__color-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.astrology-help__color-sample {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    flex-shrink: 0;
}

.astrology-help__color-item span {
    font-size: 14px;
    color: var(--color-text-secondary);
}
</style>
