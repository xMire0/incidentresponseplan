using System;
using Domain.Entities;
using Domain.Enum;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context)
    {
        // Always reseed roles and users to ensure correct setup

        //
        // 1️⃣ Seed Roles
        //
        // Remove all existing roles and users first
        var allExistingUsers = await context.Users.ToListAsync();
        context.Users.RemoveRange(allExistingUsers);
        await context.SaveChangesAsync();

        var allExistingRoles = await context.Roles.ToListAsync();
        context.Roles.RemoveRange(allExistingRoles);
        await context.SaveChangesAsync();

        // Create only the required roles
        var roles = new List<Role>
        {
            new() { Name = "Admin", SecurityClearence = SecurityClearence.Admin },
            new() { Name = "Analyst", SecurityClearence = SecurityClearence.Medium },
            new() { Name = "Developer", SecurityClearence = SecurityClearence.Medium },
            new() { Name = "Consultant", SecurityClearence = SecurityClearence.Medium }
        };
        context.Roles.AddRange(roles);
        await context.SaveChangesAsync();

        var adminRole = roles.First(r => r.Name == "Admin");
        var analystRole = roles.First(r => r.Name == "Analyst");
        var developerRole = roles.First(r => r.Name == "Developer");
        var consultantRole = roles.First(r => r.Name == "Consultant");

        //
        // 1.3️⃣ Seed Departments
        //
        var allExistingDepartments = await context.Departments.ToListAsync();
        context.Departments.RemoveRange(allExistingDepartments);
        await context.SaveChangesAsync();

        var departments = new List<Department>
        {
            new() { Name = "IT Support" },
            new() { Name = "Security" },
            new() { Name = "Development" },
            new() { Name = "Management" }
        };
        context.Departments.AddRange(departments);
        await context.SaveChangesAsync();

        var itSupportDept = departments.First(d => d.Name == "IT Support");
        var securityDept = departments.First(d => d.Name == "Security");
        var developmentDept = departments.First(d => d.Name == "Development");
        var managementDept = departments.First(d => d.Name == "Management");

        //
        // 1.5️⃣ Seed Users with BCrypt hashed passwords and Departments
        //
        var users = new List<User>
        {
            new() { Username = "hamudi", Email = "hamudi@hamudi.dk", PasswordHash = BCrypt.Net.BCrypt.HashPassword("hamudi123"), RoleId = consultantRole.Id, DepartmentId = itSupportDept.Id },
            new() { Username = "asadi", Email = "asadi@asadi.dk", PasswordHash = BCrypt.Net.BCrypt.HashPassword("asadi123"), RoleId = developerRole.Id, DepartmentId = developmentDept.Id },
            new() { Username = "emir", Email = "emir@emir.dk", PasswordHash = BCrypt.Net.BCrypt.HashPassword("emir123"), RoleId = analystRole.Id, DepartmentId = securityDept.Id },
            new() { Username = "admin", Email = "admin@admin.dk", PasswordHash = BCrypt.Net.BCrypt.HashPassword("emir123"), RoleId = adminRole.Id, DepartmentId = managementDept.Id }
        };
        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        //
        // 2️⃣ Create Scenario
        //
        var ransomwareScenario = new Scenario
        {
            Title = "Ransomware Detected on Company Servers",
            Description = "During deployment, several backend servers begin encrypting files and displaying a ransom note.",
            CreatedAt = DateTime.Now,
            Risk = Risk.High
        };

        //
        // 3️⃣ Create Questions with Answer Options
        //
        ransomwareScenario.Questions = new List<Question>
        {
            new()
            {
                Text = "What is your first action when detecting ransomware activity?",
                Priority = Priority.High,
                AnswerOptions = new List<AnswerOption>
                {
                    new() { Text = "Disconnect affected servers from the network immediately.", Weight = 10, IsCorrect = true },
                    new() { Text = "Run antivirus scans on all systems right away.", Weight = 2, IsCorrect = false },
                    new() { Text = "Inform customers that data may be lost.", Weight = 2, IsCorrect = false },
                    new() { Text = "Take no action.", Weight = 0, IsCorrect = false }
                }
            },
            new()
            {
                Text = "After isolating servers, what should be your next priority?",
                Priority = Priority.High,
                AnswerOptions = new List<AnswerOption>
                {
                    new() { Text = "Restore systems from backup immediately.", Weight = 2 },
                    new() { Text = "Notify the incident response team and security lead.", Weight = 10, IsCorrect = true },
                    new() { Text = "Delete encrypted files to save storage.", Weight = 2 },
                    new() { Text = "Take no action.", Weight = 0 }
                }
            },
            new()
            {
                Text = "What data is most critical to preserve during a ransomware incident?",
                Priority = Priority.High,
                AnswerOptions = new List<AnswerOption>
                {
                    new() { Text = "Encrypted system files only.", Weight = 2 },
                    new() { Text = "User data and temporary logs.", Weight = 5 },
                    new() { Text = "All forensic logs and system images before reboot.", Weight = 10, IsCorrect = true },
                    new() { Text = "I didn’t preserve any data.", Weight = 0 }
                }
            },
            new()
            {
                Text = "When should communication with management occur?",
                Priority = Priority.Medium,
                AnswerOptions = new List<AnswerOption>
                {
                    new() { Text = "Immediately after detection to escalate response.", Weight = 10, IsCorrect = true },
                    new() { Text = "Only after resolving the issue.", Weight = 2 },
                    new() { Text = "When ransom note includes customer data threats.", Weight = 2 },
                    new() { Text = "I didn’t communicate with management.", Weight = 0 }
                }
            },
            new()
            {
                Text = "What’s the correct procedure regarding ransom payment?",
                Priority = Priority.Medium,
                AnswerOptions = new List<AnswerOption>
                {
                    new() { Text = "Pay the ransom if the data is mission-critical.", Weight = 2 },
                    new() { Text = "Contact legal and law enforcement before deciding.", Weight = 10, IsCorrect = true },
                    new() { Text = "Ask IT to handle the payment internally.", Weight = 2 },
                    new() { Text = "I didn’t escalate or respond.", Weight = 0 }
                }
            }
        };

        //
        // 4️⃣ Link Roles to Questions
        //
        // All questions apply to Developer, Analyst, and Consultant (employee roles)
        foreach (var q in ransomwareScenario.Questions)
        {
            q.QuestionRoles.Add(new QuestionRole { Role = developerRole });
            q.QuestionRoles.Add(new QuestionRole { Role = analystRole });
            q.QuestionRoles.Add(new QuestionRole { Role = consultantRole });
        }

        //
        // 5️⃣ Calculate and set MaxPoints for each question
        //
        foreach (var question in ransomwareScenario.Questions)
        {
            question.MaxPoints = question.AnswerOptions
                .Where(o => o.IsCorrect)
                .Sum(o => o.Weight);
        }

        //
        // 6️⃣ Save all data
        //
        context.Scenarios.Add(ransomwareScenario);
        await context.SaveChangesAsync();
        
        //
        // 7️⃣ Update MaxPoints for any existing questions (data migration)
        //
        var existingQuestions = await context.Questions
            .Include(q => q.AnswerOptions)
            .Where(q => q.MaxPoints == 0)
            .ToListAsync();
        
        foreach (var question in existingQuestions)
        {
            question.MaxPoints = question.AnswerOptions
                .Where(o => o.IsCorrect)
                .Sum(o => o.Weight);
        }
        
        if (existingQuestions.Count > 0)
        {
            await context.SaveChangesAsync();
        }
    }
}
