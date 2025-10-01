using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class DeleteEvaluation
{
    public class Command : IRequest
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {

        public async Task Handle(Command request, CancellationToken cancellationToken)
        {

            var evaluation = await context.Evaluations.FindAsync([request.Id], cancellationToken) ?? throw new Exception("Evaluation not found");

            context.Remove(evaluation);

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
