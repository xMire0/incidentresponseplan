using System;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class EditResponse
{
    public class Command : IRequest
    {

        public required Response Response { get; set; }

    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)

        {
            var response = await context.Responses.FindAsync([request.Response.Id], cancellationToken)
                ?? throw new Exception("Response is not found");


        }
    }
}
