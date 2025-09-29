using System;

namespace Domain.Entities
{
    public class QuestionRole
    {
        public Guid QuestionId { get; set; }             
        public Question Question { get; set; } = null!;

        public Guid RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }
}
