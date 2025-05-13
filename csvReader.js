const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse');

/**
 * CSV dosyasını okur ve parse eder
 * @param {string} filename - Okunacak dosya adı
 * @returns {Promise<Array>} - Parse edilmiş kayıtlar
 */
async function readCsvFile(filename) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const csvData = await fs.readFile(filePath, 'utf-8');
    console.log('CSV dosyası başarıyla okundu.');

    return new Promise((resolve, reject) => {
      parse(
        csvData,
        {
          columns: true,
          skip_empty_lines: true,
        },
        (err, records) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('CSV verisi parse edildi:', records.length, 'kayıt bulundu.');
          resolve(records);
        }
      );
    });
  } catch (error) {
    console.error('CSV okuma hatası:', error);
    throw error;
  }
}

module.exports = { readCsvFile };
