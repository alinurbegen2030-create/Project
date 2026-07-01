import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthProps = {
  user: User | null;
  notice?: string;
  language?: SupportedUiLanguage;
  visualProfile?: UserVisualProfile | null;
  iconOptions?: string[];
  onVisualProfileChange?: (profile: UserVisualProfile) => void | Promise<void>;
};

type SupportedUiLanguage = 'ru' | 'kk' | 'en';
type AuthMethod = 'username' | 'email';
type OAuthProvider = 'google' | 'github' | 'discord';

type UserVisualProfile = {
  displayName: string;
  icon: string;
};

const authCopy: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    account: 'Аккаунт',
    signedInAs: 'Ты вошел как',
    signOut: 'Выйти',
    signInTitle: 'Вход',
    signUpTitle: 'Регистрация',
    username: 'Имя',
    usernamePlaceholder: 'Напиши имя или выбери ниже',
    recommendedName: 'Рекомендуемое имя',
    searching: 'ищем...',
    take: 'Взять',
    another: 'Другое',
    password: 'Пароль',
    passwordPlaceholder: 'Минимум 6 символов',
    wait: 'Подожди...',
    signIn: 'Войти',
    signUp: 'Зарегистрироваться',
    needAccount: 'Нет аккаунта? Зарегистрироваться',
    haveAccount: 'Уже есть аккаунт? Войти',
    invalidCredentials: 'Неверное имя или пароль.',
    userExists: 'Такой аккаунт уже есть. Нажми "Войти".',
    rateLimit: 'Слишком много попыток. Подожди немного и попробуй снова.',
    signInFailed: 'Не удалось войти.',
    writeName: 'Напиши имя.',
    noSupabase: 'База пока не подключена. Вход заработает после подключения Supabase.',
    created: 'Аккаунт создан. Вход выполнен.',
    signedIn: 'Вход выполнен.',
    unknownError: 'Что-то пошло не так. Попробуй еще раз.',
    signedOut: 'Ты вышел из аккаунта.',
  },
  kk: {
    account: 'Аккаунт',
    signedInAs: 'Сен кірдің:',
    signOut: 'Шығу',
    signInTitle: 'Кіру',
    signUpTitle: 'Тіркелу',
    username: 'Аты',
    usernamePlaceholder: 'Атыңды жаз немесе төменнен таңда',
    recommendedName: 'Ұсынылған ат',
    searching: 'іздеп жатырмыз...',
    take: 'Алу',
    another: 'Басқа',
    password: 'Құпиясөз',
    passwordPlaceholder: 'Кемінде 6 таңба',
    wait: 'Күте тұр...',
    signIn: 'Кіру',
    signUp: 'Тіркелу',
    needAccount: 'Аккаунт жоқ па? Тіркелу',
    haveAccount: 'Аккаунт бар ма? Кіру',
    invalidCredentials: 'Аты немесе құпиясөз дұрыс емес.',
    userExists: 'Мұндай аккаунт бар. "Кіру" батырмасын бас.',
    rateLimit: 'Әрекет тым көп. Біраз күтіп, қайта көр.',
    signInFailed: 'Кіру мүмкін болмады.',
    writeName: 'Атыңды жаз.',
    noSupabase: 'База әлі қосылмаған. Supabase қосылғаннан кейін кіру жұмыс істейді.',
    created: 'Аккаунт жасалды. Кіру орындалды.',
    signedIn: 'Кіру орындалды.',
    unknownError: 'Бірдеңе дұрыс болмады. Қайта көр.',
    signedOut: 'Аккаунттан шықтың.',
  },
  en: {
    account: 'Account',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
    signInTitle: 'Sign in',
    signUpTitle: 'Create account',
    username: 'Name',
    usernamePlaceholder: 'Type a name or choose one below',
    recommendedName: 'Recommended name',
    searching: 'searching...',
    take: 'Use it',
    another: 'Another',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    wait: 'Wait...',
    signIn: 'Sign in',
    signUp: 'Create account',
    needAccount: 'No account? Create one',
    haveAccount: 'Already have an account? Sign in',
    invalidCredentials: 'Wrong name or password.',
    userExists: 'This account already exists. Press "Sign in".',
    rateLimit: 'Too many attempts. Wait a bit and try again.',
    signInFailed: 'Could not sign in.',
    writeName: 'Type a name.',
    noSupabase: 'The database is not connected yet. Sign-in will work after Supabase is connected.',
    created: 'Account created. You are signed in.',
    signedIn: 'Signed in.',
    unknownError: 'Something went wrong. Try again.',
    signedOut: 'You signed out.',
  },
};

