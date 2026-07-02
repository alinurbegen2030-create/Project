import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';

type SupportedUiLanguage = 'ru' | 'kk' | 'en';
type DesignTheme = 'neon' | 'arena' | 'pixel';
type AppPage = 'home' | 'matches' | 'profile' | 'chats' | 'reviews';

type UserVisualProfile = {
  displayName: string;
  icon: string;
};

type Player = {
  id: string;
  ownerId?: string | null;
  name: string;
  anonymous: boolean;
  age: number;
  gender: string;
  game: string;
  platform: string;
  style: string;
  language: string;
  time: string;
  mic: boolean;
  region: string;
  goal: string;
  mode: string;
  rank: string;
  experience: string;
  contact: string;
  about: string;
  tags: string[];
  color: string;
};

type Profile = {
  name: string;
  anonymous: boolean;
  age: string;
  gender: string;
  game: string;
  platform: string;
  style: string;
  language: string;
  time: string;
  mic: string;
  region: string;
  goal: string;
  mode: string;
  rank: string;
  contact: string;
  experience: string;
  about: string;
};

type TeamupProfileRow = {
  id: string;
  owner_id?: string | null;
  name: string;
  anonymous?: boolean;
  age: number;
  gender: string;
  game: string;
  platform: string;
  style: string;
  language: string;
  play_time: string;
  mic: boolean;
  region: string;
  goal: string;
  mode: string;
  rank: string;
  experience: string;
  contact: string;
  about: string;
  tags: string[];
  color: string;
};

type ChatMessage = {
  id: string;
  profileId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

type ReplyTarget = Pick<ChatMessage, 'authorEmail' | 'body'>;

type TeamEvent = {
  id: string;
  title: string;
  type: string;
  game: string;
  time: string;
  language: string;
  slots: number;
  description: string;
  author: string;
  createdAt: string;
};

type TeamupMessageRow = {
  id: string;
  profile_id: string;
  author_email: string;
  body: string;
  created_at: string;
};

type SiteReview = {
  id: string;
  authorId?: string | null;
  authorName: string;
  authorIcon?: string;
  rating: number;
  body: string;
  createdAt: string;
};

type TeamupReviewRow = {
  id: string;
  author_id?: string | null;
  author_name: string;
  author_icon?: string | null;
  rating: number;
  body: string;
  created_at: string;
};

const appPages: AppPage[] = ['home', 'matches', 'profile', 'chats', 'reviews'];

function getPageFromHash(): AppPage {
  const hashPage = window.location.hash.replace('#', '') as AppPage;
  return appPages.includes(hashPage) ? hashPage : 'home';
}

type TeamupUserSettingsRow = {
  user_id: string;
  display_name: string;
  icon: string;
};

const text: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    heroTitle: 'Найди напарника для игры',
    heroText:
      'Заполни подробную анкету, а TeamUp покажет игроков, которые подходят по игре, возрасту, стилю, региону, режиму и времени онлайна.',
    formLanguage: 'Язык',
    profileTitle: 'Твоя анкета',
    matchesTitle: 'Подходящие игроки',
    searchProfile: 'Найти анкету',
    searchProfilePlaceholder: 'Игра, язык, регион, ранг, Discord или Telegram',
    noSearchResults: 'Анкета не найдена. Попробуй другую игру, язык, Discord или Telegram.',
    favoritesOnly: 'Только контакты',
    addFavorite: 'Добавить в контакты',
    removeFavorite: 'Убрать из контактов',
    openChat: 'Открыть чат',
    closeChat: 'Закрыть чат',
    chatPlaceholder: 'Напиши сообщение...',
    sendMessage: 'Отправить',
    chatLoginRequired: 'Войди в аккаунт, чтобы писать в чат.',
    emptyChat: 'Пока сообщений нет. Начни диалог первым.',
    ownProfile: 'Это твоя анкета',
    name: 'Имя или ник',
    namePlaceholder: 'Например: Alinur',
    anonymous: 'Анонимно',
    anonymousPlayer: 'Анонимный игрок',
    age: 'Возраст',
    gender: 'Пол',
    any: 'Не важно',
    boy: 'Мужской',
    girl: 'Женский',
    game: 'Игра',
    gamePlaceholder: 'Например: Roblox, GTA V, Brawl Stars',
    platform: 'Платформа',
    style: 'Стиль игры',
    communicationLanguage: 'Подходящий язык общения',
    languagePlaceholder: 'Выбери или напиши любой язык',
    region: 'Регион',
    regionPlaceholder: 'Например: Kazakhstan',
    time: 'Когда играешь',
    mic: 'Микрофон',
    yes: 'Есть',
    no: 'Нету',
    goal: 'Кого ищешь',
    mode: 'Режим',
    modePlaceholder: 'Например: Competitive',
    rank: 'Твой ранг или уровень',
    rankPlaceholder: 'Например: Gold, 11k, новичок',
    experienceInput: 'Опыт',
    experiencePlaceholder: 'Например: 2 года, новичок, 6 месяцев',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram или Discord username',
    about: 'О себе',
    aboutPlaceholder: 'Напиши пару слов: как играешь, кого ищешь, что важно',
    detailsPlatform: 'Платформа',
    detailsStyle: 'Стиль',
    detailsLanguage: 'Язык',
    detailsRegion: 'Регион',
    detailsOnline: 'Онлайн',
    detailsMic: 'Микрофон',
    detailsGoal: 'Ищет',
    detailsMode: 'Режим',
    detailsExperience: 'Опыт',
    years: 'лет',
    copyContact: 'Скопировать контакт',
    publish: 'Опубликовать анкету',
    emptyPeople: 'Пока нет реальных анкет. Заполни форму и опубликуй первую.',
    saved: 'Анкета опубликована. Теперь она показывается в списке игроков.',
    loginRequired: 'Сначала войди в аккаунт, потом можно опубликовать анкету.',
    publishLocked: 'Войдите, чтобы опубликовать анкету',
    deleteCard: 'Удалить анкету',
    typoPick: 'Похоже на опечатку. Выбери вариант из подсказок.',
    typoGame: 'Похоже на опечатку. Проверь название или выбери подсказку.',
    typoLanguage: 'Похоже на опечатку. Проверь язык или выбери подсказку.',
    typoRegion: 'Похоже на опечатку. Проверь регион или выбери подсказку.',
    typoMode: 'Похоже на опечатку. Проверь режим или выбери подсказку.',
  },
  kk: {
    heroTitle: 'Ойынға серіктес тап',
    heroText:
      'Толық сауалнаманы толтыр, ал TeamUp ойын, жас, стиль, аймақ, режим және онлайн уақыт бойынша сәйкес ойыншыларды көрсетеді.',
    formLanguage: 'Тіл',
    profileTitle: 'Сенің сауалнамаң',
    matchesTitle: 'Сәйкес ойыншылар',
    searchProfile: 'Сауалнама табу',
    searchProfilePlaceholder: 'Ойын, тіл, аймақ, ранг, Discord немесе Telegram',
    noSearchResults: 'Сауалнама табылмады. Басқа ойын, тіл, Discord немесе Telegram жазып көр.',
    favoritesOnly: 'Тек контактілер',
    addFavorite: 'Контактіге қосу',
    removeFavorite: 'Контактіден алып тастау',
    openChat: 'Чатты ашу',
    closeChat: 'Чатты жабу',
    chatPlaceholder: 'Хабарлама жаз...',
    sendMessage: 'Жіберу',
    chatLoginRequired: 'Чатқа жазу үшін аккаунтқа кір.',
    emptyChat: 'Әзірге хабарламалар жоқ. Диалогты бірінші болып баста.',
    ownProfile: 'Бұл сенің сауалнамаң',
    name: 'Атың немесе ник',
    namePlaceholder: 'Мысалы: Alinur',
    anonymous: 'Анонимді',
    anonymousPlayer: 'Аноним ойыншы',
    age: 'Жас',
    gender: 'Жыныс',
    any: 'Маңызды емес',
    boy: 'Ер',
    girl: 'Әйел',
    game: 'Ойын',
    gamePlaceholder: 'Мысалы: Roblox, GTA V, Brawl Stars',
    platform: 'Платформа',
    style: 'Ойын стилі',
    communicationLanguage: 'Сөйлесуге ыңғайлы тіл',
    languagePlaceholder: 'Тілді таңда немесе өзің жаз',
    region: 'Аймақ',
    regionPlaceholder: 'Мысалы: Kazakhstan',
    time: 'Қашан ойнайсың',
    mic: 'Микрофон',
    yes: 'Бар',
    no: 'Жоқ',
    goal: 'Кімді іздейсің',
    mode: 'Режим',
    modePlaceholder: 'Мысалы: Competitive',
    rank: 'Ранг немесе деңгей',
    rankPlaceholder: 'Мысалы: Gold, 11k, жаңадан бастаушы',
    experienceInput: 'Тәжірибе',
    experiencePlaceholder: 'Мысалы: 2 жыл, жаңадан бастаушы, 6 ай',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram немесе Discord username',
    about: 'Өзің туралы',
    aboutPlaceholder: 'Қалай ойнайсың, кімді іздейсің, не маңызды',
    detailsPlatform: 'Платформа',
    detailsStyle: 'Стиль',
    detailsLanguage: 'Тіл',
    detailsRegion: 'Аймақ',
    detailsOnline: 'Онлайн',
    detailsMic: 'Микрофон',
    detailsGoal: 'Іздейді',
    detailsMode: 'Режим',
    detailsExperience: 'Тәжірибе',
    years: 'жас',
    copyContact: 'Контактты көшіру',
    publish: 'Сауалнаманы жариялау',
    emptyPeople: 'Әзірге нақты сауалнамалар жоқ. Форманы толтырып, біріншісін жарияла.',
    saved: 'Сауалнама жарияланды. Енді ол ойыншылар тізімінде көрінеді.',
    loginRequired: 'Алдымен аккаунтқа кір, содан кейін сауалнаманы жариялай аласың.',
    publishLocked: 'Жариялау үшін кіріңіз',
    deleteCard: 'Сауалнаманы өшіру',
    typoPick: 'Қате жазылған сияқты. Ұсыныстан таңда.',
    typoGame: 'Қате жазылған сияқты. Атауын тексер немесе ұсынысты таңда.',
    typoLanguage: 'Қате жазылған сияқты. Тілді тексер немесе ұсынысты таңда.',
    typoRegion: 'Қате жазылған сияқты. Аймақты тексер немесе ұсынысты таңда.',
    typoMode: 'Қате жазылған сияқты. Режимді тексер немесе ұсынысты таңда.',
  },
  en: {
    heroTitle: 'Find a teammate for your game',
    heroText:
      'Fill out a detailed profile and TeamUp will show players who match your game, age, style, region, mode, and online time.',
    formLanguage: 'Language',
    profileTitle: 'Your profile',
    matchesTitle: 'Matching players',
    searchProfile: 'Find a profile',
    searchProfilePlaceholder: 'Game, language, region, rank, Discord, or Telegram',
    noSearchResults: 'No profile found. Try another game, language, Discord, or Telegram.',
    favoritesOnly: 'Contacts only',
    addFavorite: 'Add to contacts',
    removeFavorite: 'Remove from contacts',
    openChat: 'Open chat',
    closeChat: 'Close chat',
    chatPlaceholder: 'Write a message...',
    sendMessage: 'Send',
    chatLoginRequired: 'Sign in to write in chat.',
    emptyChat: 'No messages yet. Start the conversation.',
    ownProfile: 'This is your profile',
    name: 'Name or nickname',
    namePlaceholder: 'For example: Alinur',
    anonymous: 'Anonymous',
    anonymousPlayer: 'Anonymous player',
    age: 'Age',
    gender: 'Gender',
    any: 'Any',
    boy: 'Male',
    girl: 'Female',
    game: 'Game',
    gamePlaceholder: 'For example: Roblox, GTA V, Brawl Stars',
    platform: 'Platform',
    style: 'Play style',
    communicationLanguage: 'Preferred chat language',
    languagePlaceholder: 'Choose or type any language',
    region: 'Region',
    regionPlaceholder: 'For example: Kazakhstan',
    time: 'When you play',
    mic: 'Microphone',
    yes: 'Yes',
    no: 'No',
    goal: 'Looking for',
    mode: 'Mode',
    modePlaceholder: 'For example: Competitive',
    rank: 'Your rank or level',
    rankPlaceholder: 'For example: Gold, 11k, beginner',
    experienceInput: 'Experience',
    experiencePlaceholder: 'For example: 2 years, beginner, 6 months',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram or Discord username',
    about: 'About you',
    aboutPlaceholder: 'Say how you play, who you need, what matters',
    detailsPlatform: 'Platform',
    detailsStyle: 'Style',
    detailsLanguage: 'Language',
    detailsRegion: 'Region',
    detailsOnline: 'Online',
    detailsMic: 'Microphone',
    detailsGoal: 'Looking for',
    detailsMode: 'Mode',
    detailsExperience: 'Experience',
    years: 'years old',
    copyContact: 'Copy contact',
    publish: 'Publish profile',
    emptyPeople: 'There are no real profiles yet. Fill out the form and publish the first one.',
    saved: 'Profile published. It now appears in the player list.',
    loginRequired: 'Sign in first, then you can publish your profile.',
    publishLocked: 'Sign in to publish profile',
    deleteCard: 'Delete profile',
    typoPick: 'Looks like a typo. Pick one of the suggestions.',
    typoGame: 'Looks like a typo. Check the name or pick a suggestion.',
    typoLanguage: 'Looks like a typo. Check the language or pick a suggestion.',
    typoRegion: 'Looks like a typo. Check the region or pick a suggestion.',
    typoMode: 'Looks like a typo. Check the mode or pick a suggestion.',
  },
};

