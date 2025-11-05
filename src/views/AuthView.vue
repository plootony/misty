<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/services/supabase.service';
import { useUserStore } from '@/stores/user.store';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true); // true = вход, false = регистрация
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoadingEmail = ref(false);
const isLoadingGoogle = ref(false);
const error = ref('');
const success = ref('');
const hcaptchaRef = ref(null);
const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || 'c6224f9c-dd12-45a2-bd82-be6c247e7d74';

console.log('hCaptcha siteKey:', hcaptchaSiteKey ? 'установлен' : 'не установлен');

// Обработчики событий hCaptcha
const onHcaptchaError = (event) => {
    console.error('hCaptcha error:', event);
    error.value = 'Ошибка проверки безопасности. Попробуйте еще раз.';
};

const onHcaptchaExpired = () => {
    console.log('hCaptcha expired');
    if (hcaptchaRef.value) {
        hcaptchaRef.value.reset();
    }
};

const onHcaptchaVerified = (token) => {
    console.log('hCaptcha verified, token:', token ? 'получен' : 'пустой');
};

const toggleMode = () => {
    isLogin.value = !isLogin.value;
    error.value = '';
    success.value = '';
    password.value = '';
    confirmPassword.value = '';
    // Сбрасываем hCaptcha при переключении режима
    if (hcaptchaRef.value) {
        hcaptchaRef.value.reset();
    }
};

const handleEmailAuth = async () => {
    try {
        error.value = '';
        success.value = '';
        
        // Валидация
        if (!email.value || !password.value) {
            error.value = 'Заполните все поля';
            return;
        }
        
        if (!isLogin.value && password.value !== confirmPassword.value) {
            error.value = 'Пароли не совпадают';
            return;
        }
        
        if (password.value.length < 6) {
            error.value = 'Пароль должен быть не менее 6 символов';
            return;
        }
        
        // Получаем hCaptcha токен перед отправкой
        let captchaToken = null;
        if (hcaptchaSiteKey) {
            console.log('hCaptcha: Начинаем верификацию...');

            if (!hcaptchaRef.value) {
                console.error('hCaptcha: Виджет не инициализирован');
                error.value = 'Виджет безопасности не загружен. Попробуйте перезагрузить страницу.';
                return;
            }

            try {
                // Проверяем готовность виджета
                console.log('hCaptcha: Вызываем execute()...');

                // Ждём немного, чтобы виджет успел загрузиться
                await new Promise(resolve => setTimeout(resolve, 100));

                captchaToken = await hcaptchaRef.value.execute();
                console.log('hCaptcha: Токен получен:', captchaToken ? 'да' : 'нет', captchaToken);

                if (!captchaToken) {
                    console.error('hCaptcha: Токен пустой, пробуем еще раз...');
                    // Пробуем еще раз с задержкой
                    await new Promise(resolve => setTimeout(resolve, 500));
                    captchaToken = await hcaptchaRef.value.execute();
                    console.log('hCaptcha: Повторная попытка, токен:', captchaToken ? 'да' : 'нет', captchaToken);
        
                    if (!captchaToken) {
                        error.value = 'Проверка безопасности не пройдена. Попробуйте еще раз.';
                        return;
                    }
                }
            } catch (err) {
                console.error('hCaptcha: Ошибка выполнения:', err);
                error.value = 'Ошибка проверки безопасности. Попробуйте еще раз.';
            return;
            }
        } else {
            console.warn('hCaptcha: Ключ не установлен, пропускаем верификацию');
        }
        
        isLoadingEmail.value = true;
        
        if (isLogin.value) {
            // Вход
            const { session, user } = await signInWithEmail(email.value, password.value, captchaToken);
            if (user) {
                await userStore.loadUserFromSupabase(user);
                router.push('/');
            }
        } else {
            // Регистрация
            const { user } = await signUpWithEmail(email.value, password.value, captchaToken);
            if (user) {
                success.value = 'Проверьте вашу почту для подтверждения регистрации!';
                email.value = '';
                password.value = '';
                confirmPassword.value = '';
            }
        }
        
        // Сбрасываем hCaptcha после успешной отправки
        if (hcaptchaRef.value) {
            try {
                hcaptchaRef.value.reset();
                console.log('hCaptcha: Виджет сброшен');
            } catch (err) {
                console.warn('hCaptcha: Ошибка сброса виджета:', err);
            }
        }
    } catch (err) {
        console.error('Ошибка авторизации:', err);
        if (err.message.includes('Invalid login credentials')) {
            error.value = 'Неверный email или пароль';
        } else if (err.message.includes('User already registered')) {
            error.value = 'Пользователь с таким email уже зарегистрирован';
        } else if (err.message.includes('Email not confirmed')) {
            error.value = 'Подтвердите email перед входом';
        } else {
            error.value = err.message || 'Произошла ошибка. Попробуйте еще раз.';
        }
    } finally {
        isLoadingEmail.value = false;
    }
};

const handleGoogleLogin = async () => {
    try {
        isLoadingGoogle.value = true;
        error.value = '';
        await signInWithGoogle();
        // Редирект произойдет автоматически через OAuth
    } catch (err) {
        console.error('Ошибка входа через Google:', err);
        error.value = 'Не удалось войти через Google. Попробуйте еще раз.';
        isLoadingGoogle.value = false;
    }
};
</script>

