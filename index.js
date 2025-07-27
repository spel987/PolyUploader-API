const express = require("express")
const app = express()
require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bin_router = require('./routes/bin.router')
const telemetry_router = require('./routes/telemetry.router')

app.use(cors());
app.use(express.urlencoded({ extended: true }));
 
const PORT = process.env.PORT;

const postgre = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

postgre.connect((err) => {
    if (err) throw err
    console.log("Connect to PostgreSQL successfully!");
})

postgre.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    if (err) throw err
});

app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('https://polyuploader.vercel.app');
});

app.get('/update-config', async (req, res) => {
    const file_path = path.join(__dirname, 'public/update-config.json');

    fs.readFile(file_path, 'utf8', (err, json_content) => {
        if (err) {
            return res.status(500).send('Error reading JSON file. If the problem persists, open an issue on the site\'s GitHub repository: https://github.com/spel987/PolyUploader-website/issues or send me an e-mail: spel987@pm.me');
        }

        const data = JSON.parse(json_content);
        res.json(data);
    });
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/demonstration', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'demonstration.html'));
});

app.get('/googleda67cc0f18f3b235.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'googleda67cc0f18f3b235.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'terms.html'));
});

app.get('/download', (req, res) => {
    res.redirect('https://github.com/spel987/PolyUploader/releases/latest');
});

app.get('/statistics', async (req, res) => {
    const file_path = path.join(__dirname, 'public/statistics.html');

    fs.readFile(file_path, 'utf8', (err, html_content) => {
        if (err) {
            return res.status(500).send('Error reading HTML file. If the problem persists, open an issue on the site\'s GitHub repository: https://github.com/spel987/PolyUploader-website/issues or send me an e-mail: spel987@pm.me');
        }

        res.send(html_content);
    });
});

app.use("/api/bins", bin_router);

app.use('/api/telemetry', telemetry_router);

app.get("/api/count-database", async(req, res) => {
    try {
        const { rows } = await postgre.query("SELECT COUNT(*) FROM bins;")

        if (rows[0]) {
            const number_of_elements = rows[0].count
            res.json({message: "OK", data: { number_of_elements }})
        } else {
            res.redirect('https://polyuploader.vercel.app/404');
        }
    } catch (error) {
        res.json({message: error.msg});
    };
});

app.use("/:id", async(req, res) => {
    try {
        const { rows } = await postgre.query("SELECT title, upload_date, links, views FROM bins WHERE id = $1;", [req.params.id])

        if (rows[0]) {
            const title = rows[0].title;
            const upload_date = rows[0].upload_date;
            const beauty_date = new Date(upload_date).toLocaleString("en-US", {month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "numeric", hour12: true}).replace(",", "");
            const links = rows[0].links.replace(/\n/g, '<br>');
            const views = rows[0].views + 1;

            const file_path = path.join(__dirname, 'public/page.html');

            await postgre.query("UPDATE bins SET views = views + 1 WHERE id = $1;", [req.params.id]);

            fs.readFile(file_path, 'utf8', (err, html_content) => {
                if (err) {
                    return res.status(500).send('Error reading HTML file. If the problem persists, open an issue on the site\'s GitHub repository: https://github.com/spel987/PolyUploader-website/issues or send me an e-mail: spel987@pm.me');
                }
                const enhanced_html_content = html_content
                    .replace('{{title_page}}', title)
                    .replace('{{title_meta}}', title)
                    .replace('{{title_description}}', title)
                    .replace('{{title_view}}', title)
                    .replace('{{title_pre}}', title)
                    .replace('{{upload_date}}', beauty_date)
                    .replace('{{views}}', views)
                    .replace('{{links}}', links)
                
                res.send(enhanced_html_content);
            });
        } else {
            res.redirect('https://polyuploader.vercel.app/404');
        }
    } catch (error) {
        res.json({message: error.msg});
    };
});

app.listen(PORT, () => console.log(`Server is running on http://127.0.0.1:${PORT}`));