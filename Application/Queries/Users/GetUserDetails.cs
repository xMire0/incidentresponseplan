using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetUserDetails
{
    public class Query : IRequest<UserDetailsDto?>
    {
        public Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, UserDetailsDto?>
    {
        public async Task<UserDetailsDto?> Handle(Query request, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .Include(u => u.Role)
                .Include(u => u.Responses)
                    .ThenInclude(r => r.Incident)
                        .ThenInclude(i => i.Scenario)
                .Include(u => u.Responses)
                    .ThenInclude(r => r.Question)
                        .ThenInclude(q => q.AnswerOptions)
                .Include(u => u.Responses)
                    .ThenInclude(r => r.AnswerOption)
                .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

            if (user == null)
                return null;

            // Group responses by incident
            var responsesByIncident = user.Responses
                .GroupBy(r => r.IncidentId)
                .ToList();

            var completedIncidents = new List<IncidentResultDto>();
            var allIncidentIds = new HashSet<Guid>();

            foreach (var group in responsesByIncident)
            {
                var incident = group.First().Incident;
                if (incident == null) continue;

                allIncidentIds.Add(incident.Id);

                var responses = group.ToList();
                var questions = responses
                    .Select(r => r.Question)
                    .Where(q => q != null)
                    .DistinctBy(q => q.Id)
                    .ToList();

                var totalScore = responses.Sum(r => r.AnswerOption?.Weight ?? 0);
                var maxScore = questions.Sum(q => q.MaxPoints);

                var maxAnsweredAt = responses
                    .Where(r => r.AnsweredAt != default)
                    .Select(r => r.AnsweredAt)
                    .DefaultIfEmpty(DateTime.UtcNow)
                    .Max();

                completedIncidents.Add(new IncidentResultDto
                {
                    IncidentId = incident.Id,
                    IncidentTitle = incident.Title,
                    ScenarioTitle = incident.Scenario?.Title ?? "Unknown",
                    CompletedAt = maxAnsweredAt != default ? maxAnsweredAt : (DateTime?)null,
                    Score = totalScore,
                    MaxScore = maxScore,
                    Percentage = maxScore > 0 ? (int)Math.Round(totalScore * 100d / maxScore) : 0,
                    Responses = responses.Select(r => new ResponseDto
                    {
                        QuestionId = r.QuestionId,
                        QuestionText = r.Question?.Text ?? "Unknown",
                        AnswerOptionId = r.AnswerOptionId,
                        AnswerText = r.AnswerOption?.Text ?? r.Answer ?? "Unknown",
                        IsCorrect = r.AnswerOption?.IsCorrect ?? false,
                        Points = r.AnswerOption?.Weight ?? 0
                    }).ToList()
                });
            }

            // Find all incidents the user hasn't responded to
            var allIncidents = await context.Incidents
                .Include(i => i.Scenario)
                .Where(i => !allIncidentIds.Contains(i.Id))
                .Select(i => new PendingIncidentDto
                {
                    IncidentId = i.Id,
                    IncidentTitle = i.Title,
                    ScenarioTitle = i.Scenario != null ? i.Scenario.Title : "Unknown",
                    Status = i.Status.ToString(),
                    StartedAt = i.StartedAt
                })
                .ToListAsync(cancellationToken);

            return new UserDetailsDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                RoleId = user.RoleId,
                RoleName = user.Role.Name,
                CompletedIncidents = completedIncidents,
                PendingIncidents = allIncidents
            };
        }
    }

    public class UserDetailsDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public List<IncidentResultDto> CompletedIncidents { get; set; } = new();
        public List<PendingIncidentDto> PendingIncidents { get; set; } = new();
    }

    public class IncidentResultDto
    {
        public Guid IncidentId { get; set; }
        public string IncidentTitle { get; set; } = string.Empty;
        public string ScenarioTitle { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public int Score { get; set; }
        public int MaxScore { get; set; }
        public int Percentage { get; set; }
        public List<ResponseDto> Responses { get; set; } = new();
    }

    public class ResponseDto
    {
        public Guid QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public Guid AnswerOptionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int Points { get; set; }
    }

    public class PendingIncidentDto
    {
        public Guid IncidentId { get; set; }
        public string IncidentTitle { get; set; } = string.Empty;
        public string ScenarioTitle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
    }
}

