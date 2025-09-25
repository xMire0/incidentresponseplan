namespace Application.Common
{
    public class Result<T>
    {
        public bool IsSuccess { get; init; }
        public string? Error { get; init; }
        public T? Value { get; init; }

        private Result(bool isSuccess, T? value, string? error)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
        }

        // Factory methods
        public static Result<T> Success(T value) => new(true, value, null);

        public static Result<T> Failure(string error) => new(false, default, error);
    }
}
