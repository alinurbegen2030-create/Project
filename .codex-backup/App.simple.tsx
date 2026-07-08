import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

type Page = 'home' | 'gemini';

type Player = {
  id: string;
  name: string;
  avatarUrl: string;
  effect: string;
  game: string;
  platform: string;
  region: string;
  time: string;
  style: string;
  contact: string;
  about: string;
};

type PlayerForm = Omit<Player, 'id'>;

type TeamupProfileRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  effect: string | null;
  game: string;
  platform: string;
  region: string;
  play_time: string;
  style: string;
  contact: string;
  about: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const STORAGE_KEY = 'teamup-clean-player-profiles';

const starterPlayers: Player[] = [
  {
    id: 'starter-1',
    name: 'Alinur',
    avatarUrl: '',
    effect: 'rainbow',
    game: 'Roblox',
    platform: 'PC',
    region: 'Kazakhstan',
    time: 'После школы',
    style: 'Спокойно строю и прохожу карты',
    contact: '@alinur',
    about: 'Ищу напарника для Roblox и tower defense игр.',
  },
  {
    id: 'starter-2',
    name: 'PixelMate',
    avatarUrl: '',
    effect: 'blue',
    game: 'Minecraft',
    platform: 'PC / Mobile',
    region: 'CIS',
    time: 'Вечером',
    style: 'Выживание, строительство, мини-игры',
    contact: '@pixelmate',
    about: 'Люблю строить базы и играть без токсичности.',
  },
];

const emptyForm: PlayerForm = {
  name: '',
  avatarUrl: '',
  effect: 'glow',
  game: '',
  platform: '',
  region: '',
  time: '',
  style: '',
  contact: '',
  about: '',
};

function loadPlayers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? (JSON.parse(saved) as Player[]) : starterPlayers;
    return parsed.map((player) => ({
      ...player,
      avatarUrl: player.avatarUrl || '',
      effect: player.effect || 'glow',
    }));
  } catch {
    return starterPlayers;
  }
}

function getInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || 'TU';
}

function getEffectClass(effect: string) {
  return `avatar-effect avatar-effect-${effect || 'glow'}`;
}

function profileRowToPlayer(row: TeamupProfileRow): Player {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url || '',
    effect: row.effect || 'glow',
    game: row.game,
    platform: row.platform,
    region: row.region,
    time: row.play_time,
    style: row.style,
    contact: row.contact,
    about: row.about,
  };
}

function getInitialPage(): Page {
  return window.location.pathname === '/gemini' ? 'gemini' : 'home';
}

