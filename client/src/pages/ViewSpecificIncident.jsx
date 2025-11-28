// src/pages/ViewSpecificIncident.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ViewSpecificIncident.css";

const STATUS_ENUM = {
  0: "NotStarted",
  1: "InProgress",
  2: "Completed",
};

const STATUS_LABELS = {
  NotStarted: "Not started",
  InProgress: "In progress",
  Completed: "Completed",
};

const STATUS_CLASSES = {
  NotStarted: "amber",
  InProgress: "blue",
  Completed: "green",
  Unknown: "muted",
};

const answerTextFallback = (chosenOptions = []) => {
  if (chosenOptions.length) {
    return chosenOptions.map((opt) => opt.text).join(", ");
  }
  return "No answer";
};

const toSentenceCase = (value) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

const getStatusMeta = (rawStatus) => {
  let key = null;
  if (typeof rawStatus === "number") key = STATUS_ENUM[rawStatus] ?? null;
  if (!key && typeof rawStatus === "string") key = rawStatus;
  if (!key) key = "Unknown";
  const compact = key.replace(/\s+/g, "");
  const canonical = compact.charAt(0).toUpperCase() + compact.slice(1);
  const label = STATUS_LABELS[canonical] ?? toSentenceCase(canonical);
  const className = STATUS_CLASSES[canonical] ?? "muted";
  return { key: canonical, label, className };
};

