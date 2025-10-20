using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Scenario> Scenarios { get; set; } = null!;
    public DbSet<Question> Questions { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<Evaluation> Evaluations { get; set; } = null!;
    public DbSet<Incident> Incidents { get; set; } = null!;
    public DbSet<Response> Responses { get; set; } = null!;
    public DbSet<QuestionRole> QuestionRoles { get; set; } = null!;

    public DbSet<AnswerOption> AnswerOptions { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;




    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for QuestionRole (QuestionId + RoleId)
        modelBuilder.Entity<QuestionRole>()
            .HasKey(qr => new { qr.QuestionId, qr.RoleId });

        // Relationships
        modelBuilder.Entity<QuestionRole>()
            .HasOne(qr => qr.Question)
            .WithMany(q => q.QuestionRoles)
            .HasForeignKey(qr => qr.QuestionId);

        modelBuilder.Entity<QuestionRole>()
            .HasOne(qr => qr.Role)
            .WithMany(r => r.QuestionRoles)
            .HasForeignKey(qr => qr.RoleId);
    }
}
