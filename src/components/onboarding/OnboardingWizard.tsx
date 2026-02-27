"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";
import { saveUserProfile } from "@/lib/storage";
import ProgressBar from "@/components/shared/ProgressBar";
import BackButton from "@/components/shared/BackButton";
import WelcomeSlide from "./WelcomeSlide";
import QuestionStep from "./QuestionStep";
import TextInputStep from "./TextInputStep";
import FeatureSlide from "./FeatureSlide";
import ReadySlide from "./ReadySlide";

const TOTAL_STEPS = 12;

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState("");
  const [stage, setStage] = useState("");
  const [industry, setIndustry] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [commStyle, setCommStyle] = useState("");
  const [gender, setGender] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim() || "Założycielu",
      companyName: companyName.trim() || "moja firma",
      age: age as UserProfile["age"],
      stage: stage as UserProfile["stage"],
      industry,
      challenges,
      goals: goals.trim(),
      communicationStyle: commStyle as UserProfile["communicationStyle"],
      visionerMode: false,
      gender: gender as UserProfile["gender"],
      targetMarket: targetMarket.trim(),
      anthropicApiKey: anthropicKey.trim(),
      elevenLabsApiKey: elevenLabsKey.trim() || undefined,
      theme: "light",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    saveUserProfile(profile);
    router.push("/chat");
  };

  // Show progress bar for steps 1-11 (not welcome or ready)
  const showProgress = step > 0 && step < TOTAL_STEPS - 1;

  return (
    <div className="relative bg-white min-h-screen">
      {/* Header */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-10 bg-white px-8 py-4 flex items-center gap-4">
          <BackButton onClick={back} />
          <ProgressBar current={step} total={TOTAL_STEPS - 2} />
        </div>
      )}

      {/* Content with padding for header */}
      <div className={showProgress ? "pt-16" : ""}>
        {step === 0 && <WelcomeSlide onNext={next} />}

        {step === 1 && (
          <TextInputStep
            question="jak masz na imię?"
            value={name}
            onChange={setName}
            onNext={next}
            placeholder="twoje imię..."
          />
        )}

        {step === 2 && (
          <TextInputStep
            question="jak nazywa się twoja firma?"
            subtitle="możesz wpisać 'jeszcze nie wiem' jeśli jesteś na etapie pomysłu"
            value={companyName}
            onChange={setCompanyName}
            onNext={next}
            placeholder="nazwa firmy..."
          />
        )}

        {step === 3 && (
          <QuestionStep
            question="ile masz lat?"
            options={[
              { value: "18-24", label: "18–24" },
              { value: "25-30", label: "25–30" },
              { value: "31-40", label: "31–40" },
              { value: "41+", label: "41+" },
            ]}
            selected={age}
            onSelect={(v) => setAge(v as string)}
            onNext={next}
          />
        )}

        {step === 4 && (
          <QuestionStep
            question="na jakim etapie jesteś?"
            options={[
              { value: "idea", label: "Pomysł", description: "mam koncepcję, szukam kierunku" },
              { value: "mvp", label: "MVP", description: "buduję pierwszą wersję produktu" },
              { value: "pre-seed", label: "Pre-seed", description: "szukam pierwszego finansowania" },
              { value: "seed", label: "Seed", description: "mam produkt i pierwsze przychody" },
              { value: "series-a", label: "Seria A", description: "skaluję działalność" },
              { value: "growth", label: "Wzrost", description: "dynamicznie rozwijam firmę" },
            ]}
            selected={stage}
            onSelect={(v) => setStage(v as string)}
            onNext={next}
          />
        )}

        {step === 5 && (
          <QuestionStep
            question="w jakiej branży budujesz?"
            options={[
              { value: "SaaS / oprogramowanie", label: "SaaS / oprogramowanie" },
              { value: "e-commerce / retail", label: "e-commerce / retail" },
              { value: "fintech / finanse", label: "fintech / finanse" },
              { value: "healthtech / zdrowie", label: "healthtech / zdrowie" },
              { value: "edtech / edukacja", label: "edtech / edukacja" },
              { value: "AI / ML", label: "AI / ML" },
              { value: "media / content", label: "media / content" },
              { value: "martech / marketing", label: "martech / marketing" },
              { value: "gaming", label: "gaming" },
              { value: "deeptech / hardware", label: "deeptech / hardware" },
              { value: "marketplace", label: "marketplace" },
              { value: "konsulting / usługi", label: "konsulting / usługi" },
              { value: "inne", label: "inne" },
            ]}
            selected={industry}
            onSelect={(v) => setIndustry(v as string)}
            onNext={next}
          />
        )}

        {step === 6 && (
          <FeatureSlide
            title="poznaj Founa"
            subtitle="twojego AI cofoundera"
            features={[
              {
                icon: "🧠",
                title: "pamięta twój kontekst",
                description: "uczy się twojej firmy i łączy kropki między sesjami",
              },
              {
                icon: "🎯",
                title: "zawsze konkretny",
                description: "żadnych ogólnych rad — wszystko pod twój startup",
              },
              {
                icon: "🔥",
                title: "rzuca szalonymi pomysłami",
                description: "czasem to właśnie nieoczywisty pomysł otwiera nowe drzwi",
              },
              {
                icon: "🗂️",
                title: "sesje w folderach",
                description: "każda rozmowa zapisana, sortowana, gotowa do powrotu",
              },
            ]}
            onNext={next}
            continueLabel="super, dalej"
          />
        )}

        {step === 7 && (
          <QuestionStep
            question="co teraz spędza ci sen z powiek?"
            subtitle="wybierz wszystko co pasuje"
            multiSelect
            options={[
              { value: "pozyskanie klientów", label: "pozyskanie klientów" },
              { value: "budowanie produktu", label: "budowanie produktu" },
              { value: "generowanie przychodów", label: "generowanie przychodów" },
              { value: "marketing i widoczność", label: "marketing i widoczność" },
              { value: "finansowanie i inwestorzy", label: "finansowanie i inwestorzy" },
              { value: "budowanie zespołu", label: "budowanie zespołu" },
              { value: "skalowanie operacji", label: "skalowanie operacji" },
              { value: "nie wiem jeszcze", label: "nie wiem jeszcze" },
            ]}
            selected={challenges}
            onSelect={(v) => setChallenges(v as string[])}
            onNext={next}
          />
        )}

        {step === 8 && (
          <TextInputStep
            question="co chcesz osiągnąć przez najbliższe 6 miesięcy?"
            value={goals}
            onChange={setGoals}
            onNext={next}
            multiline
            placeholder="np. zdobyć pierwszych 100 klientów, zebrać 500k PLN, zbudować zespół 5 osób..."
          />
        )}

        {step === 9 && (
          <QuestionStep
            question="jak lubisz gadać?"
            options={[
              {
                value: "casual",
                label: "jak z kumplem",
                description: "bezpośrednio, po ludzku, bez korporacyjnego BS",
              },
              {
                value: "structured",
                label: "jak z konsultantem",
                description: "strukturalnie, frameworki, dane i liczby",
              },
            ]}
            selected={commStyle}
            onSelect={(v) => setCommStyle(v as string)}
            onNext={next}
          />
        )}

        {step === 10 && (
          <QuestionStep
            question="kim jesteś?"
            subtitle="pomoże nam dobrać perspektywę Founa do twojego biznesu"
            options={[
              { value: "male", label: "mężczyzna" },
              { value: "female", label: "kobieta" },
              { value: "other", label: "inne" },
              { value: "prefer_not", label: "wolę nie mówić" },
            ]}
            selected={gender}
            onSelect={(v) => setGender(v as string)}
            onNext={next}
          />
        )}

        {step === 11 && (
          <TextInputStep
            question="do kogo kierujesz swój produkt?"
            subtitle="Foun dobierze perspektywę jeśli twoi klienci różnią się od ciebie (opcjonalnie)"
            value={targetMarket}
            onChange={setTargetMarket}
            onNext={next}
            placeholder="np. kobiety po 30, freelancerzy, MŚP, nastolatki..."
            required={false}
          />
        )}

        {step === 12 && (
          <TextInputStep
            question="klucz Anthropic API"
            subtitle="twoje rozmowy z Founem. klucz jest przechowywany tylko na twoim urządzeniu."
            value={anthropicKey}
            onChange={setAnthropicKey}
            onNext={() => setStep(13)}
            type="password"
            placeholder="sk-ant-..."
            hint="Pobierz klucz na console.anthropic.com → API Keys. Twoje dane nie trafiają na nasze serwery."
          />
        )}

        {step === 13 && (
          <TextInputStep
            question="klucz ElevenLabs API"
            subtitle="do trybu głosowego — Foun będzie mówił. możesz to pominąć i dodać później."
            value={elevenLabsKey}
            onChange={setElevenLabsKey}
            onNext={() => setStep(14)}
            type="password"
            placeholder="opcjonalne — pomiń jeśli chcesz tylko tekstowo"
            required={false}
            hint="Pobierz klucz na elevenlabs.io → Profile → API Key."
          />
        )}

        {step === 14 && <ReadySlide name={name || "Założycielu"} onStart={finish} />}
      </div>
    </div>
  );
}