const contactText: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    searchProfilePlaceholder: 'Игра, язык, регион, ранг, Discord или Telegram',
    noSearchResults: 'Анкета не найдена. Попробуй другую игру, язык, Discord или Telegram.',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram или Discord username',
    copyContact: 'Скопировать контакт',
  },
  kk: {
    searchProfilePlaceholder: 'Ойын, тіл, аймақ, ранг, Discord немесе Telegram',
    noSearchResults: 'Сауалнама табылмады. Басқа ойын, тіл, Discord немесе Telegram жазып көр.',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram немесе Discord username',
    copyContact: 'Контактты көшіру',
  },
  en: {
    searchProfilePlaceholder: 'Game, language, region, rank, Discord, or Telegram',
    noSearchResults: 'No profile found. Try another game, language, Discord, or Telegram.',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram or Discord username',
    copyContact: 'Copy contact',
  },
};

const chatText: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    replyMessage: 'Ответить',
    replyingTo: 'Ответ на',
    cancelReply: 'Отмена',
  },
  kk: {
    replyMessage: 'Жауап беру',
    replyingTo: 'Жауап',
    cancelReply: 'Болдырмау',
  },
  en: {
    replyMessage: 'Reply',
    replyingTo: 'Replying to',
    cancelReply: 'Cancel',
  },
};

const eventText: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    eventsTitle: 'Игровые евенты',
    eventsCreateTitle: 'Создать евент',
    eventTitle: 'Название',
    eventTitlePlaceholder: 'Например: Вечерний турнир',
    eventType: 'Тип евента',
    eventGame: 'Игра',
    eventTime: 'Время',
    eventLanguage: 'Язык',
    eventSlots: 'Мест',
    eventDescription: 'Описание',
    eventDescriptionPlaceholder: 'Что будет, кого ищешь, какие правила',
    createEvent: 'Добавить евент',
    emptyEvents: 'Пока нет евентов. Создай первый.',
    eventBy: 'Создал',
    joinEvent: 'Написать в чат',
    eventSaved: 'Евент добавлен.',
  },
  kk: {
    eventsTitle: 'Ойын евенттері',
    eventsCreateTitle: 'Евент жасау',
    eventTitle: 'Атауы',
    eventTitlePlaceholder: 'Мысалы: Кешкі турнир',
    eventType: 'Евент түрі',
    eventGame: 'Ойын',
    eventTime: 'Уақыты',
    eventLanguage: 'Тіл',
    eventSlots: 'Орын',
    eventDescription: 'Сипаттама',
    eventDescriptionPlaceholder: 'Не болады, кімді іздейсің, қандай ереже',
    createEvent: 'Евент қосу',
    emptyEvents: 'Әзірге евент жоқ. Біріншісін жаса.',
    eventBy: 'Жасады',
    joinEvent: 'Чатқа жазу',
    eventSaved: 'Евент қосылды.',
  },
  en: {
    eventsTitle: 'Game events',
    eventsCreateTitle: 'Create event',
    eventTitle: 'Title',
    eventTitlePlaceholder: 'For example: Evening tournament',
    eventType: 'Event type',
    eventGame: 'Game',
    eventTime: 'Time',
    eventLanguage: 'Language',
    eventSlots: 'Slots',
    eventDescription: 'Description',
    eventDescriptionPlaceholder: 'What is happening, who you need, rules',
    createEvent: 'Add event',
    emptyEvents: 'No events yet. Create the first one.',
    eventBy: 'Created by',
    joinEvent: 'Write in chat',
    eventSaved: 'Event added.',
  },
};

const uiCopy: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    navHome: 'Начальная',
    navMatches: 'Найти напарников',
    navProfile: 'Анкета',
    navChats: 'Чаты',
    navReviews: 'Отзывы',
    languageInputPlaceholder: 'Русский, Қазақша, English...',
    statGames: '200+ игр',
    statProfiles: 'Живые анкеты',
    statChat: 'Чат внутри сайта',
    guideTitle: 'Как пользоваться TeamUp',
    guideStep1: 'Войди или зарегистрируйся по имени.',
    guideStep2: 'Заполни анкету: игра, возраст, язык, микрофон и контакты.',
    guideStep3: 'Открой поиск и найди подходящего напарника.',
    guideStep4: 'Добавь игрока в контакты или напиши ему в чат.',
    chatsTitle: 'Чаты',
    emptyChats: 'Пока нет чатов. Открой анкету игрока и напиши первое сообщение.',
    profileDeleted: 'Анкета удалена.',
    saveProfileChanges: 'Сохранить изменения',
    profileUpdated: 'Анкета обновлена.',
    reviewsTitle: 'Отзывы сайта',
    reviewRating: 'Оценка',
    reviewText: 'Отзыв',
    reviewPlaceholder: 'Напиши, что понравилось или что надо улучшить',
    publishReview: 'Оставить отзыв',
    emptyReviews: 'Пока нет отзывов. Будь первым.',
    reviewSaved: 'Отзыв опубликован.',
    deleteReview: 'Удалить отзыв',
    reviewDeleted: 'Отзыв удалён.',
    you: 'Ты',
  },
  kk: {
    navHome: 'Басты бет',
    navMatches: 'Серіктес табу',
    navProfile: 'Сауалнама',
    navChats: 'Чаттар',
    navReviews: 'Пікірлер',
    languageInputPlaceholder: 'Русский, Қазақша, English...',
    statGames: '200+ ойын',
    statProfiles: 'Нақты сауалнамалар',
    statChat: 'Сайт ішіндегі чат',
    guideTitle: 'TeamUp қалай қолданылады',
    guideStep1: 'Атыңмен кір немесе тіркел.',
    guideStep2: 'Сауалнаманы толтыр: ойын, жас, тіл, микрофон және контакт.',
    guideStep3: 'Іздеуді ашып, лайық серіктес тап.',
    guideStep4: 'Ойыншыны контактіге қос немесе чатқа жаз.',
    chatsTitle: 'Чаттар',
    emptyChats: 'Әзірге чат жоқ. Ойыншы сауалнамасын ашып, бірінші хабарлама жаз.',
    profileDeleted: 'Сауалнама өшірілді.',
    saveProfileChanges: 'Өзгерістерді сақтау',
    profileUpdated: 'Сауалнама жаңартылды.',
    reviewsTitle: 'Сайт пікірлері',
    reviewRating: 'Баға',
    reviewText: 'Пікір',
    reviewPlaceholder: 'Не ұнады немесе нені жақсарту керек екенін жаз',
    publishReview: 'Пікір қалдыру',
    emptyReviews: 'Әзірге пікір жоқ. Бірінші бол.',
    reviewSaved: 'Пікір жарияланды.',
    deleteReview: 'Пікірді өшіру',
    reviewDeleted: 'Пікір өшірілді.',
    you: 'Сен',
  },
  en: {
    navHome: 'Home',
    navMatches: 'Find teammates',
    navProfile: 'Profile',
    navChats: 'Chats',
    navReviews: 'Reviews',
    languageInputPlaceholder: 'Russian, Kazakh, English...',
    statGames: '200+ games',
    statProfiles: 'Real profiles',
    statChat: 'Built-in chat',
    guideTitle: 'How to use TeamUp',
    guideStep1: 'Sign in or create an account with a name.',
    guideStep2: 'Fill out your profile: game, age, language, mic, and contacts.',
    guideStep3: 'Open search and find a teammate who fits.',
    guideStep4: 'Add the player to contacts or message them in chat.',
    chatsTitle: 'Chats',
    emptyChats: 'No chats yet. Open a player profile and write the first message.',
    profileDeleted: 'Profile deleted.',
    saveProfileChanges: 'Save changes',
    profileUpdated: 'Profile updated.',
    reviewsTitle: 'Site reviews',
    reviewRating: 'Rating',
    reviewText: 'Review',
    reviewPlaceholder: 'Write what you liked or what should be improved',
    publishReview: 'Post review',
    emptyReviews: 'No reviews yet. Be the first one.',
    reviewSaved: 'Review posted.',
    deleteReview: 'Delete review',
    reviewDeleted: 'Review deleted.',
    you: 'You',
  },
};

