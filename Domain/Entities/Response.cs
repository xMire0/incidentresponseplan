namespace Domain.Entities;

public class Response
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public required Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public required Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public required Guid AnswerOptionId { get; set; }
    public AnswerOption AnswerOption { get; set; } = null!;

    //free-text or text box    
    public string? Answer { get; set; }


    public required Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public required Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public required DateTime AnsweredAt { get; set; }
}