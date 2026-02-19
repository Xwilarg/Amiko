Chat software aiming to put the user first

> [!NOTE]
> I am currently rewriting Amiko code for its V1, some features highlighted below might not be available yet

## Features
- Switch account in one click or by prefixing your messages
- Easily backup your data by exporting a whole channel content to markdown format
- Embed Amiko in others websites

## How to try it
Development is still in progress, and each day the V1 is coming closer!

Meanwhile you can still go to https://amiko.zirk.eu to try the pre-released version

## Installing from sources

### Backend

#### Docker
- Copy all the content of `server/` on your server
- In `server/Amiko.Database`, run `dotnet tool install --global dotnet-ef` then `dotnet ef database update`
- Create a `data` folders in `server/` and move the created database file inside
- Rename `docker-compose.yml.example` to `docker-compose.yml`
- Run `docker compose up -d`
- To update, run `docker compose build --no-cache` then `docker compose up -d`

#### Build
- In `server/`, run `dotnet build Amiko.sln`
- In `server/Amiko.Server`, run `dotnet tool install --global dotnet-ef` then `dotnet ef database update`
Then move all the files in your server and create the appropriate configuration

#### nginx
```nginx
server {
	root /home/path/to/amiko;

	index index.html;

	server_name amiko.host.com;

	location / {
        try_files $uri /index.html;
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

### Frontend
Go in the `client/` folder and run `npm i`

#### Web
- If you want to make a build, then run `npm run webbuild`
- If you want to run the debug version of the app directly, run `npm run webdev`
- If you want to make a build to use the website in an embed, run `npm run embedbuild`

#### Desktop
- Run `npm run apprep`
- If you want to make a build, then run `npm run appbuild`
- If you want to run the debug version of the app directly, run `npm run appdev`
