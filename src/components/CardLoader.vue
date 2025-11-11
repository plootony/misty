<template>
    <div class="card-loader">
        <svg class="card-loader__svg">
            <defs>
                <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                    <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                        <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                    <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                        <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
                    <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                        <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
                    <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                        <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                    <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                    <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
                    <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
                </filter>
            </defs>
        </svg>

        <div class="card-loader__container">
            <div class="card-loader__inner">
                <div class="card-loader__border-outer">
                    <div class="card-loader__main-card"></div>
                </div>
                <div class="card-loader__glow card-loader__glow--1"></div>
                <div class="card-loader__glow card-loader__glow--2"></div>
            </div>
            <div class="card-loader__overlay card-loader__overlay--1"></div>
            <div class="card-loader__overlay card-loader__overlay--2"></div>
            <div class="card-loader__background-glow"></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.card-loader {
    display: flex;
    align-items: center;
    justify-content: center;

    &__svg {
        position: absolute;
    }

    &__container {
        padding: 2px;
        border-radius: 24px;
        position: relative;
        background: linear-gradient(
            -30deg,
            rgba(213, 132, 110, 0.4),
            transparent,
            rgba(213, 132, 110, 0.4)
        ),
        linear-gradient(
            to bottom,
            $color-bg-dark,
            $color-bg-dark
        );
    }

    &__inner {
        position: relative;
    }

    &__border-outer {
        border: 2px solid rgba(213, 132, 110, 0.5);
        border-radius: 24px;
        padding-right: 4px;
        padding-bottom: 4px;
    }

    &__main-card {
        width: 350px;
        height: 500px;
        border-radius: 24px;
        border: 2px solid $color-pastel-gold;
        margin-top: -4px;
        margin-left: -4px;
        filter: url(#turbulent-displace);
        background-color: $color-bg-dark;
    }

    &__glow {
        border-radius: 24px;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        &--1 {
            border: 2px solid rgba(213, 132, 110, 0.6);
            filter: blur(1px);
        }

        &--2 {
            border: 2px solid $color-pastel-gold;
            filter: blur(4px);
        }
    }

    &__overlay {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 24px;
        mix-blend-mode: overlay;
        transform: scale(1.1);
        filter: blur(16px);
        background: linear-gradient(
            -30deg,
            white,
            transparent 30%,
            transparent 70%,
            white
        );

        &--1 {
            opacity: 1;
        }

        &--2 {
            opacity: 0.5;
        }
    }

    &__background-glow {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 24px;
        filter: blur(32px);
        transform: scale(1.1);
        opacity: 0.3;
        z-index: -1;
        background: linear-gradient(
            -30deg,
            $color-pastel-gold,
            transparent,
            $color-pastel-gold
        );
    }
}
</style>

