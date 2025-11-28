using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentResults
{
    public class Query : IRequest<List<IncidentResultDto>> { }

    public class Handler : IRequestHandler<Query, List<IncidentResultDto>>
    {
        private readonly AppDbContext _context;

        public Handler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<IncidentResultDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var incidents = await _context.Incidents
                .AsNoTracking()
                .Include(i => i.Scenario)
                    .ThenInclude(s => s.Questions)
                        .ThenInclude(q => q.AnswerOptions)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.AnswerOption)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Question)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.User)
                        .ThenInclude(u => u.Department)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)
                .ToListAsync(cancellationToken);

            var result = new List<IncidentResultDto>();

            foreach (var incident in incidents)
            {
                if (incident.Responses.Count == 0)
                    continue;

                var scenario = incident.Scenario;

                var groups = incident.Responses
                    .GroupBy(r => r.UserId)
                    .ToList();

                foreach (var group in groups)
                {
                    var firstResponse = group.First();
                    var user = firstResponse.User;
                    var role = firstResponse.Role;
                    var department = user?.Department;

                    var detail = new List<QuestionResultDto>();
                    var score = 0;

                    var responsesByQuestion = group
                        .GroupBy(r => r.QuestionId)
                        .ToList();

                    foreach (var questionGroup in responsesByQuestion)
                    {
                        var questionId = questionGroup.Key;
                        var scenarioQuestion = scenario?.Questions?.FirstOrDefault(q => q.Id == questionId);
                        var questionText = questionGroup.First().Question?.Text
                            ?? scenarioQuestion?.Text
                            ?? "Question";

                        var answerOptions = scenarioQuestion?.AnswerOptions ?? new List<AnswerOption>();
                        var chosenOptionIds = questionGroup
                            .Select(r => r.AnswerOptionId)
                            .Where(id => id != Guid.Empty)
                            .ToHashSet();

                        var points = questionGroup.Sum(r => r.AnswerOption?.Weight ?? 0);

                        var correctOptionIds = answerOptions
                            .Where(o => o.IsCorrect)
                            .Select(o => o.Id)
                            .ToHashSet();

                        var pickedCorrect = chosenOptionIds.Count(id => correctOptionIds.Contains(id));
                        var pickedIncorrect = chosenOptionIds.Any(id => !correctOptionIds.Contains(id));

                        // Verdict logik: kun "correct" eller "incorrect" (fjernet "partial")
                        // "correct": alle korrekte svar valgt OG ingen forkerte svar valgt
                        // "incorrect": alt andet
                        var verdict = correctOptionIds.Count > 0 
                            && pickedCorrect == correctOptionIds.Count 
                            && !pickedIncorrect
                            ? "correct"
                            : "incorrect";

                        var optionDtos = answerOptions
                            .Select(o => new OptionResultDto
                            {
                                OptionId = o.Id,
                                Text = o.Text,
                                IsCorrect = o.IsCorrect,
                                IsChosen = chosenOptionIds.Contains(o.Id),
                                Points = o.Weight
                            })
                            .ToList();

                        // Include any ad-hoc answers that no longer have a matching option
                        foreach (var orphan in questionGroup.Where(r => r.AnswerOptionId == Guid.Empty || !optionDtos.Any(o => o.OptionId == r.AnswerOptionId)))
                        {
                            optionDtos.Add(new OptionResultDto
                            {
                                OptionId = orphan.AnswerOptionId == Guid.Empty ? Guid.NewGuid() : orphan.AnswerOptionId,
                                Text = orphan.AnswerOption?.Text ?? orphan.Answer ?? "Response",
                                IsCorrect = orphan.AnswerOption?.IsCorrect ?? false,
                                IsChosen = true,
                                Points = orphan.AnswerOption?.Weight ?? 0
                            });
                        }

                        var chosenLabel = optionDtos
                            .Where(o => o.IsChosen)
                            .Select(o => o.Text)
                            .DefaultIfEmpty(questionGroup.First().Answer ?? "-")
                            .ToList();

                        // Brug Question.MaxPoints direkte
                        var maxPoints = scenarioQuestion?.MaxPoints ?? 0;
                        
                        detail.Add(new QuestionResultDto
                        {
                            Qid = questionId,
                            Text = questionText,
                            Chosen = string.Join(", ", chosenLabel),
                            Verdict = verdict,
                            Points = points,
                            Max = maxPoints,
                            Options = optionDtos
                        });

                        score += points;
                    }

                    // Beregn maxScore fra alle spørgsmål i scenariet
                    var maxScore = scenario?.Questions?.Sum(q => q.MaxPoints) ?? 0;
                    // Point kan overgå maksimal, så procent kan være > 100%
                    var pct = maxScore > 0 ? (int)Math.Round(score * 100d / maxScore) : 0;
                    var status = pct >= 70 ? "pass" : "fail";

                    DateTime? completedAt = incident.CompletedAt;
                    if (completedAt == null)
                    {
                        completedAt = group.Max(r => r.AnsweredAt);
                    }

                    DateTime? startedAt = incident.StartedAt;
                    if (startedAt == null)
                    {
                        startedAt = group.Min(r => r.AnsweredAt);
                    }
                    var durationSeconds = 0;
                    if (completedAt.HasValue && startedAt.HasValue)
                    {
                        durationSeconds = (int)Math.Max(0, (completedAt.Value - startedAt.Value).TotalSeconds);
                    }

                    result.Add(new IncidentResultDto
                    {
                        Id = Guid.NewGuid(),
                        IncidentId = incident.Id,
                        IncidentTitle = incident.Title,
                        ScenarioId = scenario?.Id,
                        ScenarioTitle = scenario?.Title ?? incident.Title,
                        UserId = user?.Id,
                        UserEmail = user?.Email ?? user?.Username ?? "unknown@user",
                        TeamId = department?.Id.ToString() ?? role?.Id.ToString(),
                        TeamName = department?.Name ?? role?.Name,
                        Score = score,
                        MaxScore = maxScore,
                        Pct = pct,
                        Status = status,
                        CompletedAt = completedAt,
                        DurationSec = durationSeconds,
                        Detail = detail,
                    });
                }
            }

            return result
                .OrderByDescending(r => r.CompletedAt ?? DateTime.MinValue)
                .ToList();
        }

    }

    public class IncidentResultDto
    {
        public Guid Id { get; set; }
        public Guid IncidentId { get; set; }
        public string IncidentTitle { get; set; } = string.Empty;
        public Guid? ScenarioId { get; set; }
        public string ScenarioTitle { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string? TeamId { get; set; }
        public string? TeamName { get; set; }
        public int Score { get; set; }
        public int MaxScore { get; set; }
        public int Pct { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public int DurationSec { get; set; }
        public List<QuestionResultDto> Detail { get; set; } = new();
    }

    public class QuestionResultDto
    {
        public Guid Qid { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Chosen { get; set; } = "-";
        public string Verdict { get; set; } = string.Empty;
        public int Points { get; set; }
        public int Max { get; set; }
        public List<OptionResultDto> Options { get; set; } = new();
    }

    public class OptionResultDto
    {
        public Guid OptionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public bool IsChosen { get; set; }
        public int Points { get; set; }
    }
}

