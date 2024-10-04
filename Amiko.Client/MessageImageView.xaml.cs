namespace Amiko.Client;

public partial class MessageImageView : ContentView
{
	public MessageImageView(Uri url)
	{
		InitializeComponent();

		ImageContent.Source = url;
    }
}