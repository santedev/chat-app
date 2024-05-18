import http from 'http';
import pkg from 'pg';
import cors from 'cors';
const { Pool } = pkg;
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'sqlhype',
    database: 'chatAppDB'
});
// Create a new HTTP server
const server = http.createServer((req, res) => {
    // Use cors middleware to allow cross-origin requests
    cors()(req, res, async () => {
        if (req.method === 'GET' && req.url === '/users') {
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT * FROM users');
                client.release();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result.rows));
            }
            catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                console.error('Error executing query', error);
            }
        }
        else if (req.method === 'POST' && req.url === '/users') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', async () => {
                try {
                    const userData = JSON.parse(body); // parse the JSON body
                    const client = await pool.connect();
                    await client.query('INSERT INTO users (displayed_name, email, password) VALUES ($1, $2, $3)', [userData.name, userData.email, userData.password]);
                    client.release();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'User created successfully' }));
                }
                catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    console.error('Error executing query', error);
                }
            });
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });
});
const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
//# sourceMappingURL=api.js.map