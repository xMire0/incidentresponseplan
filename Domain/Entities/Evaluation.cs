namespace Domain.Entities;

public class Evaluation
{
    public Guid Id { get; private set; } = Guid.NewGuid();    

    public required Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public required int CorrectAnswers { get; set; }
    public required int MissingSteps { get; set; }
    public required int Score { get; set; }

    // JSON med detaljer per spørgsmål
    public string DetailsJson { get; set; } = "{}";
    public string Comments { get; set; } = null!;
}