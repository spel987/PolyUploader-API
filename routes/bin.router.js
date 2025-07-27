const express = require("express");
const router = express.Router();
const postgre = require('../database');
const xss = require('xss');
require('dotenv').config();

async function generate_short_id(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let short_id = '';
    let exists = true;

    while (exists) {
        short_id = '';
        for (let i = 0; i < length; i++) {
            const random_index = Math.floor(Math.random() * characters.length);
            short_id += characters[random_index];
        };

        const { row_count } = await postgre.query('SELECT 1 FROM bins WHERE id = $1', [short_id]);
        exists = row_count > 0;
    };

    return short_id;
};

router.get("/:id", async(req, res) => {
    try {
        const { rows } = await postgre.query("SELECT title, content FROM bins WHERE id = $1;", [req.params.id]);

        if (rows[0]) {
            return res.json({message: "OK", data: rows});
        };

        return res.status(404).json({message: "Not found"});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    };
});

router.post("/", async(req, res) => {
    try {
        if (!req.body.title) {
            return res.status(401).json({message: "No title specified"});
        } else if (!req.body.upload_date) {
            return res.status(401).json({message: "No upload date specified"});
        } else if (!req.body.links) {
            return res.status(401).json({message: "No links specified"});
        }

        const title = xss(req.body.title);
        const upload_date = xss(req.body.upload_date);
        const links = xss(req.body.links);
        const id = await generate_short_id(10);
        const token = await generate_short_id(30);

        const sql = 'INSERT INTO bins(id, title, upload_date, links, token, views) VALUES($1, $2, $3, $4, $5, 0) RETURNING *';

        await postgre.query(sql, [id, title, upload_date, links, token]);

        const url = `https://${req.get('host')}/${id}`;

        return res.json({message: "OK", data: { url, id, token }});

    } catch (error) {
        return res.status(500).json({ message: error.message });
    };
});

router.delete("/", async(req, res) => {
    try {
        if (!req.body.id) {
            return res.status(401).json({message: "No id specified"});
        } else if (!req.body.token) {
            return res.status(401).json({message: "No token specified"});
        }
        const { rows } = await postgre.query("SELECT token FROM bins WHERE id = $1;", [req.body.id]);
        const token_give = req.body.token;

        if (token_give == rows[0].token) {
            const sql = 'DELETE FROM bins where id = $1 RETURNING *';

            const { rows } = await postgre.query(sql, [req.body.id]);

            if (rows[0]) {
                return res.json({message: "OK"});
            } else {
                return res.status(404).json({message: "Not found"});
            };

        } else {
            res.status(401).json({message: "The token is invalid"});
        };

    } catch (error) {
        return res.status(500).json({ message: error.message });
    };
});

module.exports = router;