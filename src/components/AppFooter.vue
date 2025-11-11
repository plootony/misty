<script setup>
import { ref } from 'vue';

const showPrivacyPolicy = ref(false);
const showTermsOfService = ref(false);

const openPrivacyPolicy = () => {
    showPrivacyPolicy.value = true;
};

const closePrivacyPolicy = () => {
    showPrivacyPolicy.value = false;
};

const openTermsOfService = () => {
    showTermsOfService.value = true;
};

const closeTermsOfService = () => {
    showTermsOfService.value = false;
};
</script>

<template>
    <footer class="footer">
        <div class="footer__container">
            <div class="footer__content">
                <!-- Логотип -->
                <div class="footer__logo">
                    <img src="@/assets/images/stars-icon.png" alt="Misty" class="footer__logo-icon">
                    <span class="footer__logo-text">MiSTY</span>
                </div>

                <!-- Ссылки -->
                <nav class="footer__nav">
                    <button
                        type="button"
                        class="footer__link"
                        @click="openPrivacyPolicy"
                    >
                        Политика конфиденциальности
                    </button>
                    <button
                        type="button"
                        class="footer__link"
                        @click="openTermsOfService"
                    >
                        Пользовательское соглашение
                    </button>
                </nav>

                <!-- Копирайт -->
                <div class="footer__copyright">
                    © 2025 MiSTY. Все права защищены.
                </div>
            </div>
        </div>
    </footer>

    <!-- Модалка политики конфиденциальности -->
    <div v-if="showPrivacyPolicy" class="modal-overlay" @click="closePrivacyPolicy">
        <div class="modal" @click.stop>
            <div class="modal__header">
                <h2 class="modal__title">Политика конфиденциальности</h2>
                <button type="button" class="modal__close" @click="closePrivacyPolicy">×</button>
            </div>
            <div class="modal__content">
                <div class="modal__text">
                    <h3>1. Общие положения</h3>
                    <p>Настоящая политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей приложения MiSTY.</p>

                    <h3>2. Собираемые данные</h3>
                    <p>Мы собираем следующие данные:</p>
                    <ul>
                        <li>Адрес электронной почты при регистрации</li>
                        <li>Имя пользователя</li>
                        <li>Дата рождения (для астрологических расчетов)</li>
                        <li>История гаданий и вопросы пользователей</li>
                    </ul>

                    <h3>3. Цели обработки данных</h3>
                    <p>Персональные данные используются для:</p>
                    <ul>
                        <li>Предоставления услуг гадания на картах Таро</li>
                        <li>Персонализации пользовательского опыта</li>
                        <li>Улучшения качества сервиса</li>
                        <li>Обеспечения безопасности аккаунта</li>
                    </ul>

                    <h3>4. Защита данных</h3>
                    <p>Мы принимаем все необходимые меры для защиты ваших персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.</p>

                    <h3>5. Передача данных третьим лицам</h3>
                    <p>Мы не передаем персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством или необходимых для предоставления услуг.</p>

                    <h3>6. Cookies</h3>
                    <p>Приложение использует cookies для обеспечения корректной работы сервиса аутентификации и сохранения пользовательских настроек.</p>

                    <h3>7. Ваши права</h3>
                    <p>Вы имеете право на:</p>
                    <ul>
                        <li>Доступ к своим персональным данным</li>
                        <li>Исправление неточных данных</li>
                        <li>Удаление аккаунта и связанных данных</li>
                        <li>Отзыв согласия на обработку данных</li>
                    </ul>

                    <h3>8. Контакты</h3>
                    <p>По вопросам, связанным с обработкой персональных данных, вы можете обратиться по адресу: privacy@misty.app</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Модалка пользовательского соглашения -->
    <div v-if="showTermsOfService" class="modal-overlay" @click="closeTermsOfService">
        <div class="modal" @click.stop>
            <div class="modal__header">
                <h2 class="modal__title">Пользовательское соглашение</h2>
                <button type="button" class="modal__close" @click="closeTermsOfService">×</button>
            </div>
            <div class="modal__content">
                <div class="modal__text">
                    <h3>1. Общие положения</h3>
                    <p>Настоящее пользовательское соглашение (далее — "Соглашение") регулирует отношения между разработчиком приложения MiSTY и пользователем сервиса.</p>

                    <h3>2. Предмет соглашения</h3>
                    <p>MiSTY предоставляет услуги гадания на картах Таро с использованием искусственного интеллекта. Сервис предназначен исключительно для развлекательных и консультационных целей.</p>

                    <h3>3. Права и обязанности пользователя</h3>
                    <h4>Пользователь имеет право:</h4>
                    <ul>
                        <li>Использовать сервис в соответствии с его назначением</li>
                        <li>Получать консультации в рамках выбранного тарифного плана</li>
                        <li>Удалять свою учетную запись и связанные данные</li>
                    </ul>

                    <h4>Пользователь обязан:</h4>
                    <ul>
                        <li>Предоставлять достоверную информацию при регистрации</li>
                        <li>Не использовать сервис в противоправных целях</li>
                        <li>Не пытаться обходить технические ограничения сервиса</li>
                        <li>Соблюдать нормы морали и этики</li>
                    </ul>

                    <h3>4. Ограничение ответственности</h3>
                    <p>Сервис MiSTY предоставляет информацию исключительно в развлекательных целях. Все предсказания и консультации носят вероятностный характер и не могут рассматриваться как точные прогнозы или профессиональные консультации.</p>

                    <p>Разработчик не несет ответственности за:</p>
                    <ul>
                        <li>Решения, принятые пользователем на основе полученной информации</li>
                        <li>Последствия использования сервиса</li>
                        <li>Технические сбои и перерывы в работе</li>
                        <li>Действия третьих лиц</li>
                    </ul>

                    <h3>5. Интеллектуальная собственность</h3>
                    <p>Все материалы, дизайн, программный код и контент приложения MiSTY являются объектами интеллектуальной собственности разработчика и охраняются законодательством.</p>

                    <h3>6. Запрещенные действия</h3>
                    <p>Пользователю запрещено:</p>
                    <ul>
                        <li>Копировать или модифицировать программный код</li>
                        <li>Использовать автоматизированные средства для доступа к сервису</li>
                        <li>Распространять вредоносное ПО</li>
                        <li>Пытаться взломать или обойти систему безопасности</li>
                        <li>Использовать сервис для распространения незаконного контента</li>
                        <li>Создавать множественные аккаунты для обхода ограничений</li>
                    </ul>

                    <h3>7. Тарифные планы и оплата</h3>
                    <p>Сервис предоставляется на различных тарифных планах. Условия оплаты и ограничения использования определяются выбранным тарифом. Оплата осуществляется через платежные системы партнеров.</p>

                    <h3>8. Изменение условий</h3>
                    <p>Разработчик оставляет за собой право вносить изменения в настоящее соглашение. Пользователи будут уведомлены о существенных изменениях.</p>

                    <h3>9. Прекращение действия соглашения</h3>
                    <p>Пользователь может прекратить использование сервиса в любое время. Разработчик может приостановить или прекратить доступ пользователя к сервису в случае нарушения условий соглашения.</p>

                    <h3>10. Применимое право</h3>
                    <p>Настоящее соглашение регулируется законодательством Российской Федерации.</p>

                    <h3>11. Контакты</h3>
                    <p>По вопросам, связанным с настоящим соглашением, вы можете обратиться по адресу: support@misty.app</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.footer {
    background-color: $color-bg-dark;
    border-top: 1px solid $color-bg-light;
    margin-top: auto;

    &__container {
        max-width: 1440px;
        margin: 0 auto;
        padding: $spacing-middle $spacing-small;
    }

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
    }

    &__logo {
        display: flex;
        align-items: center;
        gap: $spacing-small;

        &-icon {
            width: 24px;
            height: auto;
        }

        &-text {
            font-family: "Playfair Display", Sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: $color-white;
        }
    }

    &__nav {
        display: flex;
        gap: $spacing-large;
    }

    &__link {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;
        background: none;
        border: none;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.3s;

        &:hover {
            color: $color-pastel-orange;
        }
    }

    &__copyright {
        font-family: "Inter", Sans-serif;
        font-size: 12px;
        color: $color-grey;
        text-align: center;
    }
}