function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [geminiInput, setGeminiInput] = useState('');
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Привет! Я Gemini-помощник. Можешь попросить идею для игры, текст для анкеты, квесты, магазин или дизайн сайта.',
    },
  ]);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const featuredPlayer = players[0];

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players;

    return players.filter((player) =>
      [player.name, player.game, player.platform, player.region, player.style, player.about]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [players, search]);

  useEffect(() => {
    function handlePopState() {
      setPage(getInitialPage());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    async function loadSharedProfiles() {
      const { data, error } = await client
        .from('teamup_profiles')
        .select('id,name,avatar_url,effect,game,platform,region,play_time,style,contact,about')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const nextPlayers = (data as TeamupProfileRow[]).map(profileRowToPlayer);
        setPlayers(nextPlayers.length ? nextPlayers : starterPlayers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlayers));
      }
    }

    loadSharedProfiles();
  }, []);

  function navigate(nextPage: Page) {
    const path = nextPage === 'gemini' ? '/gemini' : '/';
    window.history.pushState({}, '', path);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function savePlayers(nextPlayers: Player[]) {
    setPlayers(nextPlayers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlayers));
  }

  function updateField(field: keyof PlayerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function publishProfile(event: FormEvent) {
    event.preventDefault();

    const nextProfile: Player = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      avatarUrl: form.avatarUrl.trim(),
      effect: form.effect,
      game: form.game.trim(),
      platform: form.platform.trim(),
      region: form.region.trim(),
      time: form.time.trim(),
      style: form.style.trim(),
      contact: form.contact.trim(),
      about: form.about.trim(),
    };

    savePlayers([nextProfile, ...players]);

    if (supabase) {
      const { data, error } = await supabase
        .from('teamup_profiles')
        .insert({
          name: nextProfile.name,
          avatar_url: nextProfile.avatarUrl,
          effect: nextProfile.effect,
          anonymous: false,
          age: 13,
          gender: 'Не указано',
          game: nextProfile.game,
          platform: nextProfile.platform,
          style: nextProfile.style,
          language: 'Русский',
          play_time: nextProfile.time,
          mic: false,
          region: nextProfile.region,
          goal: nextProfile.style,
          mode: 'Играть вместе',
          rank: 'Любой',
          experience: 'Любой',
          contact: nextProfile.contact,
          about: nextProfile.about,
          tags: [nextProfile.game, nextProfile.platform],
          color: nextProfile.effect,
        })
        .select('id,name,avatar_url,effect,game,platform,region,play_time,style,contact,about')
        .single();

      if (!error && data) {
        savePlayers([profileRowToPlayer(data as TeamupProfileRow), ...players]);
      }
    }

    setForm(emptyForm);
  }

  async function deleteProfile(id: string) {
    savePlayers(players.filter((player) => player.id !== id));
    if (supabase) {
      await supabase.from('teamup_profiles').delete().eq('id', id);
    }
  }

  async function sendGeminiMessage(event: FormEvent) {
    event.preventDefault();
    const prompt = geminiInput.trim();
    if (!prompt || geminiLoading) return;

    const nextMessages: ChatMessage[] = [...geminiMessages, { role: 'user', text: prompt }];
    setGeminiMessages(nextMessages);
    setGeminiInput('');
    setGeminiLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const result = (await response.json()) as { text?: string; error?: string };

      setGeminiMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: result.text || result.error || 'Gemini не ответил. Проверь ключ API.',
        },
      ]);
    } catch {
      setGeminiMessages([
        ...nextMessages,
        { role: 'assistant', text: 'Не получилось подключиться к Gemini API.' },
      ]);
    } finally {
      setGeminiLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('home')}>
          <span>TU</span>
          <strong>TeamUp</strong>
        </button>

        <nav aria-label="Главная навигация">
          <button type="button" onClick={() => navigate('home')}>Главная</button>
          <a href="#profiles" onClick={() => navigate('home')}>Игроки</a>
          <a href="#create" onClick={() => navigate('home')}>Анкета</a>
          <button type="button" onClick={() => navigate('gemini')}>Gemini</button>
        </nav>
      </header>

      {page === 'gemini' ? (
        <section className="gemini-page">
          <div className="section-title">
            <span>AI</span>
            <h1>Gemini помощник</h1>
          </div>

          <div className="gemini-chat" aria-live="polite">
            {geminiMessages.map((message, index) => (
              <article className={`gemini-message gemini-message-${message.role}`} key={`${message.role}-${index}`}>
                <strong>{message.role === 'user' ? 'Ты' : 'Gemini'}</strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <form className="gemini-form" onSubmit={sendGeminiMessage}>
            <textarea
              value={geminiInput}
              onChange={(event) => setGeminiInput(event.target.value)}
              placeholder="Напиши вопрос для Gemini..."
              rows={4}
            />
            <button type="submit" disabled={geminiLoading}>
              {geminiLoading ? 'Думает...' : 'Отправить'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="hero">
            <div>
              <p className="eyebrow">поиск напарников для игр</p>
              <h1>Найди с кем играть без лишних кнопок.</h1>
              <p>
                Оставь короткую анкету, выбери игру и найди игроков по региону, времени и стилю игры.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#create">Создать анкету</a>
                <a className="button button-secondary" href="#profiles">Смотреть игроков</a>
              </div>
              <div className="mobile-actions" aria-label="Быстрые разделы">
                <a href="#create">Анкета</a>
                <a href="#shop">Магазин</a>
                <button type="button" onClick={() => navigate('gemini')}>Gemini</button>
              </div>
            </div>

            <aside className="avatar-hero-card" aria-label="Твоя иконка">
              <div className={getEffectClass(featuredPlayer.effect)}>
                {featuredPlayer.avatarUrl ? (
                  <img src={featuredPlayer.avatarUrl} alt={featuredPlayer.name} />
                ) : (
                  <span>{getInitials(featuredPlayer.name)}</span>
                )}
              </div>
              <strong>{featuredPlayer.name}</strong>
              <small>эффект виден в профиле</small>
            </aside>

            <aside className="hero-card" aria-label="Статистика сайта">
              <span>{players.length}</span>
              <strong>анкет на сайте</strong>
              <small>данные сохраняются в браузере и в базе, если Supabase подключён</small>
            </aside>
          </section>

          <section className="content-grid">
            <form id="create" className="panel profile-form" onSubmit={publishProfile}>
              <div className="section-title">
                <span>01</span>
                <h2>Твоя анкета</h2>
              </div>

              <label>
                Ник
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Например: Alinur" required />
              </label>

              <label>
                Ссылка на иконку
                <input value={form.avatarUrl} onChange={(event) => updateField('avatarUrl', event.target.value)} placeholder="https://..." />
              </label>

              <label>
                Эффект иконки
                <select value={form.effect} onChange={(event) => updateField('effect', event.target.value)}>
                  <option value="glow">Glow</option>
                  <option value="rainbow">Rainbow</option>
                  <option value="blue">Blue</option>
                  <option value="gold">Gold</option>
                </select>
              </label>

              <label>
                Игра
                <input value={form.game} onChange={(event) => updateField('game', event.target.value)} placeholder="Roblox, Minecraft, Brawl Stars" required />
              </label>

              <div className="two-columns">
                <label>
                  Платформа
                  <input value={form.platform} onChange={(event) => updateField('platform', event.target.value)} placeholder="PC / Mobile" required />
                </label>

                <label>
                  Регион
                  <input value={form.region} onChange={(event) => updateField('region', event.target.value)} placeholder="Kazakhstan" required />
                </label>
              </div>

              <label>
                Когда играешь
                <input value={form.time} onChange={(event) => updateField('time', event.target.value)} placeholder="Вечером, после школы" required />
              </label>

              <label>
                Стиль игры
                <input value={form.style} onChange={(event) => updateField('style', event.target.value)} placeholder="Фарм, стройка, ranked, chill" required />
              </label>

              <label>
                Контакт
                <input value={form.contact} onChange={(event) => updateField('contact', event.target.value)} placeholder="Discord или Telegram" required />
              </label>

              <label>
                О себе
                <textarea value={form.about} onChange={(event) => updateField('about', event.target.value)} placeholder="Кого ищешь и как любишь играть" rows={4} required />
              </label>

              <button type="submit">Опубликовать</button>
            </form>

            <section id="profiles" className="panel players-panel">
              <div className="section-title">
                <span>02</span>
                <h2>Игроки</h2>
              </div>

              <label className="search">
                Поиск
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Игра, ник, регион или стиль" />
              </label>

              <div className="player-list">
                {filteredPlayers.length === 0 ? (
                  <p className="empty-state">Ничего не найдено. Попробуй другой запрос.</p>
                ) : (
                  filteredPlayers.map((player) => (
                    <article className="player-card" key={player.id}>
                      <div className={getEffectClass(player.effect)}>
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.name} />
                        ) : (
                          <span>{getInitials(player.name)}</span>
                        )}
                      </div>
                      <div className="player-card-header">
                        <div>
                          <h3>{player.name}</h3>
                          <p>{player.game}</p>
                        </div>
                        <button type="button" onClick={() => deleteProfile(player.id)} aria-label={`Удалить анкету ${player.name}`}>
                          Удалить
                        </button>
                      </div>

                      <dl>
                        <div>
                          <dt>Платформа</dt>
                          <dd>{player.platform}</dd>
                        </div>
                        <div>
                          <dt>Регион</dt>
                          <dd>{player.region}</dd>
                        </div>
                        <div>
                          <dt>Время</dt>
                          <dd>{player.time}</dd>
                        </div>
                        <div>
                          <dt>Контакт</dt>
                          <dd>{player.contact}</dd>
                        </div>
                      </dl>

                      <p>{player.style}</p>
                      <small>{player.about}</small>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>

          <section className="feature-grid" aria-label="Функции сайта">
            <article id="shop" className="panel feature-card">
              <div className="section-title">
                <span>03</span>
                <h2>Магазин</h2>
              </div>
              <p>Здесь будут VIP, бусты анкеты, рамки профиля и другие покупки для сайта.</p>
              <div className="shop-items">
                <span>VIP</span>
                <span>Boost</span>
                <span>Icons</span>
              </div>
            </article>

            <article id="quests" className="panel feature-card">
              <div className="section-title">
                <span>04</span>
                <h2>Квесты</h2>
              </div>
              <p>Задания для активности: создать анкету, найти игрока, обновить профиль и заходить каждый день.</p>
              <ul className="quest-list">
                <li>Создай анкету</li>
                <li>Найди игрока</li>
                <li>Зайди завтра</li>
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
