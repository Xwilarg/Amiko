using Amiko.Server.Database.Context;
using Amiko.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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
        builder.Services.AddHttpClient();
        builder.Services.AddControllers();
        builder.Services.AddSingleton<ConnectionManager>();
        builder.Services.AddScoped<MessageManager>();
        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("debug", p =>
            {
                p.WithOrigins("http://localhost:5173").AllowAnyHeader();
            });
        });

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.IncludeErrorDetails = true;


            var data = Encoding.UTF8.GetBytes("EffyILoveYouButPleaseINeedABetterPassword");
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

        var app = builder.Build();

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
