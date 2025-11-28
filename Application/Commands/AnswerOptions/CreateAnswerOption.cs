using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class CreateAnswerOption
{
    public class Command : IRequest<string>
    {
        public Guid QuestionId { get; set; }
        public string Text { get; set; } = null!;
        public int Weight { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var question = await context.Questions
                .Include(q => q.AnswerOptions)
                .FirstOrDefaultAsync(q => q.Id == request.QuestionId, cancellationToken);
            
            if (question == null)
                throw new InvalidOperationException("Question not found");

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

            var option = new AnswerOption
            {
                QuestionId = request.QuestionId,
                Text = request.Text,
                Weight = weight,
                IsCorrect = request.IsCorrect,
            };

            // Tilføj option til collection før beregning af MaxPoints
            question.AnswerOptions.Add(option);
            context.AnswerOptions.Add(option);
            
            // Opdater Question.MaxPoints (summen af alle korrekte optioners Weight)
            question.MaxPoints = question.AnswerOptions
                .Where(o => o.IsCorrect)
                .Sum(o => o.Weight);
            
            await context.SaveChangesAsync(cancellationToken);

            return option.Id.ToString();
        }
    }
}

