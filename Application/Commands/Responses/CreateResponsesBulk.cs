using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class CreateResponsesBulk
{
    public class Command : IRequest<int>
    {
        public required List<ResponseDto> Responses { get; set; }
    }
    
    public class ResponseDto
    {
        public required Guid IncidentId { get; set; }
        public required Guid QuestionId { get; set; }
        public required Guid AnswerOptionId { get; set; }
        public string? Answer { get; set; }
        public required Guid RoleId { get; set; }
        public required Guid UserId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, int>
    {
        public async Task<int> Handle(Command request, CancellationToken cancellationToken)
        {
            var responses = request.Responses.Select(dto => new Response
            {
                IncidentId = dto.IncidentId,
                QuestionId = dto.QuestionId,
                AnswerOptionId = dto.AnswerOptionId,
                Answer = dto.Answer,
                RoleId = dto.RoleId,
                UserId = dto.UserId,
                AnsweredAt = DateTime.UtcNow
            }).ToList();
            
            context.Responses.AddRange(responses);
            await context.SaveChangesAsync(cancellationToken);
            
            return responses.Count;
        }
    }
}

