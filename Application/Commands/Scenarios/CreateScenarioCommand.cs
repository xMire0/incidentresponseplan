using Domain.Enum;
using MediatR;

namespace Application.Commands.Scenarios;

// Command der bærer data fra API/UI ind i Application-laget
public record CreateScenarioCommand(
    string Title,
    string Description,
    Risk Risk
) : IRequest<Guid>;
