using System;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public required DbSet<Domain.Entities.Scenario> Scenarios { get; set; }
    public required DbSet<Domain.Entities.Question> Questions { get; set; }
    public required DbSet<Domain.Entities.Role> Roles { get; set; }
}