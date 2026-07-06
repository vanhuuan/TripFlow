using backend.Entities;

namespace backend.DTOs;

public record CreateShareLinkResponse(string ShareUrl, string Token);
