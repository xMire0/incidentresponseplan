using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;


namespace Application.Commands;
public class CreateIncident
{
    public class Command : IRequest<string>
    {
        public Guid ScenarioId { get; set; }
        public required string Title { get; set; }
        public IncidentStatus Status { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var incident = new Incident
            {
                Title = request.Title,
                ScenarioId = request.ScenarioId,
                Status = request.Status,
                StartedAt = request.StartedAt,
                CompletedAt = request.CompletedAt
            };

            context.Incidents.Add(incident);
            await context.SaveChangesAsync(cancellationToken);

            return incident.Id.ToString();
        }
    }
}
