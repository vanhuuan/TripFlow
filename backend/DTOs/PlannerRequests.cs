namespace backend.DTOs;

public record CreatePlannerMessageRequest(
    Guid ClientMessageId,
    string Message,
    string Locale);
