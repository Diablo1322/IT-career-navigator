import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { IcoMoon, IcoSun, IcoUser, LogoMark } from "./icons";

function isDark(): boolean {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}

function Topbar() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(isDark);

  useEffect(() => { setOpen(false); }, [pathname]);

  const toggleTheme = () => {
    const t = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("nav-theme", t); } catch { /* приватный режим */ }
    setDark(t === "dark");
  };

  const items: [string, string, string?][] = user
    ? [["/catalog", "Каталог профессий"], ["/plan", "Мой план"], ["/pricing", "Подписка"], ["/cabinet", "Личный кабинет", "cta"]]
    : [["/catalog", "Каталог профессий"], ["/pricing", "Подписка"], ["/auth?tab=login", "Войти", "cta"]];

  return (
    <div className={"wrap" + (open ? " menu-open" : "")}>
      <button className="logo" onClick={() => nav("/")}>
        <LogoMark />
        <span className="logo-t">Карьерный навигатор&nbsp;<b>IT</b></span>
      </button>
      <button
        className={"acct" + (user ? " on" : "")} aria-label={user ? "Личный кабинет" : "Войти"}
        onClick={() => nav(user ? "/cabinet" : "/auth?tab=login")}
      >
        {user ? user.name.trim().charAt(0).toUpperCase() || "?" : <IcoUser />}
      </button>
      <button className="burger" aria-label="Меню" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
      <nav className="nav">
        <button className="theme" aria-label={dark ? "Светлая тема" : "Тёмная тема"} title={dark ? "Светлая тема" : "Тёмная тема"} onClick={toggleTheme}>
          {dark ? <IcoSun /> : <IcoMoon />}
        </button>
        {items.map(([to, t, cls]) => (
          <button key={to} className={`${cls ?? ""} ${pathname === to.split("?")[0] ? "on" : ""}`} onClick={() => nav(to)}>{t}</button>
        ))}
      </nav>
    </div>
  );
}

function Footer() {
  const nav = useNavigate();
  return (
    <div className="wrap">
      <div className="f-grid">
        <div className="f-brand">
          <button className="logo" onClick={() => nav("/")}><LogoMark /><span className="logo-t">Карьерный навигатор&nbsp;<b>IT</b></span></button>
          <p className="muted">Навигатор для тех, кто входит в IT: выберите профессию, узнайте свой уровень и учитесь по плану.</p>
        </div>
        <div className="f-col f-info"><span className="eyebrow">Сервис</span>
          <div className="f-links">
            <button onClick={() => nav("/catalog")}>Каталог профессий</button>
            <button onClick={() => nav("/quiz")}>Тест на профориентацию</button>
            <button onClick={() => nav("/pricing")}>Подписка</button>
          </div>
        </div>
        <div className="f-col f-info"><span className="eyebrow">Информация</span>
          <div className="f-links">
            <button onClick={() => nav("/policy")}>Политика конфиденциальности</button>
            <button onClick={() => nav("/terms")}>Пользовательское соглашение</button>
            <button onClick={() => nav("/about")}>О проекте</button>
          </div>
        </div>
        <div className="f-col"><span className="eyebrow">Контакты</span>
          <a href="mailto:info@navigator-it.ru">info@navigator-it.ru</a><span>Telegram: @navigator_it</span>
          <span className="muted">Пн–Пт, 10:00–19:00 (МСК)</span>
        </div>
      </div>
      <div className="f-bottom"><span>© 2026 Карьерный навигатор IT</span><span>Данные о вакансиях обновляются раз в месяц</span></div>
    </div>
  );
}

function CookieBar() {
  const [ok, setOk] = useState(() => { try { return localStorage.getItem("nav-cookie") === "1"; } catch { return false; } });
  useEffect(() => { document.body.classList.toggle("has-cookie", !ok); }, [ok]);
  if (ok) return null;
  const accept = () => { try { localStorage.setItem("nav-cookie", "1"); } catch { /* приватный режим */ } setOk(true); };
  return (
    <div className="cookie" role="region" aria-label="Файлы cookie">
      <div className="cookie-in">
        <p>Мы используем файлы cookie. Продолжая пользоваться сайтом, вы соглашаетесь с <Link to="/policy">политикой конфиденциальности</Link>.</p>
        <button className="btn primary sm" onClick={accept}>Понятно</button>
      </div>
    </div>
  );
}

/** Каркас страницы: шапка, контент, подвал — как в прототипе. */
export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <header className="top"><Topbar /></header>
      <main><div className="wrap"><Outlet /></div></main>
      <footer><Footer /></footer>
      <CookieBar />
    </>
  );
}
