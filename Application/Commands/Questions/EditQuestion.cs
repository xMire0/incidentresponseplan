using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;

namespace Application.Commands;

public class EditQuestion
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public Priority Priority { get; set; }
    }


    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)

        {
            var question = await context.Questions.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("Question is not found");

            question.Priority = request.Priority;
            question.Text = request.Text;

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
