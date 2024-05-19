
# Decentralised File Sharing Platform

Most of the file storing services have a limit to upload data within particular storage limit.But with this website there is not any. You can store as many files as you want to and that too securely.And not only that , if you want to host a static website then you can do that too.
## Run Locally

Clone the project

```bash
  git clone git@github.com:nexis-network/nexis-file-system.git
```

Go to the project directory

```bash
 cd nexis-file-system
```

Install dependencies

```bash
  npm install
```

Add Environment variables

```bash
  cp .env.example .env
```

and fill the details in `.env` file

```
PORT=3000
URL= <!-- mongodb url -->
```


Start the server

```bash
  npm run start
```
