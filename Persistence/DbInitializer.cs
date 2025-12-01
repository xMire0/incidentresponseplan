using System;
using System.Linq;
using Domain.Entities;
using Domain.Enum;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context)
    {
        // Seed data only if it doesn't exist - preserve user-created data

        //
        // 1️⃣ Seed Roles - kun hvis de ikke findes
        //
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        var analystRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Analyst");
        var developerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Developer");
        var consultantRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Consultant");

        if (adminRole == null || analystRole == null || developerRole == null || consultantRole == null)
        {
            // Create missing roles
            var rolesToAdd = new List<Role>();
            
            if (adminRole == null)
            {
                adminRole = new() { Name = "Admin", SecurityClearence = SecurityClearence.Admin };
                rolesToAdd.Add(adminRole);
            }
            if (analystRole == null)
            {
                analystRole = new() { Name = "Analyst", SecurityClearence = SecurityClearence.Medium };
                rolesToAdd.Add(analystRole);
            }
            if (developerRole == null)
            {
                developerRole = new() { Name = "Developer", SecurityClearence = SecurityClearence.Medium };
                rolesToAdd.Add(developerRole);
            }
            if (consultantRole == null)
            {
                consultantRole = new() { Name = "Consultant", SecurityClearence = SecurityClearence.Medium };
                rolesToAdd.Add(consultantRole);
            }

            if (rolesToAdd.Count > 0)
            {
                context.Roles.AddRange(rolesToAdd);
                await context.SaveChangesAsync();
            }
        }

        //
        // 1.3️⃣ Seed Departments - kun hvis de ikke findes
        //
        var itSupportDept = await context.Departments.FirstOrDefaultAsync(d => d.Name == "IT Support");
        var securityDept = await context.Departments.FirstOrDefaultAsync(d => d.Name == "Security");
        var developmentDept = await context.Departments.FirstOrDefaultAsync(d => d.Name == "Development");
        var managementDept = await context.Departments.FirstOrDefaultAsync(d => d.Name == "Management");

        if (itSupportDept == null || securityDept == null || developmentDept == null || managementDept == null)
        {
            var departmentsToAdd = new List<Department>();
            
            if (itSupportDept == null)
            {
                itSupportDept = new() { Name = "IT Support" };
                departmentsToAdd.Add(itSupportDept);
            }
            if (securityDept == null)
            {
                securityDept = new() { Name = "Security" };
                departmentsToAdd.Add(securityDept);
            }
            if (developmentDept == null)
            {
                developmentDept = new() { Name = "Development" };
                departmentsToAdd.Add(developmentDept);
            }
            if (managementDept == null)
            {
                managementDept = new() { Name = "Management" };
                departmentsToAdd.Add(managementDept);
            }

            if (departmentsToAdd.Count > 0)
            {
                context.Departments.AddRange(departmentsToAdd);
                await context.SaveChangesAsync();
            }
        }

        //
        // 1.5️⃣ Seed Users with BCrypt hashed passwords and Departments - kun hvis de ikke findes
        //
        var seedUsers = new[]
        {
            new { Username = "hamudi", Email = "hamudi@hamudi.dk", Password = "hamudi123", Role = consultantRole, Department = itSupportDept },
            new { Username = "asadi", Email = "asadi@asadi.dk", Password = "asadi123", Role = developerRole, Department = developmentDept },
            new { Username = "emir", Email = "emir@emir.dk", Password = "emir123", Role = analystRole, Department = securityDept },
            new { Username = "admin", Email = "admin@admin.dk", Password = "emir123", Role = adminRole, Department = managementDept },
            new { Username = "adminforplaywright", Email = "admin@admin.com", Password = "123", Role = adminRole, Department = managementDept },
            new { Username = "employeeforplaywright", Email = "employee@employee.com", Password = "123", Role = developerRole, Department = developmentDept }
        };

        var usersToAdd = new List<User>();
        foreach (var seedUser in seedUsers)
        {
            var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == seedUser.Email);
            if (existingUser == null && seedUser.Role != null)
            {
                usersToAdd.Add(new User
                {
                    Username = seedUser.Username,
                    Email = seedUser.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedUser.Password),
                    RoleId = seedUser.Role.Id,
                    DepartmentId = seedUser.Department?.Id
                });
            }
        }

        if (usersToAdd.Count > 0)
        {
            context.Users.AddRange(usersToAdd);
            await context.SaveChangesAsync();
        }

        //
        // 2️⃣ Create Scenario - kun hvis den ikke findes
        //
        var existingScenario = await context.Scenarios
            .FirstOrDefaultAsync(s => s.Title == "Ransomware Detected on Company Servers");

        if (existingScenario == null)
        {
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
        }
        
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
