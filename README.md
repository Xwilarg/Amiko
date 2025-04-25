Chat software aiming to put the user first

## Features
- Switch account in one click or by prefixing your messages
- Easily backup your data by exporting a whole channel content to markdown format
- (More to come...)

## How to try it
Development is still in progress! Meanwhile you can still go to https://amiko.zirk.eu to try the pre-released version

## Installing from sources

### Backend
Run `dotnet build Amiko.sln` in the `server/` folder, then move all the files in your server and create the appropriate configuration
#### nginx
```nginx
server {
	root /home/path/to/amiko;

	index index.html;

	server_name amiko.host.com;

	location / {
		try_files $uri $uri/ =404;
	}
	location /ws {
		proxy_pass http://localhost:5129;
		proxy_http_version          1.1;
		proxy_set_header Upgrade    $http_upgrade;
		proxy_set_header Connection "upgrade";
	}
	location /api {
		proxy_pass http://localhost:5129;
	}
}
```

### Fontend
Go in the `client/` folder, run `npm i` then `npm run build`

#### Web
If you want to use the web version of Amiko, you can just keep the following files/folders: `js/`, `css/`, `node_modules/`, `index.html`

#### Desktop
You can run the debug version of the app by doing `npm run start` or make a build with `npm run make`