const normaliseIncident = (raw) => {
  if (!raw) return null;

  const scenario = raw.scenario ?? raw.Scenario ?? null;
  const scenarioTitle = scenario?.title ?? scenario?.Title ?? "Unknown scenario";
  const incidentId = raw.id ?? raw.Id ?? "";
  const startedAt = raw.startedAt ?? raw.StartedAt ?? null;
  const completedAt = raw.completedAt ?? raw.CompletedAt ?? null;
  const statusMeta = getStatusMeta(raw.status ?? raw.Status);

  const responses = Array.isArray(raw.responses ?? raw.Responses)
    ? raw.responses ?? raw.Responses
    : [];

  const participantsMap = new Map();
  const questionMaxLookup = new Map();
  let fallbackCounter = 0;

  // First, populate questionMaxLookup from scenario.questions if available
  // This ensures we have MaxPoints even if there are no responses yet
  if (scenario) {
    const scenarioQuestions = Array.isArray(scenario.questions ?? scenario.Questions)
      ? scenario.questions ?? scenario.Questions
      : [];
    scenarioQuestions.forEach((q) => {
      const questionId = q.id ?? q.Id;
      if (questionId) {
        const questionKey = String(questionId);
        const maxPoints = q.maxPoints ?? q.MaxPoints;
        if (maxPoints != null && maxPoints > 0) {
          questionMaxLookup.set(questionKey, maxPoints);
        }
      }
    });
  }

  responses.forEach((resp) => {
    const question = resp.question ?? resp.Question ?? {};
    const questionId =
      question.id ??
      question.Id ??
      `question-${fallbackCounter++}`;
    const questionKey = typeof questionId === "string" ? questionId : String(questionId);
    if (!questionMaxLookup.has(questionKey)) {
      // Use Question.MaxPoints if available (sum of all correct answer options' weights)
      // Fallback to calculating from answer options if MaxPoints not available
      const maxPoints = question.maxPoints ?? question.MaxPoints;
      if (maxPoints != null && maxPoints > 0) {
        questionMaxLookup.set(questionKey, maxPoints);
      } else {
        // Fallback: calculate sum of all correct answer options' weights
        const answerOptions = Array.isArray(question.answerOptions ?? question.AnswerOptions)
          ? question.answerOptions ?? question.AnswerOptions
          : [];
        const sumOfCorrectWeights = answerOptions
          .filter(option => option?.isCorrect ?? option?.IsCorrect ?? false)
          .reduce((sum, option) => sum + Number(option?.weight ?? option?.Weight ?? 0), 0);
        questionMaxLookup.set(questionKey, sumOfCorrectWeights > 0 ? sumOfCorrectWeights : 0);
      }
    }

    const answerOption = resp.answerOption ?? resp.AnswerOption ?? null;
    const questionText = question.text ?? question.Text ?? "Question";
    const points = Number(answerOption?.weight ?? answerOption?.Weight ?? 0);
    const isCorrect = Boolean(answerOption?.isCorrect ?? answerOption?.IsCorrect ?? false);
    const answerText =
      answerOption?.text ??
      answerOption?.Text ??
      resp.answer ??
      resp.Answer ??
      (isCorrect ? "Correct" : "Incorrect");

    const user = resp.user ?? resp.User ?? null;
    const role = resp.role ?? resp.Role ?? null;

    const userId = user?.id ?? user?.Id ?? null;
    const roleId = role?.id ?? role?.Id ?? null;

    const participantKey = userId
      ? `user:${userId}`
      : roleId
      ? `role:${roleId}`
      : `anon:${fallbackCounter++}`;

    if (!participantsMap.has(participantKey)) {
      participantsMap.set(participantKey, {
        id: participantKey,
        name:
          user?.username ??
          user?.Username ??
          user?.email ??
          user?.Email ??
          role?.name ??
          role?.Name ??
          "Participant",
        role: role?.name ?? role?.Name ?? null,
        answersMap: new Map(),
        totalScore: 0,
        maxScore: 0,
        _questionIds: new Set(),
      });
    }

    const participant = participantsMap.get(participantKey);
    const answersMap = participant.answersMap;

    let answerEntry = answersMap.get(questionKey);
    if (!answerEntry) {
      const baseOptions = Array.isArray(question.answerOptions ?? question.AnswerOptions)
        ? (question.answerOptions ?? question.AnswerOptions).map((option, idx) => ({
            optionId: String(option?.id ?? option?.Id ?? `option-${fallbackCounter++}-${idx}`),
            text: option?.text ?? option?.Text ?? `Option ${idx + 1}`,
            isCorrect: Boolean(option?.isCorrect ?? option?.IsCorrect),
            isChosen: false,
            points: Number(option?.weight ?? option?.Weight ?? 0),
          }))
        : [];

      answerEntry = {
        questionId: questionKey,
        question: questionText,
        options: baseOptions,
        points: 0,
      };

      answersMap.set(questionKey, answerEntry);
    }

    const answerOptionId =
      answerOption?.id ??
      answerOption?.Id ??
      resp.answerOptionId ??
      resp.AnswerOptionId ??
      null;
    const normalizedAnswerOptionId = answerOptionId ? String(answerOptionId) : null;

    let optionRecord = normalizedAnswerOptionId
      ? answerEntry.options.find((opt) => opt.optionId === normalizedAnswerOptionId)
      : null;

    if (!optionRecord) {
      optionRecord = {
        optionId:
          normalizedAnswerOptionId ??
          `adhoc-${participantKey}-${questionKey}-${fallbackCounter++}`,
        text: answerText,
        isCorrect,
        isChosen: false,
        points,
      };
      answerEntry.options.push(optionRecord);
    } else if (!optionRecord.text) {
      optionRecord.text = answerText;
    }

    optionRecord.isChosen = true;

    // Incorrect options should always give 0 points
    const actualPoints = isCorrect ? points : 0;
    answerEntry.points += actualPoints;
    participant.totalScore += actualPoints;

    if (!participant._questionIds.has(questionKey)) {
      // Use MaxPoints from lookup (which now uses Question.MaxPoints)
      const questionMax = questionMaxLookup.get(questionKey) ?? 0;
      participant.maxScore += questionMax;
      participant._questionIds.add(questionKey);
    }
  });

  const participants = Array.from(participantsMap.values()).map((participant) => {
    const answers = Array.from(participant.answersMap.values()).map((entry) => {
      const chosenOptions = entry.options.filter((opt) => opt.isChosen);
      const correctOptions = entry.options.filter((opt) => opt.isCorrect);
      const pickedCorrect = chosenOptions.filter((opt) => opt.isCorrect).length;
      const pickedIncorrect = chosenOptions.some((opt) => !opt.isCorrect);

      // Verdict logik: kun "correct" eller "incorrect" (fjernet "partial")
      // "correct": alle korrekte svar valgt OG ingen forkerte svar valgt
      // "incorrect": alt andet
      const verdict =
        correctOptions.length > 0 
          && pickedCorrect === correctOptions.length 
          && !pickedIncorrect
          ? "correct"
          : "incorrect";

      const chosenSummary = chosenOptions.length
        ? chosenOptions.map((opt) => opt.text).join(", ")
        : answerTextFallback(chosenOptions);

      const questionMax = questionMaxLookup.get(entry.questionId) ?? 0;
      // Ensure points cannot exceed max
      const cappedPoints = Math.min(entry.points, questionMax);
      
      return {
        questionId: entry.questionId,
        question: entry.question,
        points: cappedPoints,
        max: questionMax,
        verdict,
        chosenSummary,
        options: entry.options,
      };
    });

    delete participant.answersMap;

    return {
      ...participant,
      maxScore: participant.maxScore || participant.totalScore,
      answers,
    };
  });

  participants.forEach((participant) => delete participant._questionIds);
  participants.sort((a, b) => a.name.localeCompare(b.name));

  const displayTitle = scenarioTitle
    ? `${scenarioTitle}${startedAt ? ` — ${new Date(startedAt).toLocaleDateString("en-GB")}` : ""}`
    : incidentId
    ? `Incident ${incidentId}`
    : "Incident";

  return {
    id: incidentId,
    displayTitle,
    scenarioTitle,
    startedAt,
    completedAt,
    statusKey: statusMeta.key,
    statusLabel: statusMeta.label,
    statusClass: statusMeta.className,
    participants,
    participantCount: participants.length,
    questionCount:
      questionMaxLookup.size ||
      participants.reduce((set, participant) => {
        participant.answers.forEach((answer) => set.add(answer.question));
        return set;
      }, new Set()).size,
  };
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-GB") : "—");
const verdictLabel = (verdict) => {
  if (verdict === "correct") return "Correct";
  if (verdict === "incorrect") return "Incorrect";
  return "—";
};

export default function ViewSpecificIncident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [expandedAnswerKey, setExpandedAnswerKey] = useState(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get(`/api/incident/${id}`)
      .then(({ data }) => {
        if (!active) return;
        const mapped = normaliseIncident(data);
        if (!mapped) {
          setError("Incident data not available.");
          setIncident(null);
        } else {
          setIncident(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load incident", err);
        if (active) {
          setError("Could not load incident details. Please try again.");
          setIncident(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="panel">
            <h3 className="panel-title">Incident details</h3>
            <p>{error}</p>
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Incident data not found.</p>
          <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#6b61ff" opacity="0.15" />
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6b61ff" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="brand-name">AdminPro</span>
          </div>

          <div className="right-buttons">
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="container results-wrap">
        <h1 className="page-title">{incident.displayTitle}</h1>
        <p className="page-subtitle">
          Overview of incident details, participants, and their responses.
        </p>

        <div className="panel">
          <h3 className="panel-title">Incident Info</h3>
          <div className="summary-stats">
            <div>
              <b>Scenario:</b> {incident.scenarioTitle}
            </div>
            <div>
              <b>Status:</b>{" "}
              <span className={`pill ${incident.statusClass}`}>{incident.statusLabel}</span>
            </div>
            <div>
              <b>Started:</b> {formatDateTime(incident.startedAt)}
            </div>
            <div>
              <b>Completed:</b> {formatDateTime(incident.completedAt)}
            </div>
            <div>
              <b>Participants:</b> {incident.participantCount}
            </div>
            <div>
              <b>Questions:</b> {incident.questionCount}
            </div>
          </div>
          {incident.statusKey !== "Completed" && (
            <div style={{ marginTop: "12px" }}>
              <button
                className="btn-primary"
                disabled={updating}
                onClick={async () => {
                  if (!confirm("Mark this incident as completed? This will mark it as finished for all users.")) {
                    return;
                  }
                  setUpdating(true);
                  try {
                    await api.put(`/api/incident/${incident.id}`, {
                      status: "Completed",
                      completedAt: new Date().toISOString(),
                    });
                    // Reload incident data
                    const { data } = await api.get(`/api/incident/${incident.id}`);
                    setIncident(normaliseIncident(data));
                  } catch (err) {
                    console.error("Failed to mark incident as completed", err);
                    alert("Failed to mark incident as completed. Please try again.");
                  } finally {
                    setUpdating(false);
                  }
                }}
              >
                {updating ? "Marking..." : "Mark as Completed"}
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Responses</h3>
          {incident.participants.length === 0 ? (
            <div className="muted tiny">No responses recorded for this incident yet.</div>
          ) : (
            incident.participants.map((participant) => (
              <div key={participant.id} className="participant-card">
                <div className="participant-head">
                  <div>
                    <h4>{participant.name}</h4>
                    {participant.role && <div className="muted tiny">{participant.role}</div>}
                  </div>
                  <span className="pill">
                    {participant.totalScore} / {participant.maxScore} pts
                  </span>
                </div>

                <div className="answers-list">
                  {participant.answers.map((answer, index) => {
                    const questionId = answer.questionId ?? `${participant.id}-${index}`;
                    const answerKey = `${participant.id}:${questionId}`;
                    const isOpen = expandedAnswerKey === answerKey;

                    return (
                      <div
                        key={answerKey}
                        className={`answer-block ${isOpen ? "is-open" : ""}`}
                      >
                        <button
                          type="button"
                          className="answer-toggle"
                          onClick={() =>
                            setExpandedAnswerKey((prev) => (prev === answerKey ? null : answerKey))
                          }
                        >
                          <div className="answer-info">
                            <small className="muted">Question {index + 1}</small>
                            <div className="answer-question">{answer.question}</div>
                            <div className="answer-meta">
                              <span>
                                Chosen: <b>{answer.chosenSummary ?? "—"}</b>
                              </span>
                              <span>
                                Points:{" "}
                                <b>
                                  {answer.points} / {answer.max}
                                </b>
                              </span>
                            </div>
                          </div>
                          <div className="answer-right">
                            <span className={`pill ${answer.verdict}`}>
                              {verdictLabel(answer.verdict)}
                            </span>
                            <span className={`chevron ${isOpen ? "open" : ""}`} aria-hidden />
                          </div>
                        </button>

                        {isOpen && (
                          <div className="answer-options">
                            {Array.isArray(answer.options) && answer.options.length ? (
                              answer.options.map((opt) => (
                                <div
                                  key={opt.optionId ?? opt.text}
                                  className={`answer-option ${
                                    opt.isChosen ? "chosen" : ""
                                  } ${opt.isCorrect ? "correct" : ""}`}
                                >
                                  <div>
                                    <b>{opt.text || "Option"}</b>
                                    <small className="muted">
                                      {opt.isCorrect ? "Correct answer" : "Answer choice"}
                                    </small>
                                  </div>
                                  <div className="answer-option-meta">
                                    {opt.isChosen && <span className="tag chosen">Chosen</span>}
                                    {opt.isCorrect && <span className="tag correct">Correct</span>}
                                    <span className="muted">{opt.points ?? 0} pts</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="answer-option muted">
                                No answer options available for this question.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
