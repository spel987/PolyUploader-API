const express = require("express");
const router = express.Router();
const postgre = require('../database');
const xss = require('xss');
require('dotenv').config();

router.post('/:action', async (req, res) => {
    try {
        const action = xss(req.params.action);
        if (!action) {
            return res.status(401).send('No action specified');
        }

        if (!req.body.anonymized_links) {
            return res.status(401).json({message: "No anonymized links specified"});
        } else if (!req.body.upload_date) {
            return res.status(401).json({message: "No upload date specified"});
        }
        
        const date = xss(req.body.upload_date);
        const anonymized_links = xss(req.body.anonymized_links);

        if (action === 'bins') {
            const sql = "INSERT INTO telemetry_bins(upload_date, anonymized_links) VALUES($1, $2) RETURNING *";

            await postgre.query(sql, [date, anonymized_links]);

            return res.json({message: "OK"});

        } else if (action === 'upload') {
            const sql = "INSERT INTO telemetry_uploads(upload_date, anonymized_links) VALUES($1, $2) RETURNING *";

            await postgre.query(sql, [date, anonymized_links]);

            return res.json({message: "OK"});
        }

        return res.status(404).send({ message: 'Unknown telemetry action' });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;