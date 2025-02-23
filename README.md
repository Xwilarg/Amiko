Chat software

## Backend

### nginx

```
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

## Fontend

`npm i` then `npm run start`
