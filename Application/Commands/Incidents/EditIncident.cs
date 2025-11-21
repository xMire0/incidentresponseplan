using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;


namespace Application.Commands;

public class EditIncident
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public IncidentStatus? Status { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var incident = await context.Incidents.FindAsync([request.Id], cancellationToken)
                           ?? throw new Exception("Incident not found");

            if (!string.IsNullOrWhiteSpace(request.Title))
                incident.Title = request.Title;

            if (request.Status.HasValue)
            {
                incident.Status = request.Status.Value;
            }

            if (request.StartedAt.HasValue)
            {
                incident.StartedAt = request.StartedAt;
            }

            if (request.CompletedAt.HasValue)
            {
                incident.CompletedAt = request.CompletedAt;
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