// Модалки
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: grid;
    place-items: center;
    z-index: 1000;
    padding: $spacing-middle;
}

.modal {
    background-color: $color-bg-dark;
    border-radius: 8px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-middle;
        border-bottom: 1px solid $color-bg-light;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 24px;
        font-weight: 600;
        color: $color-white;
        margin: 0;
    }

    &__close {
        background: none;
        border: none;
        font-size: 28px;
        color: $color-grey;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s;

        &:hover {
            color: $color-white;
        }
    }

    &__content {
        padding: $spacing-middle;
        overflow-y: auto;
        flex: 1;
    }

    &__text {
        font-family: "Inter", Sans-serif;
        color: $color-grey;
        line-height: 1.6;

        h3 {
            font-family: "Playfair Display", Sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: $color-white;
            margin-top: $spacing-large;
            margin-bottom: $spacing-middle;

            &:first-child {
                margin-top: 0;
            }
        }

        h4 {
            font-size: 16px;
            font-weight: 600;
            color: $color-pastel-orange;
            margin-top: $spacing-middle;
            margin-bottom: $spacing-small;
        }

        p {
            margin-bottom: $spacing-middle;
        }

        ul {
            margin-bottom: $spacing-middle;
            padding-left: $spacing-large;

            li {
                margin-bottom: $spacing-x-smal;
            }
        }
    }
}

// Адаптивность
@media (max-width: 768px) {
    .footer {
        &__nav {
            flex-direction: column;
            gap: $spacing-middle;
            align-items: center;
        }
    }

    .modal {
        max-width: 95vw;
        max-height: 90vh;
    }
}
</style>