const authExtraCopy: Record<SupportedUiLanguage, Record<string, string>> = {
  ru: {
    email: 'Email',
    usernameLogin: 'Имя',
    emailLogin: 'Email',
    emailPlaceholder: 'you@example.com',
    oauthTitle: 'Или войди через',
    continueWithGoogle: 'Google',
    continueWithGithub: 'GitHub',
    continueWithDiscord: 'Discord',
    writeEmail: 'Напиши email.',
    visualName: 'Визуальное имя',
    visualNamePlaceholder: 'Как тебя показывать на сайте',
    accountIcon: 'Иконка',
    realLoginName: 'Настоящий вход',
    saveVisual: 'Сохранить вид',
    visualSaved: 'Визуальное имя сохранено.',
  },
  kk: {
    email: 'Email',
    usernameLogin: 'Аты',
    emailLogin: 'Email',
    emailPlaceholder: 'you@example.com',
    oauthTitle: 'Немесе мынамен кір',
    continueWithGoogle: 'Google',
    continueWithGithub: 'GitHub',
    continueWithDiscord: 'Discord',
    writeEmail: 'Email жаз.',
    visualName: 'Көрінетін ат',
    visualNamePlaceholder: 'Сайтта қалай көрсетілесің',
    accountIcon: 'Иконка',
    realLoginName: 'Нақты кіру',
    saveVisual: 'Сақтау',
    visualSaved: 'Көрінетін ат сақталды.',
  },
  en: {
    email: 'Email',
    usernameLogin: 'Name',
    emailLogin: 'Email',
    emailPlaceholder: 'you@example.com',
    oauthTitle: 'Or continue with',
    continueWithGoogle: 'Google',
    continueWithGithub: 'GitHub',
    continueWithDiscord: 'Discord',
    writeEmail: 'Type an email.',
    visualName: 'Display name',
    visualNamePlaceholder: 'How you appear on the site',
    accountIcon: 'Icon',
    realLoginName: 'Real login',
    saveVisual: 'Save look',
    visualSaved: 'Display name saved.',
  },
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

function friendlyAuthError(message: string, copy: Record<string, string>) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) return copy.invalidCredentials;
  if (lowerMessage.includes('user already registered')) return copy.userExists;
  if (lowerMessage.includes('email rate limit')) {
    return copy.rateLimit;
  }

  return message;
}

