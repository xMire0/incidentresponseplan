using System;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;

namespace Application.Commands;

public class CreateQuestion
{
    public class Command : IRequest<string>
    {
        public required Question Question { get; set; }
        public required Guid ScenarioId { get; set; }
        public required string Text { get; set; }
        public required Priority Priority { get; set; } //okay edited

    }


    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var question = new Question
            {
                ScenarioId = request.ScenarioId,
                Text = request.Text,
                Priority = request.Priority,
            };

            context.Questions.Add(question);
            await context.SaveChangesAsync(cancellationToken);

            return question.Id.ToString();
        }
    }
}
