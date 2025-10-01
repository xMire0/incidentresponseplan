using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class CreateEvaluation
{
    public class Command : IRequest<string>
    {
        public required Evaluation Evaluation { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Evaluations.Add(request.Evaluation);

            await context.SaveChangesAsync(cancellationToken);
            return request.Evaluation.Id.ToString();

        }
    }
}
