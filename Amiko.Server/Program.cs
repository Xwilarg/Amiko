using Amiko.Server.Database;
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
        builder.Services.AddSingleton<UserManager>();

        // Add services to the container.

        builder.Services.AddDbContext<SqliteContext>();
        builder.Services.AddControllers();
        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.IncludeErrorDetails = true;


            var data = Encoding.UTF8.GetBytes("EffyIsLoveYouButPleaseINeedABetterPassword");
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
        }

        app.UseWebSockets();

        app.UseAuthorization();

        app.UseHttpsRedirection();

        app.MapControllers();

        app.Run();
    }
}
