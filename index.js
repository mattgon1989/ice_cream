// imports here for express and pg
const express = require('express');
const pg = require('pg');
const path = require('path');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/ice_cream_db')



// static routes here (you only need these for deployment)
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use(express.json());
app.use(require('morgan')('dev'));


//app routes
app.get('/', (req,res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')))
app.get('/api/flavors', async (res, req, next) => {
    try {
        const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch(err) {
        next(err);
    }
})

//get single id
app.get('/api/flavors/:id', async (res, req, next) => {
    try {
        const SQL = `SELECT * FROM flavors WHERE id=$1;`;
        const response = await client.query(SQL,[req.params.id]);
        res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
})

//INSERT INTO statement for post
app.post('/api/flavors', async (res, req, next) => {
    try {
        const SQL = `
        INSERT INTO flavors(name, is_favorite)
        VALUES($1, $2);
        RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
})


// UPDATE funtion
app.put('/api/flavors/:id', async (res, req, next) => {
    try {
        const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at()
        WHERE id=$3 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
})

// DELETE function
app.delete('/api/flavors', async (res, req, next) => {
    try {
        const SQL = `
        DELETE FROM flavors
        WHERE id=$1
        `;
        await client.query(SQL);
        res.sendStatus(204);
    } catch(err) {
        next(err);
    }
})

//INIT

const init = async () => {
    await client.connect();
    const SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        name VARCHAR(25) NOT NULL,
        is_favorite BOOLEAN DEFAULT FALSE
    );
    INSERT INTO flavors(name, is_favorite) VALUES('Chocolate',true);
    INSERT INTO flavors(name, is_favorite) VALUES('Strawberry',true);
    INSERT INTO flavors(name) VALUES('Grape');
    INSERT INTO flavors(name, is_favorite) VALUES('Watermelon',false);
    `;

    await client.query(SQL);
    console.log('data seeded');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`listening on PORT ${PORT}`);

    })
}
init();