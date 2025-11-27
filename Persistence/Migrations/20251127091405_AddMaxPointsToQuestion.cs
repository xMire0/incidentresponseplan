using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxPointsToQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxPoints",
                table: "Questions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
            
            // Data migration: Update MaxPoints for existing questions
            // MaxPoints = sum of all correct AnswerOptions' Weight
            migrationBuilder.Sql(@"
                UPDATE Questions
                SET MaxPoints = (
                    SELECT COALESCE(SUM(Weight), 0)
                    FROM AnswerOptions
                    WHERE AnswerOptions.QuestionId = Questions.Id
                    AND AnswerOptions.IsCorrect = 1
                )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPoints",
                table: "Questions");
        }
    }
}
