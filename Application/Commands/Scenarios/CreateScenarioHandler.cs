using Application.Interfaces;
using Domain.Entities;
using MediatR;



namespace Application.Commands.Scenarios;

public class CreateScenarioCommandHandler : IRequestHandler<CreateScenarioCommand, Guid>
{
    private readonly IScenarioRepository _repo;

    public CreateScenarioCommandHandler(IScenarioRepository repo)
    {
        _repo = repo;
    }

    public async Task<Guid> Handle(CreateScenarioCommand request, CancellationToken cancellationToken)
    {
        var scenario = new Scenario
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            Risk = request.Risk
        };

        await _repo.AddAsync(scenario);
        return scenario.Id;
    }
}
