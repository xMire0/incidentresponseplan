using System;
using System.Dynamic;
using Domain.Entities;
using Domain.Enum;

namespace Domain.Entities;

public class Question
{
    public required Guid Id { get; set; }
    public required string QuestionText { get; set; }
    public required Priority Priority { get; set; } //low medium high
    public required string AcceptedAnswer { get; set; } //
    public required ICollection<Role> Roles { get; set; } = new List<Role>(); // M:N

}
