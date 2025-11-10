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
            var questionExists = await context.Questions.AnyAsync(q => q.Id == request.QuestionId, cancellationToken);
            if (!questionExists)
                throw new InvalidOperationException("Question not found");

            var option = new AnswerOption
            {
                QuestionId = request.QuestionId,
                Text = request.Text,
                Weight = request.Weight,
                IsCorrect = request.IsCorrect,
            };

            context.AnswerOptions.Add(option);
            await context.SaveChangesAsync(cancellationToken);

            return option.Id.ToString();
        }
    }
}

