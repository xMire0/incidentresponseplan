using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands.Questions;

public class EditQuestion
{
    public class Command : IRequest
    {
        public required Question Question { get; set; }
    }


    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)

        {
            var question = await context.Questions.FindAsync([request.Question.Id], cancellationToken) ?? throw new Exception("Question not found ");


            question.Priority = request.Question.Priority;
            question.Text = request.Question.Text;
            question.QuestionRoles = request.Question.QuestionRoles;

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
