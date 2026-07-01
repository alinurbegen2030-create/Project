import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthProps = {
  user: User | null;
  notice?: string;
};

const NAME_PREFIXES = ['Team', 'Pixel', 'Nova', 'Game', 'Turbo', 'Shadow', 'Star', 'Quest', 'Rocket', 'Cyber'];
const NAME_SUFFIXES = ['Player', 'Mate', 'Hero', 'Gamer', 'Hunter', 'Builder', 'Runner', 'Ninja', 'Wizard', 'Rider'];

function makeSuggestedUsername() {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  const number = Math.floor(100 + Math.random() * 9900);

  return `${prefix}${suffix}${number}`;
}

async function isSuggestedUsernameFree(name: string) {
  if (!supabase) return true;

  const { data, error } = await supabase.from('teamup_profiles').select('id').ilike('name', name).limit(1);

  if (error) return true;
  return !data?.length;
}

function legacyUsernameEmail(value: string) {
  const cleanName = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return cleanName ? `${cleanName}@teamup.local` : '';
}

function encodedUsernameEmail(value: string) {
  const normalizedName = value.trim().toLowerCase();
  const bytes = new TextEncoder().encode(normalizedName);
  const hexName = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hexName ? `u-${hexName}@teamup.local` : '';
}

function usernameEmailOptions(value: string) {
  const trimmed = value.trim();
  const options = trimmed.includes('@')
    ? [trimmed]
    : [legacyUsernameEmail(trimmed), encodedUsernameEmail(trimmed)];

  return Array.from(new Set(options.filter(Boolean)));
}

function displayNameFromEmail(email?: string) {
  if (!email) return 'player';

  const localPart = email.split('@')[0];
  if (!localPart.startsWith('u-')) return localPart;

  try {
    const hex = localPart.slice(2);
    const bytes = hex.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [];
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return 'player';
  }
}

function friendlyAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) return 'Неверное имя или пароль.';
  if (lowerMessage.includes('user already registered')) return 'Такой аккаунт уже есть. Нажми "Войти".';
  if (lowerMessage.includes('email rate limit')) {
    return 'Слишком много попыток. Подожди немного и попробуй снова.';
  }

  return message;
}

export function Auth({ user, notice }: AuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [suggestionBusy, setSuggestionBusy] = useState(false);

  useEffect(() => {
    if (!user) void refreshSuggestedUsername();
  }, [user]);

  async function refreshSuggestedUsername() {
    setSuggestionBusy(true);

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = makeSuggestedUsername();
        const isFree = await isSuggestedUsernameFree(candidate);

        if (isFree) {
          setSuggestedUsername(candidate);
          return;
        }
      }

      setSuggestedUsername(makeSuggestedUsername());
    } finally {
      setSuggestionBusy(false);
    }
  }

  async function signInWithAnyUsername() {
    const emailOptions = usernameEmailOptions(username);
    let lastError = '';

    for (const email of emailOptions) {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (!error) return true;
      lastError = error.message;
    }

    setMessage(friendlyAuthError(lastError || 'Не удалось войти.'));
    return false;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!username.trim()) {
      setMessage('Напиши имя.');
      return;
    }

    if (!supabase) {
      setMessage('База пока не подключена. Вход заработает после подключения Supabase.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const email = usernameEmailOptions(username)[0];
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          setMessage(friendlyAuthError(signUpError.message));
          void refreshSuggestedUsername();
          return;
        }

        const signedIn = await signInWithAnyUsername();
        if (signedIn) setMessage('Аккаунт создан. Вход выполнен.');
        return;
      }

      const signedIn = await signInWithAnyUsername();
      if (signedIn) setMessage('Вход выполнен.');
    } catch {
      setMessage('Что-то пошло не так. Попробуй еще раз.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage('Ты вышел из аккаунта.');
  }

  if (user) {
    return (
      <section className="panel auth-panel">
        <h2>Аккаунт</h2>
        <p className="message">Ты вошел как {displayNameFromEmail(user.email)}</p>
        <button className="ghost" type="button" onClick={signOut}>
          Выйти
        </button>
      </section>
    );
  }

  return (
    <section className="panel auth-panel">
      <h2>{mode === 'signin' ? 'Вход' : 'Регистрация'}</h2>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Имя
          <input
            type="text"
            autoComplete="username"
            placeholder="Напиши имя или выбери ниже"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <div className="username-suggestion">
          <span>
            Рекомендуемое имя: <strong>{suggestionBusy ? 'ищем...' : suggestedUsername}</strong>
          </span>
          <div>
            <button
              className="suggestion-button"
              type="button"
              disabled={!suggestedUsername || suggestionBusy || busy}
              onClick={() => {
                setUsername(suggestedUsername);
                setMessage('');
              }}
            >
              Взять
            </button>
            <button
              className="suggestion-button"
              type="button"
              disabled={suggestionBusy || busy}
              onClick={() => void refreshSuggestedUsername()}
            >
              Другое
            </button>
          </div>
        </div>

        <label>
          Пароль
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? 'Подожди...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      {notice && !message && <p className="message">{notice}</p>}
      {message && <p className="message">{message}</p>}

      <button className="ghost" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </section>
  );
}
