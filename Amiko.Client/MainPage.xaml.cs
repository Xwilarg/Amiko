﻿using Amiko.Common;
using ProtoBuf;
using System.Net.WebSockets;
using System.Xml.Linq;

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
                Username.Text = $"User {new Random().Next(0, 10000):0000}";

                sock = new();
                AddError("Connecting...", MessageType.Info);
                await ConnectAsync();
                _ = Task.Run(ListenAsync);
            };
        }

        private void AddError(string message, MessageType type)
        {
            MessageList.Children.Add(new MessageView(string.Empty, message, type));

            MessageScroll.ScrollToAsync(MessageScroll, ScrollToPosition.End, true);
        }

        private void AddMessage(string name, string content, MessageType type)
        {
            MessageList.Children.Add(new MessageView(name, content, type));

            MessageScroll.ScrollToAsync(MessageScroll, ScrollToPosition.End, true);
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
                        AddMessage(prot.Name, prot.Content, MessageType.User);
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

            Input.Text = string.Empty;
            AddMessage(Username.Text, msg, MessageType.Self);

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
                    Console.WriteLine(ms.ToArray().Length);
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
