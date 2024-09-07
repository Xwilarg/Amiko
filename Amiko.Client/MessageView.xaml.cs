namespace Amiko.Client;

public partial class MessageView : ContentView
{
	public MessageView(string name, string content)
	{
		InitializeComponent();

        Name.Text = name;
        Content.Text = content;
    }
}