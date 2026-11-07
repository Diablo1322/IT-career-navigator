package content

import (
	"testing"

	"careernav/migrations"
)

// Проверяет настоящие YAML-файлы: Рустам и Алик запускают этот тест после правок.
func TestSeedFilesAreValid(t *testing.T) {
	data, err := LoadSeed(migrations.Seed, "seed")
	if err != nil {
		t.Fatal(err)
	}
	if len(data.Professions) != 3 {
		t.Fatalf("доступных профессий %d, ожидали 3", len(data.Professions))
	}
	if len(data.SoonProfessions) != 10 {
		t.Fatalf("профессий «скоро» %d, ожидали 10", len(data.SoonProfessions))
	}
	// В каталоге 13 профессий: доступные идут первыми (1–3), «скоро» — следом (4–13), slug не повторяются.
	slugs := map[string]bool{}
	for _, p := range data.Professions {
		slugs[p.Slug] = true
		if p.SortOrder < 1 || p.SortOrder > 3 {
			t.Errorf("%s: sort_order %d, у доступных должно быть 1–3", p.Slug, p.SortOrder)
		}
	}
	for _, p := range data.SoonProfessions {
		if slugs[p.Slug] {
			t.Errorf("slug %q повторяется", p.Slug)
		}
		slugs[p.Slug] = true
		if p.SortOrder < 4 || p.SortOrder > 13 {
			t.Errorf("%s: sort_order %d, у «скоро» должно быть 4–13", p.Slug, p.SortOrder)
		}
	}
	if len(slugs) != 13 {
		t.Fatalf("всего профессий %d, ожидали 13", len(slugs))
	}
	// У каждого ключевого навыка должен быть проверочный вопрос, иначе «уверенно» не засчитать.
	withQ := map[string]bool{}
	for _, q := range data.Questions {
		withQ[q.Skill] = true
	}
	for _, p := range data.Professions {
		for _, s := range p.KeySkills {
			if !withQ[s] {
				t.Errorf("%s: у ключевого навыка %q нет проверочного вопроса", p.Slug, s)
			}
		}
	}
}

func TestSoonSlugMustNotRepeatAvailable(t *testing.T) {
	data, err := LoadSeed(migrations.Seed, "seed")
	if err != nil {
		t.Fatal(err)
	}
	data.SoonProfessions = append(data.SoonProfessions, seedSoonProfession{Slug: "qa-manual", Title: "Дубль"})
	if err := data.validate(); err == nil {
		t.Fatal("профессия «скоро» с slug доступной должна отклоняться")
	}
	data.SoonProfessions[len(data.SoonProfessions)-1] = seedSoonProfession{Slug: "new-prof"}
	if err := data.validate(); err == nil {
		t.Fatal("профессия «скоро» без названия должна отклоняться")
	}
}
