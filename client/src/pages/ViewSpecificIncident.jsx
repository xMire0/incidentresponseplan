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

  responses.forEach((resp) => {
    const question = resp.question ?? resp.Question ?? {};
    const questionId = question.id ?? question.Id ?? `question-${fallbackCounter++}`;
    if (!questionMaxLookup.has(questionId)) {
      const answerOptions = Array.isArray(question.answerOptions ?? question.AnswerOptions)
        ? question.answerOptions ?? question.AnswerOptions
        : [];
      const maxWeight = answerOptions.reduce(
        (max, option) => Math.max(max, Number(option?.weight ?? option?.Weight ?? 0)),
        0
      );
      questionMaxLookup.set(questionId, maxWeight);
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
        answers: [],
        totalScore: 0,
        maxScore: 0,
        _questionIds: new Set(),
      });
    }

    const participant = participantsMap.get(participantKey);
    participant.answers.push({
      question: questionText,
      selected: answerText,
      correct: isCorrect,
      points,
      answeredAt: resp.answeredAt ?? resp.AnsweredAt ?? null,
    });
    participant.totalScore += points;

    if (!participant._questionIds.has(questionId)) {
      participant.maxScore += questionMaxLookup.get(questionId) ?? points;
      participant._questionIds.add(questionId);
    }
  });

  const participants = Array.from(participantsMap.values()).map((participant) => ({
    ...participant,
    maxScore: participant.maxScore || participant.totalScore,
    answers: participant.answers,
  }));

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
    questionCount: questionMaxLookup.size || participants.reduce((set, participant) => {
      participant.answers.forEach((answer) => set.add(answer.question));
      return set;
    }, new Set()).size,
  };
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-GB") : "—");

export default function ViewSpecificIncident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

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
            <button className="btn-secondary" onClick={generateIncidentPDF} disabled={exporting}>
              {exporting ? "Generating…" : "⬇ Generate Report (PDF)"}
            </button>
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="container results-wrap">
        <h1 className="page-title">{incident.displayTitle}</h1>
        <p className="page-subtitle">Overview of incident details, participants, and their responses.</p>

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
                  <span className="pill">{participant.totalScore} / {participant.maxScore} pts</span>
                </div>

                <div className="answers-list">
                  {participant.answers.map((answer, index) => (
                    <details key={index} className={`answer-row ${answer.correct ? "correct" : "incorrect"}`}>
                      <summary className="q-summary">Q{index + 1}: {answer.question}</summary>
                      <div className="q-body">
                        <div><b>Answer:</b> {answer.selected}</div>
                        <div><b>Points:</b> {answer.points}</div>
                        <div className={`verdict ${answer.correct ? "ok" : "bad"}`}>
                          {answer.correct ? "✓ Correct" : "✗ Incorrect"}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
