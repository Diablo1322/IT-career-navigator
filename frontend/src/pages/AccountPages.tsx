import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { api, unwrap } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { LoadError, Loading, Meter, plural } from "../components/common";
import { ProfIcon } from "../components/icons";
import { useToast } from "../components/Toast";
import { useLoad } from "../hooks/useLoad";

/** Пускает только вошедших; гостя отправляет на вход с возвратом. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user === undefined) return <Loading text="Проверяем вход…" />;
  if (!user) return <Navigate to={`/auth?tab=login&next=${encodeURIComponent(pathname)}`} replace />;
  return <>{children}</>;
}

export function CabinetPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  // Прогресс по каждой доступной профессии берём из её карточки.
  const progress = useLoad(async () => {
    const { items } = await unwrap(api.GET("/professions"));
    const live = items.filter((p) => p.status === "available");
    return Promise.all(live.map((p) => unwrap(api.GET("/professions/{slug}", { params: { path: { slug: p.slug } } }))));
  }, [user?.id]);

  if (!user) return null;
  const doLogout = async () => {
    try { await logout(); toast("Вы вышли из аккаунта"); nav("/"); }
    catch { toast("Не удалось выйти, попробуйте ещё раз"); }
  };

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">Личный кабинет</span><h1 className="mt-8">Здравствуйте, {user.name}</h1>
          <div className="row mt-12 gap-8"><span className="chip">{user.email}</span>
            {user.email_verified ? <span className="chip good">Почта подтверждена</span> : <span className="chip gap">Почта не подтверждена</span>}</div></div>
        <div className="row"><button className="btn ghost" onClick={() => nav("/catalog")}>Каталог профессий</button><button className="btn ghost" onClick={doLogout}>Выйти из аккаунта</button></div>
      </div>
      {!user.email_verified && <div className="banner info fs-14"><span>Подтверждение почты появится в следующей версии — оно понадобится для оформления подписки.</span></div>}
      <h2 className="mb-16">Мои профессии</h2>
      {progress.loading && !progress.data ? <Loading /> : progress.error ? <LoadError error={progress.error} retry={progress.reload} /> : (
        <div className="grid3">
          {(progress.data ?? []).map((p) => {
            const pr = p.progress ?? { studied: 0, total: 0 };
            const pct = pr.total ? Math.round((pr.studied / pr.total) * 100) : 0;
            return (
              <button key={p.slug} className="pcard" onClick={() => nav(`/professions/${p.slug}`)}>
                <div className="row gap-10 nowrap"><ProfIcon slug={p.slug} small /><h3>{p.title}</h3></div>
                <div className="stack gap-6"><b className="mono big-num">{pct}%</b><Meter pct={pct} good />
                  <span className="muted fs-14">{pr.studied} из {pr.total} {plural(pr.total, ["темы", "тем", "тем"])} изучено</span></div>
                <span className="pc-go">{pr.studied ? "Продолжить →" : "Начать →"}</span>
              </button>
            );
          })}
        </div>
      )}
      <p className="muted fs-13 mt-16">Персональный план и оценка навыков появятся в следующей версии. Пока отмечайте изученные темы на <Link to="/catalog">карте профессии</Link>.</p>
    </>
  );
}

export function PricingPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  return (
    <>
      <div className="page-head"><div><span className="eyebrow">Подписка</span><h1 className="mt-8">Персональный план до первой работы</h1>
        <p className="muted">Базовые инструменты бесплатны. Подписка нужна, чтобы получить полный разбор и план под ваше время и сроки.</p></div></div>
      <div className="grid2 tiers">
        <div className="panel tier free"><div className="stack gap-6"><h3>Бесплатно</h3><span className="price">0 ₽</span></div>
          <ul><li>Каталог профессий</li><li>Общая карта тем профессии</li><li>Отметки «Изучено» после входа</li><li>Профориентация</li><li>Оценка навыков и краткий отчёт: процент и топ-3 пробела</li>
            <li className="no">Полный отчёт о разрыве</li><li className="no">Персональный план</li><li className="no">Персональная карта профессии</li></ul>
          {user ? <button className="btn ghost" disabled>Ваш текущий тариф</button> : <button className="btn ghost" onClick={() => nav("/auth?tab=register")}>Зарегистрироваться</button>}
        </div>
        <div className="panel tier pro"><div className="stack gap-6"><div className="row"><h3>Подписка</h3><span className="chip accent">рекомендуем</span></div>
          <span className="price">250 ₽ <span className="muted fs-16 ff-body fw-500">/ мес</span></span></div>
          <ul><li>Всё из бесплатного тарифа</li><li>Полный отчёт о разрыве: все навыки и пробелы</li><li>Персональный план: порядок тем, часы, итоговый срок</li><li>Персональная карта профессии с текущим шагом</li><li>Сводка по рынку труда</li><li>Пересчёт плана после повторной оценки</li></ul>
          <button className="btn primary" onClick={() => toast("Оплата подписки появится в следующей версии")}>Купить за 250 ₽</button>
          <p className="muted fs-13">Нажимая «Купить», вы принимаете условия <Link to="/terms">пользовательского соглашения</Link>. Отменить подписку можно в профиле.</p>
        </div>
      </div>
      <p className="stub-note mt-16">Оплата пока не подключена: подписка появится в следующей версии.</p>
    </>
  );
}
