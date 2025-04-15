using SimpleEvents.Backend.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register services
builder.Services.AddScoped<ITimelineService, TimelineService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "static")),
    RequestPath = ""
});

// Enable CORS
app.UseCors();

// Serve index.html for root path
app.MapGet("/", () => Results.File(
    Path.Combine(builder.Environment.ContentRootPath, "static", "index.html"),
    "text/html"));

app.MapControllers();

app.Run();
