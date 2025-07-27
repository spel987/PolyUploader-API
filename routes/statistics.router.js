const express = require("express");
const router = express.Router();
const postgre = require('../database');
require('dotenv').config();

function anonymize_urls(text) {
  return text
    .split(/\r?\n/)
    .map(line => {
      try {
        const url = new URL(line.trim());
        return url.hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

router.get('/hosts-stats', async (req, res) => {
    try {
        const uploads_query = `
            SELECT 
                unnest(string_to_array(anonymized_links, ',')) as host,
                COUNT(*) as usage_count
            FROM telemetry_uploads 
            GROUP BY host 
            ORDER BY usage_count DESC
            LIMIT 15
        `;
        const uploads_result = await postgre.query(uploads_query);

        const bins_query = `SELECT links FROM bins WHERE links IS NOT NULL AND links != ''`;
        const bins_raw_result = await postgre.query(bins_query);
        
        const bins_hosts_count = {};
        
        bins_raw_result.rows.forEach(row => {
            const anonymized_hosts = anonymize_urls(row.links);
            anonymized_hosts.forEach(host => {
                if (host) {
                    bins_hosts_count[host] = (bins_hosts_count[host] || 0) + 1;
                }
            });
        });

        const bins_result = Object.entries(bins_hosts_count)
            .map(([host, usage_count]) => ({ host, usage_count }))
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, 15);

        return res.json({
            success: true,
            data: {
                uploads: uploads_result.rows,
                bins: bins_result
            }
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.get('/activity-stats', async (req, res) => {
    try {
        const uploads_query = `
            SELECT 
                EXTRACT(HOUR FROM upload_date) as hour,
                COUNT(*) as activity_count
            FROM telemetry_uploads 
            GROUP BY EXTRACT(HOUR FROM upload_date)
            ORDER BY hour
        `;
        const uploads_result = await postgre.query(uploads_query);

        const bins_query = `
            SELECT 
                EXTRACT(HOUR FROM upload_date) as hour,
                COUNT(*) as activity_count
            FROM bins 
            GROUP BY EXTRACT(HOUR FROM upload_date)
            ORDER BY hour
        `;
        const bins_result = await postgre.query(bins_query);

        return res.json({
            success: true,
            data: {
                uploads: uploads_result.rows,
                bins: bins_result.rows
            }
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.get('/general-stats', async (req, res) => {
    try {
        const total_uploads_query = "SELECT COUNT(*) as total FROM telemetry_uploads";
        const total_uploads_result = await postgre.query(total_uploads_query);

        const total_bins_query = "SELECT COUNT(*) as total FROM bins";
        const total_bins_result = await postgre.query(total_bins_query);

        const today_uploads_query = `
            SELECT COUNT(*) as today_count 
            FROM telemetry_uploads 
            WHERE DATE(upload_date::timestamp) = CURRENT_DATE
        `;
        const today_uploads_result = await postgre.query(today_uploads_query);

        const today_bins_query = `
            SELECT COUNT(*) as today_count 
            FROM bins 
            WHERE DATE(upload_date::timestamp) = CURRENT_DATE
        `;
        const today_bins_result = await postgre.query(today_bins_query);

        return res.json({
            success: true,
            data: {
                totals: {
                    uploads: parseInt(total_uploads_result.rows[0].total),
                    bins: parseInt(total_bins_result.rows[0].total)
                },
                today: {
                    uploads: parseInt(today_uploads_result.rows[0].today_count),
                    bins: parseInt(today_bins_result.rows[0].today_count)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;