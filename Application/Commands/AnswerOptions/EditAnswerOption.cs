using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class EditAnswerOption
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public int Weight { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var option = await context.AnswerOptions.FindAsync([request.Id], cancellationToken)
                ?? throw new InvalidOperationException("Answer option not found");

            option.Text = request.Text;
            option.Weight = request.Weight;
            option.IsCorrect = request.IsCorrect;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

