namespace Amiko.Client;

public partial class MessageView : ContentView
{
	public MessageView(string name, string content, MessageType type)
	{
		InitializeComponent();

        Name.Text = name;
        Content.Text = content;
        Name.TextColor = type switch
        {
            MessageType.Info => new Color(76, 235, 52),
            MessageType.Error => new Color(235, 52, 52),
            MessageType.User => new Color(237, 237, 237),
            MessageType.Self => new Color(84, 133, 255),
            _ => throw new NotImplementedException()
        };
        Content.TextColor = type switch
        {
            MessageType.Info => new Color(76, 235, 52),
            MessageType.Error => new Color(235, 52, 52),
            MessageType.User => new Color(237, 237, 237),
            MessageType.Self => new Color(237, 237, 237),
            _ => throw new NotImplementedException()
        };
    }
}

public enum MessageType
{
    Self,
    User,
    Info,
    Error
}