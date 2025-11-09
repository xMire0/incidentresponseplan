using System;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class EditResponse
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public required Response Response { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var response = await context.Responses.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("Response is not found");

            // Update the response properties
            response.IncidentId = request.Response.IncidentId;
            response.QuestionId = request.Response.QuestionId;
            response.AnswerOptionId = request.Response.AnswerOptionId;
            response.Answer = request.Response.Answer;
            response.RoleId = request.Response.RoleId;
            response.UserId = request.Response.UserId;
            response.AnsweredAt = request.Response.AnsweredAt;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
