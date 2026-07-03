import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';

type SupportedUiLanguage = 'ru' | 'kk' | 'en';
type DesignTheme = 'neon' | 'arena' | 'pixel';
type AppPage = 'home' | 'games' | 'matches' | 'profile' | 'player' | 'chats' | 'reviews' | 'shop';
type ShopTab = 'avatars' | 'quests';

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

type ShopState = {
  xp: number;
  ownedItems: string[];
  completedQuests: string[];
  activeBackground: string;
  lastDailyReward?: string;
};

const appPages: AppPage[] = ['home', 'games', 'matches', 'profile', 'player', 'chats', 'reviews', 'shop'];
const pagePaths: Record<AppPage, string> = {
  home: '/',
  games: '/games',
  matches: '/matches',
  profile: '/profile',
  player: '/player',
  chats: '/chats',
  reviews: '/reviews',
  shop: '/shop',
};

function getPageFromLocation(): AppPage {
  const hashPage = window.location.hash.replace('#', '') as AppPage;
  if (appPages.includes(hashPage)) {
    window.history.replaceState({}, '', pagePaths[hashPage]);
    return hashPage;
  }

  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (path.startsWith('player/')) return 'player';
  const pathPage = path as AppPage | '';
  if (!pathPage) return 'home';
  return appPages.includes(pathPage as AppPage) ? (pathPage as AppPage) : 'home';
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
      'Заполни подробную анкету, а TeamUp покажет игроков, которые подходят по игре, возрасту, стилю, региону, режиму и времени онлайн.',
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
    no: 'Нет',
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
    heroTitle: 'РћР№С‹РЅТ“Р° СЃРµСЂС–РєС‚РµСЃ С‚Р°Рї',
    heroText:
      'РўРѕР»С‹Т› СЃР°СѓР°Р»РЅР°РјР°РЅС‹ С‚РѕР»С‚С‹СЂ, Р°Р» TeamUp РѕР№С‹РЅ, Р¶Р°СЃ, СЃС‚РёР»СЊ, Р°Р№РјР°Т›, СЂРµР¶РёРј Р¶У™РЅРµ РѕРЅР»Р°Р№РЅ СѓР°Т›С‹С‚ Р±РѕР№С‹РЅС€Р° СЃУ™Р№РєРµСЃ РѕР№С‹РЅС€С‹Р»Р°СЂРґС‹ РєУ©СЂСЃРµС‚РµРґС–.',
    formLanguage: 'РўС–Р»',
    profileTitle: 'РЎРµРЅС–ТЈ СЃР°СѓР°Р»РЅР°РјР°ТЈ',
    matchesTitle: 'РЎУ™Р№РєРµСЃ РѕР№С‹РЅС€С‹Р»Р°СЂ',
    searchProfile: 'РЎР°СѓР°Р»РЅР°РјР° С‚Р°Р±Сѓ',
    searchProfilePlaceholder: 'РћР№С‹РЅ, С‚С–Р», Р°Р№РјР°Т›, СЂР°РЅРі, Discord РЅРµРјРµСЃРµ Telegram',
    noSearchResults: 'РЎР°СѓР°Р»РЅР°РјР° С‚Р°Р±С‹Р»РјР°РґС‹. Р‘Р°СЃТ›Р° РѕР№С‹РЅ, С‚С–Р», Discord РЅРµРјРµСЃРµ Telegram Р¶Р°Р·С‹Рї РєУ©СЂ.',
    favoritesOnly: 'РўРµРє РєРѕРЅС‚Р°РєС‚С–Р»РµСЂ',
    addFavorite: 'РљРѕРЅС‚Р°РєС‚С–РіРµ Т›РѕСЃСѓ',
    removeFavorite: 'РљРѕРЅС‚Р°РєС‚С–РґРµРЅ Р°Р»С‹Рї С‚Р°СЃС‚Р°Сѓ',
    openChat: 'Р§Р°С‚С‚С‹ Р°С€Сѓ',
    closeChat: 'Р§Р°С‚С‚С‹ Р¶Р°Р±Сѓ',
    chatPlaceholder: 'РҐР°Р±Р°СЂР»Р°РјР° Р¶Р°Р·...',
    sendMessage: 'Р–С–Р±РµСЂСѓ',
    chatLoginRequired: 'Р§Р°С‚Т›Р° Р¶Р°Р·Сѓ ТЇС€С–РЅ Р°РєРєР°СѓРЅС‚Т›Р° РєС–СЂ.',
    emptyChat: 'УР·С–СЂРіРµ С…Р°Р±Р°СЂР»Р°РјР°Р»Р°СЂ Р¶РѕТ›. Р”РёР°Р»РѕРіС‚С‹ Р±С–СЂС–РЅС€С– Р±РѕР»С‹Рї Р±Р°СЃС‚Р°.',
    ownProfile: 'Р‘Т±Р» СЃРµРЅС–ТЈ СЃР°СѓР°Р»РЅР°РјР°ТЈ',
    name: 'РђС‚С‹ТЈ РЅРµРјРµСЃРµ РЅРёРє',
    namePlaceholder: 'РњС‹СЃР°Р»С‹: Alinur',
    anonymous: 'РђРЅРѕРЅРёРјРґС–',
    anonymousPlayer: 'РђРЅРѕРЅРёРј РѕР№С‹РЅС€С‹',
    age: 'Р–Р°СЃ',
    gender: 'Р–С‹РЅС‹СЃ',
    any: 'РњР°ТЈС‹Р·РґС‹ РµРјРµСЃ',
    boy: 'Р•СЂ',
    girl: 'УР№РµР»',
    game: 'РћР№С‹РЅ',
    gamePlaceholder: 'РњС‹СЃР°Р»С‹: Roblox, GTA V, Brawl Stars',
    platform: 'РџР»Р°С‚С„РѕСЂРјР°',
    style: 'РћР№С‹РЅ СЃС‚РёР»С–',
    communicationLanguage: 'РЎУ©Р№Р»РµСЃСѓРіРµ С‹ТЈТ“Р°Р№Р»С‹ С‚С–Р»',
    languagePlaceholder: 'РўС–Р»РґС– С‚Р°ТЈРґР° РЅРµРјРµСЃРµ У©Р·С–ТЈ Р¶Р°Р·',
    region: 'РђР№РјР°Т›',
    regionPlaceholder: 'РњС‹СЃР°Р»С‹: Kazakhstan',
    time: 'ТљР°С€Р°РЅ РѕР№РЅР°Р№СЃС‹ТЈ',
    mic: 'РњРёРєСЂРѕС„РѕРЅ',
    yes: 'Р‘Р°СЂ',
    no: 'Р–РѕТ›',
    goal: 'РљС–РјРґС– С–Р·РґРµР№СЃС–ТЈ',
    mode: 'Р РµР¶РёРј',
    modePlaceholder: 'РњС‹СЃР°Р»С‹: Competitive',
    rank: 'Р Р°РЅРі РЅРµРјРµСЃРµ РґРµТЈРіРµР№',
    rankPlaceholder: 'РњС‹СЃР°Р»С‹: Gold, 11k, Р¶Р°ТЈР°РґР°РЅ Р±Р°СЃС‚Р°СѓС€С‹',
    experienceInput: 'РўУ™Р¶С–СЂРёР±Рµ',
    experiencePlaceholder: 'РњС‹СЃР°Р»С‹: 2 Р¶С‹Р», Р¶Р°ТЈР°РґР°РЅ Р±Р°СЃС‚Р°СѓС€С‹, 6 Р°Р№',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram РЅРµРјРµСЃРµ Discord username',
    about: 'УЁР·С–ТЈ С‚СѓСЂР°Р»С‹',
    aboutPlaceholder: 'ТљР°Р»Р°Р№ РѕР№РЅР°Р№СЃС‹ТЈ, РєС–РјРґС– С–Р·РґРµР№СЃС–ТЈ, РЅРµ РјР°ТЈС‹Р·РґС‹',
    detailsPlatform: 'РџР»Р°С‚С„РѕСЂРјР°',
    detailsStyle: 'РЎС‚РёР»СЊ',
    detailsLanguage: 'РўС–Р»',
    detailsRegion: 'РђР№РјР°Т›',
    detailsOnline: 'РћРЅР»Р°Р№РЅ',
    detailsMic: 'РњРёРєСЂРѕС„РѕРЅ',
    detailsGoal: 'Р†Р·РґРµР№РґС–',
    detailsMode: 'Р РµР¶РёРј',
    detailsExperience: 'РўУ™Р¶С–СЂРёР±Рµ',
    years: 'Р¶Р°СЃ',
    copyContact: 'РљРѕРЅС‚Р°РєС‚С‚С‹ РєУ©С€С–СЂСѓ',
    publish: 'РЎР°СѓР°Р»РЅР°РјР°РЅС‹ Р¶Р°СЂРёСЏР»Р°Сѓ',
    emptyPeople: 'УР·С–СЂРіРµ РЅР°Т›С‚С‹ СЃР°СѓР°Р»РЅР°РјР°Р»Р°СЂ Р¶РѕТ›. Р¤РѕСЂРјР°РЅС‹ С‚РѕР»С‚С‹СЂС‹Рї, Р±С–СЂС–РЅС€С–СЃС–РЅ Р¶Р°СЂРёСЏР»Р°.',
    saved: 'РЎР°СѓР°Р»РЅР°РјР° Р¶Р°СЂРёСЏР»Р°РЅРґС‹. Р•РЅРґС– РѕР» РѕР№С‹РЅС€С‹Р»Р°СЂ С‚С–Р·С–РјС–РЅРґРµ РєУ©СЂС–РЅРµРґС–.',
    loginRequired: 'РђР»РґС‹РјРµРЅ Р°РєРєР°СѓРЅС‚Т›Р° РєС–СЂ, СЃРѕРґР°РЅ РєРµР№С–РЅ СЃР°СѓР°Р»РЅР°РјР°РЅС‹ Р¶Р°СЂРёСЏР»Р°Р№ Р°Р»Р°СЃС‹ТЈ.',
    publishLocked: 'Р–Р°СЂРёСЏР»Р°Сѓ ТЇС€С–РЅ РєС–СЂС–ТЈС–Р·',
    deleteCard: 'РЎР°СѓР°Р»РЅР°РјР°РЅС‹ У©С€С–СЂСѓ',
    typoPick: 'ТљР°С‚Рµ Р¶Р°Р·С‹Р»Т“Р°РЅ СЃРёСЏТ›С‚С‹. Т°СЃС‹РЅС‹СЃС‚Р°РЅ С‚Р°ТЈРґР°.',
    typoGame: 'ТљР°С‚Рµ Р¶Р°Р·С‹Р»Т“Р°РЅ СЃРёСЏТ›С‚С‹. РђС‚Р°СѓС‹РЅ С‚РµРєСЃРµСЂ РЅРµРјРµСЃРµ Т±СЃС‹РЅС‹СЃС‚С‹ С‚Р°ТЈРґР°.',
    typoLanguage: 'ТљР°С‚Рµ Р¶Р°Р·С‹Р»Т“Р°РЅ СЃРёСЏТ›С‚С‹. РўС–Р»РґС– С‚РµРєСЃРµСЂ РЅРµРјРµСЃРµ Т±СЃС‹РЅС‹СЃС‚С‹ С‚Р°ТЈРґР°.',
    typoRegion: 'ТљР°С‚Рµ Р¶Р°Р·С‹Р»Т“Р°РЅ СЃРёСЏТ›С‚С‹. РђР№РјР°Т›С‚С‹ С‚РµРєСЃРµСЂ РЅРµРјРµСЃРµ Т±СЃС‹РЅС‹СЃС‚С‹ С‚Р°ТЈРґР°.',
    typoMode: 'ТљР°С‚Рµ Р¶Р°Р·С‹Р»Т“Р°РЅ СЃРёСЏТ›С‚С‹. Р РµР¶РёРјРґС– С‚РµРєСЃРµСЂ РЅРµРјРµСЃРµ Т±СЃС‹РЅС‹СЃС‚С‹ С‚Р°ТЈРґР°.',
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
    searchProfilePlaceholder: 'РћР№С‹РЅ, С‚С–Р», Р°Р№РјР°Т›, СЂР°РЅРі, Discord РЅРµРјРµСЃРµ Telegram',
    noSearchResults: 'РЎР°СѓР°Р»РЅР°РјР° С‚Р°Р±С‹Р»РјР°РґС‹. Р‘Р°СЃТ›Р° РѕР№С‹РЅ, С‚С–Р», Discord РЅРµРјРµСЃРµ Telegram Р¶Р°Р·С‹Рї РєУ©СЂ.',
    contact: 'Discord / Telegram',
    contactPlaceholder: '@telegram РЅРµРјРµСЃРµ Discord username',
    copyContact: 'РљРѕРЅС‚Р°РєС‚С‚С‹ РєУ©С€С–СЂСѓ',
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
    replyMessage: 'РћС‚РІРµС‚РёС‚СЊ',
    replyingTo: 'РћС‚РІРµС‚ РЅР°',
    cancelReply: 'РћС‚РјРµРЅР°',
  },
  kk: {
    replyMessage: 'Р–Р°СѓР°Рї Р±РµСЂСѓ',
    replyingTo: 'Р–Р°СѓР°Рї',
    cancelReply: 'Р‘РѕР»РґС‹СЂРјР°Сѓ',
  },
  en: {
    replyMessage: 'Reply',
    replyingTo: 'Replying to',
    cancelReply: 'Cancel',
  },
};

