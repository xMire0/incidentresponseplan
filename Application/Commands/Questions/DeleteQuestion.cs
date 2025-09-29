using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class DeleteQuestion
{
    public class Command : IRequest
    {
        public required Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {

            var question = await context.Questions.FindAsync([request.Id], cancellationToken) ?? throw new Exception("Question not found");

            context.Remove(question);

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
