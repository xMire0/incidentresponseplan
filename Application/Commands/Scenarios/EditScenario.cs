using System;
using System.Net.Cache;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class EditScenario
{

    public class Command : IRequest
    {
        public Guid Id { get; set; }         
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var scenario = await context.Scenarios.FindAsync([request.Id], cancellationToken)
            ?? throw new Exception("Response is not found");

            scenario.CreatedAt = request.CreatedAt;
            scenario.Description = request.Description;
            scenario.Title = request.Title;

            await context.SaveChangesAsync(cancellationToken);
        }
    }

}

