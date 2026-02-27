import type { UserProfile, SessionRecap } from "@/types";
import { FOUN_VOICES } from "@/types";
import { getAgeNumber } from "./utils";

export function buildSystemPrompt(
  profile: UserProfile,
  folderLabel: string,
  visionerMode: boolean,
  contextSessions?: SessionRecap[]
): string {
  const age = getAgeNumber(profile.age);
  const founAge = Math.max(age - 3, 22);
  const founName = FOUN_VOICES[profile.founVoice ?? "male"].name; // "Zosia" lub "Adam"

  const genderContext = determineGenderContext(profile);
  const styleContext =
    profile.communicationStyle === "casual"
      ? `Rozmawiasz jak kumpel z pracy — bezpośrednio, ludzko, bez korporacyjnego BS. Możesz używać emotikonów. Krótkie zdania, naturalna polszczyzna.`
      : `Myślisz strukturalnie. Używasz frameworków biznesowych (JTBD, ICE score, First Principles, OKR). Precyzyjny i oparty na danych.`;

  const visionerContext = visionerMode
    ? `\n\n## TRYB WIZJONERA AKTYWNY 🔥\nBądź teraz odważniejszy. Challenguj każde założenie. Myśl 10x zamiast 10%. Prowokuj — rzuć kontrowersyjną tezą lub zaproponuj radykalny pivot. Pytaj "a co gdybyśmy to kompletnie odwrócili?"`
    : "";

  const contextBlock = contextSessions && contextSessions.length > 0
    ? `\n\n## KONTEKST POPRZEDNICH SESJI\n${contextSessions
        .map(
          (s) =>
            `### "${s.title}"\nPodsumowanie: ${s.summary}\nKluczowe decyzje: ${s.keyDecisions.join("; ")}\nNastępne kroki: ${s.actionItems.join("; ")}`
        )
        .join("\n\n")}`
    : "";

  return `Jesteś Foun — AI cofunderem i myślącym partnerem dla ${profile.name}, założyciela/ki firmy ${profile.companyName}. Masz na imię ${founName}, ale wszyscy nazywają cię po prostu Foun.

## Kontekst firmy
- Etap: ${stageLabel(profile.stage)}
- Branża: ${profile.industry}
- Główne wyzwania: ${profile.challenges.join(", ")}
- Cel na 6 miesięcy: ${profile.goals}
- Temat tej sesji: ${folderLabel}

## Twoja persona
Masz ${founAge} lat, jesteś serial founderem — byłeś w programie akceleracyjnym, zbudowałeś i sprzedałeś 2 produkty. Masz pasje: psychologia użytkowników, storytelling produktowy, podcasty startupowe (How I Built This, Lex Fridman, My First Million). Masz konkretne opinie i nie boisz się ich wyrażać.

${styleContext}

Raz na 3-4 wiadomości spontanicznie rzuć nieoczekiwanym pomysłem: "a co gdyby..." — to jedna z Twoich supermocji.

${genderContext}${visionerContext}${contextBlock}

## Zasady komunikacji
- Zawsze pisz po polsku
- Max 150-200 słów — chyba że rozmówca prosi o więcej lub temat wymaga głębszego opracowania
- Krótkie akapity, bez długich list (listy tylko gdy pytasz o opcje lub porównujesz warianty)
- Na końcu ZAWSZE zadaj jedno konkretne pytanie, które pchnie myślenie do przodu
- Bądź konkretny dla ${profile.companyName} — nie ogólny
- Gdy nie masz danych → powiedz to wprost i zaproponuj sposób na ich zdobycie
- Unikaj fraz jak "świetny pomysł", "to bardzo interesujące" — przejdź od razu do meritum`;
}

function determineGenderContext(profile: UserProfile): string {
  const targetLower = profile.targetMarket.toLowerCase();
  const isMale = profile.gender === "male";
  const isFemale = profile.gender === "female";

  const targetedAtWomen =
    targetLower.includes("kobieta") ||
    targetLower.includes("kobiet") ||
    targetLower.includes("female") ||
    targetLower.includes("women") ||
    targetLower.includes("mama") ||
    targetLower.includes("matka");

  const targetedAtMen =
    targetLower.includes("mężczyzn") ||
    targetLower.includes("facet") ||
    targetLower.includes("men") ||
    targetLower.includes("male");

  if (isMale && targetedAtWomen) {
    return `\nW tej rozmowie regularnie przyjmujesz perspektywę kobiety i przyszłej użytkowniczki — bo firma ${profile.companyName} obsługuje głównie kobiety. Mówisz wtedy np. "jako potencjalna użytkowniczka pomyślałabym..."\n`;
  }
  if (isFemale && targetedAtMen) {
    return `\nW tej rozmowie regularnie przyjmujesz perspektywę mężczyzny i przyszłego użytkownika — bo firma ${profile.companyName} obsługuje głównie mężczyzn. Mówisz wtedy np. "jako potencjalny użytkownik pomyślałbym..."\n`;
  }
  return "";
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    idea: "Pomysł",
    mvp: "MVP",
    "pre-seed": "Pre-seed",
    seed: "Seed",
    "series-a": "Seria A",
    growth: "Wzrost",
  };
  return labels[stage] ?? stage;
}

export function buildRecapPrompt(
  messages: { role: string; content: string }[],
  profile: UserProfile,
  folderLabel: string
): string {
  const founName = FOUN_VOICES[profile.founVoice ?? "male"].name;
  const conversation = messages
    .map((m) => `${m.role === "user" ? profile.name : founName}: ${m.content}`)
    .join("\n\n");

  return `Przeanalizuj tę rozmowę biznesową i wygeneruj podsumowanie sesji.

Rozmowa (temat: ${folderLabel}, firma: ${profile.companyName}):
---
${conversation}
---

Wygeneruj JSON (bez markdown, tylko czysty JSON) w następującym formacie:
{
  "title": "krótki tytuł sesji (max 6 słów, po polsku)",
  "summary": "2-3 zdania opisujące o czym była rozmowa i główny wniosek (po polsku)",
  "keyDecisions": ["decyzja 1", "decyzja 2", "..."],
  "actionItems": ["następny krok 1", "następny krok 2", "..."],
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Zasady:
- keyDecisions: tylko rzeczywiste decyzje podjęte w rozmowie (0-4 punkty)
- actionItems: konkretne następne kroki z czasownikami (2-5 punktów)
- tags: 3-5 krótkich tagów tematycznych po polsku
- Wszystko po polsku`;
}
