const http = require('http');
const faker = require('faker');

const host = 'localhost';
const port = 8000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const getTodos = async () => {
  let todos = [];
  try {
    await sleep(2000);
    for(let i=0 ; i< 3 ;i++) {
        todos.push({
          key: i,
          title :faker.name.findName(),
          time:faker.date.recent(),
          description: faker.lorem.sentence(),
          image: faker.image.avatar()
        });         
    }
    return todos;
  } catch(err) {
    console.log('error in getting todos: ', err);
  }
  return todos;
}


const requestListener = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  switch (req.url) {
      case "/todos":
          const todos = await getTodos();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(todos));
          res.end();
          break
      default:
          res.setHeader("Content-Type", "application/json");
          res.writeHead(404);
          res.end(JSON.stringify({error:"Resource not found"}));
  }
}

var server = http.createServer(requestListener);

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

