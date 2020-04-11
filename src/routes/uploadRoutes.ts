import {RequestHandler} from 'express';
import multer from 'multer';
import {MULTER_FILE_SIZE_LIMIT} from 'src/config/env';
import {asNumber} from 'src/utils/cast';
import {dir, log} from 'src/utils/log';
import {chalkJson} from 'src/utils/chalk';

// Upload endpoint
const storage = multer.memoryStorage();
const limits = {fileSize: asNumber(MULTER_FILE_SIZE_LIMIT)};
const upload = multer({storage, limits});
log(`Multer handler configured with limits="${chalkJson(limits)}"`);

export const uploadRoutes: RequestHandler[] = [
  upload.single('file'),
  (req, res) => {
    dir({url: req.url, ip: req.ip, headers: req.headers, file: req.file, body: req.body});
    res.json({
      method: req.method,
      url: req.url,
      query: req.query,
      headers: req.headers,
      file: req.file,
      body: req.body,
      ip: req.ip
    });
  }
];
