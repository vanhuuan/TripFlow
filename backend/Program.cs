using System.Text;
using System.Text.Json.Serialization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using backend.Configuration;
using backend.Data;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a valid JWT bearer token."
    });
});
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection(JwtSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddOptions<BlobStorageOptions>()
    .Bind(builder.Configuration.GetSection(BlobStorageOptions.SectionName));
builder.Services.AddOptions<BlogBlobStorageOptions>()
    .Bind(builder.Configuration.GetSection(BlogBlobStorageOptions.SectionName));
builder.Services.AddOptions<OpenAISettings>()
    .Bind(builder.Configuration.GetSection(OpenAISettings.SectionName));
builder.Services.AddOptions<AnthropicSettings>()
    .Bind(builder.Configuration.GetSection(AnthropicSettings.SectionName));
builder.Services.AddOptions<GoogleAISettings>()
    .Bind(builder.Configuration.GetSection(GoogleAISettings.SectionName));
builder.Services.AddOptions<GoogleMapsSettings>()
    .Bind(builder.Configuration.GetSection(GoogleMapsSettings.SectionName));
builder.Services.AddOptions<AISettings>()
    .Bind(builder.Configuration.GetSection(AISettings.SectionName))
    .ValidateDataAnnotations()
    .Validate(settings => IsSupportedProvider(settings.Provider), "AI:Provider must be OpenAI, Anthropic, or Google.")
    .Validate(settings => HasProviderApiKey(settings.Provider, builder.Configuration), "The configured AI provider requires its API key.")
    .ValidateOnStart();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<IGooglePlacesService, GooglePlacesService>(client =>
{
    client.BaseAddress = new Uri("https://places.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(8);
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("places", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("TripFlowCors", policy =>
    {
        policy
            .WithOrigins(builder.Configuration["FrontendUrl"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are missing.");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IFileStorageService, AzureBlobFileStorageService>();
builder.Services.AddScoped<IBlogStorageService, AzureBlobBlogStorageService>();
builder.Services.AddSingleton<ITripBlogMarkdownSerializer, TripBlogMarkdownSerializer>();
builder.Services.AddScoped<ITripBlogGenerationService, TripBlogGenerationService>();
builder.Services.AddSingleton<IConfiguredBlogModel, ConfiguredBlogModel>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("TripFlowCors");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "TripFlow API"
}));

app.MapControllers();

app.Run();

static bool IsSupportedProvider(string? provider) => provider is "OpenAI" or "Anthropic" or "Google";

static bool HasProviderApiKey(string? provider, IConfiguration configuration) => provider switch
{
    "OpenAI" => !string.IsNullOrWhiteSpace(configuration["OpenAI:ApiKey"]),
    "Anthropic" => !string.IsNullOrWhiteSpace(configuration["Anthropic:ApiKey"]),
    "Google" => !string.IsNullOrWhiteSpace(configuration["Google:ApiKey"]),
    _ => false
};
