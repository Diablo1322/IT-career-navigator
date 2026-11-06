import { Route, Routes } from "react-router-dom";

import { ComingSoon, NotFoundView } from "./components/common";
import { Layout } from "./components/Layout";
import { CabinetPage, PricingPage, RequireAuth } from "./pages/AccountPages";
import { AuthPage, ResetPage } from "./pages/AuthPage";
import { CatalogPage } from "./pages/CatalogPage";
import { HomePage } from "./pages/HomePage";
import { AboutPage, DocPage } from "./pages/InfoPages";
import { ProfessionPage } from "./pages/ProfessionPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="professions/:slug" element={<ProfessionPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="reset" element={<ResetPage />} />
        <Route path="cabinet" element={<RequireAuth><CabinetPage /></RequireAuth>} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="policy" element={<DocPage id="policy" />} />
        <Route path="terms" element={<DocPage id="terms" />} />
        <Route path="consent" element={<DocPage id="consent" />} />
        <Route path="about" element={<AboutPage />} />
        {/* Разделы следующих версий: в API их ещё нет. */}
        <Route path="quiz" element={<ComingSoon eyebrow="Профориентация" title="Тест на профориентацию">7 вопросов о том, что вам интересно, — и подберём три подходящие профессии с объяснением почему. Пока выберите профессию в каталоге.</ComingSoon>} />
        <Route path="assess" element={<ComingSoon eyebrow="Оценка навыков" title="Оценка навыков">Около 10 минут вопросов по ключевым навыкам профессии. Пока отмечайте изученные темы на карте — процент соответствия считается по ним.</ComingSoon>} />
        <Route path="plan" element={<ComingSoon eyebrow="Персональный план" title="План «что учить дальше»">Порядок тем, часы на каждую и итоговый срок с учётом вашего времени. Пока начните с тем из блока «Чего не хватает» на карте профессии.</ComingSoon>} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
}
