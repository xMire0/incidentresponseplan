using BCrypt.Net;

namespace Application.Common;

public static class PasswordHasher
{
    /// <summary>
    /// Hashes a password using BCrypt
    /// </summary>
    public static string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty", nameof(password));

        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// Verifies a password against a hash.
    /// Supports both BCrypt hashes and plain text (for backward compatibility with existing users).
    /// </summary>
    public static bool VerifyPassword(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(storedHash))
            return false;

        // Check if stored hash is a BCrypt hash (starts with $2a$, $2b$, $2x$, or $2y$)
        if (storedHash.StartsWith("$2") && storedHash.Length > 20)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, storedHash);
            }
            catch
            {
                return false;
            }
        }

        // Fallback: plain text comparison (for existing users with plain text passwords)
        return password == storedHash;
    }
}

