using System;

namespace Domain.Entities;

using Domain.Enum;

public class Incident
{
    public required Guid Id { get; set; }

    public required Guid ScenarioId { get; set; }
    public Scenario Scenario { get; set; } = null!;

    public required IncidentStatus Status { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<Response> Responses { get; set; } = new List<Response>();
}
