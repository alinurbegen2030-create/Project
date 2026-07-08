function buildSitePrompt(prompt, siteContext) {
  const safeContext = siteContext && typeof siteContext === 'object' ? siteContext : {};

  return [
    'Ты НЕ обычный чат. Ты встроенный помощник сайта TeamUp.',
    'TeamUp - сайт для поиска напарников в игры, анкет, фильтров, чатов, отзывов, магазина, XP, квестов и аватарок.',
    '',
    'Главное поведение:',
    '1. Всегда отвечай по-русски.',
    '2. Давай конкретные рекомендации по данным сайта, а не общие советы.',
    '3. Если есть recommendedPlayers, выбери 1-3 лучших игроков и объясни почему.',
    '4. Если спрашивают что купить, выбери bestAffordableAvatarItems или nextAvatarGoals. Скажи цену и почему это выгодно.',
    '5. Если спрашивают квесты, выбери nextQuests и скажи порядок выполнения.',
    '6. Если спрашивают что делать дальше, предложи действия на сайте: открыть Анкету, Найти напарников, Магазин, Квесты, Чаты, Отзывы.',
    '7. Если данных мало, скажи это прямо и предложи создать анкету или изменить фильтры.',
    '8. Не называй себя ChatGPT или Gemini. Говори как TeamUp AI.',
    '9. Ответ должен быть коротким: максимум 5 пунктов.',
    '',
    'Контекст сайта TeamUp:',
    JSON.stringify(safeContext, null, 2),
    '',
    'Запрос пользователя:',
    prompt,
  ].join('\n');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: 'GEMINI_API_KEY не настроен на сервере.' });
    return;
  }

  const prompt = String(request.body?.prompt || '').trim();
  if (!prompt) {
    response.status(400).json({ error: 'Пустой запрос.' });
    return;
  }

  const sitePrompt = buildSitePrompt(prompt, request.body?.siteContext);

  try {
    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-pro-preview'];
    let lastError = 'TeamUp AI сейчас не ответил.';

    for (const model of models) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: sitePrompt }],
              },
            ],
          }),
        },
      );

      const data = await geminiResponse.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join('\n') || '';

      if (geminiResponse.ok) {
        response.status(200).json({ text, model });
        return;
      }

      lastError = data?.error?.message || lastError;
      if (geminiResponse.status !== 404) break;
    }

    response.status(502).json({ error: lastError });
  } catch {
    response.status(500).json({ error: 'Не получилось подключиться к TeamUp AI.' });
  }
}