export function Auth({
  user,
  notice,
  language = 'ru',
  visualProfile,
  iconOptions = ['TU', 'GG', 'XP', 'LV', 'HP', 'VR'],
  onVisualProfileChange,
}: AuthProps) {
  const copy = { ...authCopy[language], ...authExtraCopy[language] };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('username');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [visualNameDraft, setVisualNameDraft] = useState('');
  const [iconDraft, setIconDraft] = useState(iconOptions[0] ?? 'TU');

  useEffect(() => {
    if (!user) void refreshSuggestedUsername();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setVisualNameDraft(visualProfile?.displayName ?? displayNameFromEmail(user.email));
    setIconDraft(visualProfile?.icon ?? iconOptions[0] ?? 'TU');
  }, [iconOptions, user, visualProfile]);

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

  function getAuthEmailOptions() {
    return authMethod === 'email' ? [username.trim()] : usernameEmailOptions(username);
  }

  async function signInWithPassword() {
    const emailOptions = getAuthEmailOptions();
    let lastError = '';

    for (const email of emailOptions) {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (!error) return true;
      lastError = error.message;
    }

    setMessage(friendlyAuthError(lastError || copy.signInFailed, copy));
    return false;
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    if (!supabase) {
      setMessage(copy.noSupabase);
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) setMessage(friendlyAuthError(error.message, copy));
    } catch {
      setMessage(copy.unknownError);
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!username.trim()) {
      setMessage(authMethod === 'email' ? copy.writeEmail : copy.writeName);
      return;
    }

    if (!supabase) {
      setMessage(copy.noSupabase);
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const email = getAuthEmailOptions()[0];
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          setMessage(friendlyAuthError(signUpError.message, copy));
          void refreshSuggestedUsername();
          return;
        }

        const signedIn = await signInWithPassword();
        if (signedIn) setMessage(copy.created);
        return;
      }

      const signedIn = await signInWithPassword();
      if (signedIn) setMessage(copy.signedIn);
    } catch {
      setMessage(copy.unknownError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage(copy.signedOut);
  }

  async function saveVisualSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!onVisualProfileChange) return;

    setBusy(true);
    setMessage('');

    try {
      await onVisualProfileChange({
        displayName: visualNameDraft,
        icon: iconDraft,
      });
      setMessage(copy.visualSaved);
    } catch {
      setMessage(copy.unknownError);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <section className="panel auth-panel">
        <h2>{copy.account}</h2>
        <div className="account-preview">
          <span>{visualProfile?.icon ?? iconDraft}</span>
          <div>
            <b>{visualProfile?.displayName || visualNameDraft || displayNameFromEmail(user.email)}</b>
            <small>{copy.realLoginName}: {displayNameFromEmail(user.email)}</small>
          </div>
        </div>

        <form className="visual-settings" onSubmit={saveVisualSettings}>
          <label>
            {copy.visualName}
            <input
              value={visualNameDraft}
              placeholder={copy.visualNamePlaceholder}
              onChange={(event) => setVisualNameDraft(event.target.value)}
              maxLength={28}
            />
          </label>

          <div>
            <span>{copy.accountIcon}</span>
            <div className="icon-picker">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={iconDraft === icon ? 'is-active' : undefined}
                  onClick={() => setIconDraft(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={busy || !onVisualProfileChange}>
            {copy.saveVisual}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
        <button className="ghost" type="button" onClick={signOut}>
          {copy.signOut}
        </button>
      </section>
    );
  }

  return (
    <section className="panel auth-panel">
      <h2>{mode === 'signin' ? copy.signInTitle : copy.signUpTitle}</h2>

      <form onSubmit={handleSubmit} className="form">
        <div className="auth-methods" aria-label={copy.oauthTitle}>
          <button
            type="button"
            className={authMethod === 'username' ? 'is-active' : undefined}
            onClick={() => {
              setAuthMethod('username');
              setMessage('');
            }}
          >
            {copy.usernameLogin}
          </button>
          <button
            type="button"
            className={authMethod === 'email' ? 'is-active' : undefined}
            onClick={() => {
              setAuthMethod('email');
              setMessage('');
            }}
          >
            {copy.emailLogin}
          </button>
        </div>

        <label>
          {authMethod === 'email' ? copy.email : copy.username}
          <input
            type={authMethod === 'email' ? 'email' : 'text'}
            autoComplete={authMethod === 'email' ? 'email' : 'username'}
            placeholder={authMethod === 'email' ? copy.emailPlaceholder : copy.usernamePlaceholder}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        {mode === 'signup' && authMethod === 'username' && (
        <div className="username-suggestion">
          <span>
            {copy.recommendedName}: <strong>{suggestionBusy ? copy.searching : suggestedUsername}</strong>
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
              {copy.take}
            </button>
            <button
              className="suggestion-button"
              type="button"
              disabled={suggestionBusy || busy}
              onClick={() => void refreshSuggestedUsername()}
            >
              {copy.another}
            </button>
          </div>
        </div>
        )}

        <label>
          {copy.password}
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? copy.wait : mode === 'signin' ? copy.signIn : copy.signUp}
        </button>

        <div className="oauth-block">
          <span>{copy.oauthTitle}</span>
          <div className="oauth-buttons">
            <button type="button" disabled={busy} onClick={() => signInWithOAuth('google')}>
              {copy.continueWithGoogle}
            </button>
            <button type="button" disabled={busy} onClick={() => signInWithOAuth('github')}>
              {copy.continueWithGithub}
            </button>
            <button type="button" disabled={busy} onClick={() => signInWithOAuth('discord')}>
              {copy.continueWithDiscord}
            </button>
          </div>
        </div>
      </form>

      {notice && !message && <p className="message">{notice}</p>}
      {message && <p className="message">{message}</p>}

      <button className="ghost" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? copy.needAccount : copy.haveAccount}
      </button>
    </section>
  );
}
