using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
            var option = await context.AnswerOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.AnswerOptions)
                .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
                ?? throw new InvalidOperationException("Answer option not found");

            var oldWeight = option.Weight;
            var oldIsCorrect = option.IsCorrect;

            // Automatisk Weight logik
            int weight = request.Weight;
            if (request.IsCorrect && weight == 0)
            {
                weight = 10; // Default for correct answers
            }
            else if (!request.IsCorrect)
            {
                // Incorrect options should always have weight 0
                weight = 0;
            }

            option.Text = request.Text;
            option.Weight = weight;
            option.IsCorrect = request.IsCorrect;

            // Opdater Question.MaxPoints (summen af alle korrekte optioners Weight)
            var question = option.Question;
            question.MaxPoints = question.AnswerOptions
                .Where(o => o.IsCorrect)
                .Sum(o => o.Weight);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

