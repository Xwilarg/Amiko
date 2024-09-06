using System.Net.WebSockets;
using System.Text;

namespace Amiko.Client
{
    public partial class MainPage : ContentPage
    {
        ClientWebSocket sock;

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
                var buffer = new byte[1024];
                var response = await sock.ReceiveAsync(buffer, CancellationToken.None);
                buffer = buffer.TakeWhile((v, index) => buffer.Skip(index).Any(w => w != 0x00)).ToArray(); // TODO: Need proper protocol

                MainThread.BeginInvokeOnMainThread(() =>
                {
                    Data.Text += $"> {Encoding.UTF8.GetString(buffer)}\n";
                });
            }
        }

        private async Task ConnectAsync()
        {
            try
            {
                await sock.ConnectAsync(new("ws://localhost:5000/ws"), CancellationToken.None);
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
            Data.Text += $"< {msg}\n";

            _ = Task.Run(async () =>
            {
                try
                {
                    var encoded = Encoding.UTF8.GetBytes(msg);
                    var buff = new ArraySegment<byte>(encoded, 0, encoded.Length);
                    await sock.SendAsync(buff, WebSocketMessageType.Text, true, CancellationToken.None);
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