const labels: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    Ranked: 'Рейтинг',
    Casual: 'Обычная игра',
    Tryhard: 'На победу',
    Chill: 'Спокойно',
    Morning: 'Утром',
    Day: 'Днем',
    Evening: 'Вечером',
    Night: 'Ночью',
    Weekend: 'На выходных',
    Duo: 'Дуо',
    Squad: 'Сквад',
    Team: 'Команда',
    Party: 'Пати',
    Coach: 'Тренер',
    Competitive: 'Соревновательный',
    Premier: 'Премьер',
    Survival: 'Выживание',
    'Zero Build': 'Без строительства',
    'All Pick': 'All Pick',
    Creative: 'Творческий',
    Development: 'Разработка',
    Kazakhstan: 'Казахстан',
    Europe: 'Европа',
    Asia: 'Азия',
    'North America': 'Северная Америка',
    'South America': 'Южная Америка',
    Kazakh: 'Казахский',
    Russian: 'Русский',
    English: 'Английский',
    Turkish: 'Турецкий',
    Spanish: 'Испанский',
    German: 'Немецкий',
    French: 'Французский',
    Japanese: 'Японский',
    Korean: 'Корейский',
    Chinese: 'Китайский',
  },
  kk: {
    Ranked: 'Рейтинг',
    Casual: 'Қарапайым ойын',
    Tryhard: 'Жеңіске ойнау',
    Chill: 'Тыныш ойын',
    Morning: 'Таңертең',
    Day: 'Күндіз',
    Evening: 'Кешке',
    Night: 'Түнде',
    Weekend: 'Демалыста',
    Duo: 'Дуо',
    Squad: 'Сквад',
    Team: 'Команда',
    Party: 'Пати',
    Coach: 'Жаттықтырушы',
    Competitive: 'Жарыстық',
    Premier: 'Премьер',
    Survival: 'Аман қалу',
    'Zero Build': 'Құрылыссыз',
    'All Pick': 'All Pick',
    Creative: 'Шығармашылық',
    Development: 'Әзірлеу',
    Kazakhstan: 'Қазақстан',
    Europe: 'Еуропа',
    Asia: 'Азия',
    'North America': 'Солтүстік Америка',
    'South America': 'Оңтүстік Америка',
    Kazakh: 'Қазақша',
    Russian: 'Орысша',
    English: 'Ағылшынша',
    Turkish: 'Түрікше',
    Spanish: 'Испанша',
    German: 'Немісше',
    French: 'Французша',
    Japanese: 'Жапонша',
    Korean: 'Корейше',
    Chinese: 'Қытайша',
  },
  en: {},
};

const formLanguageOptions = [
  'Русский',
  'Қазақша',
  'English',
  'Spanish',
  'French',
  'German',
  'Turkish',
  'Arabic',
  'Chinese',
  'Japanese',
  'Korean',
  'Portuguese',
  'Italian',
  'Hindi',
  'Uzbek',
];

const gameOptions = [
  'Roblox',
  'Minecraft',
  'Brawl Stars',
  'Clash Royale',
  'Clash of Clans',
  'Hay Day',
  'Boom Beach',
  'Squad Busters',
  'Free Fire',
  'Free Fire MAX',
  'PUBG MOBILE',
  'Call of Duty: Mobile',
  'Standoff 2',
  'Critical Ops',
  'Modern Strike Online',
  'Modern Combat 5',
  'Blood Strike',
  'Arena Breakout',
  'Delta Force',
  'Warface GO',
  'Mobile Legends: Bang Bang',
  'League of Legends: Wild Rift',
  'Honor of Kings',
  'Pokémon Unite',
  'Vainglory',
  'Arena of Valor',
  'Marvel Super War',
  'Genshin Impact',
  'Honkai: Star Rail',
  'Zenless Zone Zero',
  'Wuthering Waves',
  'Tower of Fantasy',
  'AFK Journey',
  'AFK Arena',
  'RAID: Shadow Legends',
  'Diablo Immortal',
  'Torchlight: Infinite',
  'Undawn',
  'LifeAfter',
  'Black Desert Mobile',
  'Lineage 2M',
  'Lineage W',
  'Albion Online',
  'RuneScape',
  'Old School RuneScape',
  'Dragon Raja',
  'Sky: Children of the Light',
  'Pokémon GO',
  'Monster Hunter Now',
  'Pikmin Bloom',
  'Ingress Prime',
  'Among Us',
  'Goose Goose Duck',
  'Fall Guys',
  'Stumble Guys',
  'Eggy Party',
  'Party Animals',
  'Minecraft Earth',
  'Terraria',
  'Stardew Valley',
  "Don't Starve: Pocket Edition",
  "Don't Starve: Shipwrecked",
  'Survivalcraft',
  'Last Day on Earth',
  'Frostborn',
  'Grim Soul',
  'Westland Survival',
  'Jurassic Survival',
  'Ocean Is Home',
  'Mini DAYZ',
  'Day R Survival',
  'Whiteout Survival',
  'State of Survival',
  'Dawn of Zombies',
  'The Walking Dead: Survivors',
  'Plants vs. Zombies',
  'Plants vs. Zombies 2',
  'Plants vs. Zombies Heroes',
  'Candy Crush Saga',
  'Candy Crush Soda Saga',
  'Candy Crush Jelly Saga',
  'Royal Match',
  'Royal Kingdom',
  'Homescapes',
  'Gardenscapes',
  'Fishdom',
  'Township',
  'FarmVille 2',
  'SimCity BuildIt',
  'Megapolis',
  'Idle Miner Tycoon',
  'Idle Office Tycoon',
  'Egg, Inc.',
  'Adventure Capitalist',
  'Adventure Communist',
  'Tap Titans 2',
  'Cookie Clicker',
  'My Talking Tom',
  'My Talking Tom 2',
  'My Talking Angela',
  'My Talking Angela 2',
  'Talking Ben',
  'Pou',
  'Moy 7',
  'My Boo',
  'Toca Life World',
  'Avatar World',
  'Miga Town',
  'Dr. Driving',
  'Dr. Parking 4',
  'Car Parking Multiplayer',
  'Car Parking Multiplayer 2',
  'CarX Drift Racing 2',
  'CarX Street',
  'CarX Highway Racing',
  'Asphalt 8',
  'Asphalt 9',
  'Asphalt Legends Unite',
  'Real Racing 3',
  'Need for Speed: No Limits',
  'CSR Racing 2',
  'Rebel Racing',
  'Rush Rally 3',
  'Traffic Rider',
  'Traffic Racer',
  'Extreme Car Driving Simulator',
  'Driving School Sim',
  'Bus Simulator Indonesia',
  'Truck Simulator Ultimate',
  'Euro Truck Driver',
  'Ultimate Motorcycle Simulator',
  'Moto Rider GO',
  'Hill Climb Racing',
  'Hill Climb Racing 2',
  'Beach Buggy Racing',
  'Beach Buggy Racing 2',
  'Mario Kart Tour',
  'FR Legends',
  'Static Shift Racing',
  'Rocket League Sideswipe',
  'EA SPORTS FC Mobile',
  'eFootball',
  'Dream League Soccer',
  'Score! Hero',
  'Soccer Super Star',
  'Top Eleven',
  'NBA Infinite',
  'NBA Live Mobile',
  'Tennis Clash',
  'Golf Clash',
  '8 Ball Pool',
  'Bowling Crew',
  'Archero',
  'Survivor.io',
  'Soul Knight',
  'Otherworld Legends',
  'Shadow Fight 2',
  'Shadow Fight 3',
  'Shadow Fight 4: Arena',
  'Ninja Arashi',
  'Ninja Arashi 2',
  'Dan the Man',
  'Swordigo',
  'Magic Rampage',
  'Dead Cells',
  'Grimvalor',
  'Huntdown',
  'Geometry Dash',
  'Geometry Dash Lite',
  'Geometry Dash World',
  'Geometry Dash Meltdown',
  'Geometry Dash SubZero',
  'Subway Surfers',
  'Temple Run',
  'Temple Run 2',
  'Vector',
  'Vector 2',
  'Jetpack Joyride',
  'Jetpack Joyride 2',
  "Alto's Adventure",
  "Alto's Odyssey",
  'Crossy Road',
  'Smash Hit',
  'Stack',
  'Helix Jump',
  'Color Switch',
  'Stack Ball',
  'Paper.io 2',
  'Hole.io',
  'Aquapark.io',
  'Worms Zone.io',
  'Slither.io',
  'Agar.io',
  'Diep.io',
  'Snake.io',
  'Kick the Buddy',
  'BitLife',
  'The Battle Cats',
  'Marvel Contest of Champions',
  'Mortal Kombat Mobile',
  'Roblox Studio',
  'Valorant',
  'CS2',
  'Dota 2',
  'Fortnite',
  'GTA V',
  'League of Legends',
  'Apex Legends',
];

const chatLanguageOptions = [
  'Kazakh',
  'Russian',
  'English',
  'Turkish',
  'Spanish',
  'German',
  'French',
  'Japanese',
  'Korean',
  'Chinese',
];

const regionOptions = ['Kazakhstan', 'Europe', 'Asia', 'North America', 'South America'];
const styleOptions = ['Ranked', 'Casual', 'Tryhard', 'Chill'];
const timeOptions = ['Morning', 'Day', 'Evening', 'Night', 'Weekend'];
const goalOptions = ['Duo', 'Squad', 'Team', 'Party', 'Coach'];
const modeOptions = ['Competitive', 'Premier', 'Survival', 'Zero Build', 'All Pick', 'Creative', 'Development'];
const STORAGE_KEY = 'teamup-real-player-profiles';
const CONTACTS_KEY = 'teamup-contact-profile-ids';
const MESSAGES_KEY = 'teamup-chat-messages';
const REVIEWS_KEY = 'teamup-site-reviews';
const USER_SETTINGS_KEY = 'teamup-user-visual-settings';
const REPORTS_KEY = 'teamup-reported-profile-ids';
const BLOCKED_KEY = 'teamup-blocked-profile-ids';
const CHAT_READS_KEY = 'teamup-chat-read-times';
const CHAT_CLEARS_KEY = 'teamup-chat-clear-times';
const userIconOptions = ['TU', 'GG', 'XP', 'LV', 'HP', 'VR'];
const profileColors = ['#e25555', '#2f9d68', '#e6a13d', '#6c63d9', '#3c7dd9', '#111827'];
const designThemes: Array<{ id: DesignTheme; label: string }> = [
  { id: 'neon', label: 'Neon' },
  { id: 'arena', label: 'Arena' },
  { id: 'pixel', label: 'Pixel' },
];

