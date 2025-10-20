using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;
using SQLitePCL;

namespace Application.Queries;

public class GetAnswerOptionDetails
{
    // Query
    public class Query : IRequest<AnswerOption>
    {
        public Guid Id { get; set; }
    }
    
    public class AnswerOptionDetailsDTO 

    // Handler
    public class Handler(AppDbContext context) : IRequestHandler<Query, AnswerOption>
    {
        public async Task<AnswerOption> Handle(Query request, CancellationToken cancellationToken)
        {

            var answeroption = await context.AnswerOptions.Include(x => x.Question).
            FirstOrDefaultAsync(q => q.Id == request.Id, cancellationToken);

            if (answeroption == null)
            {
                throw new Exception("Not found");
            }

            var question = await context.Questions.FirstOrDefaultAsync(x => x.Id == answeroption.QuestionId);




            return answeroption;

        }
    }
}