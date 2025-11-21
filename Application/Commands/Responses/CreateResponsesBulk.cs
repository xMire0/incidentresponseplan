using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class CreateResponsesBulk
{
    public class Command : IRequest<int>
    {
        public required List<ResponseDto> Responses { get; set; }
        public Guid? IncidentId { get; set; }
        public bool MarkCompleted { get; set; }
    }
    
    public class ResponseDto
    {
        public Guid IncidentId { get; set; }
        public Guid QuestionId { get; set; }
        public Guid AnswerOptionId { get; set; }
        public string? Answer { get; set; }
        public Guid? RoleId { get; set; }
        public Guid? UserId { get; set; }
        public string? UserEmail { get; set; }
        public DateTime? AnsweredAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, int>
    {
        public async Task<int> Handle(Command request, CancellationToken cancellationToken)
        {
            if (request.Responses.Count == 0)
                return 0;

            var incidentId = request.IncidentId ?? request.Responses[0].IncidentId;

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

            var createdUsers = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
            Guid? cachedDefaultRoleId = null;

            async Task<Guid> EnsureRoleAsync(Guid? candidate)
            {
                if (candidate.HasValue && candidate.Value != Guid.Empty)
                    return candidate.Value;

                if (cachedDefaultRoleId.HasValue)
                    return cachedDefaultRoleId.Value;

                var defaultRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Employee", cancellationToken);
                if (defaultRole == null)
                {
                    defaultRole = new Role
                    {
                        Name = "Employee",
                        SecurityClearence = SecurityClearence.Low,
                    };
                    context.Roles.Add(defaultRole);
                }

                cachedDefaultRoleId = defaultRole.Id;
                return cachedDefaultRoleId.Value;
            }

            async Task<Guid> EnsureUserAsync(Guid? candidateUserId, string? email, Guid roleId)
            {
                if (candidateUserId.HasValue && candidateUserId.Value != Guid.Empty)
                    return candidateUserId.Value;

                if (!string.IsNullOrWhiteSpace(email))
                {
                    if (!createdUsers.TryGetValue(email, out var cachedId))
                    {
                        var existing = await context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
                        if (existing != null)
                        {
                            cachedId = existing.Id;
                        }
                        else
                        {
                            var newUser = new User
                            {
                                Username = email,
                                Email = email,
                                RoleId = roleId,
                            };
                            context.Users.Add(newUser);
                            cachedId = newUser.Id;
                        }

                        createdUsers[email] = cachedId;
                    }

                    return cachedId;
                }

                var anonymousUser = new User
                {
                    Username = $"anonymous-{Guid.NewGuid():N}",
                    Email = null,
                    RoleId = roleId,
                };
                context.Users.Add(anonymousUser);
                return anonymousUser.Id;
            }

            var responses = new List<Response>(request.Responses.Count);
            foreach (var dto in request.Responses)
            {
                if (dto.QuestionId == Guid.Empty || dto.AnswerOptionId == Guid.Empty)
                    continue;

                var roleId = await EnsureRoleAsync(dto.RoleId);
                var userId = await EnsureUserAsync(dto.UserId, dto.UserEmail, roleId);

                responses.Add(new Response
                {
                    IncidentId = dto.IncidentId,
                    QuestionId = dto.QuestionId,
                    AnswerOptionId = dto.AnswerOptionId,
                    Answer = dto.Answer,
                    RoleId = roleId,
                    UserId = userId,
                    AnsweredAt = dto.AnsweredAt ?? DateTime.UtcNow
                });
            }

            if (responses.Count == 0)
                return 0;

            context.Responses.AddRange(responses);

            if (request.MarkCompleted && incidentId != Guid.Empty)
            {
                var incident = await context.Incidents.FirstOrDefaultAsync(i => i.Id == incidentId, cancellationToken);
                if (incident != null)
                {
                    incident.Status = IncidentStatus.Completed;
                    incident.CompletedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            
            return responses.Count;
        }
    }
}

