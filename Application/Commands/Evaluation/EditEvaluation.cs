using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;


namespace Application.Commands;

public class EditEvaluation
{
    public class Command : IRequest
    {
        //fake
        public Guid Id { get; set; }
        public Guid ScenarioId { get; set; }
        public IncidentStatus Status { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var evaluation = await context.Evaluations.FindAsync([request.Id], cancellationToken)
                           ?? throw new Exception("evaluation not found");
/*
            evaluation.ScenarioId = request.ScenarioId;
            evaluation.Status = request.Status;
            evaluation.CompletedAt = request.CompletedAt;
*/
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
