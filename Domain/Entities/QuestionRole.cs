using System;
using Domain.Enum;

namespace Domain.Entities;


public class QuestionRole
{

    public required Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public required Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public required string AcceptedAnswer { get; set; }
}