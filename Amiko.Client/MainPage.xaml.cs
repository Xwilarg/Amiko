using Amiko.Client.Data;
using Amiko.Common;
using ProtoBuf;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text.Json;

namespace Amiko.Client
{
    public partial class MainPage : ContentPage
    {
        /// <summary>
        /// Handle connection with server
        /// </summary>
        private ClientWebSocket sock;
        private Config _config;

        private string userConfigPath = Path.Combine(FileSystem.AppDataDirectory, "config.json");

        public MainPage()
        {
            InitializeComponent();

            if (File.Exists(userConfigPath))
            {
                _config = JsonSerializer.Deserialize<Config>(File.ReadAllText(userConfigPath));
                if (_config.Username == null) _config.Username = $"User {new Random().Next(0, 10000):0000}";
            }
            else
            {
                _config = new()
                {
                    Username = $"User {new Random().Next(0, 10000):0000}"
                };
                File.WriteAllText(userConfigPath, JsonSerializer.Serialize(_config));
            }

            Appearing += async (s, e) =>
            {
                Username.Text = _config.Username;

                sock = new();
                AddError("Connecting...", MessageType.Info);
                await ConnectAsync();
                _ = Task.Run(ListenAsync);
            };

            Loaded += (s, e) => // https://stackoverflow.com/a/76368188
            {
                _ = Task.Delay(200).ContinueWith(t =>
                {
                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        Input.Focus();
                    });
                });
            };
        }

        private void AddError(string message, MessageType type)
        {
            MessageList.Children.Add(new MessageView(string.Empty, message, DateTime.Now, type));

            ScrollDown();
        }

        private void AddMessage(string name, string content, DateTime time, MessageType type)
        {
            MessageList.Children.Add(new MessageView(name, content, time, type));

            ScrollDown();
        }

        private void ScrollDown() // TODO: Use proper container instead
        {
            _ = new Timer((object? _obj) => {
                MainThread.BeginInvokeOnMainThread(() =>
            MessageScroll.ScrollToAsync(MessageList, ScrollToPosition.End, true));
            }, null, 1, Timeout.Infinite);
        }

        private async Task ListenAsync()
        {
            while (true)
            {
                try
                {
                    var buffer = new byte[1024];
                    await sock.ReceiveAsync(buffer, CancellationToken.None);
                    buffer = buffer.TakeWhile((v, index) => buffer.Skip(index).Any(w => w != 0x00)).ToArray(); // TODO: ew
                    using MemoryStream ms = new(buffer);
                    var prot = Serializer.Deserialize<Message[]>(ms);

                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        foreach (var msg in prot)
                        {
                            TimeZoneInfo systemTimeZone = TimeZoneInfo.Local;
                            AddMessage(msg.Name, msg.Content, TimeZoneInfo.ConvertTimeFromUtc(msg.SentAt, systemTimeZone), MessageType.User);
                        }
                    });
                }
                catch (Exception ex)
                {
                    await Task.Delay(100);
                }
            }
        }

        private async Task ConnectAsync()
        {
            try
            {
                if (Debugger.IsAttached)
                {
                    await sock.ConnectAsync(new("ws://localhost:5129/ws"), CancellationToken.None);
                }
                else
                {
                    await sock.ConnectAsync(new("ws://amiko.zirk.eu/ws"), CancellationToken.None);
                }
                SendButton.IsEnabled = true;
                AddError("Connected", MessageType.Info);
                //SemanticScreenReader.Announce("Connected");
            }
            catch (Exception ex)
            {
                AddError($"Error while connecting: {ex.Message}", MessageType.Error);
            }
        }

        private void OnSendMessage(object sender, EventArgs e)
        {
            var msg = Input.Text;

            if (string.IsNullOrWhiteSpace(msg)) return;

            if (Username.Text != _config.Username)
            {
                _config.Username = Username.Text.Trim();
                Username.Text = _config.Username;
                File.WriteAllText(userConfigPath, JsonSerializer.Serialize(_config));
            }

            Input.Text = string.Empty;
            AddMessage(_config.Username, msg, DateTime.Now, MessageType.Self);

            var prot = new Message()
            {
                Name = Username.Text,
                Content = msg
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    using MemoryStream ms = new();
                    Serializer.Serialize(ms, prot);
                    await sock.SendAsync(ms.ToArray(), WebSocketMessageType.Binary, true, CancellationToken.None);
                    //SemanticScreenReader.Announce("Message sent");
                }
                catch (Exception ex)
                {
                    AddError($"Error while sending message: {ex.Message}", MessageType.Error);
                }
            });
        }
    }

}
