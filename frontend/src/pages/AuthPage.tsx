import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Куда вернуть после входа: только внутренние пути. */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/catalog";
}

type Errors = Record<string, string>;

function Field({ id, label, hint, error, ...input }: { id: string; label: React.ReactNode; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} {...input} />
      {error && <span className="err" id={`${id}-err`}>{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Ошибки API → ошибки полей формы и общее сообщение. */
function apiErrors(e: unknown): Errors {
  if (!(e instanceof ApiError)) return { form: "Что-то пошло не так, попробуйте позже" };
  switch (e.code) {
    case "validation_error": return { ...e.fields };
    case "email_taken": return { email: e.message };
    case "invalid_credentials": return { form: e.message };
    case "too_many_attempts": {
      const min = e.retryAfter ? Math.ceil(e.retryAfter / 60) : 15;
      return { form: `Слишком много попыток входа. Попробуйте через ${min} мин.` };
    }
    default: return { form: e.status === 0 ? "Нет связи с сервером. Проверьте интернет." : e.message };
  }
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { register } = useAuth();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("rName")).trim(), email = String(f.get("rMail")).trim(), password = String(f.get("rPass"));
    const errs: Errors = {};
    if (!name) errs.rName = "Укажите имя";
    if (!isEmail(email)) errs.rMail = "Проверьте адрес почты";
    if (password.length < 8) errs.rPass = "Пароль должен быть не короче 8 символов";
    if (!f.get("rOk")) errs.consent = "Без согласия на обработку данных зарегистрироваться нельзя.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await register({ name, email, password, consent_pd: true });
      onDone();
    } catch (err) {
      const a = apiErrors(err);
      setErrors({ rName: a.name, rMail: a.email, rPass: a.password, consent: a.consent_pd, form: a.form });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel stack" noValidate onSubmit={submit}>
      <h2>Создать аккаунт</h2>
      <Field id="rName" label="Имя" type="text" autoComplete="name" error={errors.rName} />
      <Field id="rMail" label="Почта" type="email" autoComplete="email" error={errors.rMail} />
      <Field id="rPass" label="Пароль" type="password" autoComplete="new-password" hint="Не короче 8 символов" error={errors.rPass} />
      <label className="check"><input type="checkbox" name="rOk" /><span>Принимаю <Link to="/terms">пользовательское соглашение</Link> и даю <Link to="/consent">согласие на обработку персональных данных</Link></span></label>
      {errors.consent && <span className="err">{errors.consent}</span>}
      {errors.form && <span className="err" role="alert">{errors.form}</span>}
      <button className="btn primary" type="submit" disabled={busy}>{busy ? "Создаём аккаунт…" : "Зарегистрироваться"}</button>
    </form>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("lMail")).trim(), password = String(f.get("lPass"));
    const errs: Errors = {};
    if (!isEmail(email)) errs.lMail = "Проверьте адрес почты";
    if (!password) errs.lPass = "Введите пароль";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await login(email, password);
      onDone();
    } catch (err) {
      const a = apiErrors(err);
      setErrors({ lMail: a.email, form: a.form });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel stack" noValidate onSubmit={submit}>
      <h2>Вход</h2>
      <Field id="lMail" label="Почта" type="email" autoComplete="email" error={errors.lMail} />
      <Field id="lPass" label="Пароль" type="password" autoComplete="current-password" error={errors.lPass} />
      {errors.form && <span className="err" role="alert">{errors.form}</span>}
      <div className="row between">
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Входим…" : "Войти"}</button>
        <button type="button" className="btn link" onClick={() => nav("/reset")}>Забыли пароль?</button>
      </div>
    </form>
  );
}

export function AuthPage() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "login" ? "login" : "register";
  const next = params.get("next");

  if (user) return <Navigate to={safeNext(next)} replace />;

  const setTab = (t: string) => { params.set("tab", t); setParams(params, { replace: true }); };
  const done = (msg: string) => () => { toast(msg); nav(safeNext(next), { replace: true }); };

  return (
    <div className="auth">
      <div className="tabs">
        <button className={tab === "register" ? "on" : ""} onClick={() => setTab("register")}>Регистрация</button>
        <button className={tab === "login" ? "on" : ""} onClick={() => setTab("login")}>Вход</button>
      </div>
      {next && next !== "/" && <div className="banner info fs-14">Войдите, чтобы продолжить. После входа вернём вас обратно.</div>}
      {tab === "register" ? <RegisterForm onDone={done("Аккаунт создан")} /> : <LoginForm onDone={done("Вы вошли")} />}
    </div>
  );
}

export function ResetPage() {
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  return (
    <div className="auth">
      <form className="panel stack" noValidate onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        <h2>Восстановление пароля</h2>
        <p className="muted">Укажите почту, на которую регистрировались. Пришлём ссылку для смены пароля.</p>
        <div className="field"><label htmlFor="rsMail">Почта</label><input id="rsMail" type="email" autoComplete="email" /></div>
        {sent && <span className="stub-note">Восстановление пароля появится в следующей версии. Пока напишите на info@navigator-it.ru.</span>}
        <div className="row between">
          <button className="btn primary" type="submit">Отправить ссылку</button>
          <button type="button" className="btn link" onClick={() => nav("/auth?tab=login")}>← Назад ко входу</button>
        </div>
      </form>
    </div>
  );
}
