using Amiko.Server.Database.Context;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Amiko.Server;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Logging.ClearProviders();
        builder.Logging.AddConsole();

        // Add services to the container.

        builder.Services.AddDbContext<SqliteContext>();
        builder.Services.AddSingleton(new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        builder.Services.AddHttpClient();
        builder.Services.AddControllers();
        builder.Services.AddSingleton<ConnectionManager>();
        builder.Services.AddScoped<MessageManager>();
        builder.Services.AddScoped<ConfigManager>();
        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("debug", p =>
            {
                p.WithOrigins("http://localhost:5173").AllowAnyHeader();
            });
        });

        WebApplication app = null;

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.IncludeErrorDetails = true;

            using var scope = app.Services.CreateScope();
            var data = Encoding.UTF8.GetBytes(scope.ServiceProvider.GetRequiredService<ConfigManager>().GetConfig().SecurityKey);
            var securityKey = new SymmetricSecurityKey(data);

            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ClockSkew = TimeSpan.Zero,

                ValidateLifetime = true,

                ValidateAudience = false,
                ValidateIssuer = false,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = securityKey
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Headers.ContainsKey("sec-websocket-protocol"))
                    {
                        var token = context.Request.Headers["sec-websocket-protocol"].ToString();
                        context.Token = token.Substring(token.IndexOf(',') + 1).Trim();
                        context.Request.Headers["sec-websocket-protocol"] = "client";

#if DEBUG
                        options.RequireHttpsMetadata = false;
#else
                        options.RequireHttpsMetadata = true;
#endif
                    }
                    return Task.CompletedTask;
                }
            };
        });

        app = builder.Build();

        using var scope = app.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<ConfigManager>().InitConfig();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseCors("debug");
        }
        else
        {
            app.UseHttpsRedirection();
        }

        app.UseWebSockets();

        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}
