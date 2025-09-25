using System;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class AddQuestionCommand
{
    public class Command : IRequest<string>
    {
        public required Question Question { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Questions.Add(request.Question);

            await context.SaveChangesAsync(cancellationToken);
            return request.Question.Id.ToString();

        }
    }
}
