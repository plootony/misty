import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useModalStore } from './modal.store'

export const useCardSelector = defineStore('cardSelectorStore', () => {
    const deck = ref([
        {
          id: 0,
          name: "Шут",
          arcana: "Старший Аркан",
          upright: "Новые начинания, спонтанность, свобода, невинность",
          reversed: "Безрассудство, риск, отсутствие направления",
          image: "/cards/the_fool.webp"
        },
        {
          id: 1,
          name: "Маг",
          arcana: "Старший Аркан",
          upright: "Сила воли, мастерство, возможности, концентрация",
          reversed: "Манипуляция, нерешительность, задержки",
          image: "/cards/the_magician.webp"
        },
        {
          id: 2,
          name: "Верховная Жрица",
          arcana: "Старший Аркан",
          upright: "Интуиция, тайны, духовность, внутреннее знание",
          reversed: "Подавленная интуиция, секреты, непонимание",
          image: "/cards/the_high_priestess.webp"
        },
        {
          id: 3,
          name: "Императрица",
          arcana: "Старший Аркан",
          upright: "Изобилие, творчество, плодородие, материнство",
          reversed: "Блокировка творчества, зависимость, пустота",
          image: "/cards/the_empress.webp"
        },
        {
          id: 4,
          name: "Император",
          arcana: "Старший Аркан",
          upright: "Власть, структура, стабильность, авторитет",
          reversed: "Тирания, ригидность, потеря контроля",
          image: "/cards/the_emperor.webp"
        },
        {
          id: 5,
          name: "Иерофант",
          arcana: "Старший Аркан",
          upright: "Традиции, обучение, духовное руководство",
          reversed: "Догматизм, ограничения, бунт против традиций",
          image: "/cards/the_hierophant.webp"
        },
        {
          id: 6,
          name: "Влюблённые",
          arcana: "Старший Аркан",
          upright: "Любовь, гармония, выбор, отношения",
          reversed: "Дисгармония, конфликт, неверный выбор",
          image: "/cards/the_lovers.webp"
        },
        {
          id: 7,
          name: "Колесница",
          arcana: "Старший Аркан",
          upright: "Движение вперёд, победа, сила воли, контроль",
          reversed: "Отсутствие направления, потеря контроля",
          image: "/cards/the_chariot.webp"
        },
        {
          id: 8,
          name: "Сила",
          arcana: "Старший Аркан",
          upright: "Внутренняя сила, храбрость, терпение",
          reversed: "Слабость, сомнение, недостаток веры в себя",
          image: "/cards/the_strength.webp"
        },
        {
          id: 9,
          name: "Отшельник",
          arcana: "Старший Аркан",
          upright: "Самопознание, поиск истины, внутренний свет",
          reversed: "Изоляция, одиночество, потеря пути",
          image: "/cards/the_hermit.webp"
        },
        {
          id: 10,
          name: "Колесо Фортуны",
          arcana: "Старший Аркан",
          upright: "Судьба, циклы, поворотный момент",
          reversed: "Неудача, нарушение циклов, внешний контроль",
          image: "/cards/the_wheel_of_fortune.webp"
        },
        {
          id: 11,
          name: "Справедливость",
          arcana: "Старший Аркан",
          upright: "Равновесие, честность, причина и следствие",
          reversed: "Несправедливость, дисбаланс, нечестность",
          image: "/cards/the_justice.webp"
        },
        {
          id: 12,
          name: "Повешенный",
          arcana: "Старший Аркан",
          upright: "Жертва, отпускание, новая перспектива",
          reversed: "Сопротивление, бесполезная жертва",
          image: "/cards/the_hangman.webp"
        },
        {
          id: 13,
          name: "Смерть",
          arcana: "Старший Аркан",
          upright: "Трансформация, окончание, новое начало",
          reversed: "Застой, сопротивление изменениям",
          image: "/cards/the_death.webp"
        },
        {
          id: 14,
          name: "Умеренность",
          arcana: "Старший Аркан",
          upright: "Баланс, гармония, умеренность",
          reversed: "Дисбаланс, эксцессы, конфликт",
          image: "/cards/the_temperance.webp"
        },
        {
          id: 15,
          name: "Дьявол",
          arcana: "Старший Аркан",
          upright: "Материальность, зависимость, теневая сторона",
          reversed: "Освобождение, преодоление зависимости",
          image: "/cards/the_devil.webp"
        },
        {
          id: 16,
          name: "Башня",
          arcana: "Старший Аркан",
          upright: "Внезапные изменения, разрушение, откровение",
          reversed: "Избегание катастрофы, страх перемен",
          image: "/cards/the_tower.webp"
        },
        {
          id: 17,
          name: "Звезда",
          arcana: "Старший Аркан",
          upright: "Надежда, вдохновение, обновление",
          reversed: "Потеря веры, разочарование, уныние",
          image: "/cards/the_star.webp"
        },
        {
          id: 18,
          name: "Луна",
          arcana: "Старший Аркан",
          upright: "Интуиция, иллюзии, подсознание",
          reversed: "Страхи, обман, замешательство",
          image: "/cards/the_moon.webp"
        },
        {
          id: 19,
          name: "Солнце",
          arcana: "Старший Аркан",
          upright: "Радость, успех, позитивность",
          reversed: "Временные трудности, неуверенность",
          image: "/cards/the_sun.webp"
        },
        {
          id: 20,
          name: "Суд",
          arcana: "Старший Аркан",
          upright: "Возрождение, внутренний зов, искупление",
          reversed: "Сомнения, отказ от призвания",
          image: "/cards/the_judgment.webp"
        },
        {
          id: 21,
          name: "Мир",
          arcana: "Старший Аркан",
          upright: "Завершение, интеграция, достижение",
          reversed: "Незавершённость, отсутствие закрытия",
          image: "/cards/the_world.webp"
        },
        {
          id: 22,
          name: "Туз Жезлов",
          arcana: "Младший Аркан",
          upright: "Новые начинания, вдохновение, потенциал",
          reversed: "Задержки, блокировка творчества",
          image: "/cards/ace_of_wands.webp"
        },
        {
          id: 23,
          name: "Двойка Жезлов",
          arcana: "Младший Аркан",
          upright: "Планирование, решения, мировоззрение",
          reversed: "Страх перемен, плохое планирование",
          image: "/cards/two_of_wands.webp"
        },
        {
          id: 24,
          name: "Тройка Жезлов",
          arcana: "Младший Аркан",
          upright: "Расширение горизонтов, предвидение, торговля",
          reversed: "Задержки, разочарование, ограниченные возможности",
          image: "/cards/three_of_wands.webp"
        },
        {
          id: 25,
          name: "Четверка Жезлов",
          arcana: "Младший Аркан",
          upright: "Праздник, гармония, домашний очаг, процветание",
          reversed: "Нестабильность, переходный период, отсутствие поддержки",
          image: "/cards/four_of_wands.webp"
        },
        {
          id: 26,
          name: "Пятерка Жезлов",
          arcana: "Младший Аркан",
          upright: "Конкуренция, конфликт, споры",
          reversed: "Избегание конфликта, согласие, примирение",
          image: "/cards/five_of_wands.webp"
        },
        {
          id: 27,
          name: "Шестерка Жезлов",
          arcana: "Младший Аркан",
          upright: "Победа, успех, публичное признание",
          reversed: "Неуверенность в себе, отсутствие признания",
          image: "/cards/six_of_wands.webp"
        },
        {
          id: 28,
          name: "Семерка Жезлов",
          arcana: "Младший Аркан",
          upright: "Вызов, защита, стойкость",
          reversed: "Нерешительность, перегрузка, капитуляция",
          image: "/cards/seven_of_wands.webp"
        },
        {
          id: 29,
          name: "Восьмерка Жезлов",
          arcana: "Младший Аркан",
          upright: "Быстрое движение, прогресс, коммуникация",
          reversed: "Задержки, разочарование, внутренние конфликты",
          image: "/cards/eight_of_wands.webp"
        },
        {
          id: 30,
          name: "Девятка Жезлов",
          arcana: "Младший Аркан",
          upright: "Стойкость, настойчивость, близость к цели",
          reversed: "Истощение, паранойя, отступление",
          image: "/cards/nine_of_wands.webp"
        },
        {
          id: 31,
          name: "Десятка Жезлов",
          arcana: "Младший Аркан",
          upright: "Бремя, ответственность, завершение",
          reversed: "Стресс, давление, освобождение от бремени",
          image: "/cards/ten_of_wands.webp"
        },
        {
          id: 32,
          name: "Паж Жезлов",
          arcana: "Младший Аркан",
          upright: "Исследование, энтузиазм, открытия",
          reversed: "Отсутствие направления, рассеянность",
          image: "/cards/page_of_wands.webp"
        },
        {
          id: 33,
          name: "Рыцарь Жезлов",
          arcana: "Младший Аркан",
          upright: "Действие, приключения, импульсивность",
          reversed: "Поспешность, агрессия, необдуманные действия",
          image: "/cards/knight_of_wands.webp"
        },
        {
          id: 34,
          name: "Королева Жезлов",
          arcana: "Младший Аркан",
          upright: "Уверенность, харизма, независимость",
          reversed: "Требовательность, ревность, неуверенность",
          image: "/cards/queen_of_wands.webp"
        },
        {
          id: 35,
          name: "Король Жезлов",
          arcana: "Младший Аркан",
          upright: "Лидерство, видение, честь",
          reversed: "Импульсивность, высокомерие, нетерпение",
          image: "/cards/king_of_wands.webp"
        },
        {
          id: 36,
          name: "Туз Кубков",
          arcana: "Младший Аркан",
          upright: "Новые чувства, интуиция, эмоциональное начало",
          reversed: "Эмоциональная блокировка, застой чувств",
          image: "/cards/ace_of_cups.webp"
        },
        {
          id: 37,
          name: "Двойка Кубков",
          arcana: "Младший Аркан",
          upright: "Партнерство, притяжение, гармоничные отношения",
          reversed: "Разрыв связей, дисгармония, недопонимание",
          image: "/cards/two_of_cups.webp"
        },
        {
          id: 38,
          name: "Тройка Кубков",
          arcana: "Младший Аркан",
          upright: "Празднование, дружба, сообщество",
          reversed: "Чрезмерность, изоляция, разочарование в группе",
          image: "/cards/three_of_cups.webp"
        },
        {
          id: 39,
          name: "Четверка Кубков",
          arcana: "Младший Аркан",
          upright: "Созерцание, апатия, переоценка",
          reversed: "Новые возможности, пробуждение интереса",
          image: "/cards/four_of_cups.webp"
        },
        {
          id: 40,
          name: "Пятерка Кубков",
          arcana: "Младший Аркан",
          upright: "Потеря, сожаление, разочарование",
          reversed: "Исцеление, прощение, движение вперед",
          image: "/cards/five_of_cups.webp"
        },
        {
          id: 41,
          name: "Шестерка Кубков",
          arcana: "Младший Аркан",
          upright: "Ностальгия, воспоминания, комфорт",
          reversed: "Зацикленность на прошлом, неудовлетворенность",
          image: "/cards/six_of_cups.webp"
        },
        {
          id: 42,
          name: "Семерка Кубков",
          arcana: "Младший Аркан",
          upright: "Иллюзии, мечты, обман",
          reversed: "Разочарование, пробуждение, реализм",
          image: "/cards/seven_of_cups.webp"
        },
        {
          id: 43,
          name: "Восьмерка Кубков",
          arcana: "Младший Аркан",
          upright: "Отказ, уход, поиск нового",
          reversed: "Нерешительность, страх перемен",
          image: "/cards/eight_of_cups.webp"
        },
        {
          id: 44,
          name: "Девятка Кубков",
          arcana: "Младший Аркан",
          upright: "Удовлетворение, благополучие, успех",
          reversed: "Материальные проблемы, неудовлетворенность",
          image: "/cards/nine_of_cups.webp"
        },
        {
          id: 45,
          name: "Десятка Кубков",
          arcana: "Младший Аркан",
          upright: "Гармония, семейное счастье, эмоциональное удовлетворение",
          reversed: "Семейные конфликты, эмоциональная нестабильность",
          image: "/cards/ten_of_cups.webp"
        },
        {
          id: 46,
          name: "Паж Кубков",
          arcana: "Младший Аркан",
          upright: "Эмоциональное открытие, интуиция, новости",
          reversed: "Эмоциональная нестабильность, недопонимание",
          image: "/cards/page_of_cups.webp"
        },
        {
          id: 47,
          name: "Рыцарь Кубков",
          arcana: "Младший Аркан",
          upright: "Романтика, эмоциональные приключения, следование сердцу",
          reversed: "Эмоциональная нестабильность, манипуляция",
          image: "/cards/knight_of_cups.webp"
        },
        {
          id: 48,
          name: "Королева Кубков",
          arcana: "Младший Аркан",
          upright: "Эмоциональная мудрость, интуиция, забота",
          reversed: "Эмоциональная холодность, манипуляция",
          image: "/cards/queen_of_cups.webp"
        },
        {
          id: 49,
          name: "Король Кубков",
          arcana: "Младший Аркан",
          upright: "Эмоциональная стабильность, контроль, мудрость",
          reversed: "Эмоциональная отстраненность, манипуляция",
          image: "/cards/king_of_cups.webp"
        },
        {
          id: 50,
          name: "Туз Пентаклей",
          arcana: "Младший Аркан",
          upright: "Новые возможности, материальное начало, потенциал",
          reversed: "Финансовые трудности, блокировка возможностей",
          image: "/cards/ace_of_pentacles.webp"
        },
        {
          id: 51,
          name: "Двойка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Баланс, адаптация, жонглирование приоритетами",
          reversed: "Дисбаланс, чрезмерная нагрузка",
          image: "/cards/two_of_pentacles.webp"
        },
        {
          id: 52,
          name: "Тройка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Мастерство, сотрудничество, качество работы",
          reversed: "Посредственность, отсутствие командной работы",
          image: "/cards/three_of_pentacles.webp"
        },
        {
          id: 53,
          name: "Четверка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Безопасность, накопление, консерватизм",
          reversed: "Жадность, материальная одержимость",
          image: "/cards/four_of_pentacles.webp"
        },
        {
          id: 54,
          name: "Пятерка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Трудности, бедность, беспокойство о материальном",
          reversed: "Восстановление, духовное богатство",
          image: "/cards/five_of_pentacles.webp"
        },
        {
          id: 55,
          name: "Шестерка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Щедрость, помощь, материальный баланс",
          reversed: "Долги, жадность, неравенство",
          image: "/cards/six_of_pentacles.webp"
        },
        {
          id: 56,
          name: "Семерка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Терпение, вложения, оценка результатов",
          reversed: "Плохие инвестиции, нетерпеливость",
          image: "/cards/seven_of_pentacles.webp"
        },
        {
          id: 57,
          name: "Восьмерка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Усердие, навыки, совершенствование",
          reversed: "Перфекционизм, отсутствие прогресса",
          image: "/cards/eight_of_pentacles.webp"
        },
        {
          id: 58,
          name: "Девятка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Изобилие, роскошь, самодостаточность",
          reversed: "Материальная потеря, зависимость",
          image: "/cards/nine_of_pentacles.webp"
        },
        {
          id: 59,
          name: "Десятка Пентаклей",
          arcana: "Младший Аркан",
          upright: "Богатство, наследие, семейные ценности",
          reversed: "Финансовые проблемы, распад семьи",
          image: "/cards/ten_of_pentacles.webp"
        },
        {
          id: 60,
          name: "Паж Пентаклей",
          arcana: "Младший Аркан",
          upright: "Возможности, обучение, практичность",
          reversed: "Лень, незрелость в финансах",
          image: "/cards/page_of_pentacles.webp"
        },
        {
          id: 61,
          name: "Рыцарь Пентаклей",
          arcana: "Младший Аркан",
          upright: "Надёжность, трудолюбие, ответственность",
          reversed: "Скука, сопротивление изменениям",
          image: "/cards/knight_of_pentacles.webp"
        },
        {
          id: 62,
          name: "Королева Пентаклей",
          arcana: "Младший Аркан",
          upright: "Изобилие, безопасность, практичная мудрость",
          reversed: "Материализм, ненадёжность",
          image: "/cards/queen_of_pentacles.webp"
        },
        {
          id: 63,
          name: "Король Пентаклей",
          arcana: "Младший Аркан",
          upright: "Богатство, бизнес, практичное лидерство",
          reversed: "Коррупция, жадность, материальные потери",
          image: "/cards/king_of_pentacles.webp"
        },
        {
          id: 64,
          name: "Туз Мечей",
          arcana: "Младший Аркан",
          upright: "Новые идеи, ясность, правда",
          reversed: "Путаница, неясность, ложь",
          image: "/cards/ace_of_swords.webp"
        },
        {
          id: 65,
          name: "Двойка Мечей",
          arcana: "Младший Аркан",
          upright: "Нерешительность, выбор, баланс",
          reversed: "Избегание решений, неуверенность",
          image: "/cards/two_of_swords.webp"
        },
        {
          id: 66,
          name: "Тройка Мечей",
          arcana: "Младший Аркан",
          upright: "Боль, разочарование, отказ",
          reversed: "Принятие, исцеление, движение вперед",
          image: "/cards/three_of_swords.webp"
        },
        {
          id: 67,
          name: "Четверка Мечей",
          arcana: "Младший Аркан",
          upright: "Отдых, восстановление, медитация",
          reversed: "Беспокойство, неудовлетворенность",
          image: "/cards/four_of_swords.webp"
        },
        {
          id: 68,
          name: "Пятерка Мечей",
          arcana: "Младший Аркан",
          upright: "Конфликт, победа, соперничество",
          reversed: "Поражение, избегание конфликта",
          image: "/cards/five_of_swords.webp"
        },
        {
          id: 69,
          name: "Шестерка Мечей",
          arcana: "Младший Аркан",
          upright: "Переход, движение, избегание конфликта",
          reversed: "Задержки, неуверенность",
          image: "/cards/six_of_swords.webp"
        },
        {
          id: 70,
          name: "Семерка Мечей",
          arcana: "Младший Аркан",
          upright: "Хитрость, стратегия, действие",
          reversed: "Нерешительность, страх",
          image: "/cards/seven_of_swords.webp"
        },
        {
          id: 71,
          name: "Восьмерка Мечей",
          arcana: "Младший Аркан",
          upright: "Ограничение, беспомощность, заточение",
          reversed: "Освобождение, самостоятельность",
          image: "/cards/eight_of_swords.webp"
        },
        {
          id: 72,
          name: "Девятка Мечей",
          arcana: "Младший Аркан",
          upright: "Тревога, страх, бессонница",
          reversed: "Принятие, исцеление, спокойствие",
          image: "/cards/nine_of_swords.webp"
        },
        {
          id: 73,
          name: "Десятка Мечей",
          arcana: "Младший Аркан",
          upright: "Поражение, крах, конец",
          reversed: "Освобождение, новые начинания",
          image: "/cards/ten_of_swords.webp"
        },
        {
          id: 74,
          name: "Паж Мечей",
          arcana: "Младший Аркан",
          upright: "Любопытство, исследование, новости",
          reversed: "Недопонимание, неуверенность",
          image: "/cards/page_of_swords.webp"
        },
        {
          id: 75,
          name: "Рыцарь Мечей",
          arcana: "Младший Аркан",
          upright: "Действие, решительность, прямота",
          reversed: "Агрессия, импульсивность",
          image: "/cards/knight_of_swords.webp"
        },
        {
          id: 76,
          name: "Королева Мечей",
          arcana: "Младший Аркан",
          upright: "Интеллект, независимость, честность",
          reversed: "Холодность, манипуляция",
          image: "/cards/queen_of_swords.webp"
        },
        {
          id: 77,
          name: "Король Мечей",
          arcana: "Младший Аркан",
          upright: "Авторитет, логика, справедливость",
          reversed: "Жестокость, манипуляция",
          image: "/cards/king_of_swords.webp"
        }
      ])

    // Перемешанная колода для отображения (computed для автоматического перемешивания)
    const shuffledDeck = ref([]);

    /**
     * Перемешивает колоду и выбирает 20 случайных карт
     */
    const shuffleDeck = () => {
        const array = [...deck.value];
        // Перемешиваем всю колоду
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        // Выбираем только первые 20 карт из перемешанной колоды
        shuffledDeck.value = array.slice(0, 20);
    }

    // Доступные карты (исключая выбранные)
    const availableCards = computed(() => {
        // Импортируем modalStore для доступа к выбранным картам
        const modalStore = useModalStore();
        const selectedCardIds = modalStore.selectedCards.map(card => card.id);
        return shuffledDeck.value.filter(card => !selectedCardIds.includes(card.id));
    })

    /**
     * Создаёт карту с случайным положением (прямое/перевёрнутое)
     * @param {Object} card - Исходная карта
     * @returns {Object} - Карта с добавленным полем isReversed
     */
    const createCardWithPosition = (card) => {
        const isReversed = Math.random() < 0.5; // 50% шанс переворота
        return {
            ...card,
            isReversed,
            position: isReversed ? 'reversed' : 'upright',
            meaning: isReversed ? card.reversed : card.upright
        };
    }

    return { deck, shuffledDeck, availableCards, shuffleDeck, createCardWithPosition }
})
