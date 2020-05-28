const log4js = require('log4js');
log4js.configure({
	appenders: {
		stdout: { type: 'stdout' },
		dateFile: { type: 'dateFile', filename: 'logs/application.log', pattern: '.yyyy-MM-dd' },
		stdoutFilter: { type: 'logLevelFilter', appender: 'stdout', level: 'ALL' },
		dateFileFilter: { type: 'logLevelFilter', appender: 'dateFile', level: 'INFO' },
	},
	categories: {
		default: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'ALL' },
		api: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'ALL' },
		main: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'ALL' },
	},
});

const apiLogger = log4js.getLogger('api');
const mainLogger = log4js.getLogger('main');

module.exports = {
	apiLogger,
	mainLogger,
};