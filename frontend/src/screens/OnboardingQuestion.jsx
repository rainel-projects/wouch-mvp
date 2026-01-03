import { useState } from "react";
import { RC_001 } from "../data/rc_001";
import QuestionHeader from "../components/onboarding/QuestionHeader";
import OptionCard from "../components/onboarding/OptionCard";
import ActionFooter from "../components/onboarding/ActionFooter";
import "../styles/onboarding.css";

export default function OnboardingQuestion() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;

    console.log("Submitting answer:", selected);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo-user-001",
          question_id: RC_001.id,
          answer_value: selected,
          time_spent: 12
        })
      });

      const data = await res.json();
      console.log("API response:", data);

    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-screen">
      <QuestionHeader step="1 / 10" question={RC_001.question} />

      <div className="options-container">
        {RC_001.options.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            isSelected={selected === opt.id}
            onSelect={() => setSelected(opt.id)}
          />
        ))}
      </div>

      <ActionFooter
        disabled={!selected || loading}
        onContinue={handleContinue}
      />
    </div>
  );
}
