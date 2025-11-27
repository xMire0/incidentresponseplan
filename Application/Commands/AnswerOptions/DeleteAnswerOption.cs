using MediatR;
using Microsoft.EntityFrameworkCore;
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
            var option = await context.AnswerOptions
                .Include(o => o.Question)
                    .ThenInclude(q => q.AnswerOptions)
                .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
                ?? throw new InvalidOperationException("Answer option not found");

            var question = option.Question;
            
            context.AnswerOptions.Remove(option);
            
            // Opdater Question.MaxPoints efter sletning
            question.MaxPoints = question.AnswerOptions
                .Where(o => o.Id != request.Id && o.IsCorrect)
                .Sum(o => o.Weight);
            
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

