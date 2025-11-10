using MediatR;
using Persistence;

namespace Application.Commands;

public class DeleteAnswerOption
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var option = await context.AnswerOptions.FindAsync([request.Id], cancellationToken)
                ?? throw new InvalidOperationException("Answer option not found");

            context.AnswerOptions.Remove(option);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

