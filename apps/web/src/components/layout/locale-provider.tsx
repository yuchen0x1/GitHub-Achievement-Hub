'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'zh-CN' | 'en-US';
export type LocaleSetting = 'auto' | Locale;

const STORAGE_KEY = 'gach:locale';

const messages = {
  'zh-CN': {
    home: '首页', achievements: '勋章图鉴', guides: '获取攻略', tiers: '勋章等级',
    profile: '成就查询', faq: '常见问题', about: '关于本站', collection: '收藏馆',
    progress: '我的进度', admin: '后台', login: '登录', logout: '退出登录',
    language: '语言', auto: '自动', theme: '主题', skip: '跳到主要内容',
  },
  'en-US': {
    home: 'Home', achievements: 'Achievements', guides: 'Guides', tiers: 'Badge tiers',
    profile: 'Profile lookup', faq: 'FAQ', about: 'About', collection: 'Collection',
    progress: 'My progress', admin: 'Admin', login: 'Sign in', logout: 'Sign out',
    language: 'Language', auto: 'Auto', theme: 'Theme', skip: 'Skip to main content',
  },
} as const;

export function resolveLocale(setting: LocaleSetting, candidates: readonly string[] = []): Locale {
  if (setting === 'zh-CN' || setting === 'en-US') return setting;
  const values = candidates.length ? candidates : ['zh-CN'];
  for (const candidate of values) {
    const value = String(candidate).toLowerCase();
    if (value === 'en' || value.startsWith('en-')) return 'en-US';
    if (value === 'zh' || value.startsWith('zh-')) return 'zh-CN';
  }
  return 'zh-CN';
}

function readSetting(): LocaleSetting {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'zh-CN' || value === 'en-US' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

type I18nContextValue = {
  locale: Locale;
  setting: LocaleSetting;
  setSetting: (value: LocaleSetting) => void;
  t: (key: keyof typeof messages['zh-CN']) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSettingState] = useState<LocaleSetting>('auto');
  const [locale, setLocale] = useState<Locale>('zh-CN');

  useEffect(() => {
    const nextSetting = readSetting();
    setSettingState(nextSetting);
    setLocale(resolveLocale(nextSetting, navigator.languages || [navigator.language]));
  }, []);

  useEffect(() => {
    const next = resolveLocale(setting, navigator.languages || [navigator.language]);
    setLocale(next);
    document.documentElement.lang = next;
    try { window.localStorage.setItem(STORAGE_KEY, setting); } catch { /* private mode */ }
  }, [setting]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setting,
    setSetting: setSettingState,
    t: (key) => messages[locale][key],
  }), [locale, setting]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside LocaleProvider');
  return context;
}