<template>
    <div class="auth">
        <div class="auth__container">
            <div class="auth__header">
                <img src="@/assets/images/stars-icon.png" alt="star icon" class="auth__icon">
                <h1 class="auth__title">{{ isLogin ? 'Добро пожаловать' : 'Регистрация' }}</h1>
                <p class="auth__subtitle">
                    {{ isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт' }}
                </p>
            </div>

            <div v-if="error" class="auth__error">
                {{ error }}
            </div>

            <div v-if="success" class="auth__success">
                {{ success }}
            </div>

            <!-- Email/Password форма -->
            <form @submit.prevent="handleEmailAuth" class="auth__form">
                <div class="auth__field">
                    <label class="auth__label" for="email">Email</label>
                    <input 
                        v-model="email"
                        type="email" 
                        id="email" 
                        class="auth__input" 
                        placeholder="your@email.com"
                        :disabled="isLoadingEmail || isLoadingGoogle"
                        required
                    >
                </div>

                <div class="auth__field">
                    <label class="auth__label" for="password">Пароль</label>
                    <input 
                        v-model="password"
                        type="password" 
                        id="password" 
                        class="auth__input" 
                        placeholder="••••••••"
                        :disabled="isLoadingEmail || isLoadingGoogle"
                        required
                    >
                </div>

                <div v-if="!isLogin" class="auth__field">
                    <label class="auth__label" for="confirmPassword">Подтвердите пароль</label>
                    <input 
                        v-model="confirmPassword"
                        type="password" 
                        id="confirmPassword" 
                        class="auth__input" 
                        placeholder="••••••••"
                        :disabled="isLoadingEmail || isLoadingGoogle"
                        required
                    >
                </div>

                <!-- hCaptcha виджет -->
                <div v-if="hcaptchaSiteKey" class="auth__captcha">
                    <VueHcaptcha
                        ref="hcaptchaRef"
                        :sitekey="hcaptchaSiteKey"
                        size="invisible"
                        @error="onHcaptchaError"
                        @expired="onHcaptchaExpired"
                        @verify="onHcaptchaVerified"
                    />
                </div>

                <button 
                    type="submit"
                    class="btn btn--primary auth__submit"
                    :disabled="isLoadingEmail || isLoadingGoogle"
                >
                    <ButtonSpinner v-if="isLoadingEmail" />
                    <span>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</span>
                </button>
            </form>

            <!-- Разделитель -->
            <div class="auth__divider">
                <span>или</span>
            </div>

            <!-- Google кнопка -->
            <button 
                @click="handleGoogleLogin" 
                class="btn btn--google auth__google-btn"
                :disabled="isLoadingEmail || isLoadingGoogle"
            >
                <ButtonSpinner v-if="isLoadingGoogle" />
                <svg v-else class="auth__google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Войти через Google</span>
            </button>

            <!-- Переключатель режима -->
            <div class="auth__toggle">
                <span v-if="isLogin">
                    Нет аккаунта? 
                    <button type="button" @click="toggleMode" class="auth__toggle-btn">
                        Зарегистрируйтесь
                    </button>
                </span>
                <span v-else>
                    Уже есть аккаунт? 
                    <button type="button" @click="toggleMode" class="auth__toggle-btn">
                        Войдите
                    </button>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.auth {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-large $spacing-middle;

    &__container {
        max-width: 540px;
        width: 100%;
        background-color: $color-bg-light;
        padding: $spacing-large;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
    }

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-small;
        margin-bottom: $spacing-large;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 42px;
        font-weight: 600;
        color: $color-white;
    }

    &__subtitle {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        color: $color-grey;
        line-height: 1.5;
    }

    &__error {
        padding: $spacing-middle;
        background-color: rgba(255, 84, 84, 0.1);
        border-left: 3px solid $color-orange;
        color: $color-orange;
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        margin-bottom: $spacing-middle;
    }

    &__success {
        padding: $spacing-middle;
        background-color: rgba(52, 168, 83, 0.1);
        border-left: 3px solid #34A853;
        color: #34A853;
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        margin-bottom: $spacing-middle;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
        margin-bottom: $spacing-middle;
    }

    &__captcha {
        display: flex;
        justify-content: center;
        margin-bottom: $spacing-small;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $color-white;
    }

    &__input {
        padding: $spacing-middle;
        background-color: $color-bg-dark;
        border: 1px solid rgba($color-grey, 0.3);
        border-radius: 4px;
        color: $color-white;
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        transition: border-color 0.3s;

        &::placeholder {
            color: $color-grey;
        }

        &:focus {
            outline: none;
            border-color: $color-pastel-orange;
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__submit {
        width: 100%;
        margin-top: $spacing-small;
    }

    &__divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: $spacing-middle 0;

        &::before,
        &::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba($color-grey, 0.3);
        }

        span {
            padding: 0 $spacing-middle;
            font-family: "Inter", Sans-serif;
            font-size: 14px;
            color: $color-grey;
        }
    }

    &__toggle {
        margin-top: $spacing-middle;
        text-align: center;
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;
    }

    &__toggle-btn {
        background: none;
        border: none;
        color: $color-pastel-orange;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.3s;

        &:hover {
            opacity: 0.8;
        }
    }

    &__google-btn {
        width: 100%;
        background-color: $color-white;
        color: #1f1f1f;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $spacing-small;
        padding: $spacing-middle $spacing-large;
        font-family: "DM Sans", Sans-serif;
        font-size: 18px;
        font-weight: 600;
        transition: all 0.3s;
        border: 2px solid transparent;

        &:hover:not(:disabled) {
            background-color: #f8f8f8;
            cursor: pointer;
        }

        &:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
    }

    &__google-icon {
        width: 24px;
        height: 24px;
    }
}
</style>
