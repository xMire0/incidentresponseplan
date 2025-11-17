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
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)
                .ToListAsync(cancellationToken);

            var result = new List<IncidentResultDto>();

            foreach (var incident in incidents)
            {
                if (incident.Responses.Count == 0)
                    continue;

                var scenario = incident.Scenario;
                var questionMaxLookup = BuildQuestionMaxLookup(scenario);

                var groups = incident.Responses
                    .GroupBy(r => r.UserId)
                    .ToList();

                foreach (var group in groups)
                {
                    var firstResponse = group.First();
                    var user = firstResponse.User;
                    var role = firstResponse.Role;

                    var detail = new List<QuestionResultDto>();
                    var score = 0;

                    foreach (var response in group)
                    {
                        var questionId = response.QuestionId;
                        var questionText = response.Question?.Text
                            ?? scenario?.Questions?.FirstOrDefault(q => q.Id == questionId)?.Text
                            ?? "Question";

                        var answerOption = response.AnswerOption;
                        var points = answerOption?.Weight ?? 0;
                        var verdict = answerOption?.IsCorrect == true
                            ? "correct"
                            : points > 0
                                ? "partial"
                                : "incorrect";

                        if (!questionMaxLookup.ContainsKey(questionId))
                        {
                            questionMaxLookup[questionId] = Math.Max(points, 0);
                        }

                        detail.Add(new QuestionResultDto
                        {
                            Qid = questionId,
                            Text = questionText,
                            Chosen = answerOption?.Text ?? response.Answer ?? "-",
                            Verdict = verdict,
                            Points = points,
                            Max = questionMaxLookup[questionId],
                        });

                        score += points;
                    }

                    var maxScore = questionMaxLookup.Values.Sum();
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
                        ScenarioId = scenario?.Id,
                        ScenarioTitle = scenario?.Title ?? incident.Title,
                        UserId = user?.Id,
                        UserEmail = user?.Email ?? user?.Username ?? "unknown@user",
                        TeamId = role?.Id.ToString(),
                        TeamName = role?.Name,
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

        private static Dictionary<Guid, int> BuildQuestionMaxLookup(Scenario? scenario)
        {
            var lookup = new Dictionary<Guid, int>();

            if (scenario?.Questions != null)
            {
                foreach (var question in scenario.Questions)
                {
                    if (question.AnswerOptions.Count == 0)
                    {
                        lookup[question.Id] = 0;
                        continue;
                    }

                    var hasCorrect = question.AnswerOptions.Any(o => o.IsCorrect);
                    var max = hasCorrect
                        ? question.AnswerOptions
                            .Where(o => o.IsCorrect)
                            .Select(o => o.Weight)
                            .DefaultIfEmpty(0)
                            .Max()
                        : question.AnswerOptions
                            .Select(o => o.Weight)
                            .DefaultIfEmpty(0)
                            .Max();

                    lookup[question.Id] = Math.Max(0, max);
                }
            }

            return lookup;
        }
    }

    public class IncidentResultDto
    {
        public Guid Id { get; set; }
        public Guid IncidentId { get; set; }
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
    }
}