const eventText: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    eventsTitle: 'РРіСЂРѕРІС‹Рµ РµРІРµРЅС‚С‹',
    eventsCreateTitle: 'РЎРѕР·РґР°С‚СЊ РµРІРµРЅС‚',
    eventTitle: 'РќР°Р·РІР°РЅРёРµ',
    eventTitlePlaceholder: 'РќР°РїСЂРёРјРµСЂ: Р’РµС‡РµСЂРЅРёР№ С‚СѓСЂРЅРёСЂ',
    eventType: 'РўРёРї РµРІРµРЅС‚Р°',
    eventGame: 'РРіСЂР°',
    eventTime: 'Р’СЂРµРјСЏ',
    eventLanguage: 'РЇР·С‹Рє',
    eventSlots: 'РњРµСЃС‚',
    eventDescription: 'РћРїРёСЃР°РЅРёРµ',
    eventDescriptionPlaceholder: 'Р§С‚Рѕ Р±СѓРґРµС‚, РєРѕРіРѕ РёС‰РµС€СЊ, РєР°РєРёРµ РїСЂР°РІРёР»Р°',
    createEvent: 'Р”РѕР±Р°РІРёС‚СЊ РµРІРµРЅС‚',
    emptyEvents: 'РџРѕРєР° РЅРµС‚ РµРІРµРЅС‚РѕРІ. РЎРѕР·РґР°Р№ РїРµСЂРІС‹Р№.',
    eventBy: 'РЎРѕР·РґР°Р»',
    joinEvent: 'РќР°РїРёСЃР°С‚СЊ РІ С‡Р°С‚',
    eventSaved: 'Р•РІРµРЅС‚ РґРѕР±Р°РІР»РµРЅ.',
  },
  kk: {
    eventsTitle: 'РћР№С‹РЅ РµРІРµРЅС‚С‚РµСЂС–',
    eventsCreateTitle: 'Р•РІРµРЅС‚ Р¶Р°СЃР°Сѓ',
    eventTitle: 'РђС‚Р°СѓС‹',
    eventTitlePlaceholder: 'РњС‹СЃР°Р»С‹: РљРµС€РєС– С‚СѓСЂРЅРёСЂ',
    eventType: 'Р•РІРµРЅС‚ С‚ТЇСЂС–',
    eventGame: 'РћР№С‹РЅ',
    eventTime: 'РЈР°Т›С‹С‚С‹',
    eventLanguage: 'РўС–Р»',
    eventSlots: 'РћСЂС‹РЅ',
    eventDescription: 'РЎРёРїР°С‚С‚Р°РјР°',
    eventDescriptionPlaceholder: 'РќРµ Р±РѕР»Р°РґС‹, РєС–РјРґС– С–Р·РґРµР№СЃС–ТЈ, Т›Р°РЅРґР°Р№ РµСЂРµР¶Рµ',
    createEvent: 'Р•РІРµРЅС‚ Т›РѕСЃСѓ',
    emptyEvents: 'УР·С–СЂРіРµ РµРІРµРЅС‚ Р¶РѕТ›. Р‘С–СЂС–РЅС€С–СЃС–РЅ Р¶Р°СЃР°.',
    eventBy: 'Р–Р°СЃР°РґС‹',
    joinEvent: 'Р§Р°С‚Т›Р° Р¶Р°Р·Сѓ',
    eventSaved: 'Р•РІРµРЅС‚ Т›РѕСЃС‹Р»РґС‹.',
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
    navHome: 'Главная',
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
    reviewDeleted: 'Отзыв удален.',
    you: 'Ты',
  },
  kk: {
    navHome: 'Р‘Р°СЃС‚С‹ Р±РµС‚',
    navMatches: 'РЎРµСЂС–РєС‚РµСЃ С‚Р°Р±Сѓ',
    navProfile: 'РЎР°СѓР°Р»РЅР°РјР°',
    navChats: 'Р§Р°С‚С‚Р°СЂ',
    navReviews: 'РџС–РєС–СЂР»РµСЂ',
    languageInputPlaceholder: 'Русский, Қазақша, English...',
    statGames: '200+ РѕР№С‹РЅ',
    statProfiles: 'РќР°Т›С‚С‹ СЃР°СѓР°Р»РЅР°РјР°Р»Р°СЂ',
    statChat: 'РЎР°Р№С‚ С–С€С–РЅРґРµРіС– С‡Р°С‚',
    guideTitle: 'TeamUp Т›Р°Р»Р°Р№ Т›РѕР»РґР°РЅС‹Р»Р°РґС‹',
    guideStep1: 'РђС‚С‹ТЈРјРµРЅ РєС–СЂ РЅРµРјРµСЃРµ С‚С–СЂРєРµР».',
    guideStep2: 'РЎР°СѓР°Р»РЅР°РјР°РЅС‹ С‚РѕР»С‚С‹СЂ: РѕР№С‹РЅ, Р¶Р°СЃ, С‚С–Р», РјРёРєСЂРѕС„РѕРЅ Р¶У™РЅРµ РєРѕРЅС‚Р°РєС‚.',
    guideStep3: 'Р†Р·РґРµСѓРґС– Р°С€С‹Рї, Р»Р°Р№С‹Т› СЃРµСЂС–РєС‚РµСЃ С‚Р°Рї.',
    guideStep4: 'РћР№С‹РЅС€С‹РЅС‹ РєРѕРЅС‚Р°РєС‚С–РіРµ Т›РѕСЃ РЅРµРјРµСЃРµ С‡Р°С‚Т›Р° Р¶Р°Р·.',
    chatsTitle: 'Р§Р°С‚С‚Р°СЂ',
    emptyChats: 'УР·С–СЂРіРµ С‡Р°С‚ Р¶РѕТ›. РћР№С‹РЅС€С‹ СЃР°СѓР°Р»РЅР°РјР°СЃС‹РЅ Р°С€С‹Рї, Р±С–СЂС–РЅС€С– С…Р°Р±Р°СЂР»Р°РјР° Р¶Р°Р·.',
    profileDeleted: 'РЎР°СѓР°Р»РЅР°РјР° У©С€С–СЂС–Р»РґС–.',
    saveProfileChanges: 'УЁР·РіРµСЂС–СЃС‚РµСЂРґС– СЃР°Т›С‚Р°Сѓ',
    profileUpdated: 'РЎР°СѓР°Р»РЅР°РјР° Р¶Р°ТЈР°СЂС‚С‹Р»РґС‹.',
    reviewsTitle: 'РЎР°Р№С‚ РїС–РєС–СЂР»РµСЂС–',
    reviewRating: 'Р‘Р°Т“Р°',
    reviewText: 'РџС–РєС–СЂ',
    reviewPlaceholder: 'РќРµ Т±РЅР°РґС‹ РЅРµРјРµСЃРµ РЅРµРЅС– Р¶Р°Т›СЃР°СЂС‚Сѓ РєРµСЂРµРє РµРєРµРЅС–РЅ Р¶Р°Р·',
    publishReview: 'РџС–РєС–СЂ Т›Р°Р»РґС‹СЂСѓ',
    emptyReviews: 'УР·С–СЂРіРµ РїС–РєС–СЂ Р¶РѕТ›. Р‘С–СЂС–РЅС€С– Р±РѕР».',
    reviewSaved: 'РџС–РєС–СЂ Р¶Р°СЂРёСЏР»Р°РЅРґС‹.',
    deleteReview: 'РџС–РєС–СЂРґС– У©С€С–СЂСѓ',
    reviewDeleted: 'РџС–РєС–СЂ У©С€С–СЂС–Р»РґС–.',
    you: 'РЎРµРЅ',
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
    Ranked: 'Р РµР№С‚РёРЅРі',
    Casual: 'РћР±С‹С‡РЅР°СЏ РёРіСЂР°',
    Tryhard: 'РќР° РїРѕР±РµРґСѓ',
    Chill: 'РЎРїРѕРєРѕР№РЅРѕ',
    Morning: 'РЈС‚СЂРѕРј',
    Day: 'Р”РЅРµРј',
    Evening: 'Р’РµС‡РµСЂРѕРј',
    Night: 'РќРѕС‡СЊСЋ',
    Weekend: 'РќР° РІС‹С…РѕРґРЅС‹С…',
    Duo: 'Р”СѓРѕ',
    Squad: 'РЎРєРІР°Рґ',
    Team: 'РљРѕРјР°РЅРґР°',
    Party: 'РџР°С‚Рё',
    Coach: 'РўСЂРµРЅРµСЂ',
    Competitive: 'РЎРѕСЂРµРІРЅРѕРІР°С‚РµР»СЊРЅС‹Р№',
    Premier: 'РџСЂРµРјСЊРµСЂ',
    Survival: 'Р’С‹Р¶РёРІР°РЅРёРµ',
    'Zero Build': 'Р‘РµР· СЃС‚СЂРѕРёС‚РµР»СЊСЃС‚РІР°',
    'All Pick': 'All Pick',
    Creative: 'РўРІРѕСЂС‡РµСЃРєРёР№',
    Development: 'Р Р°Р·СЂР°Р±РѕС‚РєР°',
    Kazakhstan: 'РљР°Р·Р°С…СЃС‚Р°РЅ',
    Europe: 'Р•РІСЂРѕРїР°',
    Asia: 'РђР·РёСЏ',
    'North America': 'РЎРµРІРµСЂРЅР°СЏ РђРјРµСЂРёРєР°',
    'South America': 'Р®Р¶РЅР°СЏ РђРјРµСЂРёРєР°',
    Kazakh: 'Қазақша',
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
    Ranked: 'Р РµР№С‚РёРЅРі',
    Casual: 'ТљР°СЂР°РїР°Р№С‹Рј РѕР№С‹РЅ',
    Tryhard: 'Р–РµТЈС–СЃРєРµ РѕР№РЅР°Сѓ',
    Chill: 'РўС‹РЅС‹С€ РѕР№С‹РЅ',
    Morning: 'РўР°ТЈРµСЂС‚РµТЈ',
    Day: 'РљТЇРЅРґС–Р·',
    Evening: 'РљРµС€РєРµ',
    Night: 'РўТЇРЅРґРµ',
    Weekend: 'Р”РµРјР°Р»С‹СЃС‚Р°',
    Duo: 'Р”СѓРѕ',
    Squad: 'РЎРєРІР°Рґ',
    Team: 'РљРѕРјР°РЅРґР°',
    Party: 'РџР°С‚Рё',
    Coach: 'Р–Р°С‚С‚С‹Т›С‚С‹СЂСѓС€С‹',
    Competitive: 'Р–Р°СЂС‹СЃС‚С‹Т›',
    Premier: 'РџСЂРµРјСЊРµСЂ',
    Survival: 'РђРјР°РЅ Т›Р°Р»Сѓ',
    'Zero Build': 'ТљТ±СЂС‹Р»С‹СЃСЃС‹Р·',
    'All Pick': 'All Pick',
    Creative: 'РЁС‹Т“Р°СЂРјР°С€С‹Р»С‹Т›',
    Development: 'УР·С–СЂР»РµСѓ',
    Kazakhstan: 'ТљР°Р·Р°Т›СЃС‚Р°РЅ',
    Europe: 'Р•СѓСЂРѕРїР°',
    Asia: 'РђР·РёСЏ',
    'North America': 'РЎРѕР»С‚ТЇСЃС‚С–Рє РђРјРµСЂРёРєР°',
    'South America': 'РћТЈС‚ТЇСЃС‚С–Рє РђРјРµСЂРёРєР°',
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
  'PokГ©mon Unite',
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
  'PokГ©mon GO',
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
const SHOP_KEY = 'teamup-shop-state';
const PRIVATE_CONTACTS_KEY = 'teamup-private-contact-profile-ids';
const REPUTATION_KEY = 'teamup-player-reputation';
const STARTER_XP = 1_200;
const userIconOptions = ['TU', 'GG', 'XP', 'LV', 'HP', 'VR'];
const profileColors = ['#e25555', '#2f9d68', '#e6a13d', '#6c63d9', '#3c7dd9', '#111827'];
const avatarShopItems = [
  { id: 'icon-crown', icon: 'CR', title: 'Crown', price: 900 },
  { id: 'icon-fire', icon: 'FR', title: 'Fire', price: 1200 },
  { id: 'icon-diamond', icon: 'DM', title: 'Diamond', price: 1500 },
  { id: 'icon-ghost', icon: 'GH', title: 'Ghost', price: 1700 },
  { id: 'icon-nitro', icon: 'NT', title: 'Nitro Boost', price: 2100 },
  { id: 'icon-star', icon: 'ST', title: 'Star Aura', price: 1900 },
  { id: 'icon-lightning', icon: 'LT', title: 'Lightning', price: 2300 },
  { id: 'icon-shield', icon: 'SH', title: 'Shield', price: 2500 },
  { id: 'icon-moon', icon: 'MO', title: 'Moon', price: 1800 },
  { id: 'icon-pixel', icon: 'PX', title: 'Pixel Frame', price: 2000 },
  { id: 'icon-ring', icon: 'RG', title: 'Neon Ring', price: 2400 },
  { id: 'icon-wings', icon: 'WG', title: 'Wings', price: 2800 },
  { id: 'icon-comet', icon: 'CM', title: 'Comet Trail', price: 3200 },
  { id: 'icon-glitch', icon: 'GL', title: 'Glitch Core', price: 3500 },
  { id: 'icon-orbit', icon: 'OR', title: 'Orbit', price: 3800 },
  { id: 'icon-portal', icon: 'PT', title: 'Portal', price: 4200 },
  { id: 'icon-sakura', icon: 'SK', title: 'Sakura', price: 3000 },
  { id: 'icon-crystal', icon: 'CY', title: 'Crystal Crown', price: 4600 },
  { id: 'icon-smoke', icon: 'SM', title: 'Shadow Smoke', price: 3400 },
  { id: 'icon-vortex', icon: 'VX', title: 'Vortex', price: 5000 },
  { id: 'icon-bubble', icon: 'BB', title: 'Bubble Pop', price: 2700 },
  { id: 'icon-spark', icon: 'SP', title: 'Spark Pack', price: 3100 },
  { id: 'icon-halo', icon: 'HL', title: 'Halo', price: 4400 },
  { id: 'icon-dragon', icon: 'DG', title: 'Dragon Flame', price: 6200 },
];
const backgroundShopItems = [
  { id: 'bg-classic', title: 'Classic', price: 0 },
  { id: 'bg-aurora', title: 'Aurora', price: 80 },
  { id: 'bg-cyber', title: 'Cyber', price: 90 },
  { id: 'bg-ocean', title: 'Ocean', price: 90 },
  { id: 'bg-sunset', title: 'Sunset', price: 100 },
  { id: 'bg-forest', title: 'Forest', price: 100 },
  { id: 'bg-galaxy', title: 'Galaxy', price: 130 },
  { id: 'bg-lava', title: 'Lava', price: 150 },
  { id: 'bg-ice', title: 'Ice', price: 110 },
  { id: 'bg-candy', title: 'Candy', price: 120 },
  { id: 'bg-shadow', title: 'Shadow', price: 140 },
  { id: 'bg-gold', title: 'Gold', price: 160 },
  { id: 'bg-matrix', title: 'Matrix', price: 170 },
  { id: 'bg-royal', title: 'Royal', price: 190 },
  { id: 'bg-glitch', title: 'Glitch', price: 210 },
  { id: 'bg-storm', title: 'Storm', price: 180 },
  { id: 'bg-mint', title: 'Mint', price: 125 },
  { id: 'bg-cherry', title: 'Cherry', price: 135 },
  { id: 'bg-dream', title: 'Dream', price: 155 },
];
const difficultyCopy = {
  easy: { ru: 'Легкий', en: 'Easy', reward: 50 },
  medium: { ru: 'Средний', en: 'Medium', reward: 90 },
  hard: { ru: 'Сложный', en: 'Hard', reward: 150 },
  secret: { ru: 'Секретный', en: 'Secret', reward: 300 },
};

const makeQuest = (
  id: string,
  difficulty: keyof typeof difficultyCopy,
  titleRu: string,
  titleEn: string,
  descriptionRu: string,
  descriptionEn: string,
  condition: string,
  target = 1,
  value = '',
  rewardBonus = 0,
) => ({
  id,
  difficulty,
  difficultyRu: difficultyCopy[difficulty].ru,
  difficultyEn: difficultyCopy[difficulty].en,
  titleRu,
  titleEn,
  descriptionRu,
  descriptionEn,
  condition,
  target,
  value,
  reward: difficultyCopy[difficulty].reward + rewardBonus,
});

const coreQuestItems = [
  makeQuest('quest-profile', 'easy', 'Создай свою анкету', 'Create your profile', 'Заполни анкету игрока и появись в поиске.', 'Fill in your player profile and appear in search.', 'profile-created'),
  makeQuest('quest-match', 'easy', 'Открой поиск игроков', 'Open player search', 'Зайди на страницу с подходящими игроками.', 'Open the page with matching players.', 'match-opened'),
  makeQuest('quest-contact', 'easy', 'Добавь первый контакт', 'Add your first contact', 'Сохрани игрока, с которым хочешь сыграть.', 'Save a player you want to play with.', 'contacts', 1),
  makeQuest('quest-chat', 'medium', 'Напиши первое сообщение', 'Send your first message', 'Отправь сообщение любому игроку в чате.', 'Send a message to any player in chat.', 'messages', 1),
  makeQuest('quest-review', 'medium', 'Оставь отзыв', 'Leave a review', 'Поставь оценку сайту и напиши короткий отзыв.', 'Rate the site and write a short review.', 'review'),
  makeQuest('quest-background', 'easy', 'Выбери фон', 'Pick a background', 'Выбери любой фон на начальном экране.', 'Choose any background on the home screen.', 'background-picked'),
  makeQuest('quest-avatar', 'hard', 'Купи предмет аватарки', 'Buy an avatar item', 'Купи любой предмет для аватарки в магазине.', 'Buy any avatar item in the store.', 'avatar-owned'),
  makeQuest('quest-filter', 'easy', 'Настрой фильтры', 'Tune the filters', 'Используй поиск или любой фильтр игроков.', 'Use player search or any player filter.', 'filter-used'),
  makeQuest('quest-team', 'hard', 'Собери мини-команду', 'Build a mini team', 'Добавь минимум трех игроков в контакты.', 'Add at least three players to contacts.', 'contacts', 3),
  makeQuest('quest-daily-start', 'easy', 'Начни путь TeamUp', 'Start the TeamUp path', 'Выполни любые 3 квеста.', 'Complete any 3 quests.', 'completed', 3),
];

const contactQuestItems = Array.from({ length: 15 }, (_, index) => {
  const target = index + 2;
  return makeQuest(
    `quest-contacts-${target}`,
    target < 6 ? 'easy' : target < 11 ? 'medium' : 'hard',
    `Добавь ${target} контакта`,
    `Add ${target} contacts`,
    `Сохрани ${target} игроков в контактах.`,
    `Save ${target} players to contacts.`,
    'contacts',
    target,
    '',
    index * 5,
  );
});

const messageQuestItems = Array.from({ length: 20 }, (_, index) => {
  const target = index + 2;
  return makeQuest(
    `quest-messages-${target}`,
    target < 6 ? 'easy' : target < 13 ? 'medium' : 'hard',
    `Напиши ${target} сообщений`,
    `Send ${target} messages`,
    `Отправь ${target} сообщений в чатах.`,
    `Send ${target} chat messages.`,
    'messages',
    target,
    '',
    index * 4,
  );
});

const backgroundQuestItems = backgroundShopItems.map((item, index) =>
  makeQuest(
    `quest-bg-${item.id.replace('bg-', '')}`,
    index < 6 ? 'easy' : index < 13 ? 'medium' : 'hard',
    `Включи фон ${item.title}`,
    `Equip ${item.title} background`,
    `Выбери фон ${item.title} на начальном экране.`,
    `Choose the ${item.title} background on the home screen.`,
    'background-active',
    1,
    item.id,
    index * 3,
  ),
);

const avatarQuestItems = avatarShopItems.flatMap((item, index) => [
  makeQuest(
    `quest-buy-${item.id.replace('icon-', '')}`,
    'medium',
    `Купи ${item.title}`,
    `Buy ${item.title}`,
    `Купи предмет ${item.title} для аватарки.`,
    `Buy the ${item.title} avatar item.`,
    'avatar-owned',
    1,
    item.id,
    index * 10,
  ),
  makeQuest(
    `quest-equip-${item.id.replace('icon-', '')}`,
    'hard',
    `Надень ${item.title}`,
    `Equip ${item.title}`,
    `Сделай ${item.title} активной иконкой профиля.`,
    `Make ${item.title} your active profile icon.`,
    'avatar-equipped',
    1,
    item.icon,
    index * 12,
  ),
]);

const profileQuestItems = [
  makeQuest('quest-profile-name', 'easy', 'Укажи имя', 'Set a name', 'Заполни имя в анкете.', 'Fill in your profile name.', 'profile-field', 1, 'name'),
  makeQuest('quest-profile-game', 'easy', 'Выбери игру', 'Choose a game', 'Укажи игру, в которую хочешь играть.', 'Choose the game you want to play.', 'profile-field', 1, 'game'),
  makeQuest('quest-profile-region', 'easy', 'Укажи регион', 'Set a region', 'Добавь свой регион для поиска.', 'Add your region for matching.', 'profile-field', 1, 'region'),
  makeQuest('quest-profile-rank', 'medium', 'Добавь ранг', 'Add a rank', 'Укажи свой ранг или уровень.', 'Add your rank or level.', 'profile-field', 1, 'rank'),
  makeQuest('quest-profile-contact', 'medium', 'Добавь связь', 'Add contact info', 'Укажи Discord, Telegram или другой контакт.', 'Add Discord, Telegram, or another contact.', 'profile-field', 1, 'contact'),
  makeQuest('quest-profile-about', 'medium', 'Напиши о себе', 'Write about yourself', 'Добавь описание минимум на 20 символов.', 'Add an about section with at least 20 characters.', 'profile-about', 20),
  makeQuest('quest-profile-experience', 'medium', 'Опиши опыт', 'Describe experience', 'Расскажи о своем игровом опыте.', 'Describe your gaming experience.', 'profile-field', 1, 'experience'),
  makeQuest('quest-profile-mic', 'easy', 'Настрой микрофон', 'Set microphone', 'Выбери статус микрофона в анкете.', 'Choose your microphone status in the profile.', 'profile-field', 1, 'mic'),
  makeQuest('quest-profile-goal', 'easy', 'Выбери цель', 'Choose a goal', 'Укажи, ищешь дуо, команду или пати.', 'Choose whether you want duo, team, or party.', 'profile-field', 1, 'goal'),
  makeQuest('quest-profile-mode', 'easy', 'Выбери режим', 'Choose a mode', 'Добавь любимый игровой режим.', 'Add your favorite game mode.', 'profile-field', 1, 'mode'),
];

const filterQuestItems = [
  makeQuest('quest-filter-search', 'easy', 'Используй поиск', 'Use search', 'Введи текст в поиск игроков.', 'Type something into player search.', 'filter-value', 1, 'search'),
  makeQuest('quest-filter-game', 'easy', 'Фильтр по игре', 'Filter by game', 'Отфильтруй игроков по игре.', 'Filter players by game.', 'filter-value', 1, 'game'),
  makeQuest('quest-filter-language', 'easy', 'Фильтр по языку', 'Filter by language', 'Отфильтруй игроков по языку.', 'Filter players by language.', 'filter-value', 1, 'language'),
  makeQuest('quest-filter-mic', 'easy', 'Фильтр по микрофону', 'Filter by microphone', 'Выбери фильтр по микрофону.', 'Choose a microphone filter.', 'filter-value', 1, 'mic'),
  makeQuest('quest-filter-age-min', 'medium', 'Минимальный возраст', 'Minimum age', 'Поставь минимальный возраст в фильтрах.', 'Set a minimum age filter.', 'filter-value', 1, 'ageMin'),
  makeQuest('quest-filter-age-max', 'medium', 'Максимальный возраст', 'Maximum age', 'Поставь максимальный возраст в фильтрах.', 'Set a maximum age filter.', 'filter-value', 1, 'ageMax'),
  makeQuest('quest-filter-two', 'medium', 'Два фильтра сразу', 'Use two filters', 'Включи любые два фильтра одновременно.', 'Use any two filters at the same time.', 'filter-count', 2),
  makeQuest('quest-filter-four', 'hard', 'Точный поиск', 'Precise search', 'Включи любые четыре фильтра одновременно.', 'Use any four filters at the same time.', 'filter-count', 4),
];

const completionQuestItems = [5, 10, 15, 20, 30, 40, 50, 60, 75, 90].map((target, index) =>
  makeQuest(
    `quest-complete-${target}`,
    target < 20 ? 'medium' : target < 60 ? 'hard' : 'secret',
    `Выполни ${target} квестов`,
    `Complete ${target} quests`,
    `Забери награды за ${target} выполненных квестов.`,
    `Claim rewards for ${target} completed quests.`,
    'completed',
    target,
    '',
    index * 20,
  ),
);

const questItems = [
  ...coreQuestItems,
  ...contactQuestItems,
  ...messageQuestItems,
  ...backgroundQuestItems,
  ...avatarQuestItems,
  ...profileQuestItems,
  ...filterQuestItems,
  ...completionQuestItems,
].map((quest, index) => ({
  ...quest,
  reward: 300 + index * 60,
}));
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

  if (['русский', 'р сѓсѓсѓрєрёр№', 'russian', 'ru'].includes(normalized)) return 'ru';
  if (['қазақша', 'казахский', 'тљр°р·р°т›с€р°', 'kazakh', 'kk'].includes(normalized)) return 'kk';
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
    searchableText.includes('РёРё Р±РѕС‚') ||
    searchableText.includes('Р±РѕС‚') ||
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

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredReputation() {
  const saved = localStorage.getItem(REPUTATION_KEY);
  if (!saved) return {};

  try {
    return JSON.parse(saved) as Record<string, Record<string, number>>;
  } catch {
    localStorage.removeItem(REPUTATION_KEY);
    return {};
  }
}

function getStoredShopState(): ShopState {
  const saved = localStorage.getItem(SHOP_KEY);
  const fallback: ShopState = { xp: STARTER_XP, ownedItems: [], completedQuests: [], activeBackground: '', lastDailyReward: '' };

  if (!saved) return fallback;

  try {
    const stored = { ...fallback, ...(JSON.parse(saved) as Partial<ShopState>) };
    return { ...stored, xp: Math.max(stored.xp, STARTER_XP) };
  } catch {
    localStorage.removeItem(SHOP_KEY);
    return fallback;
  }
}

function getPresenceStatus(player: Player, lang: SupportedUiLanguage) {
  const seed = player.id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

  if (seed % 3 === 0) return lang === 'en' ? 'online' : 'РѕРЅР»Р°Р№РЅ';
  if (seed % 3 === 1) return lang === 'en' ? 'was recently' : 'Р±С‹Р» РЅРµРґР°РІРЅРѕ';
  return lang === 'en' ? 'offline' : 'РЅРµ РІ СЃРµС‚Рё';
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

function renderStars(rating: number) {
  const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (index < safeRating ? '★' : '☆')).join('');
}

const avatarEffectByIcon: Record<string, string> = {
  CR: 'crown',
  FR: 'fire',
  DM: 'diamond',
  GH: 'ghost',
  NT: 'nitro',
  ST: 'star',
  LT: 'lightning',
  SH: 'shield',
  MO: 'moon',
  PX: 'pixel',
  RG: 'ring',
  WG: 'wings',
  CM: 'comet',
  GL: 'glitch',
  OR: 'orbit',
  PT: 'portal',
  SK: 'sakura',
  CY: 'crystal',
  SM: 'smoke',
  VX: 'vortex',
  BB: 'bubble',
  SP: 'spark',
  HL: 'halo',
  DG: 'dragon',
};

function renderVisualIcon(icon: string, className = '') {
  const effect = avatarEffectByIcon[icon];
  const classes = ['animated-avatar', className].filter(Boolean).join(' ');

  if (icon.startsWith('data:image/')) {
    return (
      <span className={`${classes} animated-avatar--image`}>
        <img src={icon} alt="" />
      </span>
    );
  }

  if (!effect) return <span className={classes}>{icon}</span>;

  return (
    <span className={`${classes} shop-icon--${effect}`} aria-label={icon}>
      <span className="shop-avatar-base">TU</span>
      <span className="shop-avatar-effect">{icon}</span>
    </span>
  );
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
    { seconds: 31536000, ru: ['РіРѕРґ', 'РіРѕРґР°', 'Р»РµС‚'], kk: 'Р¶С‹Р»', en: ['year', 'years'] },
    { seconds: 2592000, ru: ['РјРµСЃСЏС†', 'РјРµСЃСЏС†Р°', 'РјРµСЃСЏС†РµРІ'], kk: 'Р°Р№', en: ['month', 'months'] },
    { seconds: 604800, ru: ['РЅРµРґРµР»СЋ', 'РЅРµРґРµР»Рё', 'РЅРµРґРµР»СЊ'], kk: 'Р°РїС‚Р°', en: ['week', 'weeks'] },
    { seconds: 86400, ru: ['РґРµРЅСЊ', 'РґРЅСЏ', 'РґРЅРµР№'], kk: 'РєТЇРЅ', en: ['day', 'days'] },
    { seconds: 3600, ru: ['С‡Р°СЃ', 'С‡Р°СЃР°', 'С‡Р°СЃРѕРІ'], kk: 'СЃР°Т“Р°С‚', en: ['hour', 'hours'] },
    { seconds: 60, ru: ['РјРёРЅСѓС‚Сѓ', 'РјРёРЅСѓС‚С‹', 'РјРёРЅСѓС‚'], kk: 'РјРёРЅСѓС‚', en: ['minute', 'minutes'] },
    { seconds: 1, ru: ['СЃРµРєСѓРЅРґСѓ', 'СЃРµРєСѓРЅРґС‹', 'СЃРµРєСѓРЅРґ'], kk: 'СЃРµРєСѓРЅРґ', en: ['second', 'seconds'] },
  ];
  const unit = units.find((item) => diffSeconds >= item.seconds) ?? units[units.length - 1];
  const value = Math.floor(diffSeconds / unit.seconds);

  if (lang === 'en') return `${value} ${value === 1 ? unit.en[0] : unit.en[1]} ago`;
  if (lang === 'kk') return `${value} ${unit.kk} Р±Т±СЂС‹РЅ`;
  return `${value} ${pluralRu(value, unit.ru[0], unit.ru[1], unit.ru[2])} РЅР°Р·Р°Рґ`;
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
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromLocation());
  const [profileSearch, setProfileSearch] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterMic, setFilterMic] = useState('any');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');
  const [loadedProfileId, setLoadedProfileId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(() => {
    const match = window.location.pathname.match(/^\/player\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  });
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [contactsOnly, setContactsOnly] = useState(false);
  const [privateContactIds, setPrivateContactIds] = useState<string[]>([]);
  const [profileContactPrivate, setProfileContactPrivate] = useState(true);
  const [reputation, setReputation] = useState<Record<string, Record<string, number>>>(() => getStoredReputation());
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
  const [shopState, setShopState] = useState<ShopState>(() => getStoredShopState());
  const [shopTab, setShopTab] = useState<ShopTab>('avatars');
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
    shop: activeUiLanguage === 'en' ? 'Shop' : 'Магазин',
    xp: 'XP',
    buy: activeUiLanguage === 'en' ? 'Buy' : 'Купить',
    equip: activeUiLanguage === 'en' ? 'Equip' : 'Поставить',
    active: activeUiLanguage === 'en' ? 'Active' : 'Выбрано',
    owned: activeUiLanguage === 'en' ? 'Owned' : 'Куплено',
    avatarItems: activeUiLanguage === 'en' ? 'Avatar items' : 'Предметы для аватарки',
    backgrounds: activeUiLanguage === 'en' ? 'Backgrounds' : 'Фоны',
    quests: activeUiLanguage === 'en' ? 'Quests' : 'Квесты',
    claim: activeUiLanguage === 'en' ? 'Claim XP' : 'Забрать XP',
    claimed: activeUiLanguage === 'en' ? 'Claimed' : 'Получено',
  };
  const pageInfo: Record<AppPage, { title: string; text: string }> = {
    home: {
      title: t.navHome,
      text: activeUiLanguage === 'en' ? 'Start here.' : 'Начальная страница.',
    },
    games: {
      title: activeUiLanguage === 'en' ? 'Games' : 'Игры',
      text:
        activeUiLanguage === 'en'
          ? 'Pick a game and jump into players, chats, and profiles for that community.'
          : 'Выбери игру и сразу открой игроков, чаты и анкеты этого сообщества.',
    },
    matches: {
      title: t.navMatches,
      text:
        activeUiLanguage === 'en'
          ? 'Search, filter, save contacts, report, block, and open chats.'
          : 'Ищи игроков, фильтруй анкеты, добавляй контакты, жалуйся, блокируй и открывай чаты.',
    },
    player: {
      title: activeUiLanguage === 'en' ? 'Player profile' : 'Профиль игрока',
      text:
        activeUiLanguage === 'en'
          ? 'Open a shareable player card with contact privacy, reputation, and fast chat.'
          : 'Отдельная карточка игрока: приватность контакта, репутация и быстрый чат.',
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
    shop: {
      title: extraUi.shop,
      text:
        activeUiLanguage === 'en'
          ? 'Earn XP from quests and buy avatar items.'
          : 'Зарабатывай XP за квесты и покупай предметы для аватарки.',
    },
  };
  const availableIconOptions = useMemo(() => {
    const ownedAvatarIcons = avatarShopItems
      .filter((item) => shopState.ownedItems.includes(item.id))
      .map((item) => item.icon);

    return Array.from(new Set([...userIconOptions, ...ownedAvatarIcons]));
  }, [shopState.ownedItems]);

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
    function syncPageFromLocation() {
      const match = window.location.pathname.match(/^\/player\/([^/]+)/);
      setSelectedPlayerId(match ? decodeURIComponent(match[1]) : '');
      setActivePage(getPageFromLocation());
    }

    syncPageFromLocation();
    window.addEventListener('popstate', syncPageFromLocation);
    window.addEventListener('hashchange', syncPageFromLocation);
    return () => {
      window.removeEventListener('popstate', syncPageFromLocation);
      window.removeEventListener('hashchange', syncPageFromLocation);
    };
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

    if (!user && !['home', 'games', 'player'].includes(activePage)) {
      if (window.location.pathname !== pagePaths.home) window.history.replaceState({}, '', pagePaths.home);
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
    setPrivateContactIds(getStoredStringArray(PRIVATE_CONTACTS_KEY));
    setReadChatTimes(getStoredRecord(CHAT_READS_KEY));
    setClearChatTimes(getStoredRecord(CHAT_CLEARS_KEY));
  }, []);

  useEffect(() => {
    localStorage.setItem(SHOP_KEY, JSON.stringify(shopState));
  }, [shopState]);

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
    setProfileContactPrivate(privateContactIds.includes(ownProfile.id));
    setLoadedProfileId(ownProfile.id);
  }, [loadedProfileId, myProfiles, privateContactIds]);

  const gameStats = useMemo(() => {
    const stats = new Map<string, { game: string; players: number; online: number; languages: Set<string> }>();

    people.forEach((player) => {
      if (reportedIds.includes(player.id) || blockedIds.includes(player.id)) return;
      const current = stats.get(player.game) ?? { game: player.game, players: 0, online: 0, languages: new Set<string>() };
      current.players += 1;
      if (getPresenceStatus(player, 'en') === 'online') current.online += 1;
      current.languages.add(player.language);
      stats.set(player.game, current);
    });

    return Array.from(stats.values()).sort((a, b) => b.players - a.players);
  }, [blockedIds, people, reportedIds]);

  const selectedPlayer = useMemo(
    () => people.find((player) => player.id === selectedPlayerId) ?? null,
    [people, selectedPlayerId],
  );

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
  const dailyRewardClaimed = shopState.lastDailyReward === getTodayKey();

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
        availableIconOptions.includes(nextProfile.icon) || nextProfile.icon.startsWith('data:image/')
          ? nextProfile.icon
          : availableIconOptions[0],
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

  function buyShopItem(id: string, price: number) {
    setShopState((current) => {
      if (current.ownedItems.includes(id) || current.xp < price) return current;
      return {
        ...current,
        xp: current.xp - price,
        ownedItems: [...current.ownedItems, id],
      };
    });
  }

  async function equipAvatarItem(icon: string) {
    if (!user) return;
    await saveVisualProfile({
      displayName: visualProfile?.displayName ?? defaultVisualProfile(user).displayName,
      icon,
    });
  }

  function equipBackground(id: string) {
    setShopState((current) => ({
      ...current,
      activeBackground: id,
      ownedItems: current.ownedItems.includes(id) ? current.ownedItems : [...current.ownedItems, id],
    }));
  }

  function claimQuest(id: string, reward: number, isReady: boolean) {
    if (!isReady) return;
    setShopState((current) => {
      if (current.completedQuests.includes(id)) return current;
      return {
        ...current,
        xp: current.xp + reward,
        completedQuests: [...current.completedQuests, id],
      };
    });
  }

  function claimDailyReward() {
    const today = getTodayKey();
    setShopState((current) => {
      if (current.lastDailyReward === today) return current;
      return { ...current, xp: current.xp + 750, lastDailyReward: today };
    });
  }

  function addReputation(playerId: string, key: string) {
    setReputation((current) => {
      const next = {
        ...current,
        [playerId]: {
          ...(current[playerId] ?? {}),
          [key]: (current[playerId]?.[key] ?? 0) + 1,
        },
      };
      localStorage.setItem(REPUTATION_KEY, JSON.stringify(next));
      return next;
    });
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

    setPrivateContactIds((current) => {
      const next = profileContactPrivate
        ? Array.from(new Set([...current, nextProfile.id]))
        : current.filter((profileId) => profileId !== nextProfile.id);
      localStorage.setItem(PRIVATE_CONTACTS_KEY, JSON.stringify(next));
      return next;
    });

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

    setPrivateContactIds((current) => {
      const next = current.filter((profileId) => profileId !== id);
      localStorage.setItem(PRIVATE_CONTACTS_KEY, JSON.stringify(next));
      return next;
    });
    savePeopleLocally(people.filter((person) => person.id !== id));
  }

  async function removeMyProfiles() {
    if (!user || myProfiles.length === 0) return;

    if (supabase) {
      await supabase.from('teamup_profiles').delete().eq('owner_id', user.id);
    }

    const ownIds = new Set(myProfiles.map((player) => player.id));
    setPrivateContactIds((current) => {
      const next = current.filter((profileId) => !ownIds.has(profileId));
      localStorage.setItem(PRIVATE_CONTACTS_KEY, JSON.stringify(next));
      return next;
    });
    savePeopleLocally(people.filter((person) => person.ownerId !== user.id));
    setSaveMessage(t.profileDeleted);
  }

  function openPage(page: AppPage) {
    if (!user && !['home', 'games', 'player'].includes(page)) {
      if (window.location.pathname !== pagePaths.home) window.history.pushState({}, '', pagePaths.home);
      setActivePage('home');
      setAuthNotice(t.loginRequired);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAuthNotice('');
    if (window.location.pathname !== pagePaths[page]) {
      window.history.pushState({}, '', pagePaths[page]);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openPlayerProfile(id: string) {
    setSelectedPlayerId(id);
    setAuthNotice('');
    const path = `/player/${encodeURIComponent(id)}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setActivePage('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderChatBox(player: Player) {
    return (
      <div className="chat-box">
        <button
          className="chat-close"
          type="button"
          aria-label="Р—Р°РєСЂС‹С‚СЊ С‡Р°С‚"
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
            <span>{player.game} В· {label(player.language, activeUiLanguage)}</span>
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
                    {t.replyMessage || 'РћС‚РІРµС‚РёС‚СЊ'}
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
              {t.cancelReply || 'РћС‚РјРµРЅР°'}
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

  const sentMessageCount = allMessages.filter((message) => message.authorEmail === (user?.email ?? '')).length;
  const filterValues = {
    search: profileSearch.trim(),
    game: filterGame.trim(),
    language: filterLanguage.trim(),
    mic: filterMic !== 'any' ? filterMic : '',
    ageMin: filterAgeMin,
    ageMax: filterAgeMax,
  };
  const usedFilterCount = Object.values(filterValues).filter(Boolean).length;
  const completedQuestCount = questItems.filter((quest) => shopState.completedQuests.includes(quest.id)).length;
  const hasReview = Boolean(user && reviews.some((review) => review.authorId === user.id));
  const hasPickedBackground = Boolean(shopState.activeBackground && shopState.activeBackground !== 'bg-classic');
  const hasAvatarItem = avatarShopItems.some((item) => shopState.ownedItems.includes(item.id));
  const profileValueByField: Record<string, string> = {
    name: profile.name,
    game: profile.game,
    region: profile.region,
    rank: profile.rank,
    contact: profile.contact,
    experience: profile.experience,
    mic: profile.mic,
    goal: profile.goal,
    mode: profile.mode,
  };
  const getQuestReady = (quest: (typeof questItems)[number]) => {
    if (shopState.completedQuests.includes(quest.id)) return true;

    switch (quest.condition) {
      case 'profile-created':
        return myProfiles.length > 0;
      case 'match-opened':
        return myProfiles.length > 0 && people.length > 0;
      case 'contacts':
        return contactIds.length >= quest.target;
      case 'messages':
        return sentMessageCount >= quest.target;
      case 'review':
        return hasReview;
      case 'background-picked':
        return hasPickedBackground;
      case 'background-active':
        return shopState.activeBackground === quest.value;
      case 'avatar-owned':
        return quest.value ? shopState.ownedItems.includes(quest.value) : hasAvatarItem;
      case 'avatar-equipped':
        return visualProfile?.icon === quest.value;
      case 'filter-used':
        return usedFilterCount > 0;
      case 'filter-value':
        return Boolean(filterValues[quest.value as keyof typeof filterValues]);
      case 'filter-count':
        return usedFilterCount >= quest.target;
      case 'profile-field':
        return Boolean(profileValueByField[quest.value]?.trim());
      case 'profile-about':
        return profile.about.trim().length >= quest.target;
      case 'completed':
        return completedQuestCount >= quest.target;
      default:
        return false;
    }
  };
  const questProgress = questItems.map((quest) => {
    const difficulty = activeUiLanguage === 'en' ? quest.difficultyEn : quest.difficultyRu;
    const title = activeUiLanguage === 'en' ? quest.titleEn : quest.titleRu;
    const description = activeUiLanguage === 'en' ? quest.descriptionEn : quest.descriptionRu;

    return {
      ...quest,
      title,
      description,
      difficultyId: quest.difficulty,
      difficulty,
      ready: getQuestReady(quest),
    };
  });
  const navItems: Array<{ page: AppPage; label: string; locked?: boolean; badge?: number }> = [
    { page: 'home', label: t.navHome },
    { page: 'games', label: activeUiLanguage === 'en' ? 'Games' : 'Игры' },
    { page: 'matches', label: t.navMatches, locked: !user },
    { page: 'profile', label: t.navProfile, locked: !user },
    { page: 'chats', label: t.navChats, locked: !user, badge: unreadChatCount },
    { page: 'reviews', label: t.navReviews, locked: !user },
    { page: 'shop', label: extraUi.shop, locked: !user },
  ];
  const primaryPage: AppPage = user ? 'matches' : 'profile';
  const primaryLabel = user ? t.navMatches : t.navProfile;

  return (
    <main className="app-shell" data-theme={theme} data-shop-bg={shopState.activeBackground}>
      <header className="app-header">
        <button className="app-header__brand" type="button" onClick={() => openPage('home')}>
          <span className="brand__mark">TU</span>
          <span>
            <b>TeamUp</b>
            <small>{user ? displayNameFromUser(user, visualProfile) : 'Find teammates faster'}</small>
          </span>
        </button>

        <nav className="app-nav" aria-label="TeamUp pages">
          {navItems.map((item) => (
            <button
              key={item.page}
              type="button"
              className={activePage === item.page ? 'is-active' : undefined}
              aria-disabled={item.locked}
              onClick={() => openPage(item.page)}
            >
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="app-header__actions">
          <span className={user ? 'status-badge status-badge--online' : 'status-badge'}>
            {user ? 'Online' : 'Guest'}
          </span>
          <button className="primary-nav-action" type="button" onClick={() => openPage(primaryPage)}>
            {primaryLabel}
          </button>
        </div>
      </header>

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
          {user && (
            <section className="home-dashboard" aria-label="TeamUp dashboard">
              <button type="button" onClick={() => openPage('profile')}>
                <b>{myProfiles.length > 0 ? 'Анкета готова' : 'Создай анкету'}</b>
                <span>{myProfiles.length > 0 ? profile.game || 'TeamUp' : 'Заполни профиль игрока'}</span>
              </button>
              <button type="button" onClick={() => openPage('games')}>
                <b>{gameStats.length || gameOptions.length} игр</b>
                <span>Открой подбор по игре</span>
              </button>
              <button type="button" onClick={() => openPage('chats')}>
                <b>{unreadChatCount} новых</b>
                <span>Сообщения и ответы</span>
              </button>
              <button type="button" disabled={dailyRewardClaimed} onClick={claimDailyReward}>
                <b>{dailyRewardClaimed ? 'Награда взята' : '+750 XP'}</b>
                <span>Ежедневный бонус</span>
              </button>
            </section>
          )}
          <section className="hero-guide" aria-label={t.guideTitle}>
            <h2>{t.guideTitle}</h2>
            <ol>
              <li>{t.guideStep1}</li>
              <li>{t.guideStep2}</li>
              <li>{t.guideStep3}</li>
              <li>{t.guideStep4}</li>
            </ol>
          </section>
          <section className="home-backgrounds" aria-label={extraUi.backgrounds}>
            <div>
              <h2>{extraUi.backgrounds}</h2>
              <span>{shopState.activeBackground || 'Classic'}</span>
            </div>
            <div className="home-backgrounds__list">
              {backgroundShopItems.map((item) => {
                const active = shopState.activeBackground === item.id || (!shopState.activeBackground && item.id === 'bg-classic');

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={active ? 'is-active' : undefined}
                    title={item.title}
                    onClick={() => equipBackground(item.id)}
                  >
                    <span className={`background-preview ${item.id}`} />
                    <small>{item.title}</small>
                  </button>
                );
              })}
            </div>
          </section>
          {!user && (
            <div className="home-auth">
              <Auth
                user={user}
                notice={authNotice}
                language={activeUiLanguage}
                visualProfile={visualProfile}
                iconOptions={availableIconOptions}
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
          <div>
            <span>TeamUp / {pageInfo[activePage].title}</span>
            <h1>{pageInfo[activePage].title}</h1>
            <p>{pageInfo[activePage].text}</p>
          </div>
          <button type="button" onClick={() => openPage('home')}>
            {t.navHome}
          </button>
        </header>

        {activePage === 'profile' && (
        <div className="sidebar-stack page-only">
          <div ref={authPanelRef}>
          <Auth
            user={user}
            notice={authNotice}
            language={activeUiLanguage}
            visualProfile={visualProfile}
            iconOptions={availableIconOptions}
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

          <label className="checkbox-row privacy-toggle">
            <input
              type="checkbox"
              checked={profileContactPrivate}
              onChange={(event) => setProfileContactPrivate(event.target.checked)}
            />
            <span>
              {activeUiLanguage === 'en'
                ? 'Hide my contact until a player adds me'
                : 'Скрывать мой контакт, пока игрок не добавит меня'}
            </span>
          </label>

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

        {activePage === 'games' && (
        <section className="panel games-panel">
          <div className="section-title">
            <span>02</span>
            <h2>{activeUiLanguage === 'en' ? 'Game hubs' : 'Игровые разделы'}</h2>
          </div>

          {gameStats.length === 0 ? (
            <p className="empty-state">
              {activeUiLanguage === 'en'
                ? 'No real profiles yet. Create the first one from Profile.'
                : 'Пока нет анкет. Создай первую во вкладке анкеты.'}
            </p>
          ) : (
            <div className="game-hub-grid">
              {gameStats.map((item, index) => (
                <article className="game-hub-card" key={item.game}>
                  <span className={`game-hub-card__cover game-hub-card__cover--${(index % 6) + 1}`} />
                  <div>
                    <h3>{item.game}</h3>
                    <p>
                      {item.players} игроков · {item.online} онлайн · {item.languages.size} языков
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGame(item.game);
                      setProfileSearch('');
                      openPage('matches');
                    }}
                  >
                    {activeUiLanguage === 'en' ? 'Find players' : 'Найти игроков'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
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
                      {t.eventBy}: {teamEvent.author} В· {timeAgo(teamEvent.createdAt, activeUiLanguage)}
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
              const contactHidden = privateContactIds.includes(player.id) && !isOwnProfile && !contactIds.includes(player.id);
              const playerReputation = reputation[player.id] ?? {};

              return (
              <article className="player-card" key={player.id}>
                <div className="player-card__top">
                  <div className="avatar" style={{ backgroundColor: player.color }}>
                    {getDisplayName(player, t.anonymousPlayer).slice(0, 2)}
                  </div>
                  <div>
                    <h3>{getDisplayName(player, t.anonymousPlayer)}</h3>
                    <p>
                      {player.age} {t.years} В· {player.game} В· {player.rank}
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
                  <span>{contactHidden ? 'Скрыт до добавления в контакты' : player.contact}</span>
                </div>

                <div className="reputation-line">
                  {[
                    ['team', 'Хороший тиммейт'],
                    ['calm', 'Не токсичный'],
                    ['mic', 'С микрофоном'],
                  ].map(([key, labelText]) => (
                    <button key={key} type="button" onClick={() => addReputation(player.id, key)}>
                      {labelText} · {playerReputation[key] ?? 0}
                    </button>
                  ))}
                </div>

                <div className="tags">
                  {player.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                {!isOwnProfile && (
                  <>
                    <button type="button" disabled={contactHidden} onClick={() => navigator.clipboard?.writeText(player.contact)}>
                      {t.copyContact}
                    </button>
                    <button className="ghost-action" type="button" onClick={() => openPlayerProfile(player.id)}>
                      {activeUiLanguage === 'en' ? 'Open profile' : 'Профиль'}
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
                        <span>{player.game} В· {label(player.language, activeUiLanguage)}</span>
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
                                {t.replyMessage || 'РћС‚РІРµС‚РёС‚СЊ'}
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
                          {t.cancelReply || 'РћС‚РјРµРЅР°'}
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

        {activePage === 'player' && (
        <section className="panel player-profile-panel">
          {!selectedPlayer ? (
            <p className="empty-state">
              {activeUiLanguage === 'en' ? 'Player profile was not found.' : 'Профиль игрока не найден.'}
            </p>
          ) : (
            (() => {
              const isOwnProfile = Boolean(user && selectedPlayer.ownerId === user.id);
              const contactHidden = privateContactIds.includes(selectedPlayer.id) && !isOwnProfile && !contactIds.includes(selectedPlayer.id);
              const playerReputation = reputation[selectedPlayer.id] ?? {};

              return (
                <article className="player-profile-card">
                  <div className="player-profile-card__hero">
                    <div className="avatar avatar--large" style={{ backgroundColor: selectedPlayer.color }}>
                      {getDisplayName(selectedPlayer, t.anonymousPlayer).slice(0, 2)}
                    </div>
                    <div>
                      <span>{selectedPlayer.game}</span>
                      <h2>{getDisplayName(selectedPlayer, t.anonymousPlayer)}</h2>
                      <p>
                        {selectedPlayer.age} {t.years} · {selectedPlayer.rank} · {getPresenceStatus(selectedPlayer, activeUiLanguage)}
                      </p>
                    </div>
                  </div>

                  <p className="player-about">{selectedPlayer.about}</p>

                  <div className="profile-stat-grid">
                    <span><b>{t.detailsPlatform}</b>{selectedPlayer.platform}</span>
                    <span><b>{t.detailsLanguage}</b>{label(selectedPlayer.language, activeUiLanguage)}</span>
                    <span><b>{t.detailsRegion}</b>{label(selectedPlayer.region, activeUiLanguage)}</span>
                    <span><b>{t.detailsGoal}</b>{label(selectedPlayer.goal, activeUiLanguage)}</span>
                    <span><b>{t.detailsMode}</b>{label(selectedPlayer.mode, activeUiLanguage)}</span>
                    <span><b>{t.detailsMic}</b>{selectedPlayer.mic ? t.yes : t.no}</span>
                  </div>

                  <div className="contact-line contact-line--large">
                    <b>{t.contact}:</b>
                    <span>{contactHidden ? 'Скрыт до добавления в контакты' : selectedPlayer.contact}</span>
                  </div>

                  <div className="reputation-line reputation-line--large">
                    {[
                      ['team', 'Хороший тиммейт'],
                      ['calm', 'Не токсичный'],
                      ['mic', 'С микрофоном'],
                    ].map(([key, labelText]) => (
                      <button key={key} type="button" onClick={() => addReputation(selectedPlayer.id, key)}>
                        {labelText} · {playerReputation[key] ?? 0}
                      </button>
                    ))}
                  </div>

                  <div className="player-profile-actions">
                    {!isOwnProfile && (
                      <>
                        <button type="button" onClick={() => toggleContact(selectedPlayer.id)}>
                          {contactIds.includes(selectedPlayer.id) ? t.removeFavorite : t.addFavorite}
                        </button>
                        <button type="button" disabled={contactHidden} onClick={() => navigator.clipboard?.writeText(selectedPlayer.contact)}>
                          {t.copyContact}
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => toggleChat(selectedPlayer.id)}>
                      {openChatId === selectedPlayer.id ? t.closeChat : t.openChat}
                    </button>
                    <button className="ghost-action" type="button" onClick={() => openPage('matches')}>
                      {t.navMatches}
                    </button>
                  </div>

                  {openChatId === selectedPlayer.id && renderChatBox(selectedPlayer)}
                </article>
              );
            })()
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

        {activePage === 'shop' && (
        <section className="panel shop-panel">
          <div className="shop-hero">
            <div>
              <span>TeamUp Store</span>
              <h2>{extraUi.shop}</h2>
              <p>{activeUiLanguage === 'en' ? 'Buy avatar items and earn XP from quests.' : 'Покупай предметы и забирай XP за квесты.'}</p>
            </div>
            <div className="xp-card">
              <span>{extraUi.xp}</span>
              <strong>{shopState.xp.toLocaleString('ru-RU')}</strong>
            </div>
          </div>

          <div className="shop-layout">
            <aside className="shop-sidebar" aria-label="Store sections">
              <div className="shop-sidebar__wallet">
                <span>Wallet</span>
                <strong>{shopState.xp.toLocaleString('ru-RU')}</strong>
                <small>XP Balance</small>
                <button type="button" disabled={dailyRewardClaimed} onClick={claimDailyReward}>
                  {dailyRewardClaimed ? 'Daily claimed' : '+750 daily XP'}
                </button>
              </div>

              <div className="shop-tabs" role="tablist" aria-label={extraUi.shop}>
                <button type="button" className={shopTab === 'avatars' ? 'is-active' : undefined} onClick={() => setShopTab('avatars')}>
                  <span>✦</span>
                  {extraUi.avatarItems}
                </button>
                <button type="button" className={shopTab === 'quests' ? 'is-active' : undefined} onClick={() => setShopTab('quests')}>
                  <span>XP</span>
                  {extraUi.quests}
                </button>
              </div>

              <div className="shop-sidebar__meta">
                <span>{avatarShopItems.length} items</span>
                <span>{questProgress.length} quests</span>
                <span>{shopState.completedQuests.length} claimed</span>
              </div>
            </aside>

            <div className="shop-content">
              {shopTab === 'avatars' && (
                <>
                  <div className="shop-section-head">
                    <div>
                      <span>Featured avatar decorations</span>
                      <h3>Collectibles</h3>
                    </div>
                    <small>Animated effects stay on your avatar after equip.</small>
                  </div>

                  <div className="shop-grid shop-grid--catalog">
                    {avatarShopItems.map((item) => {
                      const owned = shopState.ownedItems.includes(item.id);
                      const active = visualProfile?.icon === item.icon;
                      const canBuy = shopState.xp >= item.price;
                      const rarity = item.price >= 250 ? 'Legendary' : item.price >= 190 ? 'Rare' : 'Common';

                      return (
                        <article className={active ? 'shop-card is-active' : 'shop-card'} key={item.id}>
                          <div className="shop-card__badges">
                            <span>{rarity}</span>
                            {active && <span>{extraUi.active}</span>}
                            {owned && !active && <span>Owned</span>}
                          </div>
                          <span className={`shop-icon shop-icon--${item.id.replace('icon-', '')}`} aria-hidden="true">
                            <span className="shop-avatar-base">TU</span>
                            <span className="shop-avatar-effect">{item.icon}</span>
                          </span>
                          <div className="shop-card__body">
                            <b>{item.title}</b>
                            <small>{item.price} XP</small>
                          </div>
                          {owned ? (
                            <button className="shop-action" type="button" disabled={active} onClick={() => void equipAvatarItem(item.icon)}>
                              {active ? extraUi.active : extraUi.equip}
                            </button>
                          ) : (
                            <button className="shop-action" type="button" disabled={!canBuy} onClick={() => buyShopItem(item.id, item.price)}>
                              {canBuy ? extraUi.buy : 'No XP'}
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {shopTab === 'quests' && (
                <>
                  <div className="shop-section-head">
                    <div>
                      <span>Earn rewards</span>
                      <h3>Quest Board</h3>
                    </div>
                    <small>{shopState.completedQuests.length}/{questProgress.length} claimed</small>
                  </div>

                  <div className="quest-list">
                    {questProgress.map((quest) => {
                      const claimed = shopState.completedQuests.includes(quest.id);

                      return (
                        <article className={`quest-card ${claimed ? 'is-claimed' : quest.ready ? 'is-ready' : 'is-locked'}`} key={quest.id}>
                          <div>
                            <span className={`quest-difficulty quest-difficulty--${quest.difficultyId}`}>
                              {quest.difficulty}
                            </span>
                            <b>{quest.title}</b>
                            <p>{quest.description}</p>
                            <small>+{quest.reward} XP</small>
                          </div>
                          <button
                            className="quest-claim"
                            type="button"
                            disabled={!quest.ready || claimed}
                            onClick={() => claimQuest(quest.id, quest.reward, quest.ready)}
                          >
                            {claimed ? extraUi.claimed : extraUi.claim}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
        )}

        {activePage === 'reviews' && (
        <section className="panel reviews-panel">
          <div className="section-title">
            <span>04</span>
            <h2>{t.reviewsTitle}</h2>
          </div>

          <form className="review-form" onSubmit={publishReview}>
            <div className="star-rating" aria-label={t.reviewRating}>
              <span>{t.reviewRating}</span>
              <div>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={Number(reviewRating) >= rating ? 'is-active' : undefined}
                    aria-label={`${rating} / 5`}
                    onClick={() => setReviewRating(String(rating))}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

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
                    {renderVisualIcon(getReviewAuthorIcon(review), 'review-card__avatar')}
                    <b>{review.authorName}</b>
                    <span className="review-stars">{renderStars(review.rating)}</span>
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
