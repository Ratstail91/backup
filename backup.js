const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');

//configuration
const config = require('./config.json');
const superdir = '../dbbackups';

//utils
const getDateString = () => {
	//unique string every second
	const d = new Date();
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
}

const createDirIfNotExists = (dirname) => {
	//what was wrong with fs.exists()?
	try {
		fs.statSync(dirname);
	}
	catch(e) {
		//pass upwards if we're not dealing with this
		if (e.code !== 'ENOENT') {
			throw e;
		}

		//create the directory if not exists
		fs.mkdirSync(dirname);
	}
}

//once an hour
const job = new CronJob('0 0 * * * *', () => {
	//configure settings
	const dirpath = path.resolve(__dirname, superdir, config.dirname);

	createDirIfNotExists(path.resolve(__dirname, superdir));
	createDirIfNotExists(dirpath);

	const filenames = fs.readdirSync(dirpath);

	//delete the oldest if we have too many
	if (filenames.length >= config.maxfiles) {
		fs.unlinkSync(path.join(dirpath, filenames.shift()));
	}

	//touch
//	fs.closeSync(fs.openSync(path.join(dirpath, `${getDateString()}`), 'w'));

	let child = exec(`mysqldump -u ${config.username} -p${config.password} ${config.database} > ${path.join(dirpath, `${getDateString()}`)}.sql`);
});

//kick off
job.start();