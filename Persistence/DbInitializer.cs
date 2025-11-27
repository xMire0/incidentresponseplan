using System;
using Domain.Entities;
using Domain.Enum;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context)
    {
        // Check if data already exists
        if (await context.Scenarios.AnyAsync())
        {
            return; // Data already seeded
        }

        //
        // 1️⃣ Seed Roles
        //
        var roles = new List<Role>
        {
            new() { Name = "IT", SecurityClearence = SecurityClearence.High },
            new() { Name = "Developer", SecurityClearence = SecurityClearence.Medium },
            new() { Name = "Analyst", SecurityClearence = SecurityClearence.Medium },
            new() { Name = "Admin", SecurityClearence = SecurityClearence.Admin }
        };
        context.Roles.AddRange(roles);
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
        // 4️⃣ Link Roles to Questions (optional)
        //
        // Example: all questions apply to both IT and Developer
        var itRole = roles.First(r => r.Name == "IT");
        var devRole = roles.First(r => r.Name == "Developer");

        foreach (var q in ransomwareScenario.Questions)
        {
            q.QuestionRoles.Add(new QuestionRole { Role = itRole });
            q.QuestionRoles.Add(new QuestionRole { Role = devRole });
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
