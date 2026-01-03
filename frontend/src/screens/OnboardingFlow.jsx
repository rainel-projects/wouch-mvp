import { useEffect, useState } from "react";
import { QUESTIONS } from "../data/questions";
import QuestionHeader from "../components/onboarding/QuestionHeader";
import SingleSelect from "../components/onboarding/types/SingleSelect";
import MultiSelect from "../components/onboarding/types/MultiSelect";
import SliderInput from "../components/onboarding/types/SliderInput";
import OpenText from "../components/onboarding/types/OpenText";
import ActionFooter from "../components/onboarding/ActionFooter";
import "../styles/onboarding.css";

export default function OnboardingFlow() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userId, setUserId] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(true);

  const question = QUESTIONS[index];

  /* ===============================
     CREATE USER (ONCE)
  =============================== */
  useEffect(() => {
    fetch("http://localhost:3000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@wouch.app",
        signup_source: "web"
      })
    })
      .then(res => res.json())
      .then(data => {
        setUserId(data.user_id);
        setIsCreatingUser(false);
        console.log("✅ User created:", data.user_id);
      })
      .catch(err => {
        console.error("❌ User creation failed", err);
        setIsCreatingUser(false);
      });
  }, []);

  /* ===============================
     END GUARD
  =============================== */
  if (!question) {
    console.log("Onboarding complete:", answers);
    return (
      <div className="onboarding-screen">
        <h1>Onboarding complete</h1>
        <p>Thank you for answering.</p>
      </div>
    );
  }

  /* ===============================
     UPDATE ANSWER
  =============================== */
  const updateAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value
    }));
  };

  /* ===============================
     SUBMIT ANSWER
  =============================== */
  const handleContinue = () => {
    if (!userId) {
      console.warn("User not ready yet");
      return;
    }

    const answer = answers[question.id];

    const payload = {
      user_id: userId,
      question_id: question.id,
      question_part: question.part || "part_01",
      selected_option_id: Array.isArray(answer) ? null : "opt_1",
      selected_option_key: Array.isArray(answer) ? null : "A",
      answer_value: answer,
      time_spent: 10
    };

    console.log("📤 Submitting:", payload);

    fetch("http://localhost:3000/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ Saved:", data);
      })
      .catch(() =>
        console.warn("⚠️ Backend unavailable — continuing anyway")
      );

    setIndex((prev) => prev + 1);
  };

  /* ===============================
     RENDER QUESTION
  =============================== */
  const renderQuestion = () => {
    switch (question.type) {
      case "single_select":
        return (
          <SingleSelect
            options={question.options}
            value={answers[question.id]}
            onChange={updateAnswer}
          />
        );

      case "multi_select":
        return (
          <MultiSelect
            options={question.options}
            value={answers[question.id] || []}
            onChange={updateAnswer}
          />
        );

      case "slider":
        return (
          <SliderInput
            min={question.min}
            max={question.max}
            value={
              answers[question.id] !== undefined
                ? answers[question.id]
                : question.default
            }
            onChange={updateAnswer}
          />
        );

      case "open_text":
        return (
          <OpenText
            value={answers[question.id] || ""}
            min={question.minChars}
            max={question.maxChars}
            onChange={updateAnswer}
          />
        );

      case "body_map_select":
        return (
          <SingleSelect
            options={question.options}
            value={answers[question.id]}
            onChange={updateAnswer}
          />
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  /* ===============================
     DISABLE CONTINUE LOGIC
  =============================== */
  const isDisabled =
    isCreatingUser ||
    answers[question.id] === undefined ||
    (Array.isArray(answers[question.id]) &&
      answers[question.id].length === 0);

  /* ===============================
     UI
  =============================== */
  return (
    <div className="onboarding-screen">
      <QuestionHeader
        step={`${index + 1} / ${QUESTIONS.length}`}
        question={question.text}
      />

      {renderQuestion()}

      <ActionFooter
        disabled={isDisabled}
        onContinue={handleContinue}
      />
    </div>
  );
}