const initialProfile: Profile = {
  name: '',
  anonymous: false,
  age: '16',
  gender: 'any',
  game: 'Valorant',
  platform: 'PC',
  style: 'Ranked',
  language: 'Russian',
  time: 'Evening',
  mic: 'yes',
  region: 'Kazakhstan',
  goal: 'Duo',
  mode: 'Competitive',
  rank: 'Gold',
  contact: '',
  experience: '',
  about: '',
};

const demoPlayers: Player[] = [];

function sameText(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function label(value: string, lang: SupportedUiLanguage) {
  return labels[lang][value] ?? value;
}

function editDistance(left: string, right: string) {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[a.length][b.length];
}

function looksLikeTypo(value: string, options: string[]) {
  const cleanValue = value.trim();
  if (cleanValue.length < 4 || options.some((option) => sameText(option, cleanValue))) return false;

  return options.some((option) => {
    const cleanOption = option.toLowerCase();
    const cleanInput = cleanValue.toLowerCase();
    return cleanOption.startsWith(cleanInput.slice(0, 3)) && editDistance(cleanInput, cleanOption) <= 2;
  });
}

function scorePlayer(player: Player, profile: Profile) {
  let score = 12;
  const age = Number(profile.age);

  if (profile.game.trim() && sameText(player.game, profile.game)) score += 24;
  if (player.platform === profile.platform) score += 10;
  if (player.style === profile.style) score += 10;
  if (profile.language.trim() && sameText(player.language, profile.language)) score += 9;
  if (player.time === profile.time) score += 8;
  if (profile.region.trim() && sameText(player.region, profile.region)) score += 7;
  if (player.goal === profile.goal) score += 7;
  if (profile.mode.trim() && sameText(player.mode, profile.mode)) score += 5;
  if (profile.gender === 'any' || player.gender === profile.gender) score += 4;
  if (profile.mic === 'any' || player.mic === (profile.mic === 'yes')) score += 4;

  if (Number.isFinite(age)) {
    const ageDiff = Math.abs(player.age - age);
    if (ageDiff === 0) score += 6;
    else if (ageDiff <= 2) score += 4;
    else if (ageDiff <= 4) score += 2;
  }

  return Math.min(score, 100);
}

function normalizeAge(value: string) {
  if (value === '') return '';
  const age = Number(value);
  if (!Number.isFinite(age)) return '';
  return String(Math.min(Math.max(Math.trunc(age), 1), 100));
}

function getUiLanguage(value: string): SupportedUiLanguage {
  const normalized = value.trim().toLowerCase();

  if (['русский', 'russian', 'ru'].includes(normalized)) return 'ru';
  if (['қазақша', 'казахский', 'kazakh', 'kk'].includes(normalized)) return 'kk';
  return 'en';
}

function createTags(profile: Profile) {
  return [profile.game, profile.goal, profile.style].filter(Boolean).slice(0, 3);
}

function cleanOldValue(value: string) {
  return value === 'Learning' || value.toLowerCase() === 'education' ? 'Chill' : value;
}

function cleanPlayer(player: Player): Player {
  return {
    ...player,
    style: cleanOldValue(player.style),
    tags: player.tags.map(cleanOldValue),
  };
}

function isTestProfile(player: Player) {
  const searchableText = [player.id, player.name, player.rank, player.contact, player.about]
    .join(' ')
    .toLowerCase();

  return (
    player.id === '00000000-0000-4000-8000-000000000777' ||
    player.id.startsWith('teamup-ai-') ||
    player.name.toLowerCase() === 'test player' ||
    player.contact.toLowerCase().includes('@teamup_test') ||
    player.contact.toLowerCase().includes('@teamup_ai') ||
    player.rank.toLowerCase() === 'ai bot' ||
    searchableText.includes('ai bot') ||
    searchableText.includes('ии бот') ||
    searchableText.includes('бот') ||
    searchableText.includes(' bot') ||
    searchableText.includes('demo')
  );
}

function isRemovedBotMessage(message: ChatMessage) {
  const author = message.authorEmail.toLowerCase();
  return (
    message.profileId === '00000000-0000-4000-8000-000000000777' ||
    message.profileId.startsWith('teamup-ai-') ||
    author.includes('ai bot') ||
    author.includes('@teamup_ai')
  );
}

function getStoredMessages() {
  const saved = localStorage.getItem(MESSAGES_KEY);
  if (!saved) return [];

  try {
    return (JSON.parse(saved) as ChatMessage[]).filter((message) => !isRemovedBotMessage(message));
  } catch {
    localStorage.removeItem(MESSAGES_KEY);
    return [];
  }
}

function getDisplayName(player: Player, anonymousLabel: string) {
  return player.anonymous ? anonymousLabel : player.name;
}

function getStoredStringArray(key: string) {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as string[];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function getStoredRecord(key: string) {
  const saved = localStorage.getItem(key);
  if (!saved) return {};

  try {
    return JSON.parse(saved) as Record<string, string>;
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function getPresenceStatus(player: Player, lang: SupportedUiLanguage) {
  const seed = player.id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

  if (seed % 3 === 0) return lang === 'en' ? 'online' : 'онлайн';
  if (seed % 3 === 1) return lang === 'en' ? 'was recently' : 'был недавно';
  return lang === 'en' ? 'offline' : 'не в сети';
}

function isMessageAfterClear(message: ChatMessage, clearTimes: Record<string, string>) {
  const clearedAt = clearTimes[message.profileId];
  return !clearedAt || new Date(message.createdAt).getTime() > new Date(clearedAt).getTime();
}

function defaultVisualProfile(user: User): UserVisualProfile {
  return {
    displayName: user.user_metadata?.name || user.user_metadata?.user_name || user.email?.split('@')[0] || 'player',
    icon: userIconOptions[0],
  };
}

function displayNameFromUser(user: User, visualProfile?: UserVisualProfile | null) {
  return visualProfile?.displayName?.trim() || defaultVisualProfile(user).displayName;
}

function getStoredUserSettings(userId: string) {
  const saved = localStorage.getItem(USER_SETTINGS_KEY);
  if (!saved) return null;

  try {
    const settings = JSON.parse(saved) as Record<string, UserVisualProfile>;
    return settings[userId] ?? null;
  } catch {
    localStorage.removeItem(USER_SETTINGS_KEY);
    return null;
  }
}

function storeUserSettings(userId: string, visualProfile: UserVisualProfile) {
  const saved = localStorage.getItem(USER_SETTINGS_KEY);
  const settings = saved ? (JSON.parse(saved) as Record<string, UserVisualProfile>) : {};
  settings[userId] = visualProfile;
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
}

function profileMatchesSearch(player: Player, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    player.game,
    player.language,
    player.region,
    player.rank,
    player.mode,
    player.goal,
    player.platform,
    player.contact,
    player.about,
    ...player.tags,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

function rowToPlayer(row: TeamupProfileRow): Player {
  return {
    id: row.id,
    ownerId: row.owner_id ?? null,
    name: row.name,
    anonymous: row.anonymous ?? false,
    age: row.age,
    gender: row.gender,
    game: row.game,
    platform: row.platform,
    style: cleanOldValue(row.style),
    language: row.language,
    time: row.play_time,
    mic: row.mic,
    region: row.region,
    goal: row.goal,
    mode: row.mode,
    rank: row.rank,
    experience: row.experience,
    contact: row.contact,
    about: row.about,
    tags: row.tags.map(cleanOldValue),
    color: row.color,
  };
}

function playerToRow(player: Player): TeamupProfileRow {
  return {
    id: player.id,
    owner_id: player.ownerId ?? null,
    name: player.name,
    anonymous: player.anonymous,
    age: player.age,
    gender: player.gender,
    game: player.game,
    platform: player.platform,
    style: cleanOldValue(player.style),
    language: player.language,
    play_time: player.time,
    mic: player.mic,
    region: player.region,
    goal: player.goal,
    mode: player.mode,
    rank: player.rank,
    experience: player.experience,
    contact: player.contact,
    about: player.about,
    tags: player.tags.map(cleanOldValue),
    color: player.color,
  };
}

function playerToProfile(player: Player): Profile {
  return {
    name: player.anonymous ? '' : player.name,
    anonymous: player.anonymous,
    age: String(player.age),
    gender: player.gender,
    game: player.game,
    platform: player.platform,
    style: player.style,
    language: player.language,
    time: player.time,
    mic: player.mic ? 'yes' : 'no',
    region: player.region,
    goal: player.goal,
    mode: player.mode,
    rank: player.rank === '-' ? '' : player.rank,
    contact: player.contact,
    experience: player.experience === '-' ? '' : player.experience,
    about: player.about === '-' ? '' : player.about,
  };
}

function rowToMessage(row: TeamupMessageRow): ChatMessage {
  return {
    id: row.id,
    profileId: row.profile_id,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
  };
}

function rowToReview(row: TeamupReviewRow): SiteReview {
  return {
    id: row.id,
    authorId: row.author_id ?? null,
    authorName: row.author_name,
    authorIcon: row.author_icon ?? undefined,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  };
}

function getReviewAuthorIcon(review: SiteReview) {
  return review.authorIcon || review.authorName.trim().slice(0, 2).toUpperCase() || 'TU';
}

function parseChatBody(body: string) {
  if (!body.startsWith('> ')) return { body };

  const lineBreak = body.indexOf('\n');
  if (lineBreak === -1) return { body };

  return {
    reply: body.slice(2, lineBreak),
    body: body.slice(lineBreak + 1),
  };
}

function shortenChatBody(body: string) {
  const parsed = parseChatBody(body).body.replace(/\s+/g, ' ').trim();
  return parsed.length > 80 ? `${parsed.slice(0, 80)}...` : parsed;
}

function pluralRu(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function timeAgo(dateValue: string, lang: SupportedUiLanguage) {
  const timestamp = new Date(dateValue).getTime();
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  const units = [
    { seconds: 31536000, ru: ['год', 'года', 'лет'], kk: 'жыл', en: ['year', 'years'] },
    { seconds: 2592000, ru: ['месяц', 'месяца', 'месяцев'], kk: 'ай', en: ['month', 'months'] },
    { seconds: 604800, ru: ['неделю', 'недели', 'недель'], kk: 'апта', en: ['week', 'weeks'] },
    { seconds: 86400, ru: ['день', 'дня', 'дней'], kk: 'күн', en: ['day', 'days'] },
    { seconds: 3600, ru: ['час', 'часа', 'часов'], kk: 'сағат', en: ['hour', 'hours'] },
    { seconds: 60, ru: ['минуту', 'минуты', 'минут'], kk: 'минут', en: ['minute', 'minutes'] },
    { seconds: 1, ru: ['секунду', 'секунды', 'секунд'], kk: 'секунд', en: ['second', 'seconds'] },
  ];
  const unit = units.find((item) => diffSeconds >= item.seconds) ?? units[units.length - 1];
  const value = Math.floor(diffSeconds / unit.seconds);

  if (lang === 'en') return `${value} ${value === 1 ? unit.en[0] : unit.en[1]} ago`;
  if (lang === 'kk') return `${value} ${unit.kk} бұрын`;
  return `${value} ${pluralRu(value, unit.ru[0], unit.ru[1], unit.ru[2])} назад`;
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const events: TeamEvent[] = [];
  const [uiLanguage, setUiLanguage] = useState('Русский');
  const [people, setPeople] = useState<Player[]>(demoPlayers);
  const [saveMessage, setSaveMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [visualProfile, setVisualProfile] = useState<UserVisualProfile | null>(null);
  const [authNotice, setAuthNotice] = useState('');
  const [theme, setTheme] = useState<DesignTheme>('neon');
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());
  const [profileSearch, setProfileSearch] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterMic, setFilterMic] = useState('any');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');
  const [loadedProfileId, setLoadedProfileId] = useState('');
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [contactsOnly, setContactsOnly] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [readChatTimes, setReadChatTimes] = useState<Record<string, string>>({});
  const [clearChatTimes, setClearChatTimes] = useState<Record<string, string>>({});
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyTarget | undefined>>({});
  const [chatNotice, setChatNotice] = useState('');
  const authPanelRef = useRef<HTMLDivElement>(null);
  const profilePanelRef = useRef<HTMLFormElement>(null);
  const matchesPanelRef = useRef<HTMLElement>(null);
  const activeUiLanguage = getUiLanguage(uiLanguage);
  const t: Record<string, string> = {
    ...text[activeUiLanguage],
    ...contactText[activeUiLanguage],
    ...chatText[activeUiLanguage],
    ...eventText[activeUiLanguage],
    ...uiCopy[activeUiLanguage],
  };
  const extraUi = {
    status: activeUiLanguage === 'en' ? 'Status' : 'Статус',
    report: activeUiLanguage === 'en' ? 'Report' : 'Пожаловаться',
    block: activeUiLanguage === 'en' ? 'Block' : 'Заблокировать',
    clearChat: activeUiLanguage === 'en' ? 'Clear chat' : 'Очистить чат',
    unread: activeUiLanguage === 'en' ? 'new' : 'новое',
  };
  const pageInfo: Record<AppPage, { title: string; text: string }> = {
    home: {
      title: t.navHome,
      text: activeUiLanguage === 'en' ? 'Start here.' : 'Начальная страница.',
    },
    matches: {
      title: t.navMatches,
      text:
        activeUiLanguage === 'en'
          ? 'Search, filter, save contacts, report, block, and open chats.'
          : 'Ищи игроков, фильтруй анкеты, добавляй контакты, жалуйся, блокируй и открывай чаты.',
    },
    profile: {
      title: t.navProfile,
      text:
        activeUiLanguage === 'en'
          ? 'Create or update your own teammate profile.'
          : 'Создай или измени свою анкету для поиска напарников.',
    },
    chats: {
      title: t.navChats,
      text: activeUiLanguage === 'en' ? 'All conversations are collected here.' : 'Все переписки собраны здесь.',
    },
    reviews: {
      title: t.navReviews,
      text:
        activeUiLanguage === 'en'
          ? 'Leave feedback about TeamUp and read other reviews.'
          : 'Оставь отзыв о TeamUp и посмотри отзывы других.',
    },
  };

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function syncPageFromHash() {
      setActivePage(getPageFromHash());
    }

    syncPageFromHash();
    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);

  useEffect(() => {
    if (!user) {
      setVisualProfile(null);
      return;
    }

    const currentUser = user;

    async function loadVisualProfile() {
      const fallbackProfile = getStoredUserSettings(currentUser.id) ?? defaultVisualProfile(currentUser);

      if (supabase) {
        const { data, error } = await supabase
          .from('teamup_user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .limit(1);

        if (!error && data?.[0]) {
          const row = data[0] as TeamupUserSettingsRow;
          const nextProfile = {
            displayName: row.display_name,
            icon: row.icon,
          };
          setVisualProfile(nextProfile);
          storeUserSettings(currentUser.id, nextProfile);
          return;
        }
      }

      setVisualProfile(fallbackProfile);
    }

    loadVisualProfile();
  }, [user]);

  useEffect(() => {
    if (!authReady) return;

    if (!user && activePage !== 'home') {
      if (window.location.hash !== '#home') window.location.hash = 'home';
      setActivePage('home');
      setAuthNotice(t.loginRequired);
    }
  }, [activePage, authReady, t.loginRequired, user]);

  useEffect(() => {
    const savedContacts = localStorage.getItem(CONTACTS_KEY) ?? localStorage.getItem('teamup-favorite-profile-ids');
    if (!savedContacts) return;

    try {
      const parsedContacts = JSON.parse(savedContacts) as string[];
      const cleanedContacts = parsedContacts.filter(
        (contactId) => contactId !== '00000000-0000-4000-8000-000000000777' && !contactId.startsWith('teamup-ai-'),
      );
      setContactIds(cleanedContacts);
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(cleanedContacts));
    } catch {
      localStorage.removeItem(CONTACTS_KEY);
    }
  }, []);

  useEffect(() => {
    setReportedIds(getStoredStringArray(REPORTS_KEY));
    setBlockedIds(getStoredStringArray(BLOCKED_KEY));
    setReadChatTimes(getStoredRecord(CHAT_READS_KEY));
    setClearChatTimes(getStoredRecord(CHAT_CLEARS_KEY));
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    if (!savedMessages) return;

    try {
      const cleanedMessages = (JSON.parse(savedMessages) as ChatMessage[]).filter(
        (message) => message.profileId !== '00000000-0000-4000-8000-000000000777' && !isRemovedBotMessage(message),
      );
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(cleanedMessages));
    } catch {
      localStorage.removeItem(MESSAGES_KEY);
    }
  }, []);

  useEffect(() => {
    async function loadAllMessages() {
      if (supabase) {
        const { data, error } = await supabase
          .from('teamup_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          setAllMessages(
            (data as TeamupMessageRow[])
              .map(rowToMessage)
              .filter((message) => !isRemovedBotMessage(message) && isMessageAfterClear(message, clearChatTimes)),
          );
          return;
        }
      }

      setAllMessages(getStoredMessages().filter((message) => isMessageAfterClear(message, clearChatTimes)));
    }

    loadAllMessages();
  }, [clearChatTimes]);

  useEffect(() => {
    async function loadReviews() {
      if (supabase) {
        const { data, error } = await supabase
          .from('teamup_reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setReviews((data as TeamupReviewRow[]).map(rowToReview));
          return;
        }
      }

      const saved = localStorage.getItem(REVIEWS_KEY);
      if (!saved) return;

      try {
        setReviews(JSON.parse(saved) as SiteReview[]);
      } catch {
        localStorage.removeItem(REVIEWS_KEY);
      }
    }

    loadReviews();
  }, []);

  useEffect(() => {
    async function loadPeople() {
      if (supabase) {
        const { data, error } = await supabase
          .from('teamup_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const loadedPeople = (data as TeamupProfileRow[]).map(rowToPlayer).map(cleanPlayer).filter((player) => !isTestProfile(player));
          setPeople(loadedPeople.length > 0 ? loadedPeople : demoPlayers);
          return;
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setPeople(demoPlayers);
        return;
      }

      try {
        const cleanedPeople = (JSON.parse(saved) as Player[]).map(cleanPlayer).filter((player) => !isTestProfile(player));
        setPeople(cleanedPeople.length > 0 ? cleanedPeople : demoPlayers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedPeople));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setPeople(demoPlayers);
      }
    }

    loadPeople();
  }, []);

  useEffect(() => {
    if (!openChatId) return;
    const chatId = openChatId;

    async function loadMessages() {
      if (supabase) {
        const { data, error } = await supabase
          .from('teamup_messages')
          .select('*')
          .eq('profile_id', chatId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(
            (data as TeamupMessageRow[])
              .map(rowToMessage)
              .filter((message) => !isRemovedBotMessage(message) && isMessageAfterClear(message, clearChatTimes)),
          );
          return;
        }
      }

      const saved = localStorage.getItem(MESSAGES_KEY);
      if (!saved) return;

      try {
        setMessages(
          (JSON.parse(saved) as ChatMessage[]).filter(
            (message) =>
              message.profileId === chatId && !isRemovedBotMessage(message) && isMessageAfterClear(message, clearChatTimes),
          ),
        );
      } catch {
        localStorage.removeItem(MESSAGES_KEY);
      }
    }

    loadMessages();
  }, [clearChatTimes, openChatId]);

  const matches = useMemo(
    () =>
      people
        .filter((player) => !user || player.ownerId !== user.id)
        .filter((player) => !reportedIds.includes(player.id) && !blockedIds.includes(player.id))
        .filter((player) => profileMatchesSearch(player, profileSearch))
        .filter((player) => !filterGame.trim() || sameText(player.game, filterGame))
        .filter((player) => !filterLanguage.trim() || sameText(player.language, filterLanguage))
        .filter((player) => filterMic === 'any' || player.mic === (filterMic === 'yes'))
        .filter((player) => !filterAgeMin || player.age >= Number(filterAgeMin))
        .filter((player) => !filterAgeMax || player.age <= Number(filterAgeMax))
        .filter((player) => !contactsOnly || contactIds.includes(player.id))
        .map((player) => ({ ...player, match: scorePlayer(player, profile) }))
        .sort((a, b) => b.match - a.match),
    [
      blockedIds,
      contactIds,
      contactsOnly,
      filterAgeMax,
      filterAgeMin,
      filterGame,
      filterLanguage,
      filterMic,
      people,
      profile,
      profileSearch,
      reportedIds,
      user,
    ],
  );

  const myProfiles = useMemo(
    () => (user ? people.filter((player) => player.ownerId === user.id) : []),
    [people, user],
  );

  useEffect(() => {
    const ownProfile = myProfiles[0];
    if (!ownProfile || ownProfile.id === loadedProfileId) return;

    setProfile(playerToProfile(ownProfile));
    setLoadedProfileId(ownProfile.id);
  }, [loadedProfileId, myProfiles]);

  const chatSummaries = useMemo(() => {
    const latestByProfile = new Map<string, ChatMessage>();

    allMessages.forEach((message) => {
      const current = latestByProfile.get(message.profileId);
      if (!current || new Date(message.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        latestByProfile.set(message.profileId, message);
      }
    });

    return Array.from(latestByProfile.entries())
      .map(([profileId, lastMessage]) => ({
        lastMessage,
        player: people.find((person) => person.id === profileId),
        profileId,
      }))
      .filter((item) => !blockedIds.includes(item.profileId) && !reportedIds.includes(item.profileId))
      .filter((item) => item.player)
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [allMessages, blockedIds, people, reportedIds]);

  const unreadChatCount = useMemo(
    () =>
      chatSummaries.filter(({ profileId, lastMessage }) => {
        if (lastMessage.authorEmail === (user?.email ?? '')) return false;
        const readAt = readChatTimes[profileId];
        return !readAt || new Date(lastMessage.createdAt).getTime() > new Date(readAt).getTime();
      }).length,
    [chatSummaries, readChatTimes, user],
  );

  function updateProfile<Key extends keyof Profile>(field: Key, value: Profile[Key]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function savePeopleLocally(nextPeople: Player[]) {
    setPeople(nextPeople);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPeople));
  }

  function saveReviewsLocally(nextReviews: SiteReview[]) {
    setReviews(nextReviews);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(nextReviews));
  }

  async function saveVisualProfile(nextProfile: UserVisualProfile) {
    if (!user) return;

    const cleanProfile = {
      displayName: nextProfile.displayName.trim() || defaultVisualProfile(user).displayName,
      icon:
        userIconOptions.includes(nextProfile.icon) || nextProfile.icon.startsWith('data:image/')
          ? nextProfile.icon
          : userIconOptions[0],
    };

    setVisualProfile(cleanProfile);
    storeUserSettings(user.id, cleanProfile);

    if (supabase) {
      await supabase.from('teamup_user_settings').upsert({
        user_id: user.id,
        display_name: cleanProfile.displayName,
        icon: cleanProfile.icon,
      });
    }
  }

  function removeEvent(id: string) {
    void id;
  }

  function toggleContact(id: string) {
    setContactIds((current) => {
      const next = current.includes(id) ? current.filter((contactId) => contactId !== id) : [...current, id];
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function markChatRead(id: string) {
    setReadChatTimes((current) => {
      const next = { ...current, [id]: new Date().toISOString() };
      localStorage.setItem(CHAT_READS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleChat(id: string) {
    setChatNotice('');
    setOpenChatId((current) => {
      const next = current === id ? null : id;
      if (next) markChatRead(next);
      return next;
    });
  }

  function clearChat(id: string) {
    const clearedAt = new Date().toISOString();
    setClearChatTimes((current) => {
      const next = { ...current, [id]: clearedAt };
      localStorage.setItem(CHAT_CLEARS_KEY, JSON.stringify(next));
      return next;
    });
    setMessages([]);
    setAllMessages((current) => current.filter((message) => message.profileId !== id));
  }

  function blockProfile(id: string) {
    setBlockedIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
      return next;
    });
    setOpenChatId((current) => (current === id ? null : current));
  }

  function reportProfile(id: string) {
    setReportedIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      return next;
    });
    setOpenChatId((current) => (current === id ? null : current));
  }

  async function sendChatMessage(profileId: string) {
    const body = (messageDrafts[profileId] ?? '').trim();
    if (!body) return;

    if (!user) {
      setChatNotice(t.chatLoginRequired);
      authPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const replyTarget = replyDrafts[profileId];
    const messageBody = replyTarget ? `> ${replyTarget.authorEmail}: ${shortenChatBody(replyTarget.body)}\n${body}` : body;

    if (supabase) {
      const { data, error } = await supabase
        .from('teamup_messages')
        .insert({ profile_id: profileId, author_email: user.email ?? 'player', body: messageBody })
        .select()
        .single();

      if (!error && data) {
        const savedMessage = rowToMessage(data as TeamupMessageRow);
        setMessages((current) => [...current, savedMessage]);
        setAllMessages((current) => [...current, savedMessage]);
        setMessageDrafts((current) => ({ ...current, [profileId]: '' }));
        setReplyDrafts((current) => ({ ...current, [profileId]: undefined }));
        setChatNotice('');
        return;
      }
    }

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      profileId,
      authorEmail: user.email ?? 'player',
      body: messageBody,
      createdAt: new Date().toISOString(),
    };
    const saved = localStorage.getItem(MESSAGES_KEY);
    const allMessages = saved ? (JSON.parse(saved) as ChatMessage[]) : [];
    const nextMessages = [...allMessages, nextMessage];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages));
    setMessages((current) => [...current, nextMessage]);
    setAllMessages(nextMessages);
    setMessageDrafts((current) => ({ ...current, [profileId]: '' }));
    setReplyDrafts((current) => ({ ...current, [profileId]: undefined }));
    setChatNotice('');
  }

  async function publishReview(event: FormEvent) {
    event.preventDefault();

    if (!user) {
      setAuthNotice(t.loginRequired);
      setActivePage('home');
      return;
    }

    const body = reviewBody.trim();
    if (!body) return;

    const nextReview: SiteReview = {
      id: crypto.randomUUID(),
      authorId: user.id,
      authorName: displayNameFromUser(user, visualProfile),
      authorIcon: visualProfile?.icon ?? defaultVisualProfile(user).icon,
      rating: Math.min(5, Math.max(1, Number(reviewRating) || 5)),
      body,
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('teamup_reviews')
        .insert({
          id: nextReview.id,
          author_id: nextReview.authorId,
          author_name: nextReview.authorName,
          author_icon: nextReview.authorIcon,
          rating: nextReview.rating,
          body: nextReview.body,
        })
        .select()
        .single();

      if (!error && data) {
        setReviews([rowToReview(data as TeamupReviewRow), ...reviews]);
        setReviewBody('');
        setReviewRating('5');
        setReviewMessage(t.reviewSaved);
        return;
      }
    }

    saveReviewsLocally([nextReview, ...reviews]);
    setReviewBody('');
    setReviewRating('5');
    setReviewMessage(t.reviewSaved);
  }

  async function removeReview(id: string) {
    if (!user) return;

    if (supabase) {
      await supabase.from('teamup_reviews').delete().eq('id', id).eq('author_id', user.id);
    }

    saveReviewsLocally(reviews.filter((review) => review.id !== id || review.authorId !== user.id));
    setReviewMessage(t.reviewDeleted);
  }

  async function publishProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      setAuthNotice(t.loginRequired);
      setSaveMessage(t.loginRequired);
      authPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if ((!profile.anonymous && !profile.name.trim()) || !profile.contact.trim()) return;

    const existingProfile = myProfiles[0];
    const nextProfile: Player = {
      id: existingProfile?.id ?? crypto.randomUUID(),
      ownerId: user.id,
      name: profile.anonymous ? 'Anonymous' : profile.name.trim(),
      anonymous: profile.anonymous,
      age: Number(normalizeAge(profile.age)) || 1,
      gender: profile.gender,
      game: profile.game.trim(),
      platform: profile.platform,
      style: cleanOldValue(profile.style),
      language: profile.language.trim(),
      time: profile.time,
      mic: profile.mic === 'yes',
      region: profile.region.trim(),
      goal: profile.goal,
      mode: profile.mode.trim(),
      rank: profile.rank.trim() || '-',
      experience: profile.experience.trim() || '-',
      contact: profile.contact.trim(),
      about: profile.about.trim() || '-',
      tags: createTags(profile),
      color: existingProfile?.color ?? profileColors[people.length % profileColors.length],
    };

    if (supabase) {
      const request = existingProfile
        ? supabase.from('teamup_profiles').update(playerToRow(nextProfile)).eq('id', existingProfile.id).eq('owner_id', user.id)
        : supabase.from('teamup_profiles').insert(playerToRow(nextProfile));
      const { data, error } = await request.select().single();

      if (!error && data) {
        const savedProfile = rowToPlayer(data as TeamupProfileRow);
        setPeople(existingProfile ? people.map((person) => (person.id === existingProfile.id ? savedProfile : person)) : [savedProfile, ...people]);
        setLoadedProfileId(savedProfile.id);
        setSaveMessage(existingProfile ? t.profileUpdated : t.saved);
        return;
      }
    }

    savePeopleLocally(existingProfile ? people.map((person) => (person.id === existingProfile.id ? nextProfile : person)) : [nextProfile, ...people]);
    setLoadedProfileId(nextProfile.id);
    setSaveMessage(existingProfile ? t.profileUpdated : t.saved);
  }

  async function removeProfile(id: string) {
    if (supabase) {
      await supabase.from('teamup_profiles').delete().eq('id', id);
    }

    savePeopleLocally(people.filter((person) => person.id !== id));
  }

  async function removeMyProfiles() {
    if (!user || myProfiles.length === 0) return;

    if (supabase) {
      await supabase.from('teamup_profiles').delete().eq('owner_id', user.id);
    }

    savePeopleLocally(people.filter((person) => person.ownerId !== user.id));
    setSaveMessage(t.profileDeleted);
  }

  function openPage(page: AppPage) {
    if (!user && page !== 'home') {
      if (window.location.hash !== '#home') window.location.hash = 'home';
      setActivePage('home');
      setAuthNotice(t.loginRequired);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAuthNotice('');
    if (window.location.hash !== `#${page}`) {
      window.location.hash = page;
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderChatBox(player: Player) {
    return (
      <div className="chat-box">
        <button
          className="chat-close"
          type="button"
          aria-label="Закрыть чат"
          onClick={() => {
            setOpenChatId(null);
            setChatNotice('');
            setReplyDrafts((current) => ({ ...current, [player.id]: undefined }));
          }}
        >
          x
        </button>
        <div className="chat-header">
          <div className="chat-header__avatar" style={{ backgroundColor: player.color }}>
            {getDisplayName(player, t.anonymousPlayer).slice(0, 2)}
          </div>
          <div>
            <b>{getDisplayName(player, t.anonymousPlayer)}</b>
            <span>{player.game} · {label(player.language, activeUiLanguage)}</span>
          </div>
        </div>

        <div className="chat-tools">
          <button type="button" onClick={() => clearChat(player.id)}>
            {extraUi.clearChat}
          </button>
          <button type="button" onClick={() => blockProfile(player.id)}>
            {extraUi.block}
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="chat-empty">{t.emptyChat}</p>
          ) : (
            messages.map((message) => {
              const parsedMessage = parseChatBody(message.body);
              const isOwnMessage = message.authorEmail === (user?.email ?? '');

              return (
                <div className={isOwnMessage ? 'chat-message is-own' : 'chat-message is-other'} key={message.id}>
                  <b>{isOwnMessage ? t.you : message.authorEmail}</b>
                  {parsedMessage.reply && <em>{parsedMessage.reply}</em>}
                  <span>{parsedMessage.body}</span>
                  <small>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                  <button
                    className="reply-action"
                    type="button"
                    onClick={() =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [player.id]: { authorEmail: message.authorEmail, body: message.body },
                      }))
                    }
                  >
                    {t.replyMessage || 'Ответить'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {chatNotice && <p className="field-hint">{chatNotice}</p>}

        {replyDrafts[player.id] && (
          <div className="reply-preview">
            <span>
              <b>{t.replyingTo}:</b> {replyDrafts[player.id]?.authorEmail} -{' '}
              {shortenChatBody(replyDrafts[player.id]?.body ?? '')}
            </span>
            <button type="button" onClick={() => setReplyDrafts((current) => ({ ...current, [player.id]: undefined }))}>
              {t.cancelReply || 'Отмена'}
            </button>
          </div>
        )}

        <div className="chat-compose">
          <input
            value={messageDrafts[player.id] ?? ''}
            placeholder={t.chatPlaceholder}
            onChange={(event) => setMessageDrafts((current) => ({ ...current, [player.id]: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChatMessage(player.id);
              }
            }}
          />
          <button type="button" onClick={() => sendChatMessage(player.id)}>
            {t.sendMessage}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <nav className="app-nav" aria-label="TeamUp pages">
        <button
          type="button"
          className={activePage === 'home' ? 'is-active' : undefined}
          onClick={() => openPage('home')}
        >
          {t.navHome}
        </button>
        <button
          type="button"
          className={activePage === 'matches' ? 'is-active' : undefined}
          aria-disabled={!user}
          onClick={() => openPage('matches')}
        >
          {t.navMatches}
        </button>
        <button
          type="button"
          className={activePage === 'profile' ? 'is-active' : undefined}
          aria-disabled={!user}
          onClick={() => openPage('profile')}
        >
          {t.navProfile}
        </button>
        <button
          type="button"
          className={activePage === 'chats' ? 'is-active' : undefined}
          aria-disabled={!user}
          onClick={() => openPage('chats')}
        >
          {t.navChats}
          {unreadChatCount > 0 && <span className="nav-badge">{unreadChatCount}</span>}
        </button>
        <button
          type="button"
          className={activePage === 'reviews' ? 'is-active' : undefined}
          aria-disabled={!user}
          onClick={() => openPage('reviews')}
        >
          {t.navReviews}
        </button>
      </nav>

      <section className={activePage === 'home' ? `hero ${user ? '' : 'hero--auth'}` : 'hero is-hidden'}>
        <div className="hero__content">
          <div className="hero__header">
            <div className="brand">
              <span className="brand__mark">TU</span>
              <span>TeamUp</span>
            </div>

            <label className="language-menu">
              {t.formLanguage}
              <input
                list="form-languages"
                className={looksLikeTypo(uiLanguage, formLanguageOptions) ? 'field-error' : undefined}
                placeholder={t.languageInputPlaceholder}
                value={uiLanguage}
                onChange={(event) => setUiLanguage(event.target.value)}
              />
              {looksLikeTypo(uiLanguage, formLanguageOptions) && <span className="field-hint">{t.typoPick}</span>}
              <datalist id="form-languages">
                {formLanguageOptions.map((language) => (
                  <option key={language} value={language} />
                ))}
              </datalist>
            </label>

            <div className="theme-picker" aria-label="Design theme">
              {designThemes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={theme === item.id ? 'theme-picker__button is-active' : 'theme-picker__button'}
                  onClick={() => setTheme(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="hero-stats" aria-label="TeamUp highlights">
            <span>{t.statGames}</span>
            <span>{t.statProfiles}</span>
            <span>{t.statChat}</span>
          </div>
          <section className="hero-guide" aria-label={t.guideTitle}>
            <h2>{t.guideTitle}</h2>
            <ol>
              <li>{t.guideStep1}</li>
              <li>{t.guideStep2}</li>
              <li>{t.guideStep3}</li>
              <li>{t.guideStep4}</li>
            </ol>
          </section>
          {!user && (
            <div className="home-auth">
              <Auth
                user={user}
                notice={authNotice}
                language={activeUiLanguage}
                visualProfile={visualProfile}
                iconOptions={userIconOptions}
                onVisualProfileChange={saveVisualProfile}
              />
            </div>
          )}
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="game-card game-card--red">Valorant</div>
          <div className="game-card game-card--green">Minecraft</div>
          <div className="game-card game-card--blue">CS2</div>
          <div className="game-card game-card--yellow">Roblox</div>
          <div className="hero-console">
            <span>ONLINE</span>
            <b>TeamUp</b>
            <small>match ready</small>
          </div>
        </div>
      </section>

      <section className={`workspace workspace--${activePage}`} hidden={activePage === 'home'}>
        <header className="page-header">
          <span>TeamUp</span>
          <h1>{pageInfo[activePage].title}</h1>
          <p>{pageInfo[activePage].text}</p>
        </header>

        {activePage === 'profile' && (
        <div className="sidebar-stack page-only">
          <div ref={authPanelRef}>
          <Auth
            user={user}
            notice={authNotice}
            language={activeUiLanguage}
            visualProfile={visualProfile}
            iconOptions={userIconOptions}
            onVisualProfileChange={saveVisualProfile}
          />
          </div>

        <form ref={profilePanelRef} className="panel search-panel" onSubmit={publishProfile}>
          <div className="section-title">
            <span>01</span>
            <h2>{t.profileTitle}</h2>
          </div>

          <div className="form-grid">
            <label>
              {t.name}
              <input
                required={!profile.anonymous}
                disabled={profile.anonymous}
                placeholder={t.namePlaceholder}
                value={profile.name}
                onChange={(event) => updateProfile('name', event.target.value)}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={profile.anonymous}
                onChange={(event) => updateProfile('anonymous', event.target.checked)}
              />
              <span>{t.anonymous}</span>
            </label>

            <label>
              {t.age}
              <input
                min="1"
                max="100"
                type="number"
                value={profile.age}
                onChange={(event) => updateProfile('age', normalizeAge(event.target.value))}
              />
            </label>

            <label>
              {t.gender}
              <select value={profile.gender} onChange={(event) => updateProfile('gender', event.target.value)}>
                <option value="any">{t.any}</option>
                <option value="boy">{t.boy}</option>
                <option value="girl">{t.girl}</option>
              </select>
            </label>
          </div>

          <label>
            {t.game}
            <input
              list="games"
              className={looksLikeTypo(profile.game, gameOptions) ? 'field-error' : undefined}
              placeholder={t.gamePlaceholder}
              value={profile.game}
              onChange={(event) => updateProfile('game', event.target.value)}
            />
            {looksLikeTypo(profile.game, gameOptions) && <span className="field-hint">{t.typoGame}</span>}
            <datalist id="games">
              {gameOptions.map((game) => (
                <option key={game} value={game} />
              ))}
            </datalist>
          </label>

          <div className="form-grid">
            <label>
              {t.platform}
              <select value={profile.platform} onChange={(event) => updateProfile('platform', event.target.value)}>
                {['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo Switch'].map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.style}
              <select value={profile.style} onChange={(event) => updateProfile('style', event.target.value)}>
                {styleOptions.map((style) => (
                  <option key={style} value={style}>
                    {label(style, activeUiLanguage)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              {t.communicationLanguage}
              <input
                list="languages"
                className={looksLikeTypo(profile.language, chatLanguageOptions) ? 'field-error' : undefined}
                placeholder={t.languagePlaceholder}
                value={profile.language}
                onChange={(event) => updateProfile('language', event.target.value)}
              />
              {looksLikeTypo(profile.language, chatLanguageOptions) && (
                <span className="field-hint">{t.typoLanguage}</span>
              )}
              <datalist id="languages">
                {chatLanguageOptions.map((language) => (
                  <option key={language} value={language} />
                ))}
              </datalist>
              <div className="quick-options" aria-label={t.communicationLanguage}>
                {['Kazakh', 'Russian', 'English', 'Turkish'].map((language) => (
                  <button key={language} type="button" onClick={() => updateProfile('language', language)}>
                    {label(language, activeUiLanguage)}
                  </button>
                ))}
              </div>
            </label>

            <label>
              {t.region}
              <input
                list="regions"
                className={looksLikeTypo(profile.region, regionOptions) ? 'field-error' : undefined}
                placeholder={t.regionPlaceholder}
                value={profile.region}
                onChange={(event) => updateProfile('region', event.target.value)}
              />
              {looksLikeTypo(profile.region, regionOptions) && <span className="field-hint">{t.typoRegion}</span>}
              <datalist id="regions">
                {regionOptions.map((region) => (
                  <option key={region} value={region} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="form-grid">
            <label>
              {t.time}
              <select value={profile.time} onChange={(event) => updateProfile('time', event.target.value)}>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {label(time, activeUiLanguage)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.mic}
              <select value={profile.mic} onChange={(event) => updateProfile('mic', event.target.value)}>
                <option value="yes">{t.yes}</option>
                <option value="no">{t.no}</option>
                <option value="any">{t.any}</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              {t.goal}
              <select value={profile.goal} onChange={(event) => updateProfile('goal', event.target.value)}>
                {goalOptions.map((goal) => (
                  <option key={goal} value={goal}>
                    {label(goal, activeUiLanguage)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.mode}
              <input
                list="modes"
                className={looksLikeTypo(profile.mode, modeOptions) ? 'field-error' : undefined}
                placeholder={t.modePlaceholder}
                value={profile.mode}
                onChange={(event) => updateProfile('mode', event.target.value)}
              />
              {looksLikeTypo(profile.mode, modeOptions) && <span className="field-hint">{t.typoMode}</span>}
              <datalist id="modes">
                {modeOptions.map((mode) => (
                  <option key={mode} value={mode} />
                ))}
              </datalist>
            </label>
          </div>

          <label>
            {t.rank}
            <input
              placeholder={t.rankPlaceholder}
              value={profile.rank}
              onChange={(event) => updateProfile('rank', event.target.value)}
            />
          </label>

          <div className="form-grid">
            <label>
              {t.experienceInput}
              <input
                placeholder={t.experiencePlaceholder}
                value={profile.experience}
                onChange={(event) => updateProfile('experience', event.target.value)}
              />
            </label>

            <label>
              {t.contact}
              <input
                required
                autoComplete="username"
                placeholder={t.contactPlaceholder}
                value={profile.contact}
                onChange={(event) => updateProfile('contact', event.target.value)}
              />
            </label>
          </div>

          <label>
            {t.about}
            <textarea
              maxLength={180}
              placeholder={t.aboutPlaceholder}
              value={profile.about}
              onChange={(event) => updateProfile('about', event.target.value)}
            />
          </label>

          <button type="submit">
            {user ? (myProfiles.length > 0 ? t.saveProfileChanges : t.publish) : t.publishLocked}
          </button>
          {user && myProfiles.length > 0 && (
            <button className="danger-button" type="button" onClick={() => void removeMyProfiles()}>
              {t.deleteCard}
            </button>
          )}
          {saveMessage && <p className="save-message">{saveMessage}</p>}
        </form>

        </div>
        )}

        {activePage === 'matches' && (
        <section ref={matchesPanelRef} className="panel matches-panel">
          <div className="section-title">
            <span>02</span>
            <h2>{t.matchesTitle}</h2>
          </div>

          <label className="profile-search">
            {t.searchProfile}
            <input
              type="search"
              placeholder={t.searchProfilePlaceholder}
              value={profileSearch}
              onChange={(event) => setProfileSearch(event.target.value)}
            />
          </label>

          <label className="checkbox-row filter-toggle">
            <input
              type="checkbox"
              checked={contactsOnly}
              onChange={(event) => setContactsOnly(event.target.checked)}
            />
            <span>{t.favoritesOnly}</span>
          </label>

          <div className="advanced-filters">
            <label>
              {t.game}
              <input
                list="games"
                placeholder={t.gamePlaceholder}
                value={filterGame}
                onChange={(event) => setFilterGame(event.target.value)}
              />
            </label>
            <label>
              {t.communicationLanguage}
              <input
                list="languages"
                placeholder={t.languagePlaceholder}
                value={filterLanguage}
                onChange={(event) => setFilterLanguage(event.target.value)}
              />
            </label>
            <label>
              {t.age}
              <div className="range-fields">
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="1"
                  value={filterAgeMin}
                  onChange={(event) => setFilterAgeMin(normalizeAge(event.target.value))}
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="100"
                  value={filterAgeMax}
                  onChange={(event) => setFilterAgeMax(normalizeAge(event.target.value))}
                />
              </div>
            </label>
            <label>
              {t.mic}
              <select value={filterMic} onChange={(event) => setFilterMic(event.target.value)}>
                <option value="any">{t.any}</option>
                <option value="yes">{t.yes}</option>
                <option value="no">{t.no}</option>
              </select>
            </label>
          </div>

          <section className="events-board">
            <div className="section-title">
              <span>04</span>
              <h2>{t.eventsTitle}</h2>
            </div>

            {events.length === 0 ? (
              <p className="empty-state">{t.emptyEvents}</p>
            ) : (
              <div className="event-list">
                {events.map((teamEvent) => (
                  <article className="event-card" key={teamEvent.id}>
                    <div className="event-card__top">
                      <span>{teamEvent.type}</span>
                      <b>{teamEvent.slots}</b>
                    </div>
                    <h3>{teamEvent.title}</h3>
                    <p>{teamEvent.description}</p>
                    <div className="event-meta">
                      <span>{teamEvent.game}</span>
                      <span>{label(teamEvent.time, activeUiLanguage)}</span>
                      <span>{label(teamEvent.language, activeUiLanguage)}</span>
                    </div>
                    <small>
                      {t.eventBy}: {teamEvent.author} · {timeAgo(teamEvent.createdAt, activeUiLanguage)}
                    </small>
                    <div className="event-actions">
                      <button type="button" onClick={() => setProfileSearch(teamEvent.game)}>
                        {t.joinEvent}
                      </button>
                      <button className="ghost-action" type="button" onClick={() => removeEvent(teamEvent.id)}>
                        {t.deleteCard}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {matches.length === 0 ? (
            <p className="empty-state">{profileSearch.trim() ? t.noSearchResults : t.emptyPeople}</p>
          ) : (
            <div className="match-list">
            {matches.map((player) => {
              const isOwnProfile = Boolean(user && player.ownerId === user.id);

              return (
              <article className="player-card" key={player.id}>
                <div className="player-card__top">
                  <div className="avatar" style={{ backgroundColor: player.color }}>
                    {getDisplayName(player, t.anonymousPlayer).slice(0, 2)}
                  </div>
                  <div>
                    <h3>{getDisplayName(player, t.anonymousPlayer)}</h3>
                    <p>
                      {player.age} {t.years} · {player.game} · {player.rank}
                    </p>
                  </div>
                  {isOwnProfile ? (
                    <span className="own-profile-badge">{t.ownProfile}</span>
                  ) : (
                    <strong>{player.match}%</strong>
                  )}
                </div>

                <p className="player-about">{player.about}</p>

                <div className="details-list">
                  <span>
                    <b>{t.detailsPlatform}:</b> {player.platform}
                  </span>
                  <span>
                    <b>{t.detailsStyle}:</b> {label(player.style, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsLanguage}:</b> {label(player.language, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsRegion}:</b> {label(player.region, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsOnline}:</b> {label(player.time, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{extraUi.status}:</b> {getPresenceStatus(player, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsMic}:</b> {player.mic ? t.yes.toLowerCase() : t.no.toLowerCase()}
                  </span>
                  <span>
                    <b>{t.detailsGoal}:</b> {label(player.goal, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsMode}:</b> {label(player.mode, activeUiLanguage)}
                  </span>
                  <span>
                    <b>{t.detailsExperience}:</b> {player.experience}
                  </span>
                </div>

                <div className="contact-line">
                  <b>{t.contact}:</b>
                  <span>{player.contact}</span>
                </div>

                <div className="tags">
                  {player.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                {!isOwnProfile && (
                  <>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(player.contact)}>
                      {t.copyContact}
                    </button>
                    <button className="contact-action" type="button" onClick={() => toggleContact(player.id)}>
                      {contactIds.includes(player.id) ? t.removeFavorite : t.addFavorite}
                    </button>
                    <button className="ghost-action" type="button" onClick={() => reportProfile(player.id)}>
                      {extraUi.report}
                    </button>
                    <button className="ghost-action" type="button" onClick={() => blockProfile(player.id)}>
                      {extraUi.block}
                    </button>
                  </>
                )}

                <button className="chat-action" type="button" onClick={() => toggleChat(player.id)}>
                  {openChatId === player.id ? t.closeChat : t.openChat}
                </button>

                {isOwnProfile && (
                  <button className="ghost-action" type="button" onClick={() => removeProfile(player.id)}>
                    {t.deleteCard}
                  </button>
                )}

                {openChatId === player.id && (
                  <div className="chat-box">
                    <div className="chat-header">
                      <div className="chat-header__avatar" style={{ backgroundColor: player.color }}>
                        {getDisplayName(player, t.anonymousPlayer).slice(0, 2)}
                      </div>
                      <div>
                        <b>{getDisplayName(player, t.anonymousPlayer)}</b>
                        <span>{player.game} · {label(player.language, activeUiLanguage)}</span>
                      </div>
                    </div>

                    <div className="chat-messages">
                      {messages.length === 0 ? (
                        <p className="chat-empty">{t.emptyChat}</p>
                      ) : (
                        messages.map((message) => {
                          const parsedMessage = parseChatBody(message.body);
                          const isOwnMessage = message.authorEmail === (user?.email ?? '');

                          return (
                            <div
                              className={isOwnMessage ? 'chat-message is-own' : 'chat-message is-other'}
                              key={message.id}
                            >
                              <b>{isOwnMessage ? t.you : message.authorEmail}</b>
                              {parsedMessage.reply && <em>{parsedMessage.reply}</em>}
                              <span>{parsedMessage.body}</span>
                              <small>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </small>
                              <button
                                className="reply-action"
                                type="button"
                                onClick={() =>
                                  setReplyDrafts((current) => ({
                                    ...current,
                                    [player.id]: { authorEmail: message.authorEmail, body: message.body },
                                  }))
                                }
                              >
                                {t.replyMessage || 'Ответить'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {chatNotice && <p className="field-hint">{chatNotice}</p>}

                    {replyDrafts[player.id] && (
                      <div className="reply-preview">
                        <span>
                          <b>{t.replyingTo}:</b> {replyDrafts[player.id]?.authorEmail} -{' '}
                          {shortenChatBody(replyDrafts[player.id]?.body ?? '')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyDrafts((current) => ({ ...current, [player.id]: undefined }))}
                        >
                          {t.cancelReply || 'Отмена'}
                        </button>
                      </div>
                    )}

                    <div className="chat-compose">
                      <input
                        value={messageDrafts[player.id] ?? ''}
                        placeholder={t.chatPlaceholder}
                        onChange={(event) =>
                          setMessageDrafts((current) => ({ ...current, [player.id]: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendChatMessage(player.id);
                          }
                        }}
                      />
                      <button type="button" onClick={() => sendChatMessage(player.id)}>
                        {t.sendMessage}
                      </button>
                    </div>
                  </div>
                )}
              </article>
              );
            })}
            </div>
          )}
        </section>
        )}

        {activePage === 'chats' && (
        <section className="panel chats-panel">
          <div className="section-title">
            <span>03</span>
            <h2>{t.chatsTitle}</h2>
          </div>

          {chatSummaries.length === 0 ? (
            <p className="empty-state">{t.emptyChats}</p>
          ) : (
            <div className="chat-thread-list">
              {chatSummaries.map(({ profileId, player: chatPlayer, lastMessage }) => {
                if (!chatPlayer) return null;
                const parsedLastMessage = parseChatBody(lastMessage.body);

                return (
                  <article className="chat-thread" key={profileId}>
                    <button
                      type="button"
                      className="chat-thread__button"
                      onClick={() => {
                        setOpenChatId(profileId);
                        markChatRead(profileId);
                        setChatNotice('');
                      }}
                    >
                      <span className="chat-thread__avatar" style={{ backgroundColor: chatPlayer.color }}>
                        {getDisplayName(chatPlayer, t.anonymousPlayer).slice(0, 2)}
                      </span>
                      <span className="chat-thread__body">
                        <b>{getDisplayName(chatPlayer, t.anonymousPlayer)}</b>
                        <small>{shortenChatBody(parsedLastMessage.body)}</small>
                      </span>
                      <span className="chat-thread__time">
                        {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {lastMessage.authorEmail !== (user?.email ?? '') &&
                        (!readChatTimes[profileId] ||
                          new Date(lastMessage.createdAt).getTime() > new Date(readChatTimes[profileId]).getTime()) && (
                          <span className="unread-dot">{extraUi.unread}</span>
                        )}
                    </button>

                    {openChatId === profileId && renderChatBox(chatPlayer)}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        )}

        {activePage === 'reviews' && (
        <section className="panel reviews-panel">
          <div className="section-title">
            <span>04</span>
            <h2>{t.reviewsTitle}</h2>
          </div>

          <form className="review-form" onSubmit={publishReview}>
            <label>
              {t.reviewRating}
              <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {'★'.repeat(rating)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.reviewText}
              <textarea
                maxLength={240}
                placeholder={t.reviewPlaceholder}
                value={reviewBody}
                onChange={(event) => setReviewBody(event.target.value)}
                required
              />
            </label>

            <button type="submit">{t.publishReview}</button>
            {reviewMessage && <p className="save-message">{reviewMessage}</p>}
          </form>

          {reviews.length === 0 ? (
            <p className="empty-state">{t.emptyReviews}</p>
          ) : (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-card__header">
                    <span className="review-card__avatar">
                      {getReviewAuthorIcon(review).startsWith('data:image/') ? (
                        <img src={getReviewAuthorIcon(review)} alt="" />
                      ) : (
                        getReviewAuthorIcon(review)
                      )}
                    </span>
                    <b>{review.authorName}</b>
                    <span>{'★'.repeat(review.rating)}</span>
                  </div>
                  <p>{review.body}</p>
                  <footer>
                    <small>{timeAgo(review.createdAt, activeUiLanguage)}</small>
                    {user && review.authorId === user.id && (
                      <button className="ghost-action" type="button" onClick={() => void removeReview(review.id)}>
                        {t.deleteReview}
                      </button>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
        )}
      </section>
    </main>
  );
}
