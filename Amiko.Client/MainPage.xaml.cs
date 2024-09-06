using Amiko.Common;
using ProtoBuf;
using System.Net.WebSockets;

namespace Amiko.Client
{
    public partial class MainPage : ContentPage
    {
        /// <summary>
        /// Handle connection with server
        /// </summary>
        private ClientWebSocket sock;

        public MainPage()
        {
            InitializeComponent();

            Appearing += async (s, e) =>
            {
                sock = new();
                await ConnectAsync();
                _ = Task.Run(ListenAsync);
            };
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
                    var prot = Serializer.Deserialize<Message>(ms);

                    MainThread.BeginInvokeOnMainThread(() =>
                    {
                        Data.Text += $"{prot.Name}: {prot.Content}\n";
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
                await sock.ConnectAsync(new("ws://amiko.zirk.eu/ws"), CancellationToken.None);
                SendButton.IsEnabled = true;
                Data.Text += "Connected\n";
                //SemanticScreenReader.Announce("Connected");
            }
            catch (Exception ex)
            {
                Data.Text += $"Error while connecting: {ex.Message}\n";
            }
        }

        private void OnSendMessage(object sender, EventArgs e)
        {
            var msg = Input.Text;
            Input.Text = string.Empty;
            Data.Text += $"> {msg}\n";

            var prot = new Message()
            {
                Name = "Unnamed",
                Content = msg
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    using MemoryStream ms = new();
                    Serializer.Serialize(ms, prot);
                    Console.WriteLine(ms.ToArray().Length);
                    await sock.SendAsync(ms.ToArray(), WebSocketMessageType.Binary, true, CancellationToken.None);
                    //SemanticScreenReader.Announce("Message sent");
                }
                catch (Exception ex)
                {
                    Data.Text += $"Error while sending message: {ex.Message}\n";
                }
            });
        }
    }

}
