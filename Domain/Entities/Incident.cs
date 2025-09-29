using System;

namespace Domain.Entities;

using Domain.Enum;

public class Incident
{
    public Guid Id { get; private set; } = Guid.NewGuid();    
    public required Guid ScenarioId { get; set; }
    public Scenario Scenario { get; set; } = null!;

    public required IncidentStatus Status { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<Response> Responses { get; set; } = new List<Response>();
}
